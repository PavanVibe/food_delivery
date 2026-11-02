from app.rag.documents import describe, fingerprint, to_document
from tests.conftest import MENU


def test_numeric_attributes_become_searchable_words():
    text = describe(MENU[6])
    assert "high protein" in text.lower()
    assert "Non-vegetarian" in text


def test_light_and_budget_traits():
    assert "light, low calorie" in describe(MENU[3]).lower()
    assert "budget friendly" in describe(MENU[5]).lower()


def test_document_metadata_supports_filtering():
    doc = to_document(MENU[1])
    assert doc.metadata == {"food_id": 2, "price": 289.0, "is_veg": True, "restaurant_id": 1}


def test_fingerprint_changes_when_menu_changes():
    changed = [dict(MENU[0], price=999)] + MENU[1:]
    assert fingerprint(MENU) == fingerprint(list(reversed(MENU)))
    assert fingerprint(MENU) != fingerprint(changed)
