"""Renk grubu analizi (OpenCV): white · light · dark · colored

GEÇİCİ SÜRÜM: P1'deki OpenCV modülü gelince bu dosyanın içeriği onunla değiştirilecek.
Fonksiyon imzası (classify_color(image) -> str) aynı kalmalı.

Arka planın etkisini azaltmak için sadece görselin MERKEZ bölgesine bakılır.
"""

import cv2
import numpy as np
from PIL import Image

CENTER_RATIO = 0.5  # görselin ortadaki %50'lik karesi

# HSV eşikleri (OpenCV: H 0–179, S 0–255, V 0–255)
LOW_SATURATION = 45
WHITE_MIN_VALUE = 200
LIGHT_MIN_VALUE = 150
DARK_MAX_VALUE = 85
COLORED_MIN_PIXEL_SHARE = 0.35


def _center_crop(rgb: np.ndarray) -> np.ndarray:
    h, w = rgb.shape[:2]
    ch, cw = int(h * CENTER_RATIO), int(w * CENTER_RATIO)
    top, left = (h - ch) // 2, (w - cw) // 2
    return rgb[top : top + ch, left : left + cw]


def classify_color(image: Image.Image) -> str:
    rgb = _center_crop(np.asarray(image))
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    saturation = hsv[..., 1].astype(np.float32)
    value = hsv[..., 2].astype(np.float32)

    median_value = float(np.median(value))
    # Doygun ve çok karanlık olmayan piksellerin oranı → "renkli" mi?
    colored_share = float(np.mean((saturation > LOW_SATURATION * 1.5) & (value > DARK_MAX_VALUE)))

    if median_value < DARK_MAX_VALUE:
        return "dark"
    if colored_share >= COLORED_MIN_PIXEL_SHARE:
        return "colored"
    if median_value >= WHITE_MIN_VALUE and float(np.median(saturation)) < LOW_SATURATION * 0.6:
        return "white"
    if median_value >= LIGHT_MIN_VALUE:
        return "light"
    return "dark"
