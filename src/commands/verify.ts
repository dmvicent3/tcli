import { requireConfig } from '../lib/config'
import { verifyTranslations } from '../lib/verify'

export async function verifyCommand(): Promise<void> {
  const config = requireConfig()
  verifyTranslations(config)
}
