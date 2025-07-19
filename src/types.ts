export interface Config {
  langDir: string
  sourceLang: string
  langs: string[]
  defaultNamespace: string
  namespaces: string[]
}

export interface TranslationFile {
  [key: string]: string | TranslationFile
}

export interface BatchTranslation {
  [key: string]: string
}
