"""WashMom AI API — FastAPI uygulaması.

Çalıştırma (backend klasöründe):  uvicorn main:app --reload --port 8000
Dokümantasyon:                    http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

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

    # Gizlilik: görsel diske yazılmaz, sadece bellekte işlenir.
    return {**prediction, "color_group": color_group, "model_version": model_service.model_version}
