# Employee Assistant Chatbot — System Overview

## What it is
- An internal RAG-powered assistant that answers HR/EPF/ETF/tax questions using your documents.
- Tech stack:
  - Backend: FastAPI + Chroma + HuggingFace embeddings + Azure OpenAI (optional synthesis)
  - Frontend: Next.js (React) + Tailwind (light/dark) + Voice input (Web Speech API)

---

## Architecture

- Data layer
  - `data/raw/`: uploaded source files (PDFs, etc.), also served statically at `/files/*`
  - `data/processed/`: extracted text files (generated via `scripts/convert_docs.py`)
  - `backend/rag/vectorstore/`: persisted Chroma vector database (embeddings)

- Backend (`backend/`)
  - `main.py`: FastAPI app and endpoints
  - `rag/ingest.py`: builds vector store from processed text (embeddings + Chroma)
  - `rag/query.py`: retrieval + optional Azure LLM synthesis
  - `analytics.py`: very simple JSONL event tracking and top-query stats
  - `config.py`: loads Azure env vars (supports `.env` at project root)

- Frontend (`frontend/`)
  - Pages:
    - `pages/index.tsx`: Chat (message bubbles, citations, voice)
    - `pages/upload.tsx`: Drag-drop upload + existing-docs grid with thumbnail and view
    - `pages/dashboard.tsx`: Top queries
  - Components:
    - `components/Navbar.tsx`: nav + light/dark theme toggle
    - `components/ThemeProvider.tsx`: persists theme, toggles `dark` class
    - `components/VoiceControls.tsx`: microphone (speech-to-text) + basic TTS
  - Styling: Tailwind (dark mode via `dark` class)

---

## Data Flow

1) Ingestion
- Upload PDFs on Upload page or via POST `/ingest`.
- PDF → text via `scripts/convert_docs.py` into `data/processed/`.
- `rag/ingest.py` reads `data/processed/*.txt`, chunks and embeds, persists to Chroma in `backend/rag/vectorstore/`.

2) Retrieval and Answering
- Chat page calls POST `/chat` with a question.
- `rag/query.py`:
  - Similarity search over Chroma for top‑k passages.
  - Builds a context block with indexed snippets.
  - If Azure env vars set, sends a prompt to Azure OpenAI chat model to synthesize an answer with inline citations like [1], [2].
  - Else, falls back to extractive top snippet.
- Returns `{ answer, sources[] }`. UI shows citations indexes under assistant messages.

3) Viewing Docs
- Backend serves `data/raw` statically at `/files/*`.
- Upload page shows a grid of existing documents (thumbnail-style cards) with an “eye” button to open.

4) Analytics
- Basic event tracking for chats (`data/analytics.jsonl`), visible on the Dashboard via GET `/analytics`.

---

## Backend API

- GET `/health`: service status
- POST `/ingest`: multipart file upload; saves to `data/raw/`, rebuilds vectorstore from `data/processed/`
- POST `/chat`:
  - Body: `{ question: string, top_k?: number }`
  - Response: `{ answer: string, sources: [{ index, snippet, metadata? }] }`
- GET `/files`: list of `{ name, size, url }` from `data/raw/`
- GET `/files/*`: static file serving from `data/raw/`
- GET `/analytics`: top queries (basic counts)
- POST `/forms/explain`: upload a form (PDF) and get field-by-field explanations (Azure LLM if configured; otherwise extracted text fallback)

---

## Retrieval-Augmented Generation (RAG)

- Embeddings: HuggingFace `all-MiniLM-L6-v2` (`langchain_huggingface.HuggingFaceEmbeddings`)
- Vector DB: Chroma, persisted to `backend/rag/vectorstore/`
- Chunking: ~800 chars, 150 overlap
- Synthesis (optional): Azure OpenAI Chat Completions
  - Prompt includes concatenated context labeled `[1]`, `[2]`, …
  - Answer cites sources inline, e.g., “... [1] [3]”

---

## Azure OpenAI (Microsoft LLM)

- Configure via `.env` (project root) or OS env vars:
  - `AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/`
  - `AZURE_OPENAI_KEY=...`
  - `AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini` (or `gpt-4o`)
  - `AZURE_OPENAI_API_VERSION=2024-02-15-preview`
- Base model recommended for RAG; fine‑tuning rarely needed.
- Code paths:
  - `backend/config.py` loads env
  - `backend/rag/query.py` uses Azure when env present; else extractive fallback

---

## Frontend UX

- Chat (`frontend/pages/index.tsx`)
  - Bubbles, auto‑scroll, typing indicator
  - Citations display as `[1] [2]`
  - Voice input (mic) via Web Speech API; TTS test button
  - Light/dark theme toggle in navbar

- Upload (`frontend/pages/upload.tsx`)
  - Drag and drop + multi‑select
  - After upload, vectorstore rebuilds
  - Existing documents grid: thumbnail-style cards with eye icon to open

- Dashboard (`frontend/pages/dashboard.tsx`)
  - Top queries list (auto-refresh)

---

## Running Locally

- Prepare data
  - Place PDFs in `Data Sources/`
  - Extract text:
    - PowerShell: `python scripts\convert_docs.py`
- Backend
  - `python -m venv .venv`
  - `.\\.venv\\Scripts\\Activate.ps1`
  - `pip install -r backend\\requirements.txt`
  - Optional: create `.env` with Azure vars
  - `uvicorn backend.main:app --port 8000 --reload`
- Frontend
  - `cd frontend && npm install && npm run dev`
  - Open `http://localhost:3000`
  - Ensure `NEXT_PUBLIC_API_BASE` if backend not on `http://localhost:8000`

---

## Security & Deployment

- Add authentication (SSO/Cognito/AAD) before production.
- Containerize (Docker) and orchestrate (Compose/ECS/Kubernetes).
- Store docs in object storage (S3/Azure Blob) if needed.
- Add HTTPS, CORS restrictions, secret management.
- Consider better analytics, per‑tenant vector stores, and role‑based visibility.

---

## Extensibility

- Swap/augment LLMs via `backend/rag/query.py`.
- Add multilingual support (detect + translate).
- Enhance forms assistant for structured extraction.
- Add streaming responses (SSE) for chat if desired.
