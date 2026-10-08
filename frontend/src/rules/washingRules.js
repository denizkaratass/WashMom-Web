// Yıkama kural motoru: fabric + color → yıkama profili + açıklama.
// ML değil; okunabilir tablolar. Frontend'de durur, böylece kullanıcı düzeltme
// yaptığında profil backend'e gitmeden anında yeniden hesaplanır.

import { COLOR_LABELS, FABRIC_LABELS, PROFILE_LABELS } from '../constants/labels.js'

export const FABRIC_TO_PROFILE = {
  chiffon: 'delicate',
  knitted: 'delicate',
  cotton: 'normal',
  denim: 'heavy',
  leather: 'special_care',
  furry: 'special_care',
  other: 'normal', // emin değil → needs_review
}

const PROFILE_DETAILS = {
  delicate: {
    temperature: '30°C',
    program: 'Hassas / elde yıkama programı',
    reason: 'ince ya da esnek bir yapıya sahip; yüksek sıcaklık ve sert sıkma şeklini bozabilir',
    tips: ['Düşük devirde sık (en fazla 600–800)', 'Kurutma makinesi yerine düz sererek kurut'],
  },
  normal: {
    temperature: '30–40°C',
    program: 'Standart / pamuklu programı',
    reason: 'dayanıklı ve günlük kullanıma uygun bir yapıya sahip',
    tips: ['Orta devirde sıkma yeterli', 'Çok sıcak kurutma çekmeye neden olabilir'],
  },
  heavy: {
    temperature: '30–40°C',
    program: 'Standart program, ters çevirerek',
    reason: 'kalın ve ağır bir kumaş; hassas kıyafetleri sürtünmeyle yıpratabilir',
    tips: ['Ters çevirip fermuar ve düğmeleri kapat', 'Benzer ağırlıktaki kıyafetlerle yıka'],
  },
  special_care: {
    temperature: '—',
    program: 'Makinede yıkama önerilmez',
    reason: 'özel bakım isteyen bir malzeme; su ve deterjan dokusuna zarar verebilir',
    tips: ['Kuru temizleme veya uzman bakımı tercih et', 'Küçük lekeler için nemli bezle sil'],
  },
}

const COLOR_TIPS = {
  white: 'Beyazları sadece beyaz ve çok açık renklerle yıka; griye dönmesini önler.',
  light: 'Açık renkleri koyulardan ayrı tut; renk alabilir.',
  colored: 'Renkli kıyafetler ilk yıkamalarda boya verebilir; benzer renklerle yıka.',
  dark: 'Koyu kıyafeti ters çevirerek yıka; rengi daha uzun korunur.',
}

export function getProfileForFabric(fabric) {
  return FABRIC_TO_PROFILE[fabric] ?? 'normal'
}

/**
 * @param {{ fabric: string, color_group: string }} garment
 * @returns {{
 *   washing_profile: string, label: string,
 *   temperature: string, program: string, explanation: string, tips: string[]
 * }}
 */
export function getWashingProfile({ fabric, color_group }) {
  const profile = getProfileForFabric(fabric)
  const details = PROFILE_DETAILS[profile]
  const fabricLabel = FABRIC_LABELS[fabric] ?? 'Bu'
  const colorLabel = COLOR_LABELS[color_group]

  const explanation =
    fabric === 'other'
      ? 'Kumaş yapısı net anlaşılamadı; en güvenli varsayım olarak normal bakım öneriliyor.'
      : `${fabricLabel} kıyafet ${details.reason}. Bu yüzden ${PROFILE_LABELS[profile].toLocaleLowerCase('tr-TR')} bakım profili öneriliyor.`

  return {
    washing_profile: profile,
    label: formatProfileLabel(profile, color_group),
    temperature: details.temperature,
    program: details.program,
    explanation,
    tips: colorLabel ? [...details.tips, COLOR_TIPS[color_group]] : [...details.tips],
  }
}

/** "Hassas • Koyu" */
export function formatProfileLabel(profile, colorGroup) {
  return [PROFILE_LABELS[profile], COLOR_LABELS[colorGroup]].filter(Boolean).join(' • ')
}
