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
MODEL_PATH = BASE_DIR / "model" / "best_efficientnetv2b0.keras"
CLASS_NAMES_PATH = BASE_DIR / "model" / "class_names.json"
MODEL_VERSION = os.getenv("MODEL_VERSION", "effnetv2b0-v1")
IMAGE_SIZE = (224, 224)  # P1 preprocessing notuyla doğrulanmalı

# Model dosyası yoksa sahte tahmin döner (Faz 3: modelsiz iskelet)
FAKE_MODEL_VERSION = "fake-v1"

# ---- Güven eşikleri (Bölüm 11) — frontend constants/labels.js ile aynı ----
NEEDS_REVIEW_MIN_CONFIDENCE = 0.60
NEEDS_REVIEW_MIN_MARGIN = 0.15
TOP_K = 3
