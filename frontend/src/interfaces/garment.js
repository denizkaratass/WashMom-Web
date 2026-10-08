// Gardıroptaki kıyafet kaydının veri şekilleri (Supabase "garments" tablosu). Sadece tip tanımı içerir.
// Kaynak: supabase/schema.sql — tablo değişirse burası da güncellenir.

/** @typedef {import('./analysis.js').Fabric} Fabric */
/** @typedef {import('./analysis.js').ColorGroup} ColorGroup */
/** @typedef {import('./analysis.js').WashingProfile} WashingProfile */
/** @typedef {import('./analysis.js').TopPrediction} TopPrediction */

/**
 * Veritabanındaki bir kıyafet satırı (Ekle / Listele / Güncelle / Sil işlemlerinin konusu).
 * @typedef {object} Garment
 * @property {string} id                     uuid
 * @property {string} user_id                Sahibi (RLS: herkes sadece kendi kayıtlarını görür)
 * @property {string} name                   1–80 karakter
 * @property {string} image_path             Storage içindeki yol (public URL değil)
 * @property {Fabric | null} ai_fabric       AI'ın orijinal tahmini (kullanıcı düzeltse de saklanır)
 * @property {number | null} ai_confidence
 * @property {ColorGroup | null} ai_color_group
 * @property {TopPrediction[] | null} top_predictions
 * @property {Fabric} fabric                 Nihai değer (AI ya da kullanıcı düzeltmesi)
 * @property {ColorGroup} color_group
 * @property {WashingProfile} washing_profile
 * @property {boolean} needs_review
 * @property {boolean} user_corrected        Kullanıcı kumaşı/rengi değiştirdi mi?
 * @property {string | null} user_note       En fazla 500 karakter
 * @property {string | null} model_version
 * @property {string} created_at             ISO tarih
 * @property {string} updated_at
 * @property {string | null} [imageUrl]      Listeleme/detayda eklenen süreli (signed) görsel adresi
 */

/**
 * Kaydetme formunun nihai değerleri (createGarment → values).
 * @typedef {object} GarmentFormValues
 * @property {string} name
 * @property {Fabric} fabric
 * @property {ColorGroup} color_group
 * @property {WashingProfile} washing_profile
 * @property {boolean} user_corrected
 * @property {string} [user_note]
 */

/**
 * Güncellenebilen alanlar (updateGarment sadece bunları kabul eder).
 * @typedef {Partial<Pick<Garment, 'name' | 'user_note' | 'fabric' | 'color_group' | 'washing_profile' | 'user_corrected'>>} GarmentChanges
 */

export {}
