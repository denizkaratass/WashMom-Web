"""Backend testleri — sadece standart kütüphane (unittest + urllib), ek paket gerekmez.

Çalıştırma (backend klasöründe):  python -m unittest discover -s tests -v
"""

import io
import json
import sys
import tempfile
import threading
import time
import types
import unittest
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from unittest import mock

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import config  # noqa: E402
from color_analysis import classify_color  # noqa: E402
from inference import FALLBACK_CLASSES, ModelService, adjust, build_prediction  # noqa: E402
from preprocessing import GarmentNotFoundError, InvalidImageError, load_image, prepare, to_model_input  # noqa: E402

GOLDEN_DIR = Path(__file__).resolve().parent / "golden"


def image_bytes(img: Image.Image, fmt: str, **kwargs) -> bytes:
    buf = io.BytesIO()
    img.save(buf, fmt, **kwargs)
    return buf.getvalue()


def solid(color, size=(200, 200)) -> Image.Image:
    return Image.new("RGB", size, color)


def garment_on_white(color, size=(400, 400)) -> Image.Image:
    """Beyaz zemin + ortada tek renk 'kıyafet' (GrabCut'ın ayırabileceği basit sahne)."""
    img = solid((250, 250, 250), size)
    w, h = size
    img.paste(solid(color, (w // 2, h // 2)), (w // 4, h // 4))
    return img


# ---------------------------------------------------------------- build_prediction
class BuildPredictionTests(unittest.TestCase):
    def test_confident_prediction(self):
        p = build_prediction({"knitted": 0.88, "cotton": 0.07, "chiffon": 0.03, "denim": 0.02})
        self.assertEqual(p["fabric"], "knitted")
        self.assertFalse(p["needs_review"])
        self.assertEqual([t["label"] for t in p["top_predictions"]], ["knitted", "cotton", "chiffon"])

    def test_low_confidence_needs_review(self):
        self.assertTrue(build_prediction({"denim": 0.54, "cotton": 0.30, "knitted": 0.16})["needs_review"])

    def test_confidence_threshold_is_inclusive(self):
        # en yüksek olasılık tam 0.55 → inceleme GEREKMEZ (P1 kuralı "< 0.55")
        self.assertFalse(build_prediction({"denim": 0.55, "cotton": 0.30, "knitted": 0.15})["needs_review"])

    def test_only_confidence_matters(self):
        # P1'de fark (margin) kuralı yok: 0.56'ya 0.44 bile otomatik karardır
        self.assertFalse(build_prediction({"denim": 0.56, "cotton": 0.44})["needs_review"])


# ---------------------------------------------------------------- adjust (τ düzeltmesi)
class AdjustTests(unittest.TestCase):
    def test_sums_to_one_and_shrinks_rare_classes(self):
        uniform = np.full((1, 6), 1 / 6)
        adj = adjust(uniform)[0]
        self.assertAlmostEqual(float(adj.sum()), 1.0, places=6)
        # az örnekli furry'nin eğitim ağırlığı en yüksekti → payı en çok azalır; cotton'unki en çok artar
        self.assertEqual(FALLBACK_CLASSES[int(adj.argmin())], "furry")
        self.assertEqual(FALLBACK_CLASSES[int(adj.argmax())], "cotton")


# ---------------------------------------------------------------- load_image
class LoadImageTests(unittest.TestCase):
    def test_valid_jpeg_becomes_rgb(self):
        img = load_image(image_bytes(Image.new("L", (40, 30)), "JPEG"))
        self.assertEqual((img.mode, img.size), ("RGB", (40, 30)))

    def test_png_with_alpha_becomes_rgb(self):
        self.assertEqual(load_image(image_bytes(Image.new("RGBA", (10, 10)), "PNG")).mode, "RGB")

    def test_webp_accepted(self):
        self.assertEqual(load_image(image_bytes(solid((1, 2, 3), (10, 10)), "WEBP")).size, (10, 10))

    def test_garbage_rejected(self):
        with self.assertRaises(InvalidImageError):
            load_image(b"not an image")

    def test_truncated_jpeg_rejected(self):
        data = image_bytes(solid((10, 200, 30)), "JPEG")
        with self.assertRaises(InvalidImageError):
            load_image(data[: len(data) // 3])

    def test_disallowed_format_rejected(self):
        # GIF, Content-Type'ı image/png diye yalan söylese bile içerikten anlaşılır
        with self.assertRaises(InvalidImageError):
            load_image(image_bytes(solid((200, 30, 30), (10, 10)), "GIF"))

    def test_decompression_bomb_rejected(self):
        bomb = image_bytes(Image.new("1", (20000, 20000)), "PNG")  # 400 MP, dosya ~50 KB
        self.assertLess(len(bomb), 200_000)
        with self.assertRaises(InvalidImageError):
            load_image(bomb)

    def test_oversized_image_below_pillow_limit_rejected(self):
        # 144 MP: Pillow sadece uyarı verir ama RGB'ye çevirmek ~430 MB RAM yer
        with self.assertRaises(InvalidImageError):
            load_image(image_bytes(Image.new("1", (12000, 12000)), "PNG"))

    def test_exif_orientation_applied(self):
        exif = Image.Exif()
        exif[0x0112] = 6  # 90° döndürülmüş telefon fotoğrafı
        data = image_bytes(solid((50, 50, 50), (40, 20)), "JPEG", exif=exif)
        self.assertEqual(load_image(data).size, (20, 40))

    def test_model_input_shape_and_range(self):
        arr = to_model_input(np.full((*config.IMAGE_SIZE, 3), 255, np.uint8))
        self.assertEqual(arr.shape, (1, *config.IMAGE_SIZE, 3))
        self.assertEqual(arr.dtype, np.float32)
        self.assertEqual(arr.max(), 255.0)  # 0–255, normalizasyon modelin içinde


# ---------------------------------------------------------------- prepare (GrabCut → crop)
class PrepareTests(unittest.TestCase):
    def test_garment_scene(self):
        img, mask, x = prepare(garment_on_white((20, 20, 30), (1200, 900)))
        self.assertEqual(max(img.shape[:2]), config.MAX_SIDE)  # uzun kenar 800'e indi
        self.assertEqual(mask.shape, img.shape[:2])
        self.assertEqual((x.shape, x.dtype), ((1, *config.IMAGE_SIZE, 3), np.float32))

    def test_small_image_not_upscaled(self):
        img, _, _ = prepare(garment_on_white((20, 20, 30), (300, 200)))
        self.assertEqual(img.shape[:2], (200, 300))

    def test_blank_image_has_no_garment(self):
        with self.assertRaises(GarmentNotFoundError):
            prepare(solid((240, 240, 240), (400, 400)))


# ---------------------------------------------------------------- color (P1 color_group)
class ColorTests(unittest.TestCase):
    def color_of(self, rgb):
        img = np.asarray(solid(rgb, (20, 20)))
        return classify_color(img, np.ones(img.shape[:2], np.uint8))

    def test_groups(self):
        self.assertEqual(self.color_of((250, 250, 250)), "white")
        self.assertEqual(self.color_of((20, 20, 30)), "dark")
        self.assertEqual(self.color_of((200, 30, 40)), "colored")
        self.assertEqual(self.color_of((205, 195, 175)), "light")

    def test_only_mask_pixels_count(self):
        img = np.asarray(garment_on_white((20, 20, 30)))  # beyaz arka plan, ortada koyu kıyafet
        mask = np.zeros(img.shape[:2], np.uint8)
        mask[100:300, 100:300] = 1
        self.assertEqual(classify_color(img, mask), "dark")


# ---------------------------------------------------------------- ModelService
class ModelServiceTests(unittest.TestCase):
    def test_fake_mode_is_deterministic_and_valid(self):
        service = ModelService()
        self.assertFalse(service.is_real)
        x = to_model_input(np.full((*config.IMAGE_SIZE, 3), 7, np.uint8))
        a = service.predict_probabilities(x)
        self.assertEqual(a, service.predict_probabilities(x))
        self.assertEqual(list(a), FALLBACK_CLASSES)
        self.assertAlmostEqual(sum(a.values()), 1.0, places=5)

    def _load_with(self, class_names, output_size):
        tmp = Path(tempfile.mkdtemp())
        (tmp / "m.keras").write_bytes(b"x")
        (tmp / "c.json").write_text(json.dumps(class_names), encoding="utf-8")
        fake_model = types.SimpleNamespace(output_shape=(None, output_size))
        fake_keras = types.SimpleNamespace(models=types.SimpleNamespace(load_model=lambda _p: fake_model))
        with mock.patch.multiple(config, MODEL_PATH=tmp / "m.keras", CLASS_NAMES_PATH=tmp / "c.json"), \
                mock.patch.dict(sys.modules, {"keras": fake_keras}):
            service = ModelService()
            service.load()
            return service

    def test_class_count_mismatch_fails_fast(self):
        with self.assertRaises(RuntimeError):
            self._load_with(["cotton", "denim"], output_size=7)

    def test_unknown_label_fails_fast(self):
        with self.assertRaises(RuntimeError):
            self._load_with(["cotton", "jeans"], output_size=2)

    def test_wrong_class_order_fails_fast(self):
        swapped = ["denim", "cotton", *FALLBACK_CLASSES[2:]]
        with self.assertRaises(RuntimeError):
            self._load_with(swapped, output_size=6)

    def test_matching_files_load(self):
        self.assertTrue(self._load_with(FALLBACK_CLASSES, output_size=6).is_real)


# ---------------------------------------------------------------- altın sonuçlar (gerçek model)
@unittest.skipUnless(config.MODEL_PATH.exists(), "model dosyası yok")
class GoldenTests(unittest.TestCase):
    """Backend, P1'in (kiyafet_dene.py) aynı fotoğraflara verdiği cevabı birebir vermeli."""

    def test_matches_p1(self):
        service = ModelService()
        service.load()
        golden = json.loads((GOLDEN_DIR / "golden.json").read_text(encoding="utf-8"))
        for name, expected in golden.items():
            with self.subTest(photo=name):
                img, mask, x = prepare(load_image((GOLDEN_DIR / name).read_bytes()))
                probs = service.predict_probabilities(x)
                self.assertEqual(build_prediction(probs)["fabric"], expected["fabric"])
                self.assertEqual(classify_color(img, mask), expected["color_group"])
                for label, p in expected["probabilities"].items():
                    self.assertAlmostEqual(probs[label], p, delta=0.01)


# ---------------------------------------------------------------- HTTP (gerçek uvicorn sunucusu)
def multipart(field: str, filename: str, content_type: str, data: bytes):
    boundary = uuid.uuid4().hex
    body = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode() + data + f"\r\n--{boundary}--\r\n".encode()
    return body, f"multipart/form-data; boundary={boundary}"


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import uvicorn

        from main import app

        cls.server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=0, log_level="warning"))
        threading.Thread(target=cls.server.run, daemon=True).start()
        deadline = time.time() + 15
        while not (cls.server.started and cls.server.servers):
            if time.time() > deadline:
                raise RuntimeError("uvicorn başlamadı")
            time.sleep(0.05)
        port = cls.server.servers[0].sockets[0].getsockname()[1]
        cls.base = f"http://127.0.0.1:{port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.should_exit = True

    def request(self, path, data=None, headers=None, method=None):
        req = urllib.request.Request(self.base + path, data=data, headers=headers or {}, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                return res.status, dict(res.headers), json.loads(res.read())
        except urllib.error.HTTPError as err:
            return err.code, dict(err.headers), json.loads(err.read() or b"null")

    def predict(self, data, content_type="image/jpeg", headers=None):
        body, ctype = multipart("file", "x.jpg", content_type, data)
        return self.request("/predict", body, {"Content-Type": ctype, **(headers or {})})

    def test_health(self):
        status, _, body = self.request("/health")
        self.assertEqual(status, 200)
        self.assertEqual(body["status"], "ok")

    def test_predict_contract(self):
        status, _, body = self.predict(image_bytes(garment_on_white((20, 20, 30)), "JPEG"))
        self.assertEqual(status, 200)
        self.assertEqual(
            set(body), {"fabric", "confidence", "top_predictions", "color_group", "needs_review", "model_version"}
        )
        self.assertEqual(body["color_group"], "dark")
        self.assertEqual(len(body["top_predictions"]), config.TOP_K)

    def test_no_garment_is_422(self):
        status, _, body = self.predict(image_bytes(solid((240, 240, 240)), "JPEG"))
        self.assertEqual(status, 422)
        self.assertIn("kıyafet bulunamadı", body["detail"])

    def test_errors_use_detail_json(self):
        cases = [
            (b"not an image", "image/jpeg", 400),
            (image_bytes(solid((1, 1, 1), (10, 10)), "GIF"), "image/png", 400),  # yalan Content-Type
            (image_bytes(Image.new("1", (20000, 20000)), "PNG"), "image/png", 400),  # bomb → eskiden 500
            (image_bytes(solid((1, 1, 1)), "JPEG"), "text/plain", 400),
            (b"\0" * (config.MAX_FILE_SIZE + 1), "image/jpeg", 413),
        ]
        for data, ctype, expected in cases:
            with self.subTest(ctype=ctype, expected=expected, size=len(data)):
                status, _, body = self.predict(data, ctype)
                self.assertEqual(status, expected)
                self.assertIn("detail", body)

    def test_oversized_request_rejected_early_with_cors(self):
        # Content-Length sınırı aşıyorsa gövde okunmadan 413; tarayıcı mesajı görebilsin diye CORS başlığı olmalı
        origin = config.ALLOWED_ORIGINS[0]
        req = urllib.request.Request(
            self.base + "/predict",
            data=b"x" * 1024,
            headers={"Content-Type": "multipart/form-data; boundary=b", "Origin": origin},
        )
        req.add_unredirected_header("Content-Length", str(50 * 1024 * 1024))
        try:
            urllib.request.urlopen(req, timeout=10)
            self.fail("413 bekleniyordu")
        except urllib.error.HTTPError as err:
            self.assertEqual(err.code, 413)
            self.assertEqual(err.headers.get("access-control-allow-origin"), origin)

    def test_cors_only_allowed_origins(self):
        _, ok_headers, _ = self.request("/health", headers={"Origin": config.ALLOWED_ORIGINS[0]})
        self.assertEqual(ok_headers.get("access-control-allow-origin"), config.ALLOWED_ORIGINS[0])
        _, bad_headers, _ = self.request("/health", headers={"Origin": "https://evil.example"})
        self.assertNotIn("access-control-allow-origin", {k.lower() for k in bad_headers})


if __name__ == "__main__":
    unittest.main()
