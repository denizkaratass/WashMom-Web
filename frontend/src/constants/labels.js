// Enum değerleri (backend / veritabanı dili) → Türkçe ekran etiketleri ve eşikler.
// Her şey tek yerde durur; bir etiketi değiştirmek için sadece burayı düzenle.

export const FABRICS = ['denim', 'cotton', 'knitted', 'chiffon', 'leather', 'furry', 'other']
export const COLOR_GROUPS = ['white', 'light', 'colored', 'dark']
export const WASHING_PROFILES = ['delicate', 'normal', 'heavy', 'special_care']

export const FABRIC_LABELS = {
  denim: 'Denim',
  cotton: 'Pamuk',
  knitted: 'Örgü',
  chiffon: 'Şifon',
  leather: 'Deri',
  furry: 'Tüylü',
  other: 'Diğer',
}

export const COLOR_LABELS = {
  white: 'Beyaz',
  light: 'Açık',
  colored: 'Renkli',
  dark: 'Koyu',
}

// Renk rozetlerinde kullanılan küçük renk noktaları
export const COLOR_SWATCHES = {
  white: '#ffffff',
  light: '#e9dcc4',
  colored: 'linear-gradient(135deg, #e8705f, #e0b23a, #2f7d5b)',
  dark: '#2b2a28',
}

export const PROFILE_LABELS = {
  delicate: 'Hassas',
  normal: 'Normal',
  heavy: 'Ağır',
  special_care: 'Özel bakım',
}

export const PROFILE_BADGE_CLASSES = {
  delicate: 'bg-coral-light text-coral-dark',
  normal: 'bg-leaf-light text-leaf-dark',
  heavy: 'bg-cream-dark text-ink',
  special_care: 'bg-honey-light text-honey',
}

// ---- Güven eşikleri (Bölüm 11). Backend'deki config.py ile aynı değerler. ----
export const NEEDS_REVIEW_MIN_CONFIDENCE = 0.6
export const NEEDS_REVIEW_MIN_MARGIN = 0.15
export const CONFIDENCE_HIGH = 0.8
export const CONFIDENCE_MEDIUM = 0.6

export function getConfidenceLevel(confidence) {
  if (confidence >= CONFIDENCE_HIGH) return { key: 'high', label: 'Yüksek' }
  if (confidence >= CONFIDENCE_MEDIUM) return { key: 'medium', label: 'Orta' }
  return { key: 'low', label: 'Emin değil' }
}

export function formatPercent(value) {
  return `%${Math.round((value ?? 0) * 100)}`
}

// Model kıyafete isim vermez; kaydetme formunda önerilen varsayılan isim.
export function suggestGarmentName(fabric, colorGroup) {
  const color = COLOR_LABELS[colorGroup] ?? ''
  const fabricLabel = fabric && fabric !== 'other' ? FABRIC_LABELS[fabric] : ''
  return [color, fabricLabel, 'Kıyafet'].filter(Boolean).join(' ')
}

export const DISCLAIMER = 'WashMom bir öneri sunar. Kıyafetin bakım etiketi her zaman önceliklidir.'
