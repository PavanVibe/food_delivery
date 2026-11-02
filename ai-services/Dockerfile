FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/models

WORKDIR /app

COPY requirements.txt .
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install -r requirements.txt

# Bake the embedding model into the image so startup needs no network
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY app ./app

RUN useradd --create-home appuser \
    && mkdir -p /app/indexes \
    && chown -R appuser /app /models
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
