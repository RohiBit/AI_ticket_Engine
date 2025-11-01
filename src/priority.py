"""
Priority classification for support tickets using transformers.
"""
from typing import Dict, List, Tuple, Optional

try:
    from transformers import pipeline
except Exception:
    pipeline = None  # type: ignore


class TicketPriorityClassifier:
    """Classify ticket priority as High/Medium/Low.

    This class attempts to use a transformers zero-shot classifier lazily.
    If transformers or the model can't be loaded, it falls back to a
    simple keyword-based heuristic so the backend stays responsive.
    """

    def __init__(
        self,
        model_name: str = "facebook/bart-large-mnli",
        labels: Optional[List[str]] = None,
    ):
        self.model_name = model_name
        self.labels = labels or ["low", "medium", "high"]
        self._classifier = None

    def _ensure_pipeline(self):
        if self._classifier is not None:
            return
        if pipeline is None:
            # transformers not available
            self._classifier = None
            return
        try:
            # create zero-shot-classification pipeline lazily
            self._classifier = pipeline(
                "zero-shot-classification",
                model=self.model_name,
            )
        except Exception as e:
            # If model download or instantiation fails, leave None to use heuristic
            print(f"Warning: failed to load priority model: {e}")
            self._classifier = None

    def classify(self, text: str) -> Dict[str, float]:
        """Return a mapping priority -> score (0..1).

        Tries to use the zero-shot pipeline; if unavailable falls back to a
        lightweight keyword heuristic.
        """
        self._ensure_pipeline()

        # Use model if available
        if self._classifier:
            try:
                res = self._classifier(text, candidate_labels=self.labels, multi_label=False)
                scores = res.get("scores")
                labels = res.get("labels")
                # Map returned labels/scores into our label order
                mapping = {label: 0.0 for label in self.labels}
                if scores and labels:
                    for lbl, sc in zip(labels, scores):
                        mapping[str(lbl)] = float(sc)
                return mapping
            except Exception as e:
                print(f"Priority model inference failed: {e}")

        # Fallback heuristic
        txt = (text or "").lower()
        score_map = {"low": 0.0, "medium": 0.0, "high": 0.0}

        # High-priority keywords
        high_keywords = ["urgent", "immediately", "asap", "down", "critical", "can't", "cannot", "fail", "failure", "security"]
        medium_keywords = ["slow", "error", "issue", "problem", "bug", "help needed"]
        low_keywords = ["question", "how to", "how do i", "feature", "request", "suggestion"]

        for kw in high_keywords:
            if kw in txt:
                score_map["high"] += 1.0
        for kw in medium_keywords:
            if kw in txt:
                score_map["medium"] += 1.0
        for kw in low_keywords:
            if kw in txt:
                score_map["low"] += 1.0

        # Base score for length / severity
        length = len(txt.split())
        if length > 100:
            score_map["medium"] += 0.5
        if length > 300:
            score_map["high"] += 0.5

        # Normalize to probabilities
        total = sum(score_map.values())
        if total == 0:
            # default to medium
            return {"low": 0.1, "medium": 0.8, "high": 0.1}
        return {k: v / total for k, v in score_map.items()}

    def get_priority(self, text: str) -> Tuple[str, float]:
        probs = self.classify(text)
        priority = max(probs.items(), key=lambda x: x[1])
        return priority[0], priority[1]