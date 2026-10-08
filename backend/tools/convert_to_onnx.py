"""effnet_sqrt_finetuned.keras → effnet_sqrt_finetuned.onnx (bir kez çalıştırılır; sonuç repoda durur).

Neden: TensorFlow ücretsiz sunuculara (Vercel, 500 MB paket sınırı) sığmıyor; onnxruntime sığıyor.
Ağırlıklar DEĞİŞMEZ, sadece dosya formatı değişir. Script sonunda iki modelin aynı sonucu verdiğini kontrol eder.

Tahmin grafiği: augmentation (RandomFlip...) ve dropout tahminde girdiyi aynen geçirir; ONNX'te karşılıkları
olmadığı için grafiğe alınmaz. Aynı katman nesneleri kullanıldığından ağırlıklar birebir aynıdır.

Çalıştırma (backend klasöründe, TensorFlow'lu ayrı bir ortamda):
    pip install -r tools/requirements-convert.txt
    python tools/convert_to_onnx.py
"""

import sys
from pathlib import Path

import cv2
import keras
import numpy as np
import onnxruntime as ort
import tensorflow as tf
import tf2onnx
from tensorflow.python.framework.convert_to_constants import convert_variables_to_constants_v2

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
import config  # noqa: E402
from preprocessing import garment_mask, load_image, make_crop, shrink  # noqa: E402

model = keras.models.load_model(config.KERAS_MODEL_PATH)

# 1) Sadece tahmin yolu: girdi → EfficientNetV2B0 → global average pooling → dense (softmax)
x_in = keras.Input((224, 224, 3), name="image")
h = model.get_layer("efficientnetv2-b0")(x_in, training=False)
h = model.get_layer("global_average_pooling2d_3")(h)
infer = keras.Model(x_in, model.get_layer("dense_3")(h))

# 2) Grafiği dondur: değişkenler ve yakalanan sabitler (ör. Normalization ortalaması) dosyanın içine gömülür
fn = tf.function(lambda x: infer(x, training=False))
frozen = convert_variables_to_constants_v2(fn.get_concrete_function(tf.TensorSpec((None, 224, 224, 3), tf.float32)))
tf2onnx.convert.from_graph_def(
    frozen.graph.as_graph_def(),
    input_names=[t.name for t in frozen.inputs],
    output_names=[t.name for t in frozen.outputs],
    opset=17,
    output_path=str(config.MODEL_PATH),
)

# 3) Doğrulama: altın fotoğrafların crop'larında Keras ve ONNX aynı olasılıkları vermeli
session = ort.InferenceSession(str(config.MODEL_PATH), providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name
worst = 0.0
for photo in sorted((BACKEND / "tests" / "golden").glob("*.jpg")):
    img = shrink(load_image(photo.read_bytes()))
    cv2.setRNGSeed(0)
    crop = make_crop(img, garment_mask(img), [1])
    jpeg = cv2.imencode(".jpg", cv2.cvtColor(crop, cv2.COLOR_RGB2BGR))[1].tobytes()
    x = tf.io.decode_jpeg(jpeg, channels=3).numpy()[None].astype("float32")  # P1'deki çözücü
    diff = float(np.abs(model.predict(x, verbose=0) - session.run(None, {input_name: x})[0]).max())
    worst = max(worst, diff)
    print(f"{photo.name}: Keras ↔ ONNX maks olasılık farkı = {diff:.2e}")

size_mb = config.MODEL_PATH.stat().st_size / 1e6
print(f"Kaydedildi: {config.MODEL_PATH.name} ({size_mb:.1f} MB), girdi adı: {input_name}")
if worst > 1e-5:
    sys.exit(f"HATA: ONNX modeli Keras'tan farklı ({worst:.2e} > 1e-5)")
