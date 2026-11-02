from typing import Literal

from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    query: str = Field(min_length=2, max_length=300)
    user_id: int | None = Field(default=None, gt=0)
    veg_only: bool = False
    max_price: float | None = Field(default=None, gt=0)
    limit: int = Field(default=3, ge=1, le=6)


class MatchedFood(BaseModel):
    id: int
    name: str
    price: float
    rating: float
    image_url: str | None
    is_veg: bool
    spice_level: int
    category: str | None
    restaurant_id: int
    restaurant_name: str
    reason: str
    relevance: float | None = None


class RecommendationResponse(BaseModel):
    recommendation: str
    matched_foods: list[MatchedFood]
    engine: Literal["rag-llm", "retrieval-only", "popular"]
    retrieved: int
    personalised: bool


class IndexStatus(BaseModel):
    status: Literal["built", "loaded", "empty"]
    documents: int


class Health(BaseModel):
    status: Literal["ok", "degraded"]
    index_ready: bool
    documents: int
    engine: str
