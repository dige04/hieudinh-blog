import type { TTSProvider, TTSResult, TTSOptions } from '../types'

const FPT_API_URL = 'https://api.fpt.ai/hmi/tts/v5'

/** FPT.AI speed range: -3 (slowest) to 3 (fastest), 0 is default */
const MIN_SPEED = -3
const MAX_SPEED = 3
const MAX_TEXT_LENGTH = 10000 // FPT.AI limit

interface FPTResponse {
  async: string // URL to the audio file
  error?: number
  message?: string
}

/**
 * FPT.AI TTS provider for Vietnamese text-to-speech
 * Requires TTS_API_KEY environment variable
 *
 * Supported voices: banmai, leminh, thuminh (North), myan, giahuy (Central), lannhi, linhsan (South)
 */
export class FPTProvider implements TTSProvider {
  name = 'fpt'
  private apiKey: string
  private defaultVoice: string

  constructor() {
    const apiKey = process.env.TTS_API_KEY
    if (!apiKey) {
      throw new Error('TTS_API_KEY environment variable is required for FPT provider')
    }
    this.apiKey = apiKey
    this.defaultVoice = process.env.TTS_VOICE || 'banmai'
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    // Input validation
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new Error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`)
    }

    const voice = options?.voice || this.defaultVoice
    const speed = this.validateSpeed(options?.speed)
    const format = options?.format || 'mp3'

    if (format !== 'mp3' && format !== 'wav') {
      throw new Error(`Invalid format: ${format}. Supported: mp3, wav`)
    }

    // Request TTS from FPT API
    const response = await fetch(FPT_API_URL, {
      method: 'POST',
      headers: {
        api_key: this.apiKey,
        voice: voice,
        speed: speed.toString(),
        format: format,
      },
      body: text,
    })

    if (!response.ok) {
      throw new Error(`FPT TTS API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as FPTResponse

    if (data.error) {
      throw new Error(`FPT TTS error: ${data.message}`)
    }

    // FPT returns an async URL, need to fetch the actual audio
    // Poll until the audio is ready (FPT processes asynchronously)
    const audioBuffer = await this.fetchAudioWithRetry(data.async)

    // Calculate duration from MP3 frame headers or estimate from bitrate
    const duration = this.estimateDuration(audioBuffer, format)

    return {
      buffer: audioBuffer,
      duration,
    }
  }

  private validateSpeed(speed?: number): number {
    if (speed === undefined) return 0
    if (speed < MIN_SPEED || speed > MAX_SPEED) {
      throw new Error(`Speed must be between ${MIN_SPEED} and ${MAX_SPEED}, got: ${speed}`)
    }
    return Math.round(speed) // FPT expects integer
  }

  private estimateDuration(buffer: Buffer, format: string): number {
    if (format === 'mp3' && buffer.length > 0) {
      // Try to parse MP3 frame header for accurate bitrate
      // MP3 frame header starts with sync word 0xFF 0xFB (or 0xFF 0xFA, 0xFF 0xF3)
      if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
        // Extract bitrate index from header (bits 12-15)
        const bitrateIndex = (buffer[2] >> 4) & 0x0f
        // Common MP3 bitrates for Layer III (kbps)
        const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
        const bitrate = bitrates[bitrateIndex]
        if (bitrate > 0) {
          // Duration = file size / (bitrate * 125) where 125 = 1000/8
          return Math.ceil(buffer.length / (bitrate * 125))
        }
      }
    }
    // Fallback: estimate at 128kbps (16KB per second)
    return Math.ceil(buffer.length / 16000)
  }

  private async fetchAudioWithRetry(url: string, maxRetries = 10): Promise<Buffer> {
    for (let i = 0; i < maxRetries; i++) {
      const response = await fetch(url)

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }

      // Audio not ready yet, wait with exponential backoff
      if (response.status === 404 || response.status === 202) {
        const delay = Math.min(1000 * Math.pow(1.5, i), 5000) // 1s, 1.5s, 2.25s... max 5s
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw new Error(`Failed to fetch audio: ${response.status}`)
    }

    throw new Error('Audio generation timed out')
  }
}
