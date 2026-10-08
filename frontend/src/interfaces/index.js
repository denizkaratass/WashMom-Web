// Projedeki veri şekillerinin (interface) tek giriş noktası.
// Kullanım (JSDoc içinde): /** @param {import('../interfaces/index.js').Garment} garment */
//
// analysis.js → AnalysisResult, TopPrediction, Fabric, ColorGroup, WashingProfile (AI cevabı)
// garment.js  → Garment, GarmentFormValues, GarmentChanges (gardırop kaydı)

/** @typedef {import('./analysis.js').AnalysisResult} AnalysisResult */
/** @typedef {import('./analysis.js').TopPrediction} TopPrediction */
/** @typedef {import('./analysis.js').Fabric} Fabric */
/** @typedef {import('./analysis.js').ColorGroup} ColorGroup */
/** @typedef {import('./analysis.js').WashingProfile} WashingProfile */
/** @typedef {import('./garment.js').Garment} Garment */
/** @typedef {import('./garment.js').GarmentFormValues} GarmentFormValues */
/** @typedef {import('./garment.js').GarmentChanges} GarmentChanges */

export {}
