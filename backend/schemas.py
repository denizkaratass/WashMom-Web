"""API yanıt şemaları. FastAPI bunları hem doğrulama hem de /docs sayfası için kullanır."""

from typing import Literal

from pydantic import BaseModel, Field

Fabric = Literal["denim", "cotton", "knitted", "chiffon", "leather", "furry", "other"]
ColorGroup = Literal["white", "light", "colored", "dark"]


class TopPrediction(BaseModel):
    label: Fabric
    confidence: float = Field(ge=0, le=1)


class PredictionResponse(BaseModel):
    fabric: Fabric
    confidence: float = Field(ge=0, le=1)
    top_predictions: list[TopPrediction]
    color_group: ColorGroup
    needs_review: bool
    model_version: str


class HealthResponse(BaseModel):
    status: Literal["ok"]
    model_loaded: bool
    model_version: str
