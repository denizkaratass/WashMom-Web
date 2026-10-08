"""Tüm ayarlar tek yerde. Ortam değişkenleriyle (.env / hosting paneli) değiştirilebilir."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

# ---- CORS: sadece bu adresler backend'i çağırabilir ----
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# ---- Yükleme sınırları ----
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ACCEPTED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ACCEPTED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}  # Pillow'un dosya içeriğinden okuduğu gerçek biçim
# Frontend görseli 1024 px'e küçültür; 25 MP (ör. 5000x5000) gerçek kullanım için fazlasıyla yeterli.
# RGB'ye çevrilince ~75 MB RAM eder; daha büyükleri reddedilir (ücretsiz sunucular 512 MB RAM'le çalışabilir).
MAX_IMAGE_PIXELS = 25_000_000

# ---- Model (P1 / WashMom Vision) ----
# Model SABİTTİR. Aşağıdaki değerler P1'deki kiyafet_dene.py ile birebir aynı olmalı; elle değiştirme.
KERAS_MODEL_PATH = BASE_DIR / "model" / "effnet_sqrt_finetuned.keras"  # P1'den gelen asıl dosya (kaynak)
MODEL_PATH = BASE_DIR / "model" / "effnet_sqrt_finetuned.onnx"  # aynı ağırlıklar, ONNX formatı (tools/convert_to_onnx.py)
CLASS_NAMES_PATH = BASE_DIR / "model" / "class_names.json"  # eğitim sırası: cotton, denim, chiffon, knitted, leather, furry
MODEL_VERSION = os.getenv("MODEL_VERSION", "effnet_sqrt_finetuned-v1")
IMAGE_SIZE = (224, 224)  # modele giden crop
MAX_SIDE = 800  # GrabCut öncesi uzun kenar (büyük görselde GrabCut yavaş)

# Olasılık düzeltme (P1 15.3–15.4): sqrt sınıf ağırlıkları + τ
TRAIN_COUNTS = [10351, 3402, 1290, 797, 440, 127]  # train setindeki sınıf sayıları, class_names sırasıyla
EFF_TAU = 0.3

# Model dosyası yoksa sahte tahmin döner (modelsiz geliştirme ve testler için)
FAKE_MODEL_VERSION = "fake-v1"
# Canlıda (Vercel, VERCEL=1) model yoksa sahte tahmin YERİNE açılışta hata ver: sahte sonuç gerçek gibi görünmesin.
REQUIRE_MODEL = os.getenv("REQUIRE_MODEL", "1" if os.getenv("VERCEL") else "0") == "1"

# ---- Kötüye kullanım sınırı: aynı IP'den dakikada en fazla bu kadar tahmin (ücretsiz CPU kotası korunur) ----
# Sunucu örneği (instance) başına bellekte tutulur; birden çok örnek varsa her biri ayrı sayar.
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "20"))

# ---- Güven eşiği (P1 17. bölüm, validation ile seçildi) — frontend constants/labels.js ile aynı ----
NEEDS_REVIEW_MIN_CONFIDENCE = 0.55
TOP_K = 3
