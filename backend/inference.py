"""Model yükleme + tahmin.

- model/ klasöründe P1 dosyaları varsa → gerçek EfficientNetV2B0 modeli (TensorFlow).
- Yoksa → SAHTE tahmin (Faz 3). Böylece frontend–backend iletişimi modelden bağımsız çalışır.
"""

import hashlib
import json
import logging
from typing import get_args

import numpy as np
from PIL import Image

import config
from preprocessing import to_model_input
from schemas import Fabric

logger = logging.getLogger("washmom.inference")

FALLBACK_CLASSES = ["chiffon", "cotton", "denim", "furry", "knitted", "leather", "other"]


class ModelService:
    def __init__(self) -> None:
        self.model = None
        self.class_names: list[str] = FALLBACK_CLASSES
        self.model_version = config.FAKE_MODEL_VERSION

    @property
    def is_real(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        """Uygulama açılırken BİR KEZ çağrılır (main.py → lifespan)."""
        if not (config.MODEL_PATH.exists() and config.CLASS_NAMES_PATH.exists()):
            logger.warning("Model dosyaları bulunamadı → SAHTE tahmin modu (%s)", config.MODEL_PATH)
            return

        # Sınıf sırası P1'deki eğitim sırasıyla aynı olmalı; asla elle tahmin etme.
        self.class_names = json.loads(config.CLASS_NAMES_PATH.read_text(encoding="utf-8"))
        # API ve veritabanı sadece bu etiketleri kabul eder; P1 farklı isim kullandıysa her istek 500 olurdu.
        unknown = set(self.class_names) - set(get_args(Fabric))
        if unknown:
            raise RuntimeError(f"class_names.json bilinmeyen etiket içeriyor: {sorted(unknown)}")

        import keras  # TensorFlow büyük; sadece gerçek model varken yüklenir

        model = keras.models.load_model(config.MODEL_PATH)
        # Sınıf sayısı tutmazsa zip() sessizce keser ve model YANLIŞ etiket verir; baştan dur.
        output_size = model.output_shape[-1]
        if output_size != len(self.class_names):
            raise RuntimeError(
                f"Model {output_size} sınıf çıkarıyor ama class_names.json {len(self.class_names)} sınıf içeriyor"
            )
        self.model = model
        self.model_version = config.MODEL_VERSION
        logger.info("Model yüklendi: %s (%d sınıf)", config.MODEL_PATH.name, len(self.class_names))

    def predict_probabilities(self, image: Image.Image) -> dict[str, float]:
        if self.is_real:
            probs = self.model.predict(to_model_input(image), verbose=0)[0]
        else:
            probs = self._fake_probabilities(image)
        return {label: float(p) for label, p in zip(self.class_names, probs)}

    def _fake_probabilities(self, image: Image.Image) -> np.ndarray:
        """Aynı fotoğraf için hep aynı sonucu veren, gerçekçi görünen sahte olasılıklar."""
        seed = int.from_bytes(hashlib.sha256(image.tobytes()[:65536]).digest()[:4], "big")
        rng = np.random.default_rng(seed)
        logits = rng.normal(0, 1.2, len(self.class_names))
        logits[rng.integers(len(self.class_names))] += rng.uniform(0.5, 3.5)
        exp = np.exp(logits - logits.max())
        return exp / exp.sum()


def build_prediction(probabilities: dict[str, float]) -> dict:
    """Olasılıklardan fabric, top_predictions ve needs_review üretir."""
    ranked = sorted(probabilities.items(), key=lambda item: item[1], reverse=True)
    (fabric, top), (_, second) = ranked[0], ranked[1]

    needs_review = (
        top < config.NEEDS_REVIEW_MIN_CONFIDENCE
        or (top - second) < config.NEEDS_REVIEW_MIN_MARGIN
        or fabric == "other"
    )

    return {
        "fabric": fabric,
        "confidence": round(top, 4),
        "top_predictions": [
            {"label": label, "confidence": round(conf, 4)} for label, conf in ranked[: config.TOP_K]
        ],
        "needs_review": needs_review,
    }
