import hashlib
import json

from langchain_core.documents import Document

SPICE = {0: "not spicy, mild", 1: "mildly spiced", 2: "spicy", 3: "very spicy, fiery hot"}


def traits(food: dict) -> list[str]:
    """Plain-language descriptors so numeric attributes are searchable by meaning."""
    found = []
    if (food.get("protein_g") or 0) >= 25:
        found.append("high protein")
    calories = food.get("calories")
    if calories is not None and calories <= 350:
        found.append("light, low calorie")
    elif calories is not None and calories >= 700:
        found.append("hearty and filling")
    if food["price"] <= 150:
        found.append("budget friendly, cheap")
    elif food["price"] >= 350:
        found.append("premium")
    if food.get("rating", 0) >= 4.6:
        found.append("top rated")
    return found


def describe(food: dict) -> str:
    diet = "Vegetarian" if food["is_veg"] else "Non-vegetarian"
    lines = [
        f"{food['name']}: {food.get('category') or 'dish'} from {food['restaurant_name']} ({food.get('cuisine', '')} cuisine).",
        food.get("description") or "",
        f"{diet}. {SPICE.get(food.get('spice_level', 0), '')}.",
    ]
    if extra := traits(food):
        lines.append(", ".join(extra).capitalize() + ".")
    if food.get("calories") is not None:
        lines.append(f"About {food['calories']} kcal and {food.get('protein_g') or 0} g protein.")
    if food.get("tags"):
        lines.append("Tags: " + ", ".join(food["tags"]) + ".")
    lines.append(f"Price: Rs {food['price']:.0f}. Rating {food.get('rating', 0)}/5.")
    return "\n".join(line for line in lines if line)


def to_document(food: dict) -> Document:
    return Document(
        page_content=describe(food),
        metadata={
            "food_id": food["id"],
            "price": float(food["price"]),
            "is_veg": bool(food["is_veg"]),
            "restaurant_id": food["restaurant_id"],
        },
    )


def fingerprint(foods: list[dict]) -> str:
    """Stable hash of the indexed menu; a mismatch means the saved index is stale."""
    payload = json.dumps([describe(food) for food in sorted(foods, key=lambda f: f["id"])], sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()
