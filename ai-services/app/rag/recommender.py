import logging
from dataclasses import dataclass

from langchain_core.language_models import BaseChatModel

from app.menu import MenuSource
from app.rag.chain import build_chain
from app.rag.documents import SPICE, fingerprint
from app.rag.vector_store import MenuIndex

logger = logging.getLogger(__name__)


@dataclass
class Candidate:
    food: dict
    relevance: float | None


def _context_line(food: dict) -> str:
    diet = "veg" if food["is_veg"] else "non-veg"
    nutrition = f"{food['calories']} kcal, {food.get('protein_g') or 0} g protein" if food.get("calories") else "n/a"
    return (
        f"[id={food['id']}] {food['name']} | {food['restaurant_name']} | Rs {food['price']:.0f} | "
        f"rating {food['rating']} | {diet} | {SPICE.get(food['spice_level'], '')} | {nutrition}\n"
        f"    {food.get('description') or ''}"
    )


def _fallback_reason(food: dict) -> str:
    parts = ["Vegetarian" if food["is_veg"] else "Non-veg", SPICE.get(food["spice_level"], "")]
    if (food.get("protein_g") or 0) >= 25:
        parts.append(f"{food['protein_g']} g protein")
    parts.append(f"rated {food['rating']}")
    return ", ".join(part for part in parts if part).capitalize()


def _matched(candidate: Candidate, reason: str) -> dict:
    food = candidate.food
    return {
        "id": food["id"],
        "name": food["name"],
        "price": food["price"],
        "rating": food["rating"],
        "image_url": food.get("image_url"),
        "is_veg": food["is_veg"],
        "spice_level": food["spice_level"],
        "category": food.get("category"),
        "restaurant_id": food["restaurant_id"],
        "restaurant_name": food["restaurant_name"],
        "reason": reason,
        "relevance": candidate.relevance,
    }


class Recommender:
    """Retrieval-augmented recommender: FAISS retrieval, live DB grounding, optional LLM re-ranking."""

    def __init__(self, menu: MenuSource, index: MenuIndex, llm: BaseChatModel | None = None, k: int = 8):
        self._menu = menu
        self._index = index
        self._chain = build_chain(llm) if llm else None
        self._k = k

    @property
    def engine(self) -> str:
        return "rag-llm" if self._chain else "retrieval-only"

    @property
    def index_ready(self) -> bool:
        return self._index.ready

    @property
    def documents(self) -> int:
        return self._index.size

    def refresh_index(self, force: bool = False) -> dict:
        foods = self._menu.all_foods()
        if not foods:
            self._index.build([])
            return {"status": "empty", "documents": 0}
        if not force and self._index.load(fingerprint(foods)):
            return {"status": "loaded", "documents": self._index.size}
        self._index.build(foods)
        return {"status": "built", "documents": self._index.size}

    def retrieve(
        self, query: str, *, veg_only: bool = False, max_price: float | None = None, k: int | None = None, exclude=()
    ) -> list[Candidate]:
        def allowed(meta: dict) -> bool:
            return (
                (not veg_only or meta["is_veg"])
                and (max_price is None or meta["price"] <= max_price)
                and meta["food_id"] not in exclude
            )

        hits = self._index.search(query, k or self._k, allowed)
        live = {food["id"]: food for food in self._menu.foods_by_ids([food_id for food_id, _ in hits])}

        candidates = []
        for food_id, relevance in hits:
            food = live.get(food_id)
            # Re-check live data: the item may have sold out or changed price since indexing
            if food is None or (veg_only and not food["is_veg"]) or (max_price is not None and food["price"] > max_price):
                continue
            candidates.append(Candidate(food, relevance))
        return candidates

    def recommend(
        self, query: str, *, user_id: int | None = None, veg_only: bool = False, max_price: float | None = None, limit: int = 3
    ) -> dict:
        history = self._menu.user_history(user_id) if user_id else []
        candidates = self.retrieve(query, veg_only=veg_only, max_price=max_price)
        constraints = ", ".join(
            filter(None, ["vegetarian only" if veg_only else "", f"max Rs {max_price:.0f} per dish" if max_price else ""])
        )
        return self._answer(query, candidates, history, constraints or "none", limit)

    def for_you(self, user_id: int, limit: int = 6) -> dict:
        history = self._menu.user_history(user_id)
        if not history:
            popular = [Candidate(food, None) for food in self._menu.popular(limit)]
            return {
                "recommendation": "Here are the highest-rated dishes on FoodHub right now.",
                "matched_foods": [_matched(c, _fallback_reason(c.food)) for c in popular],
                "engine": "popular",
                "retrieved": len(popular),
                "personalised": False,
            }

        tried = {item["id"] for item in history}
        veg_only = all(item["is_veg"] for item in history)
        query = "Dishes similar to " + ", ".join(item["name"] for item in history[:5])
        candidates = self.retrieve(query, veg_only=veg_only, k=self._k + 4, exclude=tried)
        request = f"Suggest new dishes this customer has not tried yet but will probably enjoy. {query}."
        return self._answer(request, candidates, history, "vegetarian only" if veg_only else "none", limit)

    def _answer(self, query: str, candidates: list[Candidate], history: list[dict], constraints: str, limit: int) -> dict:
        personalised = bool(history)
        base = {"retrieved": len(candidates), "personalised": personalised}

        if not candidates:
            return {
                **base,
                "recommendation": "I couldn't find anything on the menu that matches. Try relaxing the price or diet filter.",
                "matched_foods": [],
                "engine": self.engine,
            }

        if self._chain:
            try:
                answer = self._chain.invoke(
                    {
                        "query": query,
                        "profile": self._profile(history),
                        "constraints": constraints,
                        "context": "\n".join(_context_line(c.food) for c in candidates),
                        "limit": limit,
                    }
                )
                by_id = {c.food["id"]: c for c in candidates}
                picks, seen = [], set()
                for pick in answer.picks:
                    # Guardrail: drop any id the model invented or that wasn't retrieved
                    if pick.food_id in by_id and pick.food_id not in seen:
                        picks.append(_matched(by_id[pick.food_id], pick.reason))
                        seen.add(pick.food_id)
                if picks or not answer.picks:
                    return {**base, "recommendation": answer.message, "matched_foods": picks[:limit], "engine": "rag-llm"}
                logger.warning("LLM returned only unknown ids; falling back to retrieval ranking")
            except Exception as exc:
                logger.warning("LLM call failed, falling back to retrieval ranking: %s", exc)

        top = candidates[:limit]
        return {
            **base,
            "recommendation": f"Here are the closest matches on our menu for “{query}”.",
            "matched_foods": [_matched(c, _fallback_reason(c.food)) for c in top],
            "engine": "retrieval-only",
        }

    @staticmethod
    def _profile(history: list[dict]) -> str:
        if not history:
            return "new or anonymous customer, no order history"
        favourites = ", ".join(f"{item['name']} (x{item['times_ordered']})" for item in history[:5])
        veg_share = sum(item["is_veg"] for item in history) / len(history)
        diet = "mostly vegetarian" if veg_share >= 0.7 else "mostly non-vegetarian" if veg_share <= 0.3 else "mixed diet"
        return f"frequently orders {favourites}; {diet}"
