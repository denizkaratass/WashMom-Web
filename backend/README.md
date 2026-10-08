# WashMom AI API

WashMom Web'in FastAPI backend'i. Tek bir kıyafet fotoğrafından kumaş sınıfı ve renk grubu döndürür.

- `GET /health` → model yüklendi mi?
- `POST /predict` (multipart, alan adı `file`) → `fabric`, `confidence`, `top_predictions`, `color_group`, `needs_review`
- `GET /docs` → tarayıcıdan deneme sayfası

Model: [WashMom Vision](https://github.com/denizkaratass/WashMom-Vision) (`effnet_sqrt_finetuned`).
Sunucu modeli **ONNX** formatında çalıştırır (`model/effnet_sqrt_finetuned.onnx`). Ağırlıklar aynıdır; TensorFlow gerekmez.
Model DeepFashion-MultiModal ile eğitildi ve yalnızca **ticari olmayan** kullanım içindir (CC BY-NC 4.0).

Yüklenen fotoğraflar saklanmaz.

## Vercel'e yükleme (ücretsiz Hobby planı)

1. vercel.com → GitHub ile giriş → **Add New… → Project** → `WashMom-Web` reposunu seç.
2. **Root Directory:** `backend` (Framework: FastAPI otomatik bulunur; `main.py` içindeki `app`).
3. **Environment Variables:** `ALLOWED_ORIGINS` = canlı frontend adresi (ör. `https://washmom.netlify.app`).
4. **Deploy**. Sonra `https://<proje>.vercel.app/health` → `"model_loaded": true`.

`vercel.json` testleri, `tools/` klasörünü ve `.keras` dosyasını pakete almaz (500 MB sınırı).

## Model dosyasını yeniden üretmek (gerekmez; sonuç repoda)

```bash
pip install -r tools/requirements-convert.txt   # TensorFlow'lu ayrı bir ortamda
python tools/convert_to_onnx.py                  # Keras ↔ ONNX farkını da kontrol eder
```
