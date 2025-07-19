import { GoogleGenAI } from '@google/genai'
import { spinner } from '@clack/prompts'

export class GeminiTranslator {
  private genAI: GoogleGenAI

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey })
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string
  ): Promise<string> {
    const s = spinner()
    s.start(`Translating to ${toLang}`)

    try {
      const prompt = `Translate the following text from ${fromLang} to ${toLang}. Return only the translation, no explanations: "${text}"`

      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      })

      const translation = result.text?.trim() || ''

      s.stop(`Translated to ${toLang}`)
      return translation
    } catch (error: any) {
      s.stop(`Translation failed`)

      if (
        error.message?.includes('overloaded') ||
        error.message?.includes('503')
      ) {
        console.error(
          `[tcli] Translation service is overloaded. Please try again in a few moments.`
        )
      } else if (
        error.message?.includes('quota') ||
        error.message?.includes('429')
      ) {
        console.error(
          `[tcli] API quota exceeded. Please check your Gemini API usage.`
        )
      } else {
        console.error(`[tcli] Translation failed: ${error.message}`)
      }

      process.exit(1)
    }
  }

  async batchTranslate(
    texts: Record<string, string>,
    fromLang: string,
    toLang: string
  ): Promise<Record<string, string>> {
    const s = spinner()
    s.start(`Batch translating ${Object.keys(texts).length} keys to ${toLang}`)

    try {
      const entries = Object.entries(texts)
      const textList = entries
        .map(([key, value]) => `${key}: "${value}"`)
        .join('\n')

      const prompt = `Translate the following key-value pairs from ${fromLang} to ${toLang}. Keep the same keys, translate only the values. Return in the same format:\n${textList}`

      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      })

      const translated = result.text?.trim() || ''

      const result_obj: Record<string, string> = {}
      translated.split('\n').forEach((line) => {
        const match = line.match(/^(.+?):\s*"(.+)"$/)
        if (match) {
          result_obj[match[1]] = match[2]
        }
      })

      s.stop(`Batch translated to ${toLang}`)
      return result_obj
    } catch (error: any) {
      s.stop(`Batch translation failed`)

      if (
        error.message?.includes('overloaded') ||
        error.message?.includes('503')
      ) {
        console.error(
          `[tcli] Translation service is overloaded. Please try again in a few moments.`
        )
      } else if (
        error.message?.includes('quota') ||
        error.message?.includes('429')
      ) {
        console.error(
          `[tcli] API quota exceeded. Please check your Gemini API usage.`
        )
      } else {
        console.error(`[tcli] Batch translation failed: ${error.message}`)
      }

      process.exit(1)
    }
  }
}
