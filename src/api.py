"""
FastAPI endpoint for ticket analysis and priority classification.
"""
from typing import Dict, Optional

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel

from src.priority import TicketPriorityClassifier
from src.vectorize import TicketVectorizer
from fastapi.middleware.cors import CORSMiddleware
from src.faiss_index import FaissIndexManager


class TicketAnalysis(BaseModel):
    """Response model for ticket analysis."""
    
    ticket_text: str
    priority: str
    confidence: float
    priority_scores: Dict[str, float]
    similar_tickets: Optional[list] = None


app = FastAPI(
    title="Support Ticket Analyzer",
    description="API for ticket priority classification and similarity analysis",
)

# Development CORS: allow requests from the UI even when opened from file://
# or other local origins. For production, restrict this to your frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
priority_classifier = TicketPriorityClassifier()
vectorizer = TicketVectorizer()
# FAISS manager (index can be built offline and saved/loaded)
faiss_manager = FaissIndexManager()


@app.post("/analyze", response_model=TicketAnalysis)
async def analyze_ticket(
    ticket: str = Form(...),
    ticket_file: Optional[UploadFile] = File(None),
):
    """Analyze a support ticket for priority and similar tickets.
    
    Args:
        ticket: The ticket text (if submitting directly)
        ticket_file: Optional file upload containing ticket text
        
    Returns:
        TicketAnalysis object with priority classification and similar tickets
    """
    # Get ticket text from either form field or uploaded file
    if ticket_file:
        ticket_text = (await ticket_file.read()).decode("utf-8")
    else:
        ticket_text = ticket
        
    # Classify priority (protect against model/runtime errors)
    try:
        priority, confidence = priority_classifier.get_priority(ticket_text)
        priority_scores = priority_classifier.classify(ticket_text)
    except Exception as e:
        # Log and return a 500-friendly message via HTTPException
        # Avoid exposing internal stack traces to the client
        import logging
        logging.exception("Priority classification failed")
        from fastapi import HTTPException

        raise HTTPException(status_code=500, detail=f"Priority classification error: {e}")
    
    # Create response
    analysis = TicketAnalysis(
        ticket_text=ticket_text,
        priority=priority,
        confidence=confidence,
        priority_scores=priority_scores,
    )
    
    return analysis


@app.post("/recommend")
async def recommend_articles(ticket: str = Form(...), top_k: int = 10):
    """Return top-K recommended articles for a ticket text.

    This endpoint expects a FAISS index to be built and loaded by the server
    beforehand via FaissIndexManager.load(). If not available, returns an
    empty list with a helpful message.
    """
    if faiss_manager.index is None:
        return {"ok": False, "error": "FAISS index not loaded. Build/load an index first."}

    # Use vectorizer to encode and perform search
    try:
        hits = faiss_manager.search(ticket, top_k=top_k, embedder=vectorizer)
        articles = []
        for meta, score in hits:
            articles.append({
                "title": meta.get("title"),
                "snippet": meta.get("snippet"),
                "score": score,
                "orig_id": meta.get("orig_id"),
            })
        return {"ok": True, "results": articles}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/model-status")
async def model_status():
    """Report whether priority model pipeline has been instantiated.

    This endpoint helps debugging whether the heavy transformer pipeline
    is loaded or the server is using the lightweight fallback.
    """
    try:
        model_loaded = getattr(priority_classifier, "_classifier", None) is not None
    except Exception:
        model_loaded = False
    return {"priority_model_loaded": model_loaded}