# Model dosyaları (P1 / WashMom Vision)

| Dosya | İçerik |
|---|---|
| `effnet_sqrt_finetuned.keras` | EfficientNetV2B0, fine-tuned, sqrt class weight. [WashMom Vision](https://github.com/denizkaratass/WashMom-Vision) reposundan **değiştirilmeden** kopyalandı (38 MB). Kaynak dosya; sunucu kullanmaz. |
| `effnet_sqrt_finetuned.onnx` | **Sunucunun kullandığı dosya.** Aynı ağırlıklar, ONNX formatı (23,5 MB). `tools/convert_to_onnx.py` ile üretildi; Keras ile maks. olasılık farkı 7,8e-7. |
| `class_names.json` | Eğitim sırası: `["cotton", "denim", "chiffon", "knitted", "leather", "furry"]` |

**Model sabittir; değiştirilmez ve yeniden eğitilmez.** ONNX'e çevirmek ağırlıkları değiştirmez; sadece TensorFlow olmadan
(ücretsiz sunucuda) çalışabilmesini sağlar. Augmentation ve dropout katmanları tahminde girdiyi aynen geçirdiği için ONNX grafiğine alınmadı.

Backend, P1'in `kiyafet_dene.py` pipeline'ını birebir uygular:
800 px → GrabCut maske → beyaz zeminli kare crop (224) → JPEG turu (`simplejpeg`, TF çözücüsüyle 0 piksel fark) →
model → τ = 0.3 düzeltmesi → güven < 0.55 ise `needs_review`. Ayrıntılı sözleşme: kök `CLAUDE.md` Bölüm 6.

- Doğrulama: `python -m unittest tests.test_backend.GoldenTests -v`. Bu test `tests/golden/` içindeki 3 fotoğrafı P1 çıktılarıyla karşılaştırır.
- Dosyalar yoksa backend **sahte tahmin** döndürür (`/health` → `"model_loaded": false`).
- Lisans: CC BY-NC 4.0. Model DeepFashion-MultiModal ile eğitildiği için **ticari kullanım yasaktır** (kök `NOTICE`).
