import { text, confirm, isCancel } from '@clack/prompts'
import { requireConfig, getApiKey } from '../lib/config.js'
import { loadTranslationFile, saveTranslationFile } from '../lib/files.js'
import { GeminiTranslator } from '../lib/gemini.js'

export async function addCommand(
  key?: string,
  value?: string,
  namespace?: string,
  lang?: string
): Promise<void> {
  const config = requireConfig()
  const ns = namespace || config.defaultNamespace

  if (!config.namespaces.includes(ns)) {
    console.error(`[${config.defaultNamespace}] Namespace '${ns}' not found`)
    process.exit(1)
  }

  const targetLang = lang || config.sourceLang

  if (!config.langs.includes(targetLang)) {
    console.error(
      `[${config.defaultNamespace}] Language '${targetLang}' not supported`
    )
    process.exit(1)
  }

  if (!key) {
    const keyInput = await text({
      message: 'Enter translation key:',
      validate: (v) => (v.length === 0 ? 'Key is required' : undefined),
    })

    if (isCancel(keyInput)) {
      console.log('[tcli] Operation cancelled')
      process.exit(0)
    }

    key = keyInput as string
  }

  const translations = loadTranslationFile(config.langDir, targetLang, ns)

  if (getNestedValue(translations, key)) {
    const overwrite = await confirm({
      message: `Key '${key}' already exists. Overwrite?`,
    })

    if (isCancel(overwrite)) {
      console.log('[tcli] Operation cancelled')
      process.exit(0)
    }

    if (!overwrite) return
  }

  if (!value && targetLang === config.sourceLang) {
    const valueInput = await text({
      message: `Enter value for '${key}':`,
      validate: (v) => (v.length === 0 ? 'Value is required' : undefined),
    })

    if (isCancel(valueInput)) {
      console.log('[tcli] Operation cancelled')
      process.exit(0)
    }

    value = valueInput as string
  }

  if (targetLang === config.sourceLang) {
    if (!value) {
      console.error(
        `[${config.defaultNamespace}] Value is required for source language`
      )
      process.exit(1)
    }

    setNestedValue(translations, key, value)
    saveTranslationFile(config.langDir, targetLang, ns, translations)
    console.log(`[${ns}] Added successfully`)

    const translator = new GeminiTranslator(getApiKey())

    for (const otherLang of config.langs) {
      if (otherLang === config.sourceLang) continue

      const otherTranslations = loadTranslationFile(
        config.langDir,
        otherLang,
        ns
      )
      const translatedValue = await translator.translate(
        value,
        config.sourceLang,
        otherLang
      )

      setNestedValue(otherTranslations, key, translatedValue)
      saveTranslationFile(config.langDir, otherLang, ns, otherTranslations)
    }

    console.log(`[${ns}] Translated to all languages`)
  } else {
    const sourceTranslations = loadTranslationFile(
      config.langDir,
      config.sourceLang,
      ns
    )
    const sourceValue = getNestedValue(sourceTranslations, key)

    if (!sourceValue) {
      console.error(
        `[${config.defaultNamespace}] Source key '${key}' not found in ${config.sourceLang}`
      )
      process.exit(1)
    }

    const translator = new GeminiTranslator(getApiKey())
    const translatedValue = await translator.translate(
      sourceValue,
      config.sourceLang,
      targetLang
    )

    setNestedValue(translations, key, translatedValue)
    saveTranslationFile(config.langDir, targetLang, ns, translations)

    console.log(`[${ns}] Added successfully`)
  }
}

function getNestedValue(obj: any, key: string): string | undefined {
  const parts = key.split('.')
  let current = obj

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return undefined
    }
    current = current[part]
  }

  return typeof current === 'string' ? current : undefined
}

function setNestedValue(obj: any, key: string, value: string): void {
  const parts = key.split('.')
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part]
  }

  current[parts[parts.length - 1]] = value
}
