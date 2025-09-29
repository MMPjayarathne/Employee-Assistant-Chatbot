from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil

# Support running as `backend.main` (from project root) or `main` (from backend dir)
try:
    from backend.rag.ingest import build_vectorstore  # type: ignore
    from backend.rag.query import RagQueryEngine  # type: ignore
    from backend.config import load_azure_config  # type: ignore
except ImportError:  # pragma: no cover
    from rag.ingest import build_vectorstore
    from rag.query import RagQueryEngine
    from config import load_azure_config

# Resolve paths relative to this file, not the CWD
BACKEND_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, os.pardir))
DATA_RAW_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
DATA_PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")
VECTORSTORE_DIR = os.path.join(BACKEND_DIR, "rag", "vectorstore")

app = FastAPI(title="Employee Assistant AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files for viewing
os.makedirs(DATA_RAW_DIR, exist_ok=True)
app.mount("/files", StaticFiles(directory=DATA_RAW_DIR), name="files")


class ChatRequest(BaseModel):
    question: str
    language: Optional[str] = None
    top_k: int = 4


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# Lazy import to avoid circular import during startup
try:
    from backend.analytics import track_event, get_top_queries  # type: ignore
except ImportError:  # pragma: no cover
    from analytics import track_event, get_top_queries


@app.get("/analytics")
async def analytics(limit: int = 10) -> List[dict]:
    return get_top_queries(limit)


@app.get("/files")
async def list_files() -> List[dict]:
    items: List[dict] = []
    for name in sorted(os.listdir(DATA_RAW_DIR)):
        path = os.path.join(DATA_RAW_DIR, name)
        if os.path.isfile(path):
            items.append({
                "name": name,
                "size": os.path.getsize(path),
                "url": f"/files/{name}",
            })
    return items


@app.post("/ingest")
async def ingest(files: List[UploadFile] = File(default_factory=list)) -> dict:
    os.makedirs(DATA_RAW_DIR, exist_ok=True)

    saved_files: List[str] = []
    for f in files:
        target_path = os.path.join(DATA_RAW_DIR, f.filename)
        with open(target_path, "wb") as out_f:
            shutil.copyfileobj(f.file, out_f)
        saved_files.append(target_path)

    build_vectorstore(processed_dir=DATA_PROCESSED_DIR, persist_dir=VECTORSTORE_DIR)

    return {"saved": saved_files, "vectorstore": VECTORSTORE_DIR}


@app.post("/forms/explain")
async def explain_form(file: UploadFile = File(...)) -> dict:
    # extract text
    try:
        import pdfplumber
        import io
        content = await file.read()
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            text = "\n".join([(p.extract_text() or "") for p in pdf.pages])
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read PDF")

    azure = load_azure_config()
    explanation = ""
    if azure.endpoint and azure.api_key and azure.deployment:
        try:
            from openai import AzureOpenAI
            client = AzureOpenAI(
                api_key=azure.api_key,
                api_version=azure.api_version,
                azure_endpoint=azure.endpoint,
            )
            prompt = (
                "You are a forms assistant. Given the form text below, list each field and explain:\n"
                "- What it means\n- What acceptable values look like\n- Any HR/EPF/ETF compliance notes\n\n" 
                "Return a concise, numbered list.\n\nFORM TEXT:\n" + text
            )
            resp = client.chat.completions.create(
                model=azure.deployment,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=800,
            )
            explanation = resp.choices[0].message.content or ""
        except Exception:
            explanation = ""

    if not explanation:
        explanation = (text[:1200] + "...") if len(text) > 1200 else text

    return {"explanation": explanation}


_query_engine: Optional[RagQueryEngine] = None


def _get_query_engine() -> RagQueryEngine:
    global _query_engine
    if _query_engine is None:
        _query_engine = RagQueryEngine(persist_dir=VECTORSTORE_DIR)
    return _query_engine


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    engine = _get_query_engine()
    try:
        result = engine.answer_question(question=req.question, top_k=req.top_k)
    except FileNotFoundError:
        raise HTTPException(status_code=400, detail="Vectorstore not found. Ingest documents first.")

    track_event({
        "type": "chat",
        "question": req.question,
        "top_k": req.top_k,
    })

    return ChatResponse(answer=result["answer"], sources=result["sources"])
