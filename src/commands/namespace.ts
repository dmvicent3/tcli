import { confirm, isCancel } from '@clack/prompts'
import { requireConfig, saveConfig } from '../lib/config'
import { saveTranslationFile } from '../lib/files'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'

export async function nsAddCommand(name: string): Promise<void> {
  const config = requireConfig()

  if (config.namespaces.includes(name)) {
    console.error(
      `[${config.defaultNamespace}] Namespace '${name}' already exists`
    )
    process.exit(1)
  }

  config.namespaces.push(name)
  config.namespaces.sort()
  saveConfig(config)

  config.langs.forEach((lang) => {
    saveTranslationFile(config.langDir, lang, name, {})
  })

  console.log(`[${config.defaultNamespace}] Namespace added`)
}

export async function nsRemoveCommand(name: string): Promise<void> {
  const config = requireConfig()

  if (!config.namespaces.includes(name)) {
    console.error(`[${config.defaultNamespace}] Namespace '${name}' not found`)
    process.exit(1)
  }

  if (name === config.defaultNamespace) {
    console.error(
      `[${config.defaultNamespace}] Cannot remove default namespace`
    )
    process.exit(1)
  }

  const confirmed = await confirm({
    message: `Remove namespace '${name}' and all its translations?`,
  })

  if (isCancel(confirmed)) {
    console.log('[tcli] Operation cancelled')
    process.exit(0)
  }

  if (!confirmed) return

  config.namespaces = config.namespaces.filter((ns) => ns !== name)
  saveConfig(config)

  config.langs.forEach((lang: string) => {
    const filePath = join(config.langDir, lang, `${name}.json`)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  })

  console.log(`[${config.defaultNamespace}] Namespace removed`)
}

export async function nsListCommand(): Promise<void> {
  const config = requireConfig()

  console.log(`[${config.defaultNamespace}] Namespaces:`)
  config.namespaces.forEach((ns) => {
    const marker = ns === config.defaultNamespace ? ' (default)' : ''
    console.log(`  ${ns}${marker}`)
  })
}

export async function nsDefaultCommand(name: string): Promise<void> {
  const config = requireConfig()

  if (!config.namespaces.includes(name)) {
    console.error(`[${config.defaultNamespace}] Namespace '${name}' not found`)
    process.exit(1)
  }

  config.defaultNamespace = name
  saveConfig(config)

  console.log(`[${name}] Default namespace updated`)
}
