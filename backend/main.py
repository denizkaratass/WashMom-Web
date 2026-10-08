"""WashMom AI API — FastAPI uygulaması.

Çalıştırma (backend klasöründe):  uvicorn main:app --reload --port 8000
Dokümantasyon:                    http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import config
from color_analysis import classify_color
from inference import ModelService, build_prediction
from preprocessing import InvalidImageError, load_image
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


@app.middleware("http")
async def reject_oversized_requests(request: Request, call_next):
    length = request.headers.get("content-length")
    if request.url.path == "/predict" and length and length.isdigit() and int(length) > MAX_REQUEST_BYTES:
        return JSONResponse(status_code=413, content={"detail": "Dosya çok büyük (en fazla 10 MB)."})
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

    try:
        prediction = build_prediction(model_service.predict_probabilities(image))
        color_group = classify_color(image)
    except Exception:
        logger.exception("Tahmin sırasında hata")
        raise HTTPException(status_code=500, detail="Model hatası.")

    # Gizlilik: görsel saklanmaz. (Starlette 1 MB'tan büyük yüklemeleri istek süresince geçici
    # dosyada tutar ve istek bitince siler; frontend'in 1024 px JPEG'leri genelde bunun altındadır.)
    return {**prediction, "color_group": color_group, "model_version": model_service.model_version}
