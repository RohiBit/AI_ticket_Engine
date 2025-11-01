"""Tests for ticket vectorization module."""
import json
import tempfile
from pathlib import Path

import numpy as np
import pytest

from src.vectorize import TicketVectorizer


@pytest.fixture
def sample_tickets():
    """Create a temporary JSONL file with sample tickets."""
    tickets = [
        {"id": "1", "text": "My laptop won't turn on"},
        {"id": "2", "text": "Need help resetting password"},
        {"id": "3", "text": "Application keeps crashing"},
    ]
    
    with tempfile.NamedTemporaryFile(mode="w", suffix=".jsonl", delete=False) as f:
        for ticket in tickets:
            f.write(json.dumps(ticket) + "\n")
    
    yield Path(f.name)
    Path(f.name).unlink()


def test_vectorizer_encode():
    """Test encoding single and batched texts."""
    vectorizer = TicketVectorizer()
    
    # Single text
    text = "Test ticket text"
    embedding = vectorizer.encode(text)
    assert isinstance(embedding, np.ndarray)
    assert embedding.ndim == 1  # Single vector
    
    # Multiple texts
    texts = ["Text 1", "Text 2", "Text 3"]
    embeddings = vectorizer.encode(texts)
    assert isinstance(embeddings, np.ndarray)
    assert embeddings.ndim == 2  # Batch of vectors
    assert len(embeddings) == len(texts)


def test_encode_tickets(sample_tickets):
    """Test encoding tickets from JSONL file."""
    vectorizer = TicketVectorizer()
    embeddings = vectorizer.encode_tickets(sample_tickets)
    
    assert len(embeddings) == 3  # Number of sample tickets
    assert all(isinstance(v, np.ndarray) for v in embeddings.values())
    assert all(v.ndim == 1 for v in embeddings.values())  # Each embedding is 1D
    
    # Check if embeddings are normalized
    for emb in embeddings.values():
        assert np.abs(np.linalg.norm(emb) - 1.0) < 1e-6