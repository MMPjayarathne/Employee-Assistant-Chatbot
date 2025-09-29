# Employee Assistant AI

## Prerequisites
- Python 3.10+
- Node.js 18+

## Setup

### 1) Prepare data
- Put your PDFs in `Data Sources/`.
- Convert PDFs to text:
```bash
python scripts/convert_docs.py
```
- Text files will appear in `data/processed/`.

### 2) Backend (FastAPI)
```bash
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Endpoints:
- GET `/health`
- POST `/ingest` (multipart file upload)
- POST `/chat` ({ question })
- GET `/analytics`
- GET `/files` (list) and `/files/*` (serve)
- POST `/forms/explain` (upload a PDF form, returns explanation)

### 3) Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`

Set `NEXT_PUBLIC_API_BASE` env to point to backend if not default.

## Azure OpenAI (Microsoft LLM)
Set environment variables for synthesis:
- `AZURE_OPENAI_ENDPOINT` = e.g. `https://YOUR-RESOURCE.openai.azure.com/`
- `AZURE_OPENAI_KEY` = your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT` = your chat model deployment name (e.g., `gpt-4o-mini`, `gpt-4o`, etc.)
- `AZURE_OPENAI_API_VERSION` = e.g., `2024-02-15-preview`

If unset, the app falls back to extractive answers.

## Features
- RAG search (Chroma + Sentence-Transformers) with Azure OpenAI synthesis
- Chat UI with citations, voice input (Web Speech API), dark/light theme
- Upload docs, rebuild vector store, view existing docs with thumbnails
- Forms assistant: upload a PDF to get a field-by-field explanation
- Analytics of top questions

## Notes
- Add Docker and CI as needed.
- Consider authentication before production use.
