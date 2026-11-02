import math
import re

import pytest
from langchain_core.embeddings import Embeddings

from app.rag.recommender import Recommender
from app.rag.vector_store import MenuIndex

VOCAB = [
    "spicy", "mild", "chicken", "paneer", "biryani", "protein", "salad", "light", "vegetarian",
    "non-vegetarian", "sweet", "dessert", "chocolate", "rice", "dosa", "coffee", "cheap", "creamy",
]


class KeywordEmbeddings(Embeddings):
    """Bag-of-words embedding over a tiny vocabulary: deterministic and semantically meaningful for tests."""

    def _embed(self, text: str) -> list[float]:
        words = re.findall(r"[a-z-]+", text.lower())
        vector = [float(sum(word.startswith(term) for word in words)) for term in VOCAB]
        norm = math.sqrt(sum(v * v for v in vector)) or 1.0
        return [v / norm for v in vector]

    def embed_documents(self, texts):
        return [self._embed(text) for text in texts]

    def embed_query(self, text):
        return self._embed(text)


def food(id, name, *, veg, spice, price, protein=10, calories=400, rating=4.3, category="Mains", description=""):
    return {
        "id": id, "name": name, "description": description, "price": float(price), "rating": rating,
        "is_veg": veg, "spice_level": spice, "calories": calories, "protein_g": protein, "tags": [],
        "image_url": None, "restaurant_id": 1, "restaurant_name": "Test Kitchen", "cuisine": "Indian",
        "category": category,
    }


MENU = [
    food(1, "Chicken 65", veg=False, spice=3, price=249, protein=32, description="Crispy spicy fried chicken"),
    food(2, "Paneer Tikka Masala", veg=True, spice=2, price=289, protein=24, description="Spicy paneer curry, creamy"),
    food(3, "Chicken Biryani", veg=False, spice=2, price=299, protein=36, description="Spicy chicken biryani rice"),
    food(4, "Greek Salad", veg=True, spice=0, price=249, calories=280, description="Light salad, mild"),
    food(5, "Chocolate Lava Cake", veg=True, spice=0, price=179, description="Warm chocolate dessert, sweet"),
    food(6, "Masala Dosa", veg=True, spice=1, price=139, description="Crispy dosa, mild"),
    food(7, "Grilled Chicken Protein Bowl", veg=False, spice=0, price=349, protein=45, description="Lean protein chicken rice"),
]


class FakeMenu:
    def __init__(self, foods=None, history=None):
        self.foods = {f["id"]: dict(f) for f in (foods or MENU)}
        self.history = history or {}

    def all_foods(self):
        return list(self.foods.values())

    def foods_by_ids(self, ids):
        return [self.foods[i] for i in ids if i in self.foods]

    def popular(self, limit):
        return sorted(self.foods.values(), key=lambda f: -f["rating"])[:limit]

    def user_history(self, user_id):
        return self.history.get(user_id, [])


@pytest.fixture
def menu():
    return FakeMenu(
        history={
            42: [
                {"id": 3, "name": "Chicken Biryani", "category": "Biryani", "is_veg": False, "times_ordered": 9},
                {"id": 1, "name": "Chicken 65", "category": "Starters", "is_veg": False, "times_ordered": 4},
            ],
            7: [{"id": 6, "name": "Masala Dosa", "category": "South Indian", "is_veg": True, "times_ordered": 5}],
        }
    )


@pytest.fixture
def make_recommender(menu, tmp_path):
    def factory(llm=None):
        recommender = Recommender(menu, MenuIndex(KeywordEmbeddings(), str(tmp_path / "index")), llm, k=5)
        recommender.refresh_index()
        return recommender

    return factory
