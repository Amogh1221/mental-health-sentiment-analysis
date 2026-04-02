"""
backend/main.py

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import os
import re
import pickle
import time
from contextlib import asynccontextmanager
from typing import Optional

import nltk
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# ── NLTK setup ────────────────────────────────────────────────────────────────
for _pkg, _path in [
    ("stopwords", "corpora/stopwords"),
    ("punkt_tab", "tokenizers/punkt_tab"),
    ("wordnet",   "corpora/wordnet"),
]:
    try:
        nltk.data.find(_path)
    except LookupError:
        nltk.download(_pkg, quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

_STOP_WORDS = nltk.corpus.stopwords.words("english")
_LEMMATIZER = WordNetLemmatizer()


# ── cleaning() — exact copy from notebook cell 12 ────────────────────────────
def cleaning(text: str) -> str:
    preprocessed = str(text).lower()
    preprocessed = re.sub(r"[^a-zA-Z\s]", "", preprocessed)
    words = nltk.word_tokenize(preprocessed)
    filtered_words = [word for word in words if word not in _STOP_WORDS]
    filtered_words = [_LEMMATIZER.lemmatize(word) for word in filtered_words]
    return " ".join(filtered_words)


# ── Artifact loading ──────────────────────────────────────────────────────────
ARTIFACT_DIR = os.getenv("ARTIFACT_DIR", "./artifacts")

MODEL      = None
VECTORIZER = None
ENCODER    = None


def _load(fname: str):
    path = os.path.join(ARTIFACT_DIR, fname)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Artifact not found: {path}\n"
            f"Unzip model.zip into {ARTIFACT_DIR}/ first."
        )
    with open(path, "rb") as f:
        return pickle.load(f)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global MODEL, VECTORIZER, ENCODER
    print(f"Loading artifacts from: {ARTIFACT_DIR}")
    MODEL      = _load("model.pkl")
    VECTORIZER = _load("tfidf.pkl")
    ENCODER    = _load("encoder.pkl")
    print(f"Model loaded ✓  |  {type(MODEL).__name__}  |  Classes: {list(ENCODER.classes_)}")
    yield
    print("Shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Mental Health Sentiment Analysis API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=5000)

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class ClassProbability(BaseModel):
    label: str
    probability: float


class PredictResponse(BaseModel):
    label: str
    confidence: float
    probabilities: list[ClassProbability]
    cleaned_input: str
    latency_ms: float


class BatchPredictRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=50)


class BatchPredictResponse(BaseModel):
    results: list[PredictResponse]
    total_latency_ms: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_type: Optional[str] = None
    classes: Optional[list[str]] = None


# ── Core inference ────────────────────────────────────────────────────────────
def _infer(text: str) -> PredictResponse:
    t0 = time.perf_counter()

    cleaned = cleaning(text)
    if not cleaned.strip():
        raise HTTPException(status_code=422, detail="Text is empty after preprocessing.")

    vec        = VECTORIZER.transform([cleaned])
    pred_idx   = MODEL.predict(vec)[0]
    label      = ENCODER.inverse_transform([pred_idx])[0]
    proba      = MODEL.predict_proba(vec)[0]
    confidence = float(proba[pred_idx])

    probs_sorted = [
        ClassProbability(label=cls, probability=round(float(p), 4))
        for cls, p in sorted(
            zip(ENCODER.classes_, proba),
            key=lambda x: x[1],
            reverse=True,
        )
    ]

    return PredictResponse(
        label         = label,
        confidence    = round(confidence, 4),
        probabilities = probs_sorted,
        cleaned_input = cleaned,
        latency_ms    = round((time.perf_counter() - t0) * 1000, 2),
    )


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/", response_model=HealthResponse)
def health():
    return HealthResponse(
        status       = "ok",
        model_loaded = MODEL is not None,
        model_type   = type(MODEL).__name__ if MODEL else None,
        classes      = list(ENCODER.classes_) if ENCODER else None,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    return _infer(req.text)


@app.post("/predict/batch", response_model=BatchPredictResponse)
def predict_batch(req: BatchPredictRequest):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    t0 = time.perf_counter()
    results = [_infer(t) for t in req.texts]
    return BatchPredictResponse(
        results          = results,
        total_latency_ms = round((time.perf_counter() - t0) * 1000, 2),
    )


@app.get("/classes")
def get_classes():
    if ENCODER is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    return {"classes": list(ENCODER.classes_)}
