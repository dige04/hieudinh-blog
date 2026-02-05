# Vietnamese TTS APIs Research for Podcast Generation
*Date: 2026-02-05*

## 1. FPT.AI Text to Speech
Leading domestic provider with strong regional accent support.

### API Integration
*   **Endpoint:** `POST https://api.fpt.ai/hmi/tts/v5`
*   **Auth:** `api_key` header
*   **Voices:**
    *   **North:** `banmai` (Female), `leminh` (Male), `thuminh` (Female)
    *   **Central:** `myan` (Female), `giahuy` (Male)
    *   **South:** `lannhi` (Female), `linhsan` (Female)
*   **Format:** MP3/WAV, returns URL (async processing recommended for long text)

### Pricing (Pre-paid Packages)
*   **Free:** 100k chars/month (low priority)
*   **Paid:** ~333-500 VND per 1k chars
    *   500k VND: 1.5M chars
    *   1M VND: 4M chars
    *   2M VND: 10M chars

### Code Example (Node.js)
```typescript
async function generateFPT(text: string, apiKey: string) {
  const response = await fetch('https://api.fpt.ai/hmi/tts/v5', {
    method: 'POST',
    headers: {
      'api_key': apiKey,
      'voice': 'banmai',
      'speed': '0',
      'format': 'mp3'
    },
    body: text // Raw text body
  });
  const data = await response.json();
  return data.async; // Returns URL to audio file
}
```

---

## 2. ElevenLabs
Best for natural prosody and voice cloning.

### API Integration
*   **Endpoint:** `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
*   **Auth:** `xi-api-key` header
*   **Model:** `eleven_multilingual_v2` or `eleven_flash_v2_5` (lower latency/cost)
*   **Format:** Streamed audio buffer

### Pricing (Subscription)
*   **Free:** 10k chars/mo
*   **Starter:** $5/mo for 30k chars
*   **Creator:** $22/mo for 100k chars
*   **Flash v2.5:** 50% cost reduction (0.5 credits/char)

### Code Example (Node.js)
```typescript
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({ apiKey: "YOUR_KEY" });

async function generateElevenLabs(text: string) {
  const audioStream = await client.textToSpeech.convert("VOICE_ID", {
    text,
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128",
  });
  // Handle stream...
}
```

---

## 3. Viettel AI
Strong alternative for regional Vietnamese voices.

### API Integration
*   **Endpoint:** `POST https://viettelai.vn/tts/speech_synthesis`
*   **Auth:** Token in header or body
*   **Voices:** `hn-quynhanh` (North), `hcm-diemmy` (South), etc.
*   **Format:** Returns binary audio or link based on options

### Pricing (30-day Packages)
*   **Free:** 50k chars (trial)
*   **Standard:** 380k VND for 1M chars (~380 VND/1k)
*   **Pro:** 1.12M VND for 4M chars (~280 VND/1k)
*   **VIP:** 2.3M VND for 10M chars (~230 VND/1k)

### Code Example (Node.js)
```typescript
async function generateViettel(text: string, token: string) {
  const response = await fetch('https://viettelai.vn/tts/speech_synthesis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      token,
      voice: 'hn-quynhanh',
      speed: 1.0,
      tts_return_option: 3 // MP3
    })
  });
  // Response is binary audio if configured, or check documentation for URL mode
  return response.arrayBuffer();
}
```

## Summary Comparison

| Provider | Best For | Approx Cost / 1M Chars | Voice Quality |
| :--- | :--- | :--- | :--- |
| **FPT.AI** | Native Accents | ~333k VND ($13) | ⭐⭐⭐⭐ (Robotic but clear) |
| **ElevenLabs**| Naturalness | ~$100 (Creator) / ~$50 (Flash) | ⭐⭐⭐⭐⭐ (Best prosody) |
| **Viettel** | Cost at Scale | ~230k-380k VND ($9-$15) | ⭐⭐⭐⭐ (Good regional) |

**Recommendation:** Use **ElevenLabs** for "host" personas requiring emotion/flow. Use **FPT.AI** or **Viettel** for reading long-form news bodies where cost and clarity are prioritzed.
