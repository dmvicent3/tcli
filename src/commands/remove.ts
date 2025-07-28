import { text, confirm, isCancel } from '@clack/prompts'
import { requireConfig } from '../lib/config.js'
import { loadTranslationFile, saveTranslationFile } from '../lib/files.js'

export async function removeCommand(
  key?: string,
  namespace?: string,
  lang?: string
): Promise<void> {
  const config = requireConfig()
  const ns = namespace || config.defaultNamespace

  if (!config.namespaces.includes(ns)) {
    console.error(`[${config.defaultNamespace}] Namespace '${ns}' not found`)
    process.exit(1)
  }

  if (!key) {
    const keyInput = await text({
      message: 'Enter translation key to remove:',
      validate: (v) => (v.length === 0 ? 'Key is required' : undefined),
    })

    if (isCancel(keyInput)) {
      console.log('[tcli] Operation cancelled')
      process.exit(0)
    }

    key = keyInput as string
  }

  if (lang) {
    if (!config.langs.includes(lang)) {
      console.error(
        `[${config.defaultNamespace}] Language '${lang}' not supported`
      )
      process.exit(1)
    }

    const translations = loadTranslationFile(config.langDir, lang, ns)

    if (!hasNestedKey(translations, key)) {
      console.error(`[${config.defaultNamespace}] Key '${key}' not found`)
      process.exit(1)
    }

    const confirmed = await confirm({
      message: `Remove '${key}' from ${lang}?`,
    })

    if (isCancel(confirmed)) {
      console.log('[tcli] Operation cancelled')
      process.exit(0)
    }

    if (!confirmed) return

    deleteNestedKey(translations, key)
    saveTranslationFile(config.langDir, lang, ns, translations)

    console.log(`[${ns}] Removed successfully`)
    return
  }

  const sourceTranslations = loadTranslationFile(
    config.langDir,
    config.sourceLang,
    ns
  )

  if (!hasNestedKey(sourceTranslations, key)) {
    console.error(`[${config.defaultNamespace}] Key '${key}' not found`)
    process.exit(1)
  }

  const confirmed = await confirm({
    message: `Remove '${key}' from all languages?`,
  })

  if (isCancel(confirmed)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  if (!confirmed) return

  for (const language of config.langs) {
    const translations = loadTranslationFile(config.langDir, language, ns)

    if (hasNestedKey(translations, key)) {
      deleteNestedKey(translations, key)
      saveTranslationFile(config.langDir, language, ns, translations)
    }
  }

  console.log(`[${ns}] Removed from all languages`)
}

function hasNestedKey(obj: any, key: string): boolean {
  const parts = key.split('.')
  let current = obj

  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return false
    }
    current = current[part]
  }

  return true
}

function deleteNestedKey(obj: any, key: string): void {
  const parts = key.split('.')
  let current = obj

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return
    }
    current = current[part]
  }

  delete current[parts[parts.length - 1]]
}
