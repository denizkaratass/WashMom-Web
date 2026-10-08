# Model dosyaları (P1 / WashMom Vision)

| Dosya | İçerik |
|---|---|
| `effnet_sqrt_finetuned.keras` | EfficientNetV2B0, fine-tuned, sqrt class weight. [WashMom Vision](https://github.com/denizkaratass/WashMom-Vision) reposundan **değiştirilmeden** kopyalandı (38 MB). Kaynak dosya; sunucu kullanmaz. |
| `effnet_sqrt_finetuned.onnx` | **Sunucunun kullandığı dosya.** Aynı ağırlıklar, ONNX formatı (23,5 MB). `tools/convert_to_onnx.py` ile üretildi; Keras ile maks. olasılık farkı 7,8e-7. |
| `class_names.json` | Eğitim sırası: `["cotton", "denim", "chiffon", "knitted", "leather", "furry"]` |

**Model sabittir; değiştirilmez ve yeniden eğitilmez.** ONNX'e çevirmek ağırlıkları değiştirmez; sadece TensorFlow olmadan
(ücretsiz sunucuda) çalışabilmesini sağlar. Augmentation ve dropout katmanları tahminde girdiyi aynen geçirdiği için ONNX grafiğine alınmadı.

## Modelin sözleşmesi

Kaynak: P1 `kiyafet_dene.py`. Backend bu adımları birebir uygular; biri bile farklı olursa model hata vermeden yanlış sonuç verir.

| # | Kural | Değer | Backend'de |
|---|---|---|---|
| 1 | Model | EfficientNetV2B0, fine-tuned, sqrt class weight; sunucu ONNX halini çalıştırır | `model/effnet_sqrt_finetuned.onnx` |
| 2 | Sınıflar + sıra | `cotton, denim, chiffon, knitted, leather, furry` (6; `other` yok) | `class_names.json` |
| 3 | Küçültme | uzun kenar 800 px, `INTER_AREA` (büyütmez) | `preprocessing.shrink` |
| 4 | Kıyafeti ayırma | GrabCut, kenardan %5 içeride dikdörtgen, 5 iterasyon; her istekte `cv2.setRNGSeed(0)` (P1'in taze süreç durumu, sonuç istek sırasına bağlı olmaz) | `preprocessing.garment_mask`, `prepare` |
| 5 | Crop | maske dışı beyaz, %8 pay, beyaz kare tuval, 224×224 | `preprocessing.make_crop` |
| 6 | JPEG turu | crop JPEG'e kodlanıp geri açılır (eğitim verisi böyleydi). P1: `tf.io.decode_jpeg`; backend: `simplejpeg` `fastdct=True` (0 piksel fark) | `preprocessing.jpeg_roundtrip` |
| 7 | Girdi | `(1, 224, 224, 3)` float32, RGB, 0–255 | `preprocessing.to_model_input` |
| 8 | Olasılık düzeltme | sqrt sınıf ağırlıkları, τ = 0.3 | `inference.adjust` |
| 9 | Güven eşiği | `confidence < 0.55` → `needs_review` (P1'de validation ile seçildi) | `config.NEEDS_REVIEW_MIN_CONFIDENCE` |
| 10 | Renk | sadece GrabCut maskesindeki pikseller, medyan HSV doygunluk/parlaklık | `color_analysis.classify_color` |
| 11 | Sürümler | onnxruntime 1.30.0, simplejpeg 1.9.0, opencv-python-headless 4.10.0.84 | `requirements.txt` |

`other` modelden gelmez; sadece kullanıcının "emin değilim" düzeltmesi olarak vardır.

- Doğrulama: `python -m unittest tests.test_backend.GoldenTests -v`. Bu test `tests/golden/` içindeki 3 fotoğrafı P1 çıktılarıyla karşılaştırır.
- Dosyalar yoksa backend **sahte tahmin** döndürür (`/health` → `"model_loaded": false`).
- Lisans: CC BY-NC 4.0. Model DeepFashion-MultiModal ile eğitildiği için **ticari kullanım yasaktır** (kök `NOTICE`).
