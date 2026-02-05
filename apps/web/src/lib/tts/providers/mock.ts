import type { TTSProvider, TTSResult, TTSOptions } from '../types'

/**
 * Mock TTS provider for development/testing
 * Returns a minimal valid MP3 buffer
 */
export class MockProvider implements TTSProvider {
  name = 'mock'

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    // Estimate duration: ~150 words per minute, avg 5 chars per word
    const wordCount = text.length / 5
    const duration = Math.ceil((wordCount / 150) * 60)

    // Minimal valid MP3 frame (silent)
    // This is a valid MP3 header + silent frame for testing
    const silentMp3 = Buffer.from([
      0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ])

    return {
      buffer: silentMp3,
      duration,
    }
  }
}
