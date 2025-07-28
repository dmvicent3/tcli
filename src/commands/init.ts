import { text, multiselect, select, isCancel } from '@clack/prompts'
import { getApiKey, loadConfig, saveConfig } from '../lib/config.js'
import { scanExistingStructure } from '../lib/files.js'
import type { Config } from '../types.ts'

const COMMON_LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'pt-PT', label: 'Portuguese (Portugal)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'es-AR', label: 'Spanish (Argentina)' },
  { value: 'es-CL', label: 'Spanish (Chile)' },
  { value: 'es-CO', label: 'Spanish (Colombia)' },
  { value: 'es-PE', label: 'Spanish (Peru)' },
  { value: 'es-UY', label: 'Spanish (Uruguay)' },
  { value: 'es-PA', label: 'Spanish (Panama)' },
  { value: 'pl-PL', label: 'Polish (Poland)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'it-IT', label: 'Italian (Italy)' },
  { value: 'de-DE', label: 'German (Germany)' },
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

  const selectedLangs = await multiselect({
    message: 'Select languages to support:',
    options: COMMON_LANGUAGES,
    initialValues: existing.langs.length > 0 ? existing.langs : ['en-us'],
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
      .map((lang) => lang.trim())
      .filter(Boolean)
    finalLangs.push(...additionalLangs)
  }

  const sourceLang = await select({
    message: 'Select source language:',
    options: finalLangs.map((lang) => ({
      value: lang,
      label: COMMON_LANGUAGES.find((l) => l.value === lang)?.label || lang,
    })),
  })

  if (isCancel(sourceLang)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  const allNamespaces = [
    ...new Set([...existing.namespaces, 'common', 'home', 'auth', 'errors']),
  ]
  const namespaceOptions = [
    ...allNamespaces.map((ns) => ({ value: ns, label: ns })),
    { value: 'other', label: 'Other (manual input)' },
  ]

  const selectedNamespaces = await multiselect({
    message: 'Select namespaces:',
    options: namespaceOptions,
    initialValues:
      existing.namespaces.length > 0 ? existing.namespaces : ['common'],
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
      .map((ns) => ns.trim())
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
