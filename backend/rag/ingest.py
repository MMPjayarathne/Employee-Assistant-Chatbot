import os
import glob
from typing import List, Tuple

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def _read_processed_texts_with_names(processed_dir: str) -> List[Tuple[str, str]]:
    os.makedirs(processed_dir, exist_ok=True)
    items: List[Tuple[str, str]] = []
    for path in sorted(glob.glob(os.path.join(processed_dir, "*.txt"))):
        base = os.path.splitext(os.path.basename(path))[0]
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().strip()
                if content:
                    items.append((base, content))
        except Exception:
            continue
    return items


def build_vectorstore(processed_dir: str, persist_dir: str, model_name: str = DEFAULT_MODEL_NAME) -> None:
    os.makedirs(persist_dir, exist_ok=True)

    named_texts = _read_processed_texts_with_names(processed_dir)
    if not named_texts:
        return

    embeddings = HuggingFaceEmbeddings(model_name=model_name)

    documents: List[str] = []
    metadatas: List[dict] = []

    for base, txt in named_texts:
        chunk_size = 800
        overlap = 150
        start = 0
        while start < len(txt):
            end = min(start + chunk_size, len(txt))
            documents.append(txt[start:end])
            metadatas.append({
                "source_name": base,
                "raw_url": f"/files/{base}.pdf",
            })
            if end == len(txt):
                break
            start = end - overlap

    Chroma.from_texts(texts=documents, embedding=embeddings, metadatas=metadatas, persist_directory=persist_dir)
