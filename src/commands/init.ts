import { text, multiselect, select, isCancel } from '@clack/prompts'
import { getApiKey, loadConfig, saveConfig } from '../lib/config.js'
import { scanExistingStructure } from '../lib/files.js'
import type { Config } from '../types.ts'

const COMMON_LANGUAGES = [
  { value: 'en-us', label: 'English (US)' },
  { value: 'pt-pt', label: 'Portuguese (Portugal)' },
  { value: 'pt-br', label: 'Portuguese (Brazil)' },
  { value: 'es-es', label: 'Spanish (Spain)' },
  { value: 'fr-fr', label: 'French (France)' },
  { value: 'it-it', label: 'Italian (Italy)' },
  { value: 'de-de', label: 'German (Germany)' },
  { value: 'ja-jp', label: 'Japanese (Japan)' },
  { value: 'ko-kr', label: 'Korean (South Korea)' },
  { value: 'zh-cn', label: 'Chinese (Simplified)' },
  { value: 'other', label: 'Other (manual input)' },
]

process.on('SIGINT', () => {
  console.log('\n[tcli] Operation cancelled')
  process.exit(0)
})

export async function initCommand(): Promise<void> {
  console.log('[tcli] Initializing translation configuration...')

  if (!getApiKey()) return

  const existingConfig = loadConfig()

  const langDir = await text({
    message: 'Enter the language folder path:',
    placeholder: './lang',
    initialValue: existingConfig?.langDir || './lang',
  })

  if (isCancel(langDir)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  const existing = scanExistingStructure(langDir as string)
  const existingLangs = existing.langs.map((l) => l.toLowerCase())
  const existingNamespaces = existing.namespaces.map((ns) => ns.toLowerCase())

  const selectedLangs = await multiselect({
    message: 'Select languages to support:',
    options: COMMON_LANGUAGES,
    initialValues: existingLangs.length > 0 ? existingLangs : ['en-us'],
  })

  if (isCancel(selectedLangs)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  let finalLangs = [...(selectedLangs as string[])]

  if (finalLangs.includes('other')) {
    finalLangs = finalLangs.filter((lang) => lang !== 'other')

    const customLangs = await text({
      message:
        "Enter additional languages (comma-separated, e.g., 'sv-se,da-dk'):",
      validate: (value) => {
        if (!value || value.length === 0)
          return 'At least one language is required'
        return undefined
      },
    })

    if (isCancel(customLangs)) {
      console.log('[tcli] Operation cancelled')
      process.exit(0)
    }

    const additionalLangs = (customLangs as string)
      .split(',')
      .map((lang) => lang.trim().toLowerCase())
      .filter(Boolean)
    finalLangs.push(...additionalLangs)
  }

  const sourceLang = await select({
    message: 'Select source language:',
    options: finalLangs.map((lang) => ({
      value: lang,
      label:
        COMMON_LANGUAGES.find((l) => l.value.toLowerCase() === lang)?.label ||
        lang,
    })),
  })

  if (isCancel(sourceLang)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  const allNamespaces = [
    ...new Set([...existingNamespaces, 'common', 'home', 'auth', 'errors']),
  ]
  const namespaceOptions = [
    ...allNamespaces.map((ns) => ({ value: ns, label: ns })),
    { value: 'other', label: 'Other (manual input)' },
  ]

  const selectedNamespaces = await multiselect({
    message: 'Select namespaces:',
    options: namespaceOptions,
    initialValues:
      existingNamespaces.length > 0 ? existingNamespaces : ['common'],
  })

  if (isCancel(selectedNamespaces)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  let finalNamespaces = [...(selectedNamespaces as string[])]

  if (finalNamespaces.includes('other')) {
    finalNamespaces = finalNamespaces.filter((ns) => ns !== 'other')

    const customNamespaces = await text({
      message:
        "Enter additional namespaces (comma-separated, e.g., 'dashboard,settings'):",
      validate: (value) => {
        if (!value || value.length === 0)
          return 'At least one namespace is required'
        return undefined
      },
    })

    if (isCancel(customNamespaces)) {
      console.log('[tcli] Operation cancelled')
      process.exit(0)
    }

    const additionalNamespaces = (customNamespaces as string)
      .split(',')
      .map((ns) => ns.trim().toLowerCase())
      .filter(Boolean)
    finalNamespaces.push(...additionalNamespaces)
  }

  const defaultNamespace = await select({
    message: 'Select default namespace:',
    options: finalNamespaces.map((ns) => ({ value: ns, label: ns })),
  })

  if (isCancel(defaultNamespace)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  const config: Config = {
    defaultNamespace: defaultNamespace as string,
    langDir: langDir as string,
    langs: finalLangs,
    namespaces: finalNamespaces,
    sourceLang: sourceLang as string,
  }

  saveConfig(config)
  console.log(`Configuration saved successfully`)
}
