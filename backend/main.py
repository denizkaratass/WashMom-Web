"""WashMom AI API — FastAPI uygulaması.

Çalıştırma (backend klasöründe):  uvicorn main:app --reload --port 8000
Dokümantasyon:                    http://localhost:8000/docs
"""

import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import config
from color_analysis import classify_color
from inference import ModelService, build_prediction
from preprocessing import GarmentNotFoundError, InvalidImageError, load_image, prepare
from schemas import HealthResponse, PredictionResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("washmom")

model_service = ModelService()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    model_service.load()  # model her istekte değil, uygulama açılırken bir kez yüklenir
    yield


app = FastAPI(title="WashMom AI API", version="1.0.0", lifespan=lifespan)

# multipart gövdesi endpoint'e gelmeden önce tamamen okunur. Content-Length baştan çok büyükse
# gövdeyi hiç okumadan reddet. (CORS'tan ÖNCE eklenir → CORS en dışta kalır, 413 yanıtı da CORS başlığı alır.)
MAX_REQUEST_BYTES = config.MAX_FILE_SIZE + 64 * 1024  # dosya + multipart başlıkları için pay


# IP → son 60 sn'deki /predict zamanları. Tek event loop'ta çalışır (kilit gerekmez); örnek başına bellekte tutulur.
_recent_predictions: dict[str, deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Vercel gerçek istemci IP'sini x-real-ip'ye yazar (istemci bunu değiştiremez); yerelde bağlantı adresi kullanılır.
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")


def _over_rate_limit(ip: str) -> bool:
    now = time.monotonic()
    hits = _recent_predictions[ip]
    while hits and now - hits[0] > 60:
        hits.popleft()
    if len(hits) >= config.RATE_LIMIT_PER_MINUTE:
        return True
    hits.append(now)
    # Bellek şişmesin: boşalmış IP kayıtlarını ara ara temizle
    if len(_recent_predictions) > 10_000:
        for key in [k for k, v in _recent_predictions.items() if not v]:
            del _recent_predictions[key]
    return False


@app.middleware("http")
async def guard_predict_requests(request: Request, call_next):
    if request.url.path == "/predict" and request.method == "POST":
        length = request.headers.get("content-length")
        if length and length.isdigit() and int(length) > MAX_REQUEST_BYTES:
            return JSONResponse(status_code=413, content={"detail": "Dosya çok büyük (en fazla 10 MB)."})
        # Pahalı tahmin (GrabCut + model) ücretsiz CPU kotasını tüketmesin
        if _over_rate_limit(_client_ip(request)):
            return JSONResponse(
                status_code=429,
                content={"detail": "Çok fazla istek. Bir dakika sonra tekrar dene."},
                headers={"Retry-After": "60"},
            )
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "model_loaded": model_service.is_real, "model_version": model_service.model_version}


@app.post("/predict", response_model=PredictionResponse)
def predict(file: UploadFile = File(...)):
    # Not: async değil → FastAPI bunu ayrı bir thread'de çalıştırır; model tahmini sunucuyu kilitlemez.
    if file.content_type not in config.ACCEPTED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Desteklenmeyen dosya türü. JPG, PNG veya WEBP gönderin.")

    data = file.file.read(config.MAX_FILE_SIZE + 1)
    if len(data) > config.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Dosya çok büyük (en fazla 10 MB).")

    try:
        image = load_image(data)
    except InvalidImageError:
        raise HTTPException(status_code=400, detail="Görsel okunamadı.")

    started = time.perf_counter()
    try:
        # P1 akışı: 800 px → GrabCut maske (bir kez) → crop → model; aynı maske renk için de kullanılır
        img, mask, model_input = prepare(image)
    except GarmentNotFoundError:
        raise HTTPException(
            status_code=422, detail="Fotoğrafta kıyafet bulunamadı. Sade bir zeminde, kıyafet ortada olacak şekilde dene."
        )
    except Exception:
        # Yakalanmayan hata düz metin 500 + CORS başlıksız döner; tarayıcı bunu "ağ hatası" sanar
        logger.exception("Ön işleme sırasında hata")
        raise HTTPException(status_code=500, detail="Görsel işlenemedi.")

    try:
        prediction = build_prediction(model_service.predict_probabilities(model_input))
        color_group = classify_color(img, mask)
    except Exception:
        logger.exception("Tahmin sırasında hata")
        raise HTTPException(status_code=500, detail="Model hatası.")

    # İzleme için: süre ve sonuç (görsel, IP veya kişisel veri loglanmaz)
    logger.info(
        "predict ok fabric=%s conf=%.3f review=%s ms=%d",
        prediction["fabric"], prediction["confidence"], prediction["needs_review"], (time.perf_counter() - started) * 1000,
    )

    # Gizlilik: görsel saklanmaz. (Starlette 1 MB'tan büyük yüklemeleri istek süresince geçici
    # dosyada tutar ve istek bitince siler; frontend'in 1024 px JPEG'leri genelde bunun altındadır.)
    return {**prediction, "color_group": color_group, "model_version": model_service.model_version}
