import type { Config } from '../types.ts'
import { loadTranslationFile } from './files'

export function verifyTranslations(config: Config): void {
  const allNamespaceKeys: Record<string, Set<string>> = {}
  for (const namespace of config.namespaces) {
    allNamespaceKeys[namespace] = new Set()
    for (const lang of config.langs) {
      const translations = loadTranslationFile(config.langDir, lang, namespace)
      collectAllKeys(translations, '', allNamespaceKeys[namespace])
    }
  }

  let hasMissing = false
  for (const namespace of config.namespaces) {
    for (const lang of config.langs) {
      const translations = loadTranslationFile(config.langDir, lang, namespace)
      const missing: string[] = []
      for (const key of allNamespaceKeys[namespace]) {
        if (!hasNestedKey(translations, key)) {
          missing.push(key)
        }
      }
      if (missing.length > 0) {
        if (!hasMissing) {
          hasMissing = true
        }
        console.log(`\n[${namespace}] Missing keys in ${lang}:`)
        missing.forEach((key) => {
          console.log(`  - ${key}`)
        })
      }
    }
  }
  if (!hasMissing) {
    console.log(
      `[${config.defaultNamespace}] All translation keys are present in all namespaces and languages.`
    )
  }
}

function collectAllKeys(obj: any, prefix: string, keySet: Set<string>) {
  if (typeof obj !== 'object' || obj === null) return
  for (const key in obj) {
    const value = obj[key]
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      collectAllKeys(value, fullKey, keySet)
    } else {
      keySet.add(fullKey)
    }
  }
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
