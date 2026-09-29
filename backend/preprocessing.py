"""Görsel ön işleme. P1'de model nasıl eğitildiyse BİREBİR aynısı olmalı.

Varsayımlar (P1'in preprocessing notuyla doğrula):
- RGB, 224x224
- Piksel aralığı 0–255 (Keras EfficientNetV2B0 normalizasyonu kendi içinde yapar)
"""

import io

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

from config import IMAGE_SIZE


class InvalidImageError(ValueError):
    """Görsel okunamadı / bozuk."""


def load_image(data: bytes) -> Image.Image:
    """Byte'ları Pillow görseline çevirir, EXIF yönünü düzeltir, RGB yapar."""
    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidImageError("Görsel okunamadı") from exc

    image = ImageOps.exif_transpose(image)  # telefon fotoğrafları yan dönmesin
    return image.convert("RGB")


def to_model_input(image: Image.Image) -> np.ndarray:
    """(1, 224, 224, 3) float32, 0–255 aralığında."""
    resized = image.resize(IMAGE_SIZE, Image.Resampling.BILINEAR)
    array = np.asarray(resized, dtype=np.float32)
    return np.expand_dims(array, axis=0)
