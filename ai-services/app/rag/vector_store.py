import threading
from collections.abc import Callable
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings

from app.rag.documents import fingerprint, to_document


class IndexNotReady(RuntimeError):
    pass


class MenuIndex:
    """FAISS vector index over the menu, persisted to disk with a staleness fingerprint."""

    def __init__(self, embeddings: Embeddings, index_dir: str):
        self._embeddings = embeddings
        self._dir = Path(index_dir)
        self._store: FAISS | None = None
        self._lock = threading.Lock()

    @property
    def ready(self) -> bool:
        return self._store is not None

    @property
    def size(self) -> int:
        return self._store.index.ntotal if self._store else 0

    def build(self, foods: list[dict]) -> None:
        store = FAISS.from_documents([to_document(food) for food in foods], self._embeddings) if foods else None
        with self._lock:
            self._store = store
        if store:
            self._dir.mkdir(parents=True, exist_ok=True)
            store.save_local(str(self._dir))
            (self._dir / "fingerprint").write_text(fingerprint(foods))

    def load(self, expected_fingerprint: str) -> bool:
        marker = self._dir / "fingerprint"
        if not marker.exists() or marker.read_text() != expected_fingerprint:
            return False
        # Safe: we only ever load the docstore pickle this service wrote itself
        store = FAISS.load_local(str(self._dir), self._embeddings, allow_dangerous_deserialization=True)
        with self._lock:
            self._store = store
        return True

    def search(self, query: str, k: int, allowed: Callable[[dict], bool] | None = None) -> list[tuple[int, float]]:
        store = self._store
        if store is None:
            raise IndexNotReady("Menu index is not ready")
        hits = store.similarity_search_with_score(query, k=k, filter=allowed, fetch_k=max(k * 5, 50))
        # Normalised embeddings: squared L2 distance d maps to cosine similarity 1 - d/2
        return [(doc.metadata["food_id"], round(max(0.0, 1 - float(score) / 2), 3)) for doc, score in hits]
