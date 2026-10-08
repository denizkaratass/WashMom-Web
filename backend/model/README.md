# Model dosyaları (P1 / WashMom Vision)

| Dosya | İçerik |
|---|---|
| `effnet_sqrt_finetuned.keras` | EfficientNetV2B0, fine-tuned, sqrt class weight. [WashMom Vision](https://github.com/denizkaratass/WashMom-Vision) reposundan **değiştirilmeden** kopyalandı (38 MB). |
| `class_names.json` | Eğitim sırası: `["cotton", "denim", "chiffon", "knitted", "leather", "furry"]` |

**Model sabittir; değiştirilmez ve yeniden eğitilmez.** Backend, P1'in `kiyafet_dene.py` pipeline'ını birebir uygular:
800 px → GrabCut maske → beyaz zeminli kare crop (224) → JPEG turu → model → τ = 0.3 düzeltmesi → güven < 0.55 ise `needs_review`.
Ayrıntılı sözleşme: kök `CLAUDE.md` Bölüm 6.

- Sürümler: `tensorflow-cpu==2.20.0`, `keras==3.15.1` (model bunlarla doğrulandı).
- Doğrulama: `python -m unittest tests.test_backend.GoldenTests -v`. Bu test `tests/golden/` içindeki 3 fotoğrafın P1 çıktılarıyla karşılaştırma yapar.
- Dosyalar yoksa backend **sahte tahmin** döndürür (`/health` → `"model_loaded": false`).
- Lisans: CC BY-NC 4.0. Model DeepFashion-MultiModal ile eğitildiği için **ticari kullanım yasaktır** (kök `NOTICE`).
- Hugging Face Spaces 10 MB üstü dosyaları Git LFS/Xet ile ister: `git lfs track "*.keras"`.
