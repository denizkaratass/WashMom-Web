"""Model yükleme + tahmin.

- model/ klasöründe P1 dosyaları varsa → gerçek model (effnet_sqrt_finetuned.onnx, onnxruntime) + τ düzeltmesi.
- Yoksa → SAHTE tahmin. Böylece testler ve frontend–backend iletişimi modelden bağımsız çalışır.
"""

import hashlib
import json
import logging
from typing import get_args

import numpy as np

import config
from schemas import Fabric

logger = logging.getLogger("washmom.inference")

# Sahte modda da gerçek modelin sınıfları ve sırası kullanılır (class_names.json ile aynı).
FALLBACK_CLASSES = ["cotton", "denim", "chiffon", "knitted", "leather", "furry"]


# ---- P1 kiyafet_dene.py'den BİREBİR alındı (sqrt ağırlıklar + adjust). Değiştirme. ----
_balanced = [sum(config.TRAIN_COUNTS) / (len(config.TRAIN_COUNTS) * n) for n in config.TRAIN_COUNTS]
EFF_WEIGHTS = np.sqrt(np.array(_balanced))  # compute_class_weight("balanced") formülünün karekökü


def adjust(probs: np.ndarray, weights: np.ndarray = EFF_WEIGHTS, tau: float = config.EFF_TAU) -> np.ndarray:
    """Eğitimde ağırlığı yüksek olan (az örnekli) sınıfların şişen payını geri alır, sonra yeniden normalize eder."""
    adj = probs * np.power(weights, -tau)
    return adj / adj.sum(axis=-1, keepdims=True)


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
        # TRAIN_COUNTS ve adjust() bu sıraya göre yazıldı; sıra farklıysa düzeltme yanlış sınıfa uygulanır.
        if self.class_names != FALLBACK_CLASSES:
            raise RuntimeError(f"class_names.json model sırasıyla uyuşmuyor: {self.class_names} ≠ {FALLBACK_CLASSES}")

        import onnxruntime  # sadece gerçek model varken yüklenir

        # ONNX: P1 modelinin aynı ağırlıklarla dönüştürülmüş hali (tools/convert_to_onnx.py). TensorFlow gerekmez.
        session = onnxruntime.InferenceSession(str(config.MODEL_PATH), providers=["CPUExecutionProvider"])
        # Sınıf sayısı tutmazsa zip() sessizce keser ve model YANLIŞ etiket verir; baştan dur.
        output_size = session.get_outputs()[0].shape[-1]
        if output_size != len(self.class_names):
            raise RuntimeError(
                f"Model {output_size} sınıf çıkarıyor ama class_names.json {len(self.class_names)} sınıf içeriyor"
            )
        self.model = session
        self.input_name = session.get_inputs()[0].name
        self.model_version = config.MODEL_VERSION
        logger.info("Model yüklendi: %s (%d sınıf)", config.MODEL_PATH.name, len(self.class_names))

    def predict_probabilities(self, model_input: np.ndarray) -> dict[str, float]:
        """model_input: preprocessing.prepare() çıktısı, (1, 224, 224, 3). τ düzeltmesi uygulanmış olasılıklar döner."""
        if self.is_real:
            probs = adjust(self.model.run(None, {self.input_name: model_input})[0])[0]
        else:
            probs = self._fake_probabilities(model_input)
        return {label: float(p) for label, p in zip(self.class_names, probs)}

    def _fake_probabilities(self, model_input: np.ndarray) -> np.ndarray:
        """Aynı fotoğraf için hep aynı sonucu veren, gerçekçi görünen sahte olasılıklar."""
        seed = int.from_bytes(hashlib.sha256(model_input.tobytes()[:65536]).digest()[:4], "big")
        rng = np.random.default_rng(seed)
        logits = rng.normal(0, 1.2, len(self.class_names))
        logits[rng.integers(len(self.class_names))] += rng.uniform(0.5, 3.5)
        exp = np.exp(logits - logits.max())
        return exp / exp.sum()


def build_prediction(probabilities: dict[str, float]) -> dict:
    """Olasılıklardan fabric, top_predictions ve needs_review üretir."""
    ranked = sorted(probabilities.items(), key=lambda item: item[1], reverse=True)
    fabric, top = ranked[0]

    # P1 kuralı: en yüksek olasılık eşiğin altındaysa karar kullanıcıya sorulur (USER_CONFIRM).
    needs_review = top < config.NEEDS_REVIEW_MIN_CONFIDENCE

    return {
        "fabric": fabric,
        "confidence": round(top, 4),
        "top_predictions": [
            {"label": label, "confidence": round(conf, 4)} for label, conf in ranked[: config.TOP_K]
        ],
        "needs_review": needs_review,
    }
