import os
import glob
from typing import List

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def _read_processed_texts(processed_dir: str) -> List[str]:
    os.makedirs(processed_dir, exist_ok=True)
    texts: List[str] = []
    for path in sorted(glob.glob(os.path.join(processed_dir, "*.txt"))):
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().strip()
                if content:
                    texts.append(content)
        except Exception:
            continue
    return texts


def build_vectorstore(processed_dir: str, persist_dir: str, model_name: str = DEFAULT_MODEL_NAME) -> None:
    os.makedirs(persist_dir, exist_ok=True)

    texts = _read_processed_texts(processed_dir)
    if not texts:
        return

    embeddings = HuggingFaceEmbeddings(model_name=model_name)

    documents: List[str] = []
    for txt in texts:
        chunk_size = 800
        overlap = 150
        start = 0
        while start < len(txt):
            end = min(start + chunk_size, len(txt))
            documents.append(txt[start:end])
            if end == len(txt):
                break
            start = end - overlap

    Chroma.from_texts(texts=documents, embedding=embeddings, persist_directory=persist_dir)
