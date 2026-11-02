from langchain_core.embeddings import DeterministicFakeEmbedding, Embeddings
from langchain_core.language_models import BaseChatModel

from app.config import Settings


def build_embeddings(settings: Settings) -> Embeddings:
    if settings.embedding_provider == "fake":
        return DeterministicFakeEmbedding(size=384)

    from langchain_huggingface import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(model_name=settings.embedding_model, encode_kwargs={"normalize_embeddings": True})


def build_llm(settings: Settings) -> BaseChatModel | None:
    if settings.llm_provider == "none" or not settings.gemini_api_key:
        return None

    from langchain_google_genai import ChatGoogleGenerativeAI

    # No retries: on timeout the recommender falls back to retrieval-only ranking
    return ChatGoogleGenerativeAI(
        model=settings.llm_model,
        google_api_key=settings.gemini_api_key,
        thinking_level=settings.llm_thinking_level,
        timeout=settings.llm_timeout_seconds,
        max_retries=0,
    )
