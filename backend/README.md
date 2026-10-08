---
title: WashMom AI API
emoji: 🧺
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
license: cc-by-nc-4.0
short_description: Kumaş (EfficientNetV2B0) + renk (OpenCV) analizi API'si
---

# WashMom AI API

WashMom Web'in FastAPI backend'i. Tek bir kıyafet fotoğrafından kumaş sınıfı ve renk grubu döndürür.

- `GET /health` → model yüklendi mi?
- `POST /predict` (multipart, alan adı `file`) → `fabric`, `confidence`, `top_predictions`, `color_group`, `needs_review`
- `GET /docs` → tarayıcıdan deneme sayfası

Model: [WashMom Vision](https://github.com/denizkaratass/WashMom-Vision) (`effnet_sqrt_finetuned.keras`).
Model DeepFashion-MultiModal ile eğitildi ve yalnızca **ticari olmayan** kullanım içindir (CC BY-NC 4.0).

Yüklenen fotoğraflar saklanmaz.

Space ayarı: **Settings → Variables** → `ALLOWED_ORIGINS` = canlı frontend adresi (ör. `https://washmom.netlify.app`).
