"""
FAISS index manager for article vectors.

Usage:
  - Build an index from a JSONL of articles (each line: {"id":..., "title":..., "text":...})
  - Save/load FAISS index and metadata mapping
  - Search by query embedding

This is intentionally lightweight and synchronous to keep the example simple.
"""
from pathlib import Path
import json
from typing import Dict, List, Tuple, Optional

import numpy as np
try:
    import faiss
except Exception:
    faiss = None  # type: ignore

from src.vectorize import TicketVectorizer


class FaissIndexManager:
    def __init__(self, dim: Optional[int] = None):
        self.index = None
        self.id_to_meta: Dict[int, Dict] = {}
        self.next_id = 0
        self.dim = dim

    def build_from_jsonl(self, jsonl_path: str, model_name: str = "all-MiniLM-L6-v2") -> int:
        """Read articles from JSONL and build the FAISS index.

        Each JSON line should contain at least: id (str/int), title, text (body).
        Returns number of indexed items.
        """
        if faiss is None:
            raise RuntimeError("faiss is not installed or failed to import")

        vec = TicketVectorizer(model_name=model_name)

        metas = []
        texts = []
        raw_ids = []
        with open(jsonl_path, "r", encoding="utf-8") as fh:
            for line in fh:
                obj = json.loads(line)
                txt = obj.get("text") or obj.get("content") or obj.get("body") or obj.get("article") or ""
                if not txt:
                    continue
                metas.append({
                    "orig_id": obj.get("id") or obj.get("article_id") or obj.get("_id"),
                    "title": obj.get("title") or obj.get("headline") or "",
                    "snippet": (txt[:300] + "...") if len(txt) > 300 else txt,
                    "raw": obj,
                })
                texts.append(txt)
                raw_ids.append(metas[-1]["orig_id"])

        if not texts:
            return 0

        embeddings = vec.encode(texts, show_progress_bar=True)
        embeddings = np.array(embeddings).astype('float32')

        self.dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(self.dim)  # cosine if vectors are normalized
        # ensure normalized (our vectorizer normalizes by default)
        if not index.is_trained:
            pass
        index.add(embeddings)

        # store mapping
        self.index = index
        self.id_to_meta = {i: metas[i] for i in range(len(metas))}
        self.next_id = len(metas)
        return len(metas)

    def save(self, index_path: str, meta_path: str):
        if faiss is None:
            raise RuntimeError("faiss not available")
        if self.index is None:
            raise RuntimeError("index not built")
        Path(index_path).parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, index_path)
        with open(meta_path, "w", encoding="utf-8") as fh:
            json.dump(self.id_to_meta, fh, ensure_ascii=False, indent=2)

    def load(self, index_path: str, meta_path: str):
        if faiss is None:
            raise RuntimeError("faiss not available")
        self.index = faiss.read_index(index_path)
        with open(meta_path, "r", encoding="utf-8") as fh:
            self.id_to_meta = json.load(fh)
        self.next_id = max(int(k) for k in self.id_to_meta.keys()) + 1
        self.dim = self.index.d

    def search(self, query: str, top_k: int = 10, embedder: Optional[TicketVectorizer] = None) -> List[Tuple[Dict, float]]:
        """Return list of (meta, score) for top_k matches for the query text."""
        if self.index is None:
            return []
        if embedder is None:
            embedder = TicketVectorizer()
        q_emb = embedder.encode(query)
        q = np.array([q_emb]).astype('float32')
        # If embeddings were normalized, use inner product for cosine
        D, I = self.index.search(q, top_k)
        results = []
        for score, idx in zip(D[0].tolist(), I[0].tolist()):
            if idx < 0:
                continue
            meta = self.id_to_meta.get(str(idx)) or self.id_to_meta.get(idx)
            results.append((meta, float(score)))
        return results
