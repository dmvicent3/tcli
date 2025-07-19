import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { Config } from '../types.ts'

const CONFIG_FILE = 'tcli.config.json'

export function loadConfig(): Config | null {
  if (!existsSync(CONFIG_FILE)) return null
  return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
}

export function saveConfig(config: Config): void {
  const sorted = Object.keys(config)
    .sort()
    .reduce((acc, key) => {
      acc[key] = config[key as keyof Config]
      return acc
    }, {} as any)

  writeFileSync(CONFIG_FILE, JSON.stringify(sorted, null, 2))
}

export function requireConfig() {
  const config = loadConfig()
  if (!config) {
    console.error('[tcli] No config found. Run `tcli init` first.')
    process.exit(1)
  }
  return config
}

export function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[tcli] GEMINI_API_KEY environment variable not found.')
    console.error('[tcli] Please set it in your .env file or environment.')
    process.exit(1)
  }
  return apiKey
}
