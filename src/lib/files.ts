import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from 'fs'
import { join } from 'path'
import type { TranslationFile } from '../types.ts'

export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

export function loadTranslationFile(
  langDir: string,
  lang: string,
  namespace: string
): TranslationFile {
  const filePath = join(langDir, lang, `${namespace}.json`)
  if (!existsSync(filePath)) return {}
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

export function saveTranslationFile(
  langDir: string,
  lang: string,
  namespace: string,
  data: TranslationFile
): void {
  const langPath = join(langDir, lang)
  ensureDir(langPath)

  const sorted = sortObjectKeys(data)
  const filePath = join(langPath, `${namespace}.json`)
  writeFileSync(filePath, JSON.stringify(sorted, null, 2))
}

function sortObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj
  }

  const sorted: any = {}
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObjectKeys(obj[key])
    })
  return sorted
}

export function scanExistingStructure(langDir: string): {
  langs: string[]
  namespaces: string[]
} {
  if (!existsSync(langDir)) return { langs: [], namespaces: [] }

  const langs = readdirSync(langDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  const namespaces = new Set<string>()

  langs.forEach((lang) => {
    const langPath = join(langDir, lang)
    const files = readdirSync(langPath)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''))
    files.forEach((ns) => namespaces.add(ns))
  })

  return { langs, namespaces: Array.from(namespaces) }
}
