import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.rag.recommender import Recommender
from app.rag.vector_store import MenuIndex
from tests.conftest import KeywordEmbeddings


@pytest.fixture
def client(make_recommender):
    with TestClient(create_app(lambda: make_recommender())) as test_client:
        yield test_client


def test_health_reports_index(client):
    body = client.get("/health").json()
    assert body == {"status": "ok", "index_ready": True, "documents": 7, "engine": "retrieval-only"}


def test_recommend_returns_grounded_menu_items(client):
    res = client.post("/recommend", json={"query": "light salad", "limit": 1})
    assert res.status_code == 200
    assert res.json()["matched_foods"][0]["name"] == "Greek Salad"


def test_recommend_validates_input(client):
    assert client.post("/recommend", json={"query": "x"}).status_code == 422
    assert client.post("/recommend", json={"query": "pizza", "limit": 50}).status_code == 422


def test_for_you(client):
    res = client.get("/recommend/for-you/42?limit=2")
    assert res.status_code == 200
    assert res.json()["personalised"] is True


def test_rebuild_requires_internal_key(client):
    assert client.post("/index/rebuild").status_code == 401
    res = client.post("/index/rebuild", headers={"X-Internal-Key": "dev-internal-key"})
    assert res.json() == {"status": "built", "documents": 7}


def test_returns_503_until_index_is_ready(menu, tmp_path):
    def broken():
        class NoDb(type(menu)):
            def all_foods(self):
                raise ConnectionError("database down")

        return Recommender(NoDb(), MenuIndex(KeywordEmbeddings(), str(tmp_path / "x")))

    with TestClient(create_app(broken)) as client:
        assert client.get("/health").json()["status"] == "degraded"
        assert client.post("/recommend", json={"query": "pizza"}).status_code == 503
