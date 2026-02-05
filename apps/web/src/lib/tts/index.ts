import type { TTSProvider } from './types'
import { FPTProvider } from './providers/fpt'
import { MockProvider } from './providers/mock'

export type { TTSProvider, TTSResult, TTSOptions } from './types'

/**
 * Create a TTS provider based on environment configuration
 * Set TTS_PROVIDER env var to 'fpt' or 'mock' (default: 'mock')
 */
export function createTTSProvider(): TTSProvider {
  const provider = process.env.TTS_PROVIDER || 'mock'

  switch (provider) {
    case 'fpt':
      return new FPTProvider()
    case 'mock':
      return new MockProvider()
    default:
      throw new Error(`Unknown TTS provider: ${provider}. Supported: fpt, mock`)
  }
}
