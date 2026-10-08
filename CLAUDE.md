# WashMom Web — Project Context (v2)

> “Annem olsa nasıl yıkardı?”

---

## 0. BENİMLE ÇALIŞMA ŞEKLİN (EN ÖNEMLİ BÖLÜM)

Sen bu projede hem kıdemli bir Full-Stack / AI geliştiricisi hem de benim birebir eğitmenimsin.

Ben web geliştirmede başlangıç seviyesindeyim. Amacım projeyi bitirmenin yanında
React, frontend–backend iletişimi, API, authentication, veritabanı ve AI model
entegrasyonunu gerçekten öğrenmek.

Her adımda:

1. Ne yapacağımızı ve genel mimaride nereye oturduğunu anlat.
2. Neden yaptığımızı anlat.
3. Yeni kavramları kısa ve sade açıkla.
4. Sadece o adımla ilgili kodu küçük bloklar halinde yaz (tek seferde yüzlerce satır yazma).
5. Kodun önemli satırlarını açıkla.
6. Nasıl test edeceğimi söyle (ne görmem gerektiğini de yaz).
7. Ben çalıştırıp çıktımı göstermeden bir sonraki büyük adıma geçme.
8. Hata çıkarsa önce nedenini anlat, sonra düzelt.
9. Her adım bitince bana bir **git commit mesajı** öner.

Kütüphane eklerken “Neden buna ihtiyacımız var?” sorusunu cevapla.

Mimari değişiklik önerirken önce şunları yaz ve onayımı bekle:
mevcut yöntem · önerilen yöntem · avantaj · dezavantaj · projeye eklediği zorluk.

Projenin kapsamını benim onayım olmadan büyütme.

Bu dosyanın en altındaki **MEVCUT DURUM** bölümü nerede kaldığımızı gösterir.
Her yeni oturumda önce oraya bak; bir faz bitince oranın güncellenmesini öner.

---

## 1. ÜRÜN ÖZETİ

WashMom, kullanıcının **tek bir kıyafet** fotoğrafı yükleyerek kıyafetin:

- kumaş / yapı türünü (AI)
- renk grubunu (OpenCV)
- AI güven seviyesini
- yıkama (bakım) profilini (kural motoru)

öğrenmesini sağlayan AI destekli web uygulamasıdır.

Kullanıcı analiz ettiği kıyafetleri hesabındaki **Gardırobum (My Wardrobe)** alanına
kaydedebilir ve daha sonra iki kayıtlı kıyafeti seçip **“Bununla yıkanır mı?”**
özelliğini kullanabilir.

Kapsam dışı: çoklu kıyafet tespiti, çamaşırları makinelere bölme, bir fotoğrafta
birden fazla kıyafet analizi (detay: Bölüm 17).

### Ana akış

```
HOME → FOTOĞRAF YÜKLE → AI ANALİZİ → WASH PASSPORT
     → (isterse) giriş yap → GARDIROBA KAYDET → daha sonra İKİ KIYAFETİ KARŞILAŞTIR
```

- Analiz için giriş **zorunlu değildir**.
- Giriş sadece “Gardırobuma Kaydet” anında istenir.
- Giriş sonrası kullanıcı **analiz sonucunu kaybetmeden** kayda devam etmelidir (Bölüm 9).

### Sorumluluk notu

Wash Passport ve Compare ekranlarında küçük bir not bulunur:
“WashMom bir öneri sunar. Kıyafetin bakım etiketi her zaman önceliklidir.”

---

## 2. SAYFALAR VE ROUTE'LAR

| Route | Sayfa | Giriş gerekir mi? |
|---|---|---|
| `/` | Home / Landing | Hayır |
| `/analyze` | Fotoğraf yükleme + analiz | Hayır |
| `/result` | Wash Passport | Hayır |
| `/login`, `/register` | Auth | — |
| `/wardrobe` | Gardırobum listesi | Evet |
| `/wardrobe/:id` | Kıyafet detayı | Evet |
| `/compare` | Bununla yıkanır mı? | Evet |
| `/dashboard` | Küçük istatistikler | Evet |
| `*` | 404 sayfası | Hayır |

Giriş gerektiren sayfalar bir `ProtectedRoute` bileşeniyle korunur.

`/result` sayfası yenilenirse ve elde analiz verisi yoksa kullanıcıyı `/analyze`'a yönlendir.

### Navbar

Sol: WashMom logosu
Linkler: Ana Sayfa · Analiz Et · Gardırobum · Bununla Yıkanır mı? · Dashboard
Sağ: “Giriş Yap” veya (giriş yapılmışsa) avatar + Çıkış
Mobilde hamburger menü.

**Arayüz dili Türkçe.** “Wash Passport” ve “WashMom” marka adı olarak kalabilir.

---

## 3. HOME / LANDING

- Hero: “Annem olsa nasıl yıkardı?”
- Alt metin: “Bir kıyafet fotoğrafı yükle. WashMom kumaş yapısını ve rengini analiz
  ederek sana yıkama profilini anlatsın.”
- Ana CTA: **[ Kıyafetimi Analiz Et ]**
- Özellik kartları: Tek kıyafet · AI destekli analiz · Açıklanabilir sonuç
- “Nasıl çalışır?”: 1. Fotoğraf yükle → 2. WashMom analiz etsin → 3. Yıkama pasaportunu al

Gerçek bir ürün sitesi gibi görünmeli, okul ödevi gibi değil.

---

## 4. ANALYZE PAGE (`/analyze`)

- Sürükle-bırak alanı: “Fotoğrafını buraya bırak” veya [ Dosya Seç ]
- Mobilde kamera ile çekmeye izin ver (`<input type="file" accept="image/*" capture>`).
- Seçilince önizleme + “Fotoğraf hazır ✓” + [ Değiştir ] + [ WashMom'a Sor ]
- Fotoğraf ipuçları: tek kıyafet · iyi ışık · kıyafet tamamen görünsün · sade arka plan

### Dosya doğrulama (frontend)

- Kabul edilen türler: JPG, PNG, WEBP
- Maksimum boyut: 10 MB
- HEIC (iPhone) desteklenmiyorsa anlaşılır bir mesaj göster.
- Geçersiz dosyada WashMom dilinde hata göster.

### Görsel küçültme

Yüklemeden önce görsel tarayıcıda (canvas ile, ek kütüphane olmadan)
en uzun kenarı **1024 px** olacak şekilde küçültülüp JPEG'e çevrilir.
Aynı küçültülmüş dosya hem `/predict`'e gönderilir hem de Storage'a yüklenir.
Amaç: hızlı upload, düşük depolama, backend'e daha az yük.

---

## 5. ANALİZ YÜKLEME DENEYİMİ

Boş spinner yerine adım adım WashMom mesajları:

“Kıyafet inceleniyor...”
✓ Görsel hazırlanıyor
✓ Kumaş yapısı analiz ediliyor
✓ Renk grubu belirleniyor
✓ Yıkama profili oluşturuluyor

Bunlar UX mesajlarıdır; her biri için ayrı model yoktur.

Backend ilk istekte yavaş uyanabilir (ücretsiz hosting “cold start”).
İstek 8 saniyeyi geçerse: “WashMom biraz uykulu, uyanıyor... ☕” mesajı göster.
`/analyze` sayfası açılınca arka planda `GET /health` çağırarak backend'i önceden uyandır.

---

## 6. AI MODELİ (P1 İLE BAĞLANTI)

WashMom Web yeni model eğitmez. Model ayrı proje olan **WashMom Vision / P1**'de eğitilir.

### P1'den alınacak dosyalar (sözleşme)

| Dosya | İçerik |
|---|---|
| `best_efficientnetv2b0.keras` | Eğitilmiş model |
| `class_names.json` | Sınıfların **eğitimdeki sırası** (ör. `["chiffon","cotton","denim",...]`) |
| `preprocessing.md` (veya not) | Girdi boyutu (ör. 224×224), RGB, piksel aralığı |
| TensorFlow / Keras sürümü | Backend'de **aynı sürüm** kullanılacak |

Önemli notlar:

- Sınıf sırası yanlış olursa model “çalışır ama yanlış etiket verir”. Sırayı asla elle tahmin etme.
- Keras'ın `EfficientNetV2B0` modeli normalizasyonu kendi içinde yapar; girdiyi genelde
  **0–255 aralığında** bekler. P1'de nasıl eğitildiyse backend'de de birebir öyle yapılmalı.
- Fotoğrafın EXIF yönü (telefon fotoğraflarının yan dönmesi) düzeltilmeli.
- P1'den 3–5 test görseli ve P1'deki çıktıları alınır; backend aynı sonucu verirse entegrasyon doğrudur.

Sınıflar: `denim · cotton · knitted · chiffon · leather · furry · other`

---

## 7. RENK ANALİZİ

Yeni model yok; P1'deki OpenCV modülü kullanılır.
Çıktı: `white · light · dark · colored`

Risk: Arka plan rengi sonucu bozabilir. Bu yüzden renk, görselin **merkez bölgesinden**
hesaplanmalı (P1 modülü zaten bunu yapıyorsa aynen kullan). Kullanıcı rengi de düzeltebilir.

---

## 8. KURAL MOTORLARI (ML DEĞİL, AÇIKLANABİLİR)

İki kural motoru vardır. İkisi de **frontend'de**, saf JavaScript fonksiyonları olarak durur:

```
src/rules/washingRules.js        → fabric + color → washing_profile + açıklama
src/rules/compatibilityRules.js  → garment A + garment B → uyumluluk sonucu
```

**Neden frontend'de?**
- Kullanıcı tahmini düzelttiğinde profil backend'e gitmeden anında yeniden hesaplanır.
- Compare, zaten Supabase'den okunan veriyle çalışır; backend'e gerek kalmaz.
- Kurallar tek bir yerde durur (Python + JS kopyası olmaz).
- Mock modda da birebir aynı kurallar çalışır.

Backend sadece AI çıktısı üretir: fabric, olasılıklar, renk, needs_review.

### 8.1 Yıkama profili (washing_profile)

Profil = kumaşın **bakım seviyesi**. Renk ayrı alan olarak tutulur ve ekranda profille birlikte gösterilir
(ör. “Hassas • Koyu”).

| fabric | washing_profile | Ekranda |
|---|---|---|
| chiffon, knitted | `delicate` | Hassas |
| cotton | `normal` | Normal |
| denim | `heavy` | Ağır |
| leather, furry | `special_care` | Özel bakım (makinede yıkama önerilmez) |
| other | `normal` + `needs_review = true` | Normal (emin değil) |

Örnekler: knitted + dark → Hassas • Koyu · denim + dark → Ağır • Koyu · cotton + white → Normal • Beyaz

### 8.2 Uyumluluk (Bununla yıkanır mı?)

**Renk kontrolü**

| | white | light | colored | dark |
|---|---|---|---|---|
| **white** | ✓ | ✓ | ✕ | ✕ |
| **light** | ✓ | ✓ | ⚠ | ✕ |
| **colored** | ✕ | ⚠ | ✓ | ⚠ |
| **dark** | ✕ | ✕ | ⚠ | ✓ |

**Bakım kontrolü**

| | delicate | normal | heavy | special_care |
|---|---|---|---|---|
| **delicate** | ✓ | ⚠ | ✕ | ✕ |
| **normal** | ⚠ | ✓ | ⚠ | ✕ |
| **heavy** | ✕ | ⚠ | ✓ | ✕ |
| **special_care** | ✕ | ✕ | ✕ | ✕ |

**Güven kontrolü:** İki kıyafetten biri `needs_review = true` ve kullanıcı düzeltmemişse ⚠.

**Sonuç:**
- Herhangi bir ✕ → `NOT_RECOMMENDED` → “Ayrı tutmak daha güvenli”
- ✕ yok, en az bir ⚠ → `CAUTION` → “Dikkat”
- Hepsi ✓ → `HIGH_COMPATIBILITY` → “Yüksek uyumluluk”

Fonksiyon her kontrol için bir **neden cümlesi** de döndürür. Örnek:
“Renkleri uyumlu olsa da örgü kıyafet hassas, denim ise ağır bakım profiline sahip.”

Kural tabloları bu dosyadaki gibi okunabilir nesneler olarak yazılır; if-else yığını olarak değil.
Bu iki dosya için birkaç küçük **Vitest** testi yazılır (kuralları öğrenmek ve bozmamak için).

---

## 9. ANALİZ STATE'İ VE GİRİŞ AKIŞI

Analiz sonucu ve küçültülmüş görsel bir React Context'te tutulur (`AnalysisContext`).

“Gardırobuma Kaydet” tıklanınca:

1. Kullanıcı giriş yapmışsa → kaydetme formu (isim + not) açılır.
2. Giriş yapmamışsa → login/register **modal** olarak açılır (sayfadan ayrılmadan).
   Giriş başarılı olunca kaydetme formu otomatik devam eder.

Modal kullanılmasının nedeni: sayfa değişirse bellekteki görsel (File) kaybolabilir.

Kıyafet adı modelden gelmez (model “kazak” demez). Kaydetme formunda varsayılan bir isim
önerilir (ör. “Koyu Örgü Kıyafet”), kullanıcı değiştirebilir.

---

## 10. AI API (FastAPI)

### `GET /health`

```json
{ "status": "ok", "model_loaded": true, "model_version": "effnetv2b0-v1" }
```

### `POST /predict`

Girdi: `multipart/form-data`, alan adı `file`

Başarılı yanıt:

```json
{
  "fabric": "knitted",
  "confidence": 0.88,
  "top_predictions": [
    { "label": "knitted", "confidence": 0.88 },
    { "label": "cotton",  "confidence": 0.07 },
    { "label": "chiffon", "confidence": 0.03 }
  ],
  "color_group": "dark",
  "needs_review": false,
  "model_version": "effnetv2b0-v1"
}
```

`washing_profile` ve açıklama metni frontend'de `washingRules.js` ile üretilir.

Hata yanıtları (FastAPI standardı `{"detail": "..."}`):
- `400` geçersiz / okunamayan görsel
- `413` dosya çok büyük
- `500` model hatası

Frontend bu hataları WashMom diline çevirir.

### Backend kuralları

- Model uygulama açılırken **bir kez** yüklenir (her istekte değil) — FastAPI `lifespan`.
- CORS sadece izinli adreslere açık: `http://localhost:5173` ve canlı frontend domain'i.
- Yüklenen görseller backend'de **saklanmaz** (gizlilik).
- Pydantic şemaları `schemas.py` içinde.

---

## 11. CONFIDENCE / BELİRSİZLİK

`needs_review = true` olur eğer:
- en yüksek olasılık < **0.60**, veya
- ilk iki olasılık arasındaki fark < **0.15**, veya
- fabric = `other`

(Eşikler P1 doğrulama sonuçlarına göre ayarlanabilir; tek yerde, sabit olarak tanımlanır.)

UI güven etiketi: ≥ 0.80 “Yüksek” · 0.60–0.80 “Orta” · altı “Emin değil”

`needs_review` ise kesin sonuç verme:
“WashMom bu kıyafetten tam emin olamadı.” + `top_predictions`'tan ilk 2–3 seçenek + [ Emin değilim ]

Kullanıcı **kumaşı ve rengi** düzeltebilir. Düzeltme:
- modeli yeniden eğitmez,
- sadece kullanıcının kaydını değiştirir,
- profili `washingRules.js` ile anında yeniden hesaplar,
- AI'ın orijinal tahmini de ayrıca saklanır (detay sayfasında “AI tahmini / senin düzeltmen” gösterilir).

---

## 12. MOCK MODE / REAL API MODE

Frontend, P1 modelini beklemeden geliştirilir.

```
VITE_USE_MOCK_API=true   → src/services/mockApi.js
VITE_USE_MOCK_API=false  → FastAPI (VITE_API_URL)
```

Componentler sadece `api.js` içindeki `analyzeGarment(file)` fonksiyonunu çağırır;
mock mu gerçek mi olduğunu bilmez. Model gelince hiçbir component yeniden yazılmaz.

Mock servis gerçeğe benzemeli:
- 1.5–2.5 sn gecikme,
- bazen yüksek güvenli, bazen `needs_review` sonuç,
- bazen hata (hata ekranlarını geliştirmek için),
- gerçek API ile **birebir aynı JSON şekli**.

Ara adım: FastAPI iskeleti de önce **sahte** `/predict` döndürür. Böylece gerçek
frontend–backend iletişimini (CORS, multipart, fetch) modelden bağımsız, erkenden öğreniriz.

---

## 13. AUTH

- Supabase Auth, **Email + Password**. Google OAuth opsiyonel, şimdilik yok.
- Oturum bilgisi `AuthContext` ile tüm uygulamaya dağıtılır.
- E-posta doğrulama ayarı bilinçli seçilmeli (geliştirmede kapatılabilir; ne anlama geldiğini açıkla).
- Canlıya çıkarken Supabase'de Site URL / Redirect URL'ler canlı domain'e göre ayarlanır.

---

## 14. VERİTABANI (Supabase PostgreSQL)

### Tablo: `garments`

| Alan | Tip | Not |
|---|---|---|
| id | uuid, PK | `gen_random_uuid()` |
| user_id | uuid, not null | `auth.users` referansı, default `auth.uid()`, `on delete cascade` |
| name | text, not null | |
| image_path | text, not null | Storage yolu (public URL **değil**) |
| ai_fabric | text | Modelin orijinal tahmini |
| ai_confidence | real | |
| ai_color_group | text | OpenCV'nin orijinal sonucu |
| top_predictions | jsonb | |
| fabric | text, not null | Nihai değer (AI veya kullanıcı düzeltmesi) |
| color_group | text, not null | Nihai değer |
| washing_profile | text, not null | |
| needs_review | boolean | default false |
| user_corrected | boolean | default false |
| user_note | text | |
| model_version | text | Hangi modelle analiz edildi |
| created_at | timestamptz | default `now()` |
| updated_at | timestamptz | trigger ile otomatik güncellenir |

- `fabric`, `color_group`, `washing_profile` için **CHECK constraint** ile izinli değerler sınırlanır.
- `(user_id, created_at desc)` için index.

### Row Level Security

RLS açık. SELECT / INSERT / UPDATE / DELETE için dört policy: `auth.uid() = user_id`.
Test: iki farklı hesapla giriş yapıp birinin diğerinin kıyafetini **göremediğini** doğrula.

Supabase işlemleri componentlerde değil, `src/services/garmentService.js` içinde durur.

---

## 15. FOTOĞRAF DEPOLAMA (Supabase Storage)

- Bucket: `garment-images`, **private**.
- Yol: `{user_id}/{uuid}.jpg`
- Storage policy: kullanıcı sadece kendi `user_id` klasörüne yükleyebilir, okuyabilir, silebilir.
- Görseller **signed URL** ile gösterilir (listede toplu `createSignedUrls`).
- Silme sırası: önce DB kaydı, sonra görsel. Görsel silinemezse hatayı logla, kullanıcıyı engelleme.
- Kaydetme sırası: önce görsel yükle, sonra DB kaydı. DB kaydı başarısızsa yüklenen görseli sil.

---

## 16. DİĞER EKRANLAR

### Wash Passport (`/result`)

- Görsel, önerilen isim, Yapı, AI Güveni (etiket + yüzde), Renk, Yıkama Profili
- “Birlikte değerlendirilebilir” / “Ayrı tutmak daha güvenli” önerileri (kurallardan üretilir)
- Açılır “WashMom neden böyle düşündü?” paneli
- Butonlar: [ Tahmini Düzelt ] [ Gardırobuma Kaydet ] [ Yeni Analiz ]
- Bakım etiketi notu

### Gardırobum (`/wardrobe`)

- Kart grid: görsel, isim, “Örgü • Koyu”, profil rozeti
- Toplam kıyafet sayısı
- Arama (isim)
- Filtreler **gruplu**:
  - Renk: Tümü / Beyaz / Açık / Renkli / Koyu
  - Kumaş: Tümü / Denim / Pamuk / Örgü / ...
  - Profil: Tümü / Hassas / Normal / Ağır / Özel bakım
- Sıralama: En yeni / En eski
- Boş durum: “Gardırobun henüz boş. İlk kıyafetini analiz et!” + CTA
- Yükleniyor durumu için skeleton kartlar

### Kıyafet Detayı (`/wardrobe/:id`)

Görsel, isim, kumaş, güven, renk, profil, analiz tarihi, not,
“AI tahmini / senin düzeltmen” karşılaştırması.
Butonlar: [ Düzenle ] [ Sil ] (silmede onay modalı).
Kayıt bulunamazsa anlaşılır mesaj.

### Compare (`/compare`)

- Gardıroptan iki kıyafet seçimi (aynı kıyafet iki kez seçilemez)
- Gardıropta 2'den az kıyafet varsa yönlendirici mesaj
- Sonuç: Renk / Bakım / Güven satırları (✓ ⚠ ✕) + genel sonuç + ana neden cümlesi

### Dashboard (`/dashboard`)

Küçük ve basit: toplam kıyafet, renk grupları, profil dağılımı, kumaş dağılımı.
Recharts ile 2 grafik. Veriler kullanıcının kendi kayıtlarından frontend'de hesaplanır.
Büyük bir analytics sistemine dönüştürülmez.

---

## 17. YAPMAYACAĞIMIZ ŞEYLER

multi-garment detection · makinelere bölme · YOLO · yeni görüntü modeli ·
ayrı compatibility ML modeli · ödeme · e-ticaret · admin paneli · sosyal özellikler ·
mesajlaşma · gereksiz mikroservis · karmaşık recommendation engine

---

## 18. TEKNOLOJİLER

**Frontend:** React · Vite · Tailwind CSS (v4, `@tailwindcss/vite` eklentisi ile) · React Router ·
Supabase JS client · Recharts · Vitest (sadece kural testleri için)

> Not: Tailwind v4 kurulumu eski eğitimlerden farklıdır (`tailwind.config.js` zorunlu değil,
> tema CSS içinde `@theme` ile tanımlanır). Resmi dokümana göre kur.

**Backend:** Python · FastAPI · Uvicorn · TensorFlow/Keras (P1 ile aynı sürüm, CPU) ·
OpenCV (`opencv-python-headless`) · NumPy · Pillow · Pydantic · python-multipart

Gereksiz UI framework'ü ekleme.

---

## 19. DOSYA MİMARİSİ

```
washmom-web/
├── frontend/
│   ├── public/
│   │   └── _redirects                # Netlify SPA yönlendirmesi: /*  /index.html  200
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx  Footer.jsx  ProtectedRoute.jsx
│   │   │   ├── UploadBox.jsx  LoadingAnalysis.jsx
│   │   │   ├── WashPassport.jsx  ConfidenceBadge.jsx  CorrectionPanel.jsx
│   │   │   ├── GarmentCard.jsx  CompatibilityResult.jsx
│   │   │   ├── AuthModal.jsx  ConfirmModal.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx  Analyze.jsx  Result.jsx  Login.jsx  Register.jsx
│   │   │   ├── Wardrobe.jsx  GarmentDetail.jsx  Compare.jsx  Dashboard.jsx  NotFound.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── AnalysisContext.jsx
│   │   ├── services/
│   │   │   ├── api.js                # analyzeGarment(file) — mock/real seçimi burada
│   │   │   ├── mockApi.js
│   │   │   ├── supabase.js
│   │   │   ├── garmentService.js     # DB CRUD
│   │   │   └── storageService.js     # görsel upload / signed URL / silme
│   │   ├── rules/
│   │   │   ├── washingRules.js
│   │   │   ├── compatibilityRules.js
│   │   │   └── rules.test.js
│   │   ├── constants/
│   │   │   └── labels.js             # enum → Türkçe etiket, eşik değerleri
│   │   ├── utils/
│   │   │   └── resizeImage.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── main.py                       # FastAPI app, CORS, endpointler
│   ├── inference.py                  # model yükleme + tahmin
│   ├── preprocessing.py              # P1 ile birebir aynı ön işleme
│   ├── color_analysis.py             # P1 OpenCV modülü
│   ├── schemas.py
│   ├── config.py                     # eşikler, izinli origin'ler, max dosya boyutu
│   ├── model/
│   │   ├── best_efficientnetv2b0.keras
│   │   └── class_names.json
│   ├── requirements.txt              # sürümler sabitlenmiş
│   ├── Dockerfile
│   └── .env.example
├── supabase/
│   └── schema.sql                    # tablo, trigger, RLS ve storage policy'leri
├── docs/screenshots/
├── .gitignore
└── README.md
```

---

## 20. ORTAM DEĞİŞKENLERİ VE GÜVENLİK

`frontend/.env`:
```
VITE_USE_MOCK_API=true
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...        # anon / publishable key
```

- `.env` dosyaları **asla** GitHub'a gitmez; repoda sadece `.env.example` olur.
- Supabase **service_role / secret key** hiçbir zaman frontend'e konmaz.
- `VITE_` ile başlayan her değişken tarayıcıda görünür; bu yüzden güvenlik RLS ile sağlanır.

---

## 21. DEPLOYMENT

**Frontend:** Netlify (veya Vercel). Erken deploy edilir (landing hazır olunca), sonra her fazda güncellenir.
SPA yenileme 404'ü için `_redirects` dosyası.

**Backend:** Frontend'den ayrı deploy. TensorFlow büyük ve RAM ister; 512 MB RAM'li ücretsiz
planlarda çökebilir. Önerilen: **Hugging Face Spaces (Docker)**. Alternatif: Render / Railway
(RAM ve cold start sınırlarına dikkat). Model dosyası gerekiyorsa Git LFS ile taşınır.

**Supabase:** Auth + Database + Storage.

```
Kullanıcı → Netlify (React) ──→ FastAPI (HF Spaces): EfficientNet + OpenCV
                           └──→ Supabase: Auth + Postgres + Storage
```

---

## 22. TASARIM DİLİ

Klasik mavi/mor AI dashboard'u gibi görünmemeli.
Marka: sıcak · temiz · pratik · güvenilir · hafif esprili.

- Krem / kırık beyaz arka plan
- Sıcak yeşil ana vurgu, hafif mercan/pembe ikincil vurgu
- Koyu gri metin
- Yuvarlak kartlar, geniş boşluk, büyük kıyafet fotoğrafları
- Renkler Tailwind temasında **token** olarak tanımlanır (ör. `cream`, `leaf`, `coral`, `ink`)
- **Mobile-first**: her sayfa önce telefon genişliğinde yapılır, en sona bırakılmaz.
- Temel erişilebilirlik: görsellerde `alt`, butonlarda anlaşılır metin, yeterli kontrast,
  klavye ile kullanılabilir modallar.

### WashMom dili

| Yerine | Kullan |
|---|---|
| Prediction confidence: 0.43 | WashMom bu kıyafetten tam emin olamadı. |
| Submit | WashMom'a Sor |
| Classification Result | Yıkama Pasaportun Hazır |
| Error 500 | Bir şeyler ters gitti, WashMom tekrar deniyor. |
| Compare | Bununla yıkanır mı? |

Her ekranda **boş**, **yükleniyor** ve **hata** durumları o özellik yapılırken birlikte yapılır.

---

## 23. UYGULAMA SIRASI

### Faz 0 — Hazırlık
1. Klasör yapısı, `git init`, `.gitignore`, GitHub repo (public)

### Faz 1 — Frontend temeli
2. React + Vite kurulumu
3. Tailwind v4 kurulumu + tasarım token'ları
4. React Router, Layout (Navbar/Footer), boş sayfalar, 404
5. Landing page (mobile-first)
6. **İlk Netlify deploy** (`_redirects` dahil)

### Faz 2 — Analiz akışı (mock)
7. UploadBox: seçim, sürükle-bırak, doğrulama, önizleme, küçültme
8. `api.js` + `mockApi.js` (gecikme, belirsiz sonuç, hata)
9. AnalysisContext + LoadingAnalysis
10. `washingRules.js` + testleri
11. Result / Wash Passport
12. Confidence + düzeltme UI

### Faz 3 — FastAPI iskeleti (modelsiz)
13. FastAPI kurulumu, `/health`, sahte `/predict`, CORS
14. Frontend'i `VITE_USE_MOCK_API=false` ile yerel FastAPI'ye bağlama

### Faz 4 — Supabase
15. Supabase projesi + `supabase.js`
16. Auth: register / login / logout, AuthContext, ProtectedRoute, AuthModal
17. `garments` tablosu + trigger + RLS (`schema.sql`)
18. Storage bucket + policy'ler
19. CREATE: görsel yükle + kaydet (giriş sonrası kaldığı yerden devam)
20. READ: Gardırop listesi (signed URL'ler) + Kıyafet detayı
21. UPDATE: isim, not, düzeltme
22. DELETE: kayıt + görsel
23. Arama / filtre / sıralama

### Faz 5 — Compare & Dashboard
24. Compare UI
25. `compatibilityRules.js` + testleri
26. Dashboard (Recharts)

### Faz 6 — Gerçek model
27. P1 dosyalarını al (model, `class_names.json`, ön işleme notları, TF sürümü)
28. `preprocessing.py`, `inference.py`, `color_analysis.py`
29. P1 test görselleriyle aynı sonucun alındığını doğrula

### Faz 7 — Canlıya çıkış
30. Backend deploy (HF Spaces / Docker)
31. Canlı ortam değişkenleri, CORS, Supabase redirect URL'leri
32. Uçtan uca test (misafir analiz → giriş → kaydet → düzenle → karşılaştır → sil)

### Faz 8 — Teslim
33. Son responsive / erişilebilirlik kontrolü
34. README (kurulum, mimari şeması, ekran görüntüleri, canlı link), GitHub temizliği

---

## 24. FİNAL TESLİM LİSTESİ

- [ ] Çalışan React uygulaması (canlı link)
- [ ] Responsive tasarım
- [ ] Fotoğraf upload + AI sonuç ekranı (Wash Passport)
- [ ] Confidence handling + kullanıcı düzeltmesi
- [ ] Authentication
- [ ] Gardırobum + CRUD + Search/Filter + Garment Detail
- [ ] “Bununla yıkanır mı?”
- [ ] Dashboard
- [ ] FastAPI bağlantısı (gerçek model)
- [ ] Supabase (Auth + DB + Storage, RLS açık)
- [ ] Public GitHub repo, README, en az bir ekran görüntüsü

---

## 25. MEVCUT DURUM

> Bu bölümü her faz sonunda güncelle.

- Aktif faz: **Teslim hazırlığı** (kod tarafı Faz 1–5 tamam, Faz 6 hazırlığı yapıldı)
- 2026-10-08: Teslim temizliği: Login/Register sarmalayıcıları kaldırıldı (route doğrudan AuthPage), kullanılmayan
  needs_review_by_rule alanı silindi, WashPassport "Özel bakım bakım" metin hatası düzeltildi, netlify.toml eklendi,
  README'ye ekran görüntüleri (docs/screenshots, mock mod) ve özellik listesi eklendi. Vitest 18/18.
- Tamamlanan adımlar: 1–5, 7–14, 16–26 kod olarak tamam. Doğrulanan: `npm run build`, `npm run lint` (0 uyarı),
  Vitest 19/19, backend `/health` + sahte `/predict` + 400/413 hataları + CORS curl ile test edildi.
- Supabase projesi kuruldu (ref: mzfliaafsvdgxotwpwrt, Frankfurt), schema.sql çalıştırıldı, "Confirm email" kapalı.
  Uçtan uca test 15/15 geçti: storage upload/signed URL/silme, CRUD, updated_at trigger, CHECK, iki hesapla RLS izolasyonu.
- Kullanıcıya bağlı: P1 model dosyaları (27–29), Netlify / HF Spaces (6, 30–31). GitHub push kullanıcı isteğiyle ertelendi.
- `color_analysis.py` geçici sürüm; P1 OpenCV modülü gelince değiştirilecek.
- 2026-10-08: Güvenlik/QA incelemesi: backend bağımlılıkları yamalı sürümlere yükseltildi (fastapi 0.142.4,
  starlette 1.7.0, python-multipart 0.0.32, pillow 12.3.0, python-dotenv 1.2.4); decompression bomb / dev görsel /
  sahte format / büyük gövde korumaları; model sınıf sayısı + etiket kontrolü; Modal sürükle-kapan hatası; WCAG AA
  kontrast; Netlify _headers; GitHub Actions CI. Testler: Vitest 49/49, backend unittest 26/26.
  Supabase projesi duraklatılmıştı, kullanıcı Restore etti. E2E (production build + yerel FastAPI + Supabase) 20/20:
  kayıt, kaydet, düzenle, gardırop, compare, dashboard, iki hesapla RLS + doğrudan REST/Storage saldırısı, silme.
- 2026-09-29: Kullanıcı projeyi adım adım onay beklemeden bitirmemi istedi (öğretmen modu yerine).
- P1 modeli: hazır değil (mock mode ile ilerleniyor)
- Alınan kararlar:
  - 2026-09-29: Kural motorları (washingRules, compatibilityRules) frontend'de. Backend sadece AI çıktısı döner.
  - 2026-09-29: Giriş, analiz sonucunu kaybetmemek için modal ile yapılır.
  - 2026-09-29: Backend deploy hedefi Hugging Face Spaces (Docker).
  - 2026-09-29: GitHub repo ve push projenin sonuna bırakıldı; commit'ler yerelde birikiyor.
    (Adım 6'daki Netlify deploy'u için GitHub yerine sürükle-bırak veya erteleme kararı o adımda verilecek.)
- Açık kararlar / notlar: —

---

## İLK GÖREV

Şimdi projenin tamamını kodlama.

Önce yalnızca şu soruyu kısaca açıkla:
“Bu mimariyi nasıl kuracağız ve neden bu sırayla ilerleyeceğiz?”

Sonra Faz 0'dan başla.
