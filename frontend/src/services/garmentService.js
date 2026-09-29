// "garments" tablosu için tüm veritabanı işlemleri. Componentler Supabase'i doğrudan çağırmaz.
// Güvenlik RLS ile sağlanır: kullanıcı sadece kendi satırlarını görür/değiştirir.

import { supabase } from './supabase.js'
import {
  getSignedUrl,
  getSignedUrls,
  removeGarmentImage,
  uploadGarmentImage,
} from './storageService.js'

const TABLE = 'garments'

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yap.')
  return data.user.id
}

/**
 * Önce görsel yüklenir, sonra DB kaydı. DB kaydı başarısız olursa yüklenen görsel silinir.
 * @param {{ imageFile: File, analysis: object, values: object }} params
 *   analysis: API'nin orijinal çıktısı; values: nihai alanlar (name, fabric, color_group, ...)
 */
export async function createGarment({ imageFile, analysis, values }) {
  const userId = await requireUserId()
  const imagePath = await uploadGarmentImage(userId, imageFile)

  const row = {
    name: values.name,
    image_path: imagePath,
    ai_fabric: analysis.fabric,
    ai_confidence: analysis.confidence,
    ai_color_group: analysis.color_group,
    top_predictions: analysis.top_predictions,
    fabric: values.fabric,
    color_group: values.color_group,
    washing_profile: values.washing_profile,
    needs_review: analysis.needs_review,
    user_corrected: values.user_corrected,
    user_note: values.user_note || null,
    model_version: analysis.model_version,
  }

  const { data, error } = await supabase.from(TABLE).insert(row).select().single()
  if (error) {
    await removeGarmentImage(imagePath).catch((e) => console.error('Yetim görsel silinemedi:', e))
    throw error
  }
  return data
}

/** Kullanıcının tüm kıyafetleri (en yeni önce) + her biri için imageUrl. */
export async function listGarments() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  const urls = await getSignedUrls(data.map((g) => g.image_path)).catch((e) => {
    console.error('Signed URL alınamadı:', e)
    return {}
  })
  return data.map((g) => ({ ...g, imageUrl: urls[g.image_path] ?? null }))
}

/** Tek kıyafet; bulunamazsa null. */
export async function getGarment(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
  if (error) {
    if (error.code === '22P02') return null // geçersiz uuid → bulunamadı gibi davran
    throw error
  }
  if (!data) return null
  const imageUrl = await getSignedUrl(data.image_path).catch(() => null)
  return { ...data, imageUrl }
}

/** Sadece izin verilen alanlar güncellenir. */
export async function updateGarment(id, changes) {
  const allowed = ['name', 'user_note', 'fabric', 'color_group', 'washing_profile', 'user_corrected']
  const patch = Object.fromEntries(Object.entries(changes).filter(([k]) => allowed.includes(k)))
  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

/** Önce DB kaydı, sonra görsel. Görsel silinemezse loglanır, kullanıcı engellenmez. */
export async function deleteGarment(garment) {
  const { error } = await supabase.from(TABLE).delete().eq('id', garment.id)
  if (error) throw error
  await removeGarmentImage(garment.image_path).catch((e) => console.error('Görsel silinemedi:', e))
}
