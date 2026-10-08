"""Renk grubu analizi (OpenCV): white · light · dark · colored

P1 kiyafet_dene.py'deki color_group fonksiyonunun BİREBİR aynısı. Değiştirme.
Sadece GrabCut maskesinin içindeki (kıyafete ait) piksellere bakılır; arka plan rengi sonucu etkilemez.
"""

import cv2
import numpy as np


def classify_color(img: np.ndarray, mask: np.ndarray) -> str:
    """img: RGB uint8 (preprocessing.prepare çıktısı), mask: 1 = kıyafet, 0 = arka plan."""
    pixels = img[np.isin(mask, [1])]  # sadece kıyafet pikselleri (RGB)
    hsv = cv2.cvtColor(pixels.reshape(-1, 1, 3), cv2.COLOR_RGB2HSV).reshape(-1, 3)
    s, v = float(np.median(hsv[:, 1])), float(np.median(hsv[:, 2]))
    if v < 90:
        return "dark"
    if s < 35:
        return "white" if v >= 200 else ("light" if v >= 140 else "dark")
    if v >= 190 and s < 80:
        return "light"
    return "colored"
