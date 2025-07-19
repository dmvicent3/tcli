import { readFileSync } from 'fs'
import { text, isCancel } from '@clack/prompts'
import { requireConfig, getApiKey } from '../lib/config'
import { loadTranslationFile, saveTranslationFile } from '../lib/files'
import { GeminiTranslator } from '../lib/gemini'
import type { BatchTranslation } from '../types.ts'

export async function batchCommand(
  filePath?: string,
  namespace?: string,
  langs?: string
): Promise<void> {
  const config = requireConfig()
  const ns = namespace || config.defaultNamespace

  if (!config.namespaces.includes(ns)) {
    console.error(`[${config.defaultNamespace}] Namespace '${ns}' not found`)
    process.exit(1)
  }

  if (!filePath) {
    const fileInput = await text({
      message: 'Enter path to JSON file with translations:',
      validate: (v) => (v.length === 0 ? 'File path is required' : undefined),
    })

    if (isCancel(fileInput)) {
      console.log('[tcli] Operation cancelled')
      process.exit(0)
    }

    filePath = fileInput as string
  }

  const targetLangs = langs
    ? langs.split(',')
    : config.langs.filter((l) => l !== config.sourceLang)

  let batchData: BatchTranslation
  try {
    batchData = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (error) {
    console.error(
      `[${config.defaultNamespace}] Failed to read or parse file: ${filePath}`
    )
    process.exit(1)
  }

  const translator = new GeminiTranslator(getApiKey())

  for (const targetLang of targetLangs) {
    if (!config.langs.includes(targetLang)) {
      console.error(
        `[${config.defaultNamespace}] Language '${targetLang}' not supported`
      )
      continue
    }

    const translations = loadTranslationFile(config.langDir, targetLang, ns)
    const translatedBatch = await translator.batchTranslate(
      batchData,
      config.sourceLang,
      targetLang
    )

    Object.entries(translatedBatch).forEach(([key, value]) => {
      setNestedValue(translations, key, value)
    })

    saveTranslationFile(config.langDir, targetLang, ns, translations)
  }

  console.log(`[${ns}] Batch translation completed`)
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
