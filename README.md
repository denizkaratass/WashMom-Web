# WashMom Web

> "Annem olsa nasıl yıkardı?"

Tek bir kıyafet fotoğrafından **kumaş yapısını** (AI), **renk grubunu** (OpenCV) ve **yıkama profilini** (kural motoru) çıkaran web uygulaması. Analiz edilen kıyafetler **Gardırobum**'a kaydedilir. İki kıyafet seçilerek **“Bununla yıkanır mı?”** sorusu cevaplanır.

**Canlı demo:** _(Netlify linki deploy sonrası buraya eklenecek)_

| Ana sayfa | Analiz | Wash Passport |
|---|---|---|
| ![Ana sayfa](docs/screenshots/home-desktop.png) | ![Fotoğraf yükleme](docs/screenshots/analyze.png) | ![Wash Passport](docs/screenshots/result.png) |

<p align="center">
  <img src="docs/screenshots/home-mobile.png" alt="Mobil ana sayfa" width="220" />
  <img src="docs/screenshots/result-mobile.png" alt="Mobil Wash Passport" width="220" />
</p>

> Ekran görüntüleri mock modda alınmıştır; örnek kıyafet görseli bir çizimdir.

## Özellikler

- Fotoğraf yükleme (sürükle-bırak, mobilde kamera), tarayıcıda 1024 px'e küçültme
- AI kumaş tahmini + güven seviyesi; emin olunamadığında kullanıcıya sorma
- Kullanıcı düzeltmesi (kumaş ve renk); AI'ın orijinal tahmini ayrıca saklanır
- Supabase ile e-posta/şifre girişi; giriş, analiz sonucu kaybolmadan modal ile yapılır
- Gardırobum: kaydet, listele, ara, filtrele, düzenle, sil (fotoğraflar private bucket + signed URL)
- “Bununla yıkanır mı?”: iki kıyafetin renk / bakım / güven uyumluluğu
- Dashboard: renk, profil ve kumaş dağılımı (Recharts)
- Güvenlik: Row Level Security, her kullanıcı sadece kendi kayıtlarını ve fotoğraflarını görür

## Mimari

```
Kullanıcı → React (Netlify) ──→ FastAPI (HF Spaces): EfficientNetV2B0 + OpenCV
                            └──→ Supabase: Auth + Postgres (RLS) + Storage
```

| Parça | Görev |
|---|---|
| `frontend/` | React + Vite + Tailwind v4. Kural motorları (`src/rules/`) burada çalışır. |
| `backend/` | FastAPI. Sadece AI çıktısı üretir: kumaş, olasılıklar, renk, `needs_review`. Görsel saklamaz. |
| `supabase/schema.sql` | `garments` tablosu, trigger, RLS ve Storage policy'leri. |

Kural motorları frontend'dedir. Bu sayede kullanıcı tahmini düzelttiğinde profil anında yeniden hesaplanır. Aynı kurallar mock modda da çalışır.

## Hızlı başlangıç (sadece frontend, mock mod)

Gereken: Node.js 20+

```bash
cd frontend
npm install
cp .env.example .env      # VITE_USE_MOCK_API=true
npm run dev               # http://localhost:5173
```

Mock modda analiz sahte bir API ile çalışır: 1.5–2.5 sn gecikme, bazen belirsiz sonuç, bazen hata. Supabase ayarlanmadıysa giriş ve gardırop sayfaları bunu söyleyen bir mesaj gösterir.

```bash
npm test         # kural motoru testleri (Vitest)
npm run build    # canlı için dist/ üretir
```

## Supabase kurulumu (giriş + gardırop)

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluştur.
2. **SQL Editor** → `supabase/schema.sql` dosyasının tamamını yapıştır → **Run**. Bu adım tabloyu, RLS'yi, `garment-images` bucket'ını ve policy'leri oluşturur.
3. **Project Settings → API** sayfasından `Project URL` ve `anon`/`publishable` key'i `frontend/.env` dosyasına yaz:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
   ⚠️ `service_role` / secret key **asla** frontend'e konmaz.
4. **Authentication → Sign In / Providers → Email**: geliştirirken **Confirm email** kapatılabilir. Kapalıyken kayıt olan kişi hemen giriş yapar. Açıkken önce e-postasındaki linke tıklaması gerekir; canlıda açık tutulması önerilir.
5. `npm run dev` komutunu yeniden başlat (`.env` değişiklikleri ancak yeniden başlatınca okunur).

**RLS testi:** İki farklı hesap aç, birine kıyafet kaydet. Diğer hesabın gardırobunda o kıyafet görünmemeli.

## Backend (FastAPI)

Gereken: Python 3.12+

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- `http://localhost:8000/health` → `{"status":"ok","model_loaded":false,...}`
- `http://localhost:8000/docs` → tarayıcıdan fotoğraf gönderip `/predict` endpoint'ini deneyebilirsin.

`backend/model/` klasöründe P1 model dosyaları yokken backend **sahte tahmin** döner. Frontend'i bu backend'e bağlamak için `frontend/.env` içinde `VITE_USE_MOCK_API=false` yap ve `npm run dev` komutunu yeniden başlat.

Gerçek modeli eklemek için: [`backend/model/README.md`](backend/model/README.md)

## Deployment

**Frontend (Netlify):** Repo kökündeki `netlify.toml` ayarları hazırdır (base `frontend`, build `npm run build`, publish `dist`). Ortam değişkenleri Netlify panelinden girilir. `public/_redirects` sayfa yenilemede 404 alınmasını önler.

**Backend (Hugging Face Spaces, Docker):** `backend/` içeriğini bir Docker Space'e yükle (`Dockerfile` hazır, port 7860). Space ayarlarından `ALLOWED_ORIGINS` değişkenine Netlify adresini ekle. Frontend'de `VITE_API_URL` değerini Space adresi yap.

**Supabase:** Authentication → URL Configuration → Site URL ve Redirect URL'lere canlı Netlify adresini ekle.

## Proje yapısı

```
frontend/src/
  components/   Navbar, UploadBox, WashPassport, CorrectionPanel, GarmentCard, modallar...
  pages/        Home, Analyze, Result, Login, Register, Wardrobe, GarmentDetail, Compare, Dashboard, NotFound
  context/      AuthContext (oturum), AnalysisContext (son analiz)
  services/     api.js (mock/gerçek seçimi), mockApi.js, supabase.js, garmentService.js, storageService.js
  rules/        washingRules.js, compatibilityRules.js, rules.test.js
  constants/    labels.js (Türkçe etiketler, eşikler)
  utils/        resizeImage.js (canvas ile 1024 px'e küçültme)
backend/
  main.py  inference.py  preprocessing.py  color_analysis.py  schemas.py  config.py
supabase/schema.sql
```

---

WashMom bir öneri sunar. Kıyafetin bakım etiketi her zaman önceliklidir.
