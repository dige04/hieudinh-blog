export interface TTSOptions {
  voice?: string
  speed?: number // -3 to 3 for FPT, 0.5-2.0 for others
  format?: 'mp3' | 'wav'
}

export interface TTSProvider {
  name: string
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>
}

export interface TTSResult {
  buffer: Buffer
  duration: number // seconds
}
