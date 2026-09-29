// Componentler sadece buradaki fonksiyonları çağırır; mock mu gerçek mi bilmezler.
//   VITE_USE_MOCK_API=true  → mockApi.js
//   VITE_USE_MOCK_API=false → FastAPI (VITE_API_URL)

import { ApiError } from './apiError.js'
import { mockAnalyzeGarment } from './mockApi.js'

export { ApiError }

export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 90_000 // ücretsiz hosting cold start uzun sürebilir

const STATUS_MESSAGES = {
  400: 'Bu fotoğrafı okuyamadım. Başka bir fotoğraf dener misin?',
  413: 'Bu fotoğraf biraz fazla büyük. Daha küçük bir fotoğraf dener misin?',
  500: 'Bir şeyler ters gitti, WashMom tekrar denemeni istiyor.',
}

/** @returns {Promise<{fabric, confidence, top_predictions, color_group, needs_review, model_version}>} */
export async function analyzeGarment(file) {
  if (USE_MOCK_API) return mockAnalyzeGarment(file)

  const body = new FormData()
  body.append('file', file)

  let response
  try {
    response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new ApiError(0, 'WashMom çok uzun süre cevap vermedi. Biraz sonra tekrar dener misin?')
    }
    throw new ApiError(0, 'WashMom’a ulaşamadım. İnternet bağlantını kontrol edip tekrar dene.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, STATUS_MESSAGES[response.status] ?? STATUS_MESSAGES[500])
  }
  return response.json()
}

/** /analyze açılınca backend'i önceden uyandırır (cold start). Hata olursa sessizce geçer. */
export function wakeBackend() {
  if (USE_MOCK_API) return
  fetch(`${API_URL}/health`).catch(() => {})
}
