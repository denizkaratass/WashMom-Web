// Dosya doğrulama + tarayıcıda (canvas ile) küçültme. Ek kütüphane yok.

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_DIMENSION = 1024

/** Geçerliyse null, değilse WashMom dilinde hata mesajı döner. */
export function validateImageFile(file) {
  if (!file) return 'Bir fotoğraf seçmelisin.'

  const name = file.name?.toLowerCase() ?? ''
  if (/\.(heic|heif)$/.test(name) || /heic|heif/.test(file.type)) {
    return 'iPhone’un HEIC formatını henüz okuyamıyorum. Ayarlar → Kamera → Formatlar → “En Uyumlu” seçip tekrar çekebilir ya da fotoğrafı JPG olarak paylaşabilirsin.'
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Bu dosyayı tanıyamadım. Lütfen JPG, PNG ya da WEBP bir fotoğraf seç.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Bu fotoğraf biraz fazla büyük (en fazla 10 MB). Daha küçük bir fotoğraf dener misin?'
  }
  return null
}

async function loadBitmap(file) {
  // imageOrientation: 'from-image' → telefon fotoğraflarının EXIF yönünü uygular (yan dönmez)
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // bazı eski tarayıcılar seçenekleri desteklemez → <img> ile devam
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** En uzun kenarı 1024 px olacak şekilde küçültür ve JPEG File döndürür. */
export async function resizeImage(file, maxDimension = MAX_DIMENSION, quality = 0.85) {
  const source = await loadBitmap(file)
  const width = source.width
  const height = source.height
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // şeffaf PNG'ler JPEG'de siyaha dönmesin
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(source, 0, 0, w, h)
  source.close?.()

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality),
  )
  const baseName = (file.name || 'kiyafet').replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}
