# Model dosyaları (P1 / WashMom Vision)

Bu klasöre P1'den şu iki dosya kopyalanır:

- `best_efficientnetv2b0.keras`: eğitilmiş model
- `class_names.json`: sınıfların **eğitimdeki sırası**, ör. `["chiffon","cotton","denim","furry","knitted","leather","other"]`

Dosyalar yokken backend **sahte tahmin** döndürür (`/health` → `"model_loaded": false`).

Dosyaları ekledikten sonra:

1. `requirements.txt` içindeki `tensorflow` satırının yorumunu kaldırıp sürümü P1'dekiyle aynı yap.
2. `preprocessing.py` içindeki varsayımları (224×224, RGB, 0–255) P1 notlarıyla karşılaştır.
3. `color_analysis.py` dosyasını P1'in OpenCV modülüyle değiştir (`classify_color(image) -> str` imzası aynı kalsın).
4. P1'in 3–5 test görselini `/docs` üzerinden gönder; P1'deki çıktılarla aynı sonucu aldığını doğrula.
5. Model büyükse (>100 MB) Git LFS ile taşı: `git lfs track "*.keras"`.
