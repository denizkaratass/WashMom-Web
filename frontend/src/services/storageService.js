// Supabase Storage: private "garment-images" bucket'ı. Görseller signed URL ile gösterilir.
import { supabase } from './supabase.js'

const BUCKET = 'garment-images'
const SIGNED_URL_SECONDS = 60 * 60 // 1 saat

/** Görseli {user_id}/{uuid}.jpg yoluna yükler, Storage yolunu döndürür. */
export async function uploadGarmentImage(userId, file) {
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function getSignedUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error) throw error
  return data.signedUrl
}

/** Listeler için toplu signed URL: { [path]: url } */
export async function getSignedUrls(paths) {
  if (!paths.length) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
  if (error) throw error
  return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]))
}

export async function removeGarmentImage(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
