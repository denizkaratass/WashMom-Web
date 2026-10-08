// Servis katmanı testleri. Supabase ve fetch sahte (mock) — ağa çıkılmaz.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COLOR_GROUPS, getConfidenceLevel, MODEL_FABRICS, NEEDS_REVIEW_MIN_CONFIDENCE } from '../constants/labels.js'
import { MAX_FILE_SIZE, validateImageFile } from '../utils/resizeImage.js'

// ---------------------------------------------------------------- sahte Supabase
const fake = vi.hoisted(() => {
  const state = {}
  const builder = {
    insert: (row) => ((state.inserted = row), builder),
    update: (patch) => ((state.updated = patch), builder),
    delete: () => builder,
    select: () => builder,
    order: async () => state.list,
    eq: () => builder,
    single: async () => state.single,
    maybeSingle: async () => state.maybe,
    then: (resolve) => resolve(state.deleteResult), // await supabase.from().delete().eq()
  }
  const bucket = {
    upload: vi.fn(async () => ({ error: state.uploadError ?? null })),
    remove: vi.fn(async () => ({ error: state.removeError ?? null })),
    createSignedUrl: vi.fn(async (path) => ({ data: { signedUrl: `signed:${path}` }, error: null })),
    createSignedUrls: vi.fn(async (paths) => ({ data: paths.map((p) => ({ path: p, signedUrl: `signed:${p}` })), error: null })),
  }
  const supabase = {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })) },
    from: vi.fn(() => builder),
    storage: { from: vi.fn(() => bucket) },
  }
  return { state, bucket, supabase }
})
vi.mock('./supabase.js', () => ({ supabase: fake.supabase }))

const { createGarment, deleteGarment, getGarment, listGarments, updateGarment } = await import('./garmentService.js')

const analysis = {
  fabric: 'knitted',
  confidence: 0.88,
  top_predictions: [{ label: 'knitted', confidence: 0.88 }],
  color_group: 'dark',
  needs_review: false,
  model_version: 'v1',
}
const values = { name: 'Kazak', fabric: 'cotton', color_group: 'dark', washing_profile: 'normal', user_corrected: true, user_note: '' }

beforeEach(() => {
  for (const k of Object.keys(fake.state)) delete fake.state[k]
  vi.clearAllMocks()
})

describe('garmentService', () => {
  it('kaydederken görseli kullanıcının klasörüne yükler, AI ve nihai değerleri ayrı yazar', async () => {
    fake.state.single = { data: { id: 'g1' }, error: null }
    await createGarment({ imageFile: new File(['x'], 'a.jpg'), analysis, values })

    const [path] = fake.bucket.upload.mock.calls[0]
    expect(path).toMatch(/^user-1\/[0-9a-f-]{36}\.jpg$/)
    expect(fake.state.inserted).toMatchObject({ ai_fabric: 'knitted', fabric: 'cotton', image_path: path, user_note: null })
    expect(fake.state.inserted).not.toHaveProperty('user_id') // DB default auth.uid() + RLS belirler
  })

  it('DB kaydı başarısızsa yüklenen görseli siler (yetim dosya kalmaz)', async () => {
    fake.state.single = { data: null, error: new Error('check constraint') }
    await expect(createGarment({ imageFile: new File(['x'], 'a.jpg'), analysis, values })).rejects.toThrow()
    const [uploaded] = fake.bucket.upload.mock.calls[0]
    expect(fake.bucket.remove).toHaveBeenCalledWith([uploaded])
  })

  it('görsel yüklenemezse DB kaydı denenmez', async () => {
    fake.state.uploadError = new Error('storage down')
    await expect(createGarment({ imageFile: new File(['x'], 'a.jpg'), analysis, values })).rejects.toThrow('storage down')
    expect(fake.state.inserted).toBeUndefined()
  })

  it('silerken önce DB, sonra görsel; görsel silinemezse kullanıcıyı engellemez', async () => {
    fake.state.deleteResult = { error: null }
    fake.state.removeError = new Error('storage down')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(deleteGarment({ id: 'g1', image_path: 'user-1/a.jpg' })).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('DB silme başarısızsa görsele dokunmaz', async () => {
    fake.state.deleteResult = { error: new Error('rls') }
    await expect(deleteGarment({ id: 'g1', image_path: 'user-1/a.jpg' })).rejects.toThrow('rls')
    expect(fake.bucket.remove).not.toHaveBeenCalled()
  })

  it('güncellemede sadece izinli alanlar gönderilir', async () => {
    fake.state.single = { data: {}, error: null }
    await updateGarment('g1', { name: 'Yeni', user_id: 'baskasi', image_path: 'x', ai_fabric: 'denim', fabric: 'denim' })
    expect(fake.state.updated).toEqual({ name: 'Yeni', fabric: 'denim' })
  })

  it('geçersiz id "bulunamadı" sayılır', async () => {
    fake.state.maybe = { data: null, error: { code: '22P02' } }
    await expect(getGarment('abc')).resolves.toBeNull()
  })

  it('liste her kıyafete signed URL ekler, URL alınamazsa yine de listeyi döndürür', async () => {
    fake.state.list = { data: [{ id: 'g1', image_path: 'user-1/a.jpg' }], error: null }
    expect((await listGarments())[0].imageUrl).toBe('signed:user-1/a.jpg')

    fake.bucket.createSignedUrls.mockRejectedValueOnce(new Error('down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await listGarments())[0].imageUrl).toBeNull()
    spy.mockRestore()
  })
})

// ---------------------------------------------------------------- api.js (gerçek API modu)
describe('api.js gerçek mod', () => {
  let analyzeGarment
  beforeEach(async () => {
    vi.stubEnv('VITE_USE_MOCK_API', 'false')
    vi.stubEnv('VITE_API_URL', 'http://api.test/')
    vi.resetModules()
    ;({ analyzeGarment } = await import('./api.js'))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const respond = (status, body) =>
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status })))

  it('dosyayı "file" alanıyla /predict adresine gönderir', async () => {
    respond(200, JSON.stringify(analysis))
    await expect(analyzeGarment(new File(['x'], 'a.jpg'))).resolves.toEqual(analysis)
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('http://api.test/predict') // sondaki / temizlenir
    expect(options.body.get('file')).toBeInstanceOf(File)
  })

  it.each([
    [400, 'okuyamadım'],
    [413, 'fazla büyük'],
    [422, 'kıyafeti seçemedim'],
    [500, 'ters gitti'],
    [503, 'ters gitti'], // bilinmeyen kodlar genel mesaja düşer
  ])('%i → WashMom dilinde mesaj', async (status, text) => {
    respond(status, '{"detail":"x"}')
    await expect(analyzeGarment(new File(['x'], 'a.jpg'))).rejects.toMatchObject({ name: 'ApiError', status, message: expect.stringContaining(text) })
  })

  it('bozuk JSON yanıtında teknik hata yerine WashMom mesajı', async () => {
    respond(200, '<html>proxy error</html>')
    await expect(analyzeGarment(new File(['x'], 'a.jpg'))).rejects.toMatchObject({ name: 'ApiError', message: expect.stringContaining('ters gitti') })
  })

  it('ağ hatası ve zaman aşımı ayrı mesaj verir', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))))
    await expect(analyzeGarment(new File(['x'], 'a.jpg'))).rejects.toThrow('ulaşamadım')
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new DOMException('t', 'TimeoutError'))))
    await expect(analyzeGarment(new File(['x'], 'a.jpg'))).rejects.toThrow('uzun süre')
  })
})

// ---------------------------------------------------------------- mockApi sözleşmesi
describe('mockApi', () => {
  afterEach(() => vi.useRealTimers())

  it('gerçek /predict ile aynı JSON şeklini ve tutarlı needs_review değerini döndürür', async () => {
    vi.useFakeTimers()
    const { mockAnalyzeGarment } = await import('./mockApi.js')
    let ok = 0
    for (let i = 0; i < 200; i++) {
      const promise = mockAnalyzeGarment().then(
        (r) => r,
        (e) => e,
      )
      await vi.advanceTimersByTimeAsync(3000)
      const r = await promise
      if (r instanceof Error) {
        expect(r.name).toBe('ApiError')
        expect([422, 500]).toContain(r.status)
        continue
      }
      ok++
      expect(Object.keys(r).sort()).toEqual(['color_group', 'confidence', 'fabric', 'model_version', 'needs_review', 'top_predictions'])
      expect(MODEL_FABRICS).toContain(r.fabric) // model 'other' üretmez
      expect(COLOR_GROUPS).toContain(r.color_group)
      expect(r.top_predictions[0]).toEqual({ label: r.fabric, confidence: r.confidence })
      expect(r.needs_review).toBe(r.confidence < NEEDS_REVIEW_MIN_CONFIDENCE)
    }
    expect(ok).toBeGreaterThan(100)
  })
})

// ---------------------------------------------------------------- doğrulama ve etiketler
describe('validateImageFile', () => {
  const file = (name, type, size = 10) => new File([new Uint8Array(size)], name, { type })

  it.each([
    [file('a.jpg', 'image/jpeg'), null],
    [file('a.png', 'image/png'), null],
    [file('a.webp', 'image/webp'), null],
    [file('IMG_1.HEIC', ''), 'HEIC'],
    [file('a.jpg', 'image/heic'), 'HEIC'],
    [file('a.gif', 'image/gif'), 'tanıyamadım'],
    [file('a.pdf', 'application/pdf'), 'tanıyamadım'],
    [file('a.jpg', 'image/jpeg', MAX_FILE_SIZE + 1), 'büyük'],
    [null, 'seçmelisin'],
  ])('%#', (f, expected) => {
    const result = validateImageFile(f)
    if (expected === null) expect(result).toBeNull()
    else expect(result).toContain(expected)
  })

  it('tam 10 MB kabul edilir', () => {
    expect(validateImageFile(file('a.jpg', 'image/jpeg', MAX_FILE_SIZE))).toBeNull()
  })
})

describe('getConfidenceLevel sınırları', () => {
  it.each([
    [0.8, 'high'],
    [0.7999, 'medium'],
    [0.55, 'medium'],
    [0.5499, 'low'],
    [0, 'low'],
  ])('%f → %s', (c, key) => expect(getConfidenceLevel(c).key).toBe(key))
})
