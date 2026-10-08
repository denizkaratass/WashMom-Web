// Uyumluluk kural motoru (Bölüm 8.2): garment A + garment B → "Bununla yıkanır mı?"
// Tablolar CLAUDE.md'deki matrislerin birebir kopyasıdır.

import { COLOR_LABELS, FABRIC_LABELS, PROFILE_LABELS } from '../constants/labels.js'

export const OK = 'ok'
export const WARN = 'warn'
export const NO = 'no'

export const COLOR_MATRIX = {
  white: { white: OK, light: OK, colored: NO, dark: NO },
  light: { white: OK, light: OK, colored: WARN, dark: NO },
  colored: { white: NO, light: WARN, colored: OK, dark: WARN },
  dark: { white: NO, light: NO, colored: WARN, dark: OK },
}

export const CARE_MATRIX = {
  delicate: { delicate: OK, normal: WARN, heavy: NO, special_care: NO },
  normal: { delicate: WARN, normal: OK, heavy: WARN, special_care: NO },
  heavy: { delicate: NO, normal: WARN, heavy: OK, special_care: NO },
  special_care: { delicate: NO, normal: NO, heavy: NO, special_care: NO },
}

export const RESULTS = {
  HIGH_COMPATIBILITY: { key: 'HIGH_COMPATIBILITY', title: 'Yüksek uyumluluk' },
  CAUTION: { key: 'CAUTION', title: 'Dikkat' },
  NOT_RECOMMENDED: { key: 'NOT_RECOMMENDED', title: 'Ayrı tutmak daha güvenli' },
}

const lower = (text) => text.toLocaleLowerCase('tr-TR')
const lowerFirst = (text) => lower(text.charAt(0)) + text.slice(1)
const fabricName = (fabric) => (fabric === 'other' ? 'Kumaşı belirsiz' : FABRIC_LABELS[fabric])

function colorCheck(a, b) {
  const status = COLOR_MATRIX[a.color_group][b.color_group]
  const ca = COLOR_LABELS[a.color_group]
  const cb = COLOR_LABELS[b.color_group]
  const same = a.color_group === b.color_group

  const reason = {
    [OK]: same
      ? `İkisi de ${lower(ca)} renk grubunda; renk karışma riski düşük.`
      : `${ca} ve ${lower(cb)} renkler birlikte yıkanabilir.`,
    [WARN]: `${ca} ve ${lower(cb)} renkler birlikte yıkanırsa boya geçebilir; ilk yıkamalarda dikkat et.`,
    [NO]: `${ca} ve ${lower(cb)} kıyafetler birlikte yıkanmamalı; açık olan boya alabilir.`,
  }[status]

  return { key: 'color', title: 'Renk', status, reason }
}

function careCheck(a, b) {
  const pa = a.washing_profile
  const pb = b.washing_profile
  const status = CARE_MATRIX[pa][pb]
  const fa = fabricName(a.fabric)
  const fb = lower(fabricName(b.fabric))

  let reason
  if (pa === 'special_care' || pb === 'special_care') {
    const special = pa === 'special_care' ? a : b
    reason = `${fabricName(special.fabric)} kıyafet özel bakım istiyor; makinede başka kıyafetle yıkanması önerilmez.`
  } else if (status === OK) {
    reason = `İkisi de ${lower(PROFILE_LABELS[pa])} bakım profiline sahip.`
  } else if (status === WARN) {
    reason = `${fa} kıyafet ${lower(PROFILE_LABELS[pa])}, ${fb} ise ${lower(PROFILE_LABELS[pb])} bakım istiyor; daha hassas olanın programını seç.`
  } else {
    reason = `${fa} kıyafet ${lower(PROFILE_LABELS[pa])}, ${fb} ise ${lower(PROFILE_LABELS[pb])} bakım profiline sahip.`
  }

  return { key: 'care', title: 'Bakım', status, reason }
}

export function isUnresolvedReview(garment) {
  return Boolean(garment.needs_review) && !garment.user_corrected
}

function confidenceCheck(a, b) {
  const unsure = [a, b].filter(isUnresolvedReview)
  const status = unsure.length ? WARN : OK
  const reason =
    unsure.length === 0
      ? 'İki kıyafetin analizi de yeterince net.'
      : unsure.length === 2
        ? 'WashMom iki kıyafetten de tam emin değil; tahminleri kontrol etmeni öneririz.'
        : `WashMom “${unsure[0].name}” için tam emin değil; tahmini kontrol etmeni öneririz.`

  return { key: 'confidence', title: 'Güven', status, reason }
}

/**
 * @param {import('../interfaces/index.js').Garment} a
 * @param {import('../interfaces/index.js').Garment} b  (kullanılan alanlar: name, fabric, color_group, washing_profile, needs_review, user_corrected)
 */
export function checkCompatibility(a, b) {
  const checks = [colorCheck(a, b), careCheck(a, b), confidenceCheck(a, b)]
  const [color, care] = checks

  let result
  if (checks.some((c) => c.status === NO)) result = RESULTS.NOT_RECOMMENDED
  else if (checks.some((c) => c.status === WARN)) result = RESULTS.CAUTION
  else result = RESULTS.HIGH_COMPATIBILITY

  return { result: result.key, title: result.title, checks, mainReason: buildMainReason(color, care, checks) }
}

function buildMainReason(color, care, checks) {
  const worst = checks.find((c) => c.status === NO) ?? checks.find((c) => c.status === WARN)
  if (!worst) return 'Renk ve bakım profilleri uyumlu; birlikte yıkanabilirler.'
  if (worst.key !== 'color' && color.status === OK) {
    return `Renkleri uyumlu olsa da ${lowerFirst(worst.reason)}`
  }
  return worst.reason
}

/**
 * Wash Passport'taki "Birlikte değerlendirilebilir / Ayrı tutmak daha güvenli" ipuçları.
 * Tek kıyafet için, tablolarda ✓ ve ✕ olan grupları listeler.
 */
export function getGroupingHints(colorGroup, profile) {
  const pick = (row, labels, status) =>
    Object.entries(row)
      .filter(([, s]) => s === status)
      .map(([key]) => labels[key])

  const colorRow = COLOR_MATRIX[colorGroup] ?? {}
  const careRow = CARE_MATRIX[profile] ?? {}

  return {
    together: {
      colors: pick(colorRow, COLOR_LABELS, OK),
      profiles: pick(careRow, PROFILE_LABELS, OK),
    },
    apart: {
      colors: pick(colorRow, COLOR_LABELS, NO),
      profiles: pick(careRow, PROFILE_LABELS, NO),
    },
  }
}
