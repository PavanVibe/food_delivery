import json

from langchain_core.language_models.fake_chat_models import FakeListChatModel

from app.rag.recommender import Recommender
from app.rag.vector_store import MenuIndex
from tests.conftest import KeywordEmbeddings


def llm_returning(**payload):
    return FakeListChatModel(responses=[json.dumps(payload)] * 5)


def ids(result):
    return [food["id"] for food in result["matched_foods"]]


def test_retrieval_finds_semantically_relevant_dishes(make_recommender):
    result = make_recommender().recommend("something spicy with chicken", limit=2)
    assert result["engine"] == "retrieval-only"
    assert set(ids(result)) <= {1, 3}


def test_veg_and_budget_filters_are_hard_constraints(make_recommender):
    result = make_recommender().recommend("spicy chicken", veg_only=True, max_price=250, limit=5)
    foods = result["matched_foods"]
    assert foods and all(f["is_veg"] and f["price"] <= 250 for f in foods)


def test_llm_picks_are_returned_with_reasons(make_recommender):
    llm = llm_returning(message="Try these!", picks=[{"food_id": 3, "reason": "Spicy and hearty"}])
    result = make_recommender(llm).recommend("spicy chicken")
    assert result["engine"] == "rag-llm"
    assert result["recommendation"] == "Try these!"
    assert result["matched_foods"][0]["reason"] == "Spicy and hearty"


def test_hallucinated_ids_are_dropped(menu, make_recommender):
    retrieved = {c.food["id"] for c in make_recommender().retrieve("spicy chicken")}
    not_retrieved = next(food_id for food_id in menu.foods if food_id not in retrieved)
    picks = [
        {"food_id": 999, "reason": "made up"},
        {"food_id": not_retrieved, "reason": "not retrieved"},
        {"food_id": 1, "reason": "ok"},
    ]
    result = make_recommender(llm_returning(message="Here you go", picks=picks)).recommend("spicy chicken", limit=3)
    assert 999 not in ids(result)
    assert not_retrieved not in ids(result)
    assert 1 in ids(result)


def test_falls_back_to_retrieval_when_llm_output_is_invalid(make_recommender):
    result = make_recommender(FakeListChatModel(responses=["not json at all"])).recommend("chocolate dessert")
    assert result["engine"] == "retrieval-only"
    assert ids(result)[0] == 5


def test_falls_back_when_llm_only_invents_dishes(make_recommender):
    llm = llm_returning(message="x", picks=[{"food_id": 12345, "reason": "fake"}])
    result = make_recommender(llm).recommend("chocolate dessert")
    assert result["engine"] == "retrieval-only"


def test_unavailable_items_are_removed_at_query_time(menu, make_recommender):
    recommender = make_recommender()
    del menu.foods[5]
    assert 5 not in ids(recommender.recommend("chocolate dessert sweet", limit=5))


def test_personalised_profile_is_sent_to_the_llm(make_recommender):
    captured = {}

    class SpyLLM(FakeListChatModel):
        def _call(self, messages, *args, **kwargs):
            captured["prompt"] = messages[-1].content
            return super()._call(messages, *args, **kwargs)

    llm = SpyLLM(responses=[json.dumps({"message": "ok", "picks": [{"food_id": 1, "reason": "r"}]})])
    result = make_recommender(llm).recommend("spicy", user_id=42)
    assert result["personalised"] is True
    assert "Chicken Biryani (x9)" in captured["prompt"]


def test_for_you_suggests_untried_dishes(make_recommender):
    result = make_recommender().for_you(42, limit=3)
    assert result["personalised"] is True
    assert not {1, 3} & set(ids(result))


def test_for_you_keeps_vegetarians_vegetarian(make_recommender):
    result = make_recommender().for_you(7, limit=5)
    assert result["matched_foods"] and all(food["is_veg"] for food in result["matched_foods"])


def test_for_you_without_history_returns_popular(make_recommender):
    result = make_recommender().for_you(1000)
    assert result["engine"] == "popular"
    assert result["personalised"] is False


def test_saved_index_is_reused_until_menu_changes(menu, tmp_path):
    index_dir = str(tmp_path / "idx")
    first = Recommender(menu, MenuIndex(KeywordEmbeddings(), index_dir)).refresh_index()
    second = Recommender(menu, MenuIndex(KeywordEmbeddings(), index_dir)).refresh_index()
    menu.foods[1]["price"] = 199.0
    third = Recommender(menu, MenuIndex(KeywordEmbeddings(), index_dir)).refresh_index()
    assert (first["status"], second["status"], third["status"]) == ("built", "loaded", "built")
