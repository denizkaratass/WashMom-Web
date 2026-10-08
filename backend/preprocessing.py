"""Görsel ön işleme. Model SABİT; P1'de (kiyafet_dene.py) nasıl yapıldıysa BİREBİR aynısı.

Akış: görsel → uzun kenar 800 px → GrabCut maske → beyaz zeminli kare crop (224) → JPEG turu
Model girdisi: (1, 224, 224, 3) float32, RGB, 0–255 (EfficientNetV2B0 normalizasyonu kendi içinde yapar).
"""

import io

import cv2
import numpy as np
import simplejpeg
from PIL import Image, ImageOps, UnidentifiedImageError

from config import ACCEPTED_IMAGE_FORMATS, IMAGE_SIZE, MAX_IMAGE_PIXELS, MAX_SIDE


class InvalidImageError(ValueError):
    """Görsel okunamadı / bozuk / izin verilmeyen türde."""


class GarmentNotFoundError(ValueError):
    """GrabCut fotoğrafta kıyafet bulamadı."""


def load_image(data: bytes) -> Image.Image:
    """Byte'ları Pillow görseline çevirir, EXIF yönünü düzeltir, RGB yapar."""
    try:
        image = Image.open(io.BytesIO(data))  # sadece başlığı okur; pikseller henüz açılmadı
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise InvalidImageError("Görsel okunamadı") from exc

    # Content-Type başlığı istemciden gelir, güvenilmez; gerçek dosya biçimine bak.
    if image.format not in ACCEPTED_IMAGE_FORMATS:
        raise InvalidImageError(f"Desteklenmeyen biçim: {image.format}")

    # Küçük bir dosya devasa boyutlu bir görsel olabilir ("decompression bomb").
    # Pikselleri açmadan önce boyutu kontrol et; yoksa yüzlerce MB RAM harcanır.
    width, height = image.size
    if width * height > MAX_IMAGE_PIXELS:
        raise InvalidImageError(f"Görsel çok büyük: {width}x{height}")

    try:
        image.load()
    except (OSError, Image.DecompressionBombError) as exc:
        raise InvalidImageError("Görsel okunamadı") from exc

    image = ImageOps.exif_transpose(image)  # telefon fotoğrafları yan dönmesin
    return image.convert("RGB")


def shrink(image: Image.Image) -> np.ndarray:
    """Uzun kenarı MAX_SIDE'a indirir (büyütmez). RGB uint8 numpy dizisi döner."""
    img = np.asarray(image)
    scale = MAX_SIDE / max(img.shape[:2])
    if scale < 1:
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    return img


# ---- P1 kiyafet_dene.py'den BİREBİR alındı (garment_mask, make_crop). Değiştirme. ----
def garment_mask(img: np.ndarray) -> np.ndarray:
    # GrabCut: kenardan %5 içerideki dikdörtgenin içinde kıyafeti arka plandan ayırır
    h, w = img.shape[:2]
    rect = (int(w * 0.05), int(h * 0.05), int(w * 0.90), int(h * 0.90))
    gc = np.zeros((h, w), np.uint8)
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(img, gc, rect, bgd, fgd, 5, cv2.GC_INIT_WITH_RECT)
    return np.isin(gc, [cv2.GC_FGD, cv2.GC_PR_FGD]).astype(np.uint8)  # 1 = kıyafet, 0 = arka plan


def make_crop(img, mask, codes, pad_ratio=0.08, size=224):
    part = np.isin(mask, codes)  # bu parçaya ait pikseller True
    if part.sum() < 50:  # parça yok ya da birkaç piksellik gürültü
        return None
    ys, xs = np.where(part)
    y1, y2, x1, x2 = ys.min(), ys.max(), xs.min(), xs.max()  # bounding box
    pad_y, pad_x = int((y2 - y1) * pad_ratio), int((x2 - x1) * pad_ratio)
    y1, y2 = max(0, y1 - pad_y), min(mask.shape[0], y2 + 1 + pad_y)
    x1, x2 = max(0, x1 - pad_x), min(mask.shape[1], x2 + 1 + pad_x)
    clean = img.copy()
    clean[~part] = 255  # kıyafet olmayan pikseller beyaz
    crop = clean[y1:y2, x1:x2]
    h, w = crop.shape[:2]
    s = max(h, w)
    square = np.full((s, s, 3), 255, np.uint8)  # beyaz kare tuval
    top, left = (s - h) // 2, (s - w) // 2
    square[top : top + h, left : left + w] = crop
    return cv2.resize(square, (size, size), interpolation=cv2.INTER_AREA)


def jpeg_roundtrip(crop: np.ndarray) -> np.ndarray:
    """Eğitim crop'ları JPEG olarak saklanmıştı; model aynı sıkıştırma izlerini görsün (P1 ile aynı kodlayıcı/çözücü).

    P1 çözücüsü tf.io.decode_jpeg'dir ve varsayılanı hızlı DCT'dir (INTEGER_FAST). simplejpeg fastdct=True ile
    aynı libjpeg-turbo yolunu kullanır: 0 piksel fark (OpenCV/Pillow ise 21'e kadar farklı). TensorFlow gerekmez.
    """
    _, buf = cv2.imencode(".jpg", cv2.cvtColor(crop, cv2.COLOR_RGB2BGR))
    return simplejpeg.decode_jpeg(buf.tobytes(), colorspace="RGB", fastdct=True, fastupsample=False)


def to_model_input(crop: np.ndarray) -> np.ndarray:
    """(1, 224, 224, 3) float32, 0–255 aralığında."""
    return crop[None].astype("float32")


def prepare(image: Image.Image) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Tüm ön işleme. Döner: (küçültülmüş RGB görsel, kıyafet maskesi, model girdisi).

    Maske hem crop hem renk analizi için kullanılır; GrabCut (yavaş adım) sadece bir kez çalışır.
    """
    img = shrink(image)
    # GrabCut OpenCV'nin RNG'sini kullanır ve durum çağrıdan çağrıya taşınır: aynı fotoğraf, önceki isteklere göre
    # farklı maske verebilir. P1'de (kiyafet_dene.py) her çalıştırma taze süreçtir; seed 0 o taze durumla aynıdır.
    cv2.setRNGSeed(0)  # RNG thread'e özeldir; GrabCut ile aynı thread'de, hemen önce çağrılır
    try:
        mask = garment_mask(img)
    except cv2.error as exc:  # ör. çok küçük ya da tek renk görselde GrabCut model kuramaz
        raise GarmentNotFoundError("Kıyafet bulunamadı") from exc
    crop = make_crop(img, mask, [1], size=IMAGE_SIZE[0])
    if crop is None:
        raise GarmentNotFoundError("Kıyafet bulunamadı")
    return img, mask, to_model_input(jpeg_roundtrip(crop))
