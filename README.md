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

### 3) Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`

Set `NEXT_PUBLIC_API_BASE` env to point to backend if not default.

## Notes
- The current RAG uses `sentence-transformers/all-MiniLM-L6-v2` + Chroma.
- Add your LLM of choice for better synthesis.
- For deployment, add Dockerfiles and a docker-compose file as needed.
