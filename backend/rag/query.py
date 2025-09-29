import os
from typing import List, Dict

from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma

DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class RagQueryEngine:
    def __init__(self, persist_dir: str, model_name: str = DEFAULT_MODEL_NAME) -> None:
        if not os.path.isdir(persist_dir):
            raise FileNotFoundError(f"Vectorstore not found at {persist_dir}")
        self.persist_dir = persist_dir
        self.embeddings = SentenceTransformerEmbeddings(model_name=model_name)
        self.vs = Chroma(persist_directory=persist_dir, embedding_function=self.embeddings)

    def answer_question(self, question: str, top_k: int = 4) -> Dict:
        docs = self.vs.similarity_search(question, k=top_k)
        sources: List[Dict] = []
        for d in docs:
            sources.append({
                "snippet": d.page_content[:300],
                "metadata": d.metadata,
            })

        top_snippet = docs[0].page_content if docs else ""
        answer = top_snippet[:800] if top_snippet else "No relevant information found in the knowledge base."

        return {"answer": answer, "sources": sources}
