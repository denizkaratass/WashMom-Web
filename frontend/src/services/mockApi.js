// Sahte AI API. Gerçek FastAPI /predict ile BİREBİR aynı JSON şeklini döndürür.
// Amaç: model hazır olmadan tüm arayüzü (yükleniyor, belirsiz sonuç, hata) geliştirmek.

import {
  COLOR_GROUPS,
  FABRICS,
  NEEDS_REVIEW_MIN_CONFIDENCE,
  NEEDS_REVIEW_MIN_MARGIN,
} from '../constants/labels.js'
import { ApiError } from './apiError.js'

const MODEL_VERSION = 'mock-v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pick = (list) => list[Math.floor(Math.random() * list.length)]

function buildPredictions(topConfidence, secondConfidence) {
  const [first, second, ...rest] = [...FABRICS].sort(() => Math.random() - 0.5)
  const remaining = Math.max(0, 1 - topConfidence - secondConfidence)
  const third = rest[0]
  return [
    { label: first, confidence: topConfidence },
    { label: second, confidence: secondConfidence },
    { label: third, confidence: +(remaining * 0.7).toFixed(2) },
  ]
}

export async function mockAnalyzeGarment() {
  await sleep(1500 + Math.random() * 1000)

  const roll = Math.random()
  if (roll < 0.1) {
    throw new ApiError(500, 'Bir şeyler ters gitti, WashMom tekrar denemeni istiyor.')
  }

  // %30 belirsiz sonuç, %60 net sonuç
  const uncertain = roll < 0.4
  const top = uncertain ? +(0.4 + Math.random() * 0.15).toFixed(2) : +(0.8 + Math.random() * 0.17).toFixed(2)
  const second = uncertain ? +(top - 0.05 - Math.random() * 0.05).toFixed(2) : +((1 - top) * 0.6).toFixed(2)
  const top_predictions = buildPredictions(top, second)
  const fabric = top_predictions[0].label

  return {
    fabric,
    confidence: top,
    top_predictions,
    color_group: pick(COLOR_GROUPS),
    needs_review:
      top < NEEDS_REVIEW_MIN_CONFIDENCE || top - second < NEEDS_REVIEW_MIN_MARGIN || fabric === 'other',
    model_version: MODEL_VERSION,
  }
}
