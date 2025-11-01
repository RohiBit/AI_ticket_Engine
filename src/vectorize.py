"""
Ticket text vectorization using sentence-transformers.
"""
import json
from pathlib import Path
from typing import Dict, List, Optional, Union

import numpy as np
from sentence_transformers import SentenceTransformer


class TicketVectorizer:
    """Convert support ticket text into dense vector embeddings."""

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        device: Optional[str] = None,
    ):
        """Initialize the vectorizer with a sentence-transformer model.
        
        Args:
            model_name: Name of the sentence-transformers model to use
                (see https://www.sbert.net/docs/pretrained_models.html)
            device: Optional device to run on ('cpu' or 'cuda')
        """
        self.model = SentenceTransformer(model_name, device=device)
        
    def encode(
        self,
        texts: Union[str, List[str]],
        batch_size: int = 32,
        show_progress_bar: bool = False,
        normalize_embeddings: bool = True,
    ) -> np.ndarray:
        """Convert text or list of texts into embeddings.
        
        Args:
            texts: Single string or list of strings to encode
            batch_size: Batch size for encoding
            show_progress_bar: Whether to show progress during encoding
            normalize_embeddings: Whether to L2-normalize the embeddings
            
        Returns:
            Array of shape (N, D) containing the embeddings
        """
        return self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=show_progress_bar,
            normalize_embeddings=normalize_embeddings,
        )

    def encode_tickets(
        self,
        jsonl_path: Union[str, Path],
        batch_size: int = 32,
    ) -> Dict[str, np.ndarray]:
        """Read tickets from a JSONL file and convert to embeddings.
        
        Args:
            jsonl_path: Path to JSONL file containing tickets
                (expects 'id' and 'text' fields)
            batch_size: Batch size for encoding
            
        Returns:
            Dict mapping ticket IDs to their embeddings
        """
        texts = []
        ids = []
        
        with open(jsonl_path) as f:
            for line in f:
                ticket = json.loads(line)
                if "text" in ticket and ticket["text"]:
                    texts.append(ticket["text"])
                    ids.append(ticket.get("id", ""))
                    
        embeddings = self.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
        )
        return dict(zip(ids, embeddings))


def main():
    """CLI for encoding tickets from JSONL file."""
    import argparse
    from pathlib import Path
    
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Input JSONL file containing tickets",
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output .npy file to save embeddings",
    )
    parser.add_argument(
        "--model",
        default="all-MiniLM-L6-v2",
        help="Name of sentence-transformers model to use",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size for encoding",
    )
    args = parser.parse_args()
    
    vectorizer = TicketVectorizer(model_name=args.model)
    embeddings = vectorizer.encode_tickets(
        args.input,
        batch_size=args.batch_size,
    )
    
    # Save as .npy file
    np.save(args.output, embeddings)
    print(f"Saved {len(embeddings)} embeddings to {args.output}")


if __name__ == "__main__":
    main()