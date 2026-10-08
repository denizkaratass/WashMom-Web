// AI analizinin veri şekilleri (backend /predict cevabı). Sadece tip tanımı içerir, çalışan kod yoktur.
// JavaScript'te "interface" yerine JSDoc @typedef kullanılır; VS Code bu tanımlarla otomatik tamamlama yapar.
// Kaynak: backend/schemas.py (PredictionResponse) — alanlar orada değişirse burası da güncellenir.

/** Modelin tahmin edebildiği kumaşlar + kullanıcının seçebildiği 'other' ("emin değilim"). */
/** @typedef {'denim' | 'cotton' | 'knitted' | 'chiffon' | 'leather' | 'furry' | 'other'} Fabric */

/** OpenCV ile kıyafet piksellerinden bulunan renk grubu. */
/** @typedef {'white' | 'light' | 'colored' | 'dark'} ColorGroup */

/** Kural motorunun (rules/washingRules.js) ürettiği bakım profili. */
/** @typedef {'delicate' | 'normal' | 'heavy' | 'special_care'} WashingProfile */

/**
 * İlk 3 tahminden biri.
 * @typedef {object} TopPrediction
 * @property {Fabric} label
 * @property {number} confidence  0–1 arası olasılık (τ düzeltmesinden sonra)
 */

/**
 * POST /predict cevabı.
 * @typedef {object} AnalysisResult
 * @property {Fabric} fabric                    En olası kumaş
 * @property {number} confidence                Bu kumaşın olasılığı (0–1)
 * @property {TopPrediction[]} top_predictions  En olası 3 kumaş, büyükten küçüğe
 * @property {ColorGroup} color_group
 * @property {boolean} needs_review             confidence < 0.55 ise true → kullanıcıya sorulur
 * @property {string} model_version             ör. "effnet_sqrt_finetuned-v1" (mock modda "mock-v1")
 */

export {}
