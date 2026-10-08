// Sahte AI API. Gerçek FastAPI /predict ile BİREBİR aynı JSON şeklini ve kurallarını taklit eder:
// modelin 6 sınıfı, needs_review = güven < 0.55, kıyafet bulunamazsa 422.
// Amaç: backend açmadan tüm arayüzü (yükleniyor, belirsiz sonuç, hata) geliştirmek.

import { COLOR_GROUPS, MODEL_FABRICS, NEEDS_REVIEW_MIN_CONFIDENCE } from '../constants/labels.js'
import { ApiError } from './apiError.js'
import { STATUS_MESSAGES } from './statusMessages.js'

const MODEL_VERSION = 'mock-v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pick = (list) => list[Math.floor(Math.random() * list.length)]

function buildPredictions(topConfidence, secondConfidence) {
  const [first, second, third] = [...MODEL_FABRICS].sort(() => Math.random() - 0.5)
  const remaining = Math.max(0, 1 - topConfidence - secondConfidence)
  return [
    { label: first, confidence: topConfidence },
    { label: second, confidence: secondConfidence },
    { label: third, confidence: +(remaining * 0.7).toFixed(2) },
  ]
}

export async function mockAnalyzeGarment() {
  await sleep(1500 + Math.random() * 1000)

  const roll = Math.random()
  if (roll < 0.05) throw new ApiError(500, STATUS_MESSAGES[500])
  if (roll < 0.1) throw new ApiError(422, STATUS_MESSAGES[422])

  // %30 belirsiz sonuç (0.40–0.54), %60 net sonuç (0.80–0.97)
  const uncertain = roll < 0.4
  const top = uncertain ? +(0.4 + Math.random() * 0.14).toFixed(2) : +(0.8 + Math.random() * 0.17).toFixed(2)
  const second = +((1 - top) * 0.6).toFixed(2)
  const top_predictions = buildPredictions(top, second)

  return {
    fabric: top_predictions[0].label,
    confidence: top,
    top_predictions,
    color_group: pick(COLOR_GROUPS),
    needs_review: top < NEEDS_REVIEW_MIN_CONFIDENCE,
    model_version: MODEL_VERSION,
  }
}
