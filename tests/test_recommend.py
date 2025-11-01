from fastapi.testclient import TestClient
from src import api

client = TestClient(api.app)


def test_recommend_no_index():
    # Ensure FAISS index is not loaded
    api.faiss_manager.index = None
    resp = client.post("/recommend", data={"ticket": "Hello", "top_k": "5"})
    assert resp.status_code == 200
    j = resp.json()
    assert j.get("ok") is False
    assert "not loaded" in j.get("error", "").lower()


def test_recommend_with_mock_index():
    # Replace the faiss_manager with a lightweight mock that simulates search
    class MockFaiss:
        def __init__(self):
            self.index = True

        def search(self, ticket, top_k=5, embedder=None):
            # Return a list of (meta, score) pairs like the real implementation
            return [
                ({"title": "KB Article 1", "snippet": "Answer content 1", "orig_id": "a1"}, 0.95),
                ({"title": "KB Article 2", "snippet": "Answer content 2", "orig_id": "a2"}, 0.87),
            ]

    api.faiss_manager = MockFaiss()

    resp = client.post("/recommend", data={"ticket": "I see an error on login", "top_k": "2"})
    assert resp.status_code == 200
    j = resp.json()
    assert j.get("ok") is True
    results = j.get("results")
    assert isinstance(results, list)
    assert len(results) == 2
    assert results[0]["title"] == "KB Article 1" or results[0]["title"] == "KB Article 1"
