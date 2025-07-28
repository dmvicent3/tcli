import { requireConfig } from '../lib/config.js'
import { verifyTranslations } from '../lib/verify.js'

export async function verifyCommand(): Promise<void> {
  const config = requireConfig()
  verifyTranslations(config)
}
