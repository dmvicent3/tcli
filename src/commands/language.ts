import { confirm, isCancel } from '@clack/prompts'
import { requireConfig, saveConfig, getApiKey } from '../lib/config'
import { loadTranslationFile, saveTranslationFile } from '../lib/files'
import { GeminiTranslator } from '../lib/gemini'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'

export async function langAddCommand(lang: string): Promise<void> {
  const config = requireConfig()

  if (config.langs.includes(lang)) {
    console.error(
      `[${config.defaultNamespace}] Language '${lang}' already exists`
    )
    process.exit(1)
  }

  config.langs.push(lang)
  config.langs.sort()
  saveConfig(config)

  config.namespaces.forEach((ns) => {
    saveTranslationFile(config.langDir, lang, ns, {})
  })

  const autoTranslate = await confirm({
    message: `Auto-translate all existing keys to ${lang}?`,
  })

  if (isCancel(autoTranslate)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  if (autoTranslate) {
    const translator = new GeminiTranslator(getApiKey())

    for (const ns of config.namespaces) {
      const sourceTranslations = loadTranslationFile(
        config.langDir,
        config.sourceLang,
        ns
      )
      const flatKeys = flattenObject(sourceTranslations)

      if (Object.keys(flatKeys).length === 0) continue

      const translatedKeys = await translator.batchTranslate(
        flatKeys,
        config.sourceLang,
        lang
      )
      const targetTranslations = unflattenObject(translatedKeys)

      saveTranslationFile(config.langDir, lang, ns, targetTranslations)
    }

    console.log(`[${config.defaultNamespace}] Language added and translated`)
  } else {
    console.log(`[${config.defaultNamespace}] Language added`)
  }
}

export async function langRemoveCommand(lang: string): Promise<void> {
  const config = requireConfig()

  if (!config.langs.includes(lang)) {
    console.error(`[${config.defaultNamespace}] Language '${lang}' not found`)
    process.exit(1)
  }

  if (lang === config.sourceLang) {
    console.error(`[${config.defaultNamespace}] Cannot remove source language`)
    process.exit(1)
  }

  const confirmed = await confirm({
    message: `Remove language '${lang}' and all its translations?`,
  })

  if (isCancel(confirmed)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  if (!confirmed) return

  config.langs = config.langs.filter((l) => l !== lang)
  saveConfig(config)

  const langDirPath = join(config.langDir, lang)
  if (existsSync(langDirPath)) {
    rmSync(langDirPath, { recursive: true, force: true })
  }

  console.log(`[${config.defaultNamespace}] Language removed`)
}

export async function langListCommand(): Promise<void> {
  const config = requireConfig()

  console.log(`[${config.defaultNamespace}] Languages:`)
  config.langs.forEach((lang) => {
    const marker = lang === config.sourceLang ? ' (source)' : ''
    console.log(`  ${lang}${marker}`)
  })
}

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {}

  Object.keys(obj).forEach((key) => {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(flattened, flattenObject(obj[key], newKey))
    } else {
      flattened[newKey] = obj[key]
    }
  })

  return flattened
}

function unflattenObject(obj: Record<string, string>): any {
  const result: any = {}

  Object.keys(obj).forEach((key) => {
    const parts = key.split('.')
    let current = result

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part]
    }

    current[parts[parts.length - 1]] = obj[key]
  })

  return result
}
