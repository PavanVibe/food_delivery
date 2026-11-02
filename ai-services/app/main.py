import logging
import secrets
from collections.abc import Callable
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Path, Query, Request

from app.config import get_settings
from app.rag.recommender import Recommender
from app.rag.vector_store import IndexNotReady
from app.schemas import Health, IndexStatus, RecommendationRequest, RecommendationResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("foodhub.ai")


def build_default_recommender() -> Recommender:
    from app.menu import MenuRepository
    from app.rag.models import build_embeddings, build_llm
    from app.rag.vector_store import MenuIndex

    settings = get_settings()
    index = MenuIndex(build_embeddings(settings), settings.index_dir)
    return Recommender(MenuRepository(settings.conninfo), index, build_llm(settings), k=settings.retrieval_k)


def create_app(build: Callable[[], Recommender] = build_default_recommender) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        recommender = build()
        try:
            status = recommender.refresh_index()
            logger.info("Menu index %s with %s documents (engine: %s)", status["status"], status["documents"], recommender.engine)
        except Exception as exc:
            logger.error("Menu index unavailable at startup: %s", exc)
        app.state.recommender = recommender
        yield

    app = FastAPI(title="FoodHub AI Service", version="1.0.0", lifespan=lifespan)

    def recommender(request: Request) -> Recommender:
        return request.app.state.recommender

    @app.get("/health", response_model=Health)
    def health(rec: Recommender = Depends(recommender)):
        return {
            "status": "ok" if rec.index_ready else "degraded",
            "index_ready": rec.index_ready,
            "documents": rec.documents,
            "engine": rec.engine,
        }

    @app.post("/recommend", response_model=RecommendationResponse)
    def recommend(body: RecommendationRequest, rec: Recommender = Depends(recommender)):
        try:
            return rec.recommend(
                body.query, user_id=body.user_id, veg_only=body.veg_only, max_price=body.max_price, limit=body.limit
            )
        except IndexNotReady as exc:
            raise HTTPException(status_code=503, detail="Menu index is still being built, try again shortly") from exc

    @app.get("/recommend/for-you/{user_id}", response_model=RecommendationResponse)
    def for_you(
        user_id: int = Path(gt=0), limit: int = Query(6, ge=1, le=12), rec: Recommender = Depends(recommender)
    ):
        try:
            return rec.for_you(user_id, limit)
        except IndexNotReady as exc:
            raise HTTPException(status_code=503, detail="Menu index is still being built, try again shortly") from exc

    @app.post("/index/rebuild", response_model=IndexStatus)
    def rebuild(x_internal_key: str = Header(default=""), rec: Recommender = Depends(recommender)):
        if not secrets.compare_digest(x_internal_key, get_settings().internal_api_key):
            raise HTTPException(status_code=401, detail="Invalid internal key")
        return rec.refresh_index(force=True)

    return app


app = create_app()
