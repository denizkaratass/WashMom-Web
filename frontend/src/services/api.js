// Componentler sadece buradaki fonksiyonları çağırır; mock mu gerçek mi bilmezler.
//   VITE_USE_MOCK_API=true  → mockApi.js (sahte sonuç; sonuç ekranında "demo" uyarısı çıkar)
//   başka her değer / tanımsız → FastAPI (VITE_API_URL). Değişken unutulursa canlıda sahte sonuç gösterilmez.

import { COLOR_GROUPS, FABRICS } from '../constants/labels.js'
import { ApiError } from './apiError.js'
import { mockAnalyzeGarment } from './mockApi.js'
import { STATUS_MESSAGES } from './statusMessages.js'

export { ApiError }

export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 90_000 // ücretsiz hosting cold start uzun sürebilir

const isProbability = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1

/** Backend beklenmedik bir şey dönerse (proxy sayfası, eski sürüm...) sonuç ekranı çökmesin. */
export function isValidAnalysis(r) {
  return (
    r !== null &&
    typeof r === 'object' &&
    FABRICS.includes(r.fabric) &&
    isProbability(r.confidence) &&
    COLOR_GROUPS.includes(r.color_group) &&
    typeof r.needs_review === 'boolean' &&
    typeof r.model_version === 'string' &&
    Array.isArray(r.top_predictions) &&
    r.top_predictions.length > 0 &&
    r.top_predictions.every((p) => FABRICS.includes(p?.label) && isProbability(p?.confidence))
  )
}

/** AbortSignal.timeout eski Safari'de (iOS 15 ve öncesi) yok; orada elle zamanlayıcı kurulur. */
function timeoutSignal(ms) {
  if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms)
  const controller = new AbortController()
  setTimeout(() => controller.abort(new DOMException('Zaman aşımı', 'TimeoutError')), ms)
  return controller.signal
}

/**
 * @param {File} file  Küçültülmüş kıyafet fotoğrafı
 * @returns {Promise<import('../interfaces/index.js').AnalysisResult>}
 */
export async function analyzeGarment(file) {
  if (USE_MOCK_API) return mockAnalyzeGarment(file)

  const body = new FormData()
  body.append('file', file)

  let response
  try {
    response = await fetch(`${API_URL}/predict`, { method: 'POST', body, signal: timeoutSignal(REQUEST_TIMEOUT_MS) })
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new ApiError(0, 'WashMom çok uzun süre cevap vermedi. Biraz sonra tekrar dener misin?')
    }
    throw new ApiError(0, 'WashMom’a ulaşamadım. İnternet bağlantını kontrol edip tekrar dene.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, STATUS_MESSAGES[response.status] ?? STATUS_MESSAGES[500])
  }
  // Bozuk ya da beklenmedik yanıtta kullanıcı "Unexpected token..." gibi teknik bir mesaj görmesin
  const data = await response.json().catch(() => null)
  if (!isValidAnalysis(data)) throw new ApiError(response.status, STATUS_MESSAGES[500])
  return data
}

/** /analyze açılınca backend'i önceden uyandırır (cold start). Hata olursa sessizce geçer. */
export function wakeBackend() {
  if (USE_MOCK_API) return
  fetch(`${API_URL}/health`).catch(() => {})
}

/** Sonuç sahte (mock) ya da modelsiz (fake) backend'den mi geldi? Ekranda demo uyarısı için. */
export function isDemoResult(result) {
  return /^(mock|fake)-/.test(result?.model_version ?? '')
}
