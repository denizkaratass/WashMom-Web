import { describe, expect, it } from 'vitest'
import { getWashingProfile, formatProfileLabel } from './washingRules.js'
import {
  CARE_MATRIX,
  COLOR_MATRIX,
  checkCompatibility,
  getGroupingHints,
} from './compatibilityRules.js'
import { suggestGarmentName } from '../constants/labels.js'

const garment = (fabric, color_group, extra = {}) => ({
  name: `${fabric}-${color_group}`,
  fabric,
  color_group,
  washing_profile: getWashingProfile({ fabric, color_group }).washing_profile,
  needs_review: false,
  user_corrected: false,
  ...extra,
})

describe('washingRules', () => {
  it.each([
    ['chiffon', 'delicate'],
    ['knitted', 'delicate'],
    ['cotton', 'normal'],
    ['denim', 'heavy'],
    ['leather', 'special_care'],
    ['furry', 'special_care'],
    ['other', 'normal'],
  ])('%s → %s', (fabric, profile) => {
    expect(getWashingProfile({ fabric, color_group: 'dark' }).washing_profile).toBe(profile)
  })

  it('CLAUDE.md örnek etiketleri', () => {
    expect(getWashingProfile({ fabric: 'knitted', color_group: 'dark' }).label).toBe('Hassas • Koyu')
    expect(getWashingProfile({ fabric: 'denim', color_group: 'dark' }).label).toBe('Ağır • Koyu')
    expect(getWashingProfile({ fabric: 'cotton', color_group: 'white' }).label).toBe('Normal • Beyaz')
  })

  it('profil etiketi renk olmadan da çalışır', () => {
    expect(formatProfileLabel('special_care')).toBe('Özel bakım')
  })

  it('varsayılan kıyafet adı önerir', () => {
    expect(suggestGarmentName('knitted', 'dark')).toBe('Koyu Örgü Kıyafet')
    expect(suggestGarmentName('other', 'white')).toBe('Beyaz Kıyafet')
  })
})

describe('compatibilityRules', () => {
  it('matrisler simetrik', () => {
    for (const m of [COLOR_MATRIX, CARE_MATRIX]) {
      for (const a of Object.keys(m)) for (const b of Object.keys(m)) expect(m[a][b]).toBe(m[b][a])
    }
  })

  it('aynı renk ve profil → yüksek uyumluluk', () => {
    const r = checkCompatibility(garment('cotton', 'white'), garment('cotton', 'light'))
    expect(r.result).toBe('HIGH_COMPATIBILITY')
    expect(r.checks.map((c) => c.status)).toEqual(['ok', 'ok', 'ok'])
  })

  it('örgü + denim (ikisi de koyu) → ayrı tut, açıklayıcı neden', () => {
    const r = checkCompatibility(garment('knitted', 'dark'), garment('denim', 'dark'))
    expect(r.result).toBe('NOT_RECOMMENDED')
    expect(r.mainReason).toBe(
      'Renkleri uyumlu olsa da örgü kıyafet hassas, denim ise ağır bakım profiline sahip.',
    )
  })

  it('beyaz + koyu → ayrı tut', () => {
    const r = checkCompatibility(garment('cotton', 'white'), garment('cotton', 'dark'))
    expect(r.result).toBe('NOT_RECOMMENDED')
    expect(r.checks[0].status).toBe('no')
  })

  it('tek bir ⚠ → dikkat', () => {
    const r = checkCompatibility(garment('cotton', 'colored'), garment('cotton', 'dark'))
    expect(r.result).toBe('CAUTION')
  })

  it('özel bakım her zaman ayrı tutulur', () => {
    const r = checkCompatibility(garment('leather', 'dark'), garment('leather', 'dark'))
    expect(r.result).toBe('NOT_RECOMMENDED')
    expect(r.checks[1].reason).toContain('özel bakım')
  })

  it('düzeltilmemiş belirsiz tahmin uyarı verir, düzeltilmiş vermez', () => {
    const unsure = garment('cotton', 'dark', { needs_review: true, name: 'Tişört' })
    const r1 = checkCompatibility(unsure, garment('cotton', 'dark'))
    expect(r1.result).toBe('CAUTION')
    expect(r1.checks[2].reason).toContain('Tişört')

    const r2 = checkCompatibility({ ...unsure, user_corrected: true }, garment('cotton', 'dark'))
    expect(r2.result).toBe('HIGH_COMPATIBILITY')
  })

  it('gruplama ipuçları tablolardan üretilir', () => {
    const h = getGroupingHints('dark', 'delicate')
    expect(h.together.colors).toEqual(['Koyu'])
    expect(h.together.profiles).toEqual(['Hassas'])
    expect(h.apart.colors).toEqual(['Beyaz', 'Açık'])
    expect(h.apart.profiles).toEqual(['Ağır', 'Özel bakım'])
  })
})
