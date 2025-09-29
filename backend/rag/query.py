import os
from typing import List, Dict

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from backend.config import load_azure_config

DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class RagQueryEngine:
    def __init__(self, persist_dir: str, model_name: str = DEFAULT_MODEL_NAME) -> None:
        if not os.path.isdir(persist_dir):
            raise FileNotFoundError(f"Vectorstore not found at {persist_dir}")
        self.persist_dir = persist_dir
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.vs = Chroma(persist_directory=persist_dir, embedding_function=self.embeddings)
        self.azure = load_azure_config()

    def _call_llm(self, prompt: str) -> str:
        if not (self.azure.endpoint and self.azure.api_key and self.azure.deployment):
            return ""
        try:
            from openai import AzureOpenAI
            client = AzureOpenAI(
                api_key=self.azure.api_key,
                api_version=self.azure.api_version,
                azure_endpoint=self.azure.endpoint,
            )
            response = client.chat.completions.create(
                model=self.azure.deployment,
                messages=[
                    {"role": "system", "content": "You are an HR compliance assistant. Answer concisely and cite sources by [index]."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=600,
            )
            return response.choices[0].message.content or ""
        except Exception:
            return ""

    def answer_question(self, question: str, top_k: int = 4) -> Dict:
        docs = self.vs.similarity_search(question, k=top_k)
        sources: List[Dict] = []
        for idx, d in enumerate(docs):
            sources.append({
                "index": idx + 1,
                "snippet": d.page_content[:500],
                "metadata": d.metadata,
            })

        context_chunks = []
        for i, d in enumerate(docs):
            context_chunks.append(f"[{i+1}] {d.page_content}")
        context = "\n\n".join(context_chunks)

        prompt = (
            "Using the context below, answer the question. If unsure, say you don't know.\n\n"
            f"Question: {question}\n\nContext:\n{context}\n\n"
            "Return a concise answer with inline citations like [1], [2]."
        )

        synthesized = self._call_llm(prompt)
        if synthesized:
            answer = synthesized
        else:
            top_snippet = docs[0].page_content if docs else ""
            answer = top_snippet[:800] if top_snippet else "No relevant information found in the knowledge base."

        return {"answer": answer, "sources": sources}
