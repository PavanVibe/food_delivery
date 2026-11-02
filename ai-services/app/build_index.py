"""Rebuilds the FAISS menu index from PostgreSQL: python -m app.build_index"""

from app.main import build_default_recommender

if __name__ == "__main__":
    result = build_default_recommender().refresh_index(force=True)
    print(f"Index {result['status']}: {result['documents']} menu items embedded")
