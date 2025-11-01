"""Build a FAISS index from a JSONL file of articles.

Each line in the input JSONL should be a JSON object with at least one text field
(`text`, `content`, `body`, or `article`) and an `id` or similar identifier.

Usage:
  python scripts\build_faiss.py --input data/articles.jsonl --index-out data/faiss.index --meta-out data/faiss_meta.json

This script uses the `FaissIndexManager` in `src/faiss_index.py`.
"""
import argparse
import sys
from pathlib import Path

# Ensure the project root is on sys.path so `from src...` imports work when running
# the script directly from PowerShell/Windows (ModuleNotFoundError otherwise).
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.faiss_index import FaissIndexManager


def main():
    parser = argparse.ArgumentParser(description="Build FAISS index from JSONL articles file")
    parser.add_argument("--input", required=True, help="Input JSONL file with articles")
    parser.add_argument("--index-out", default="data/faiss.index", help="Output path for FAISS index")
    parser.add_argument("--meta-out", default="data/faiss_meta.json", help="Output path for metadata JSON")
    parser.add_argument("--model", default="all-MiniLM-L6-v2", help="SentenceTransformers model to use for embeddings")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: input file not found: {input_path}")
        sys.exit(2)

    print(f"Building FAISS index from {input_path} using model {args.model}...")
    fim = FaissIndexManager()
    try:
        count = fim.build_from_jsonl(str(input_path), model_name=args.model)
    except Exception as e:
        print(f"Failed to build index: {e}")
        sys.exit(1)

    if count == 0:
        print("No articles indexed. Check the input file format and fields.")
        sys.exit(1)

    index_out = Path(args.index_out)
    meta_out = Path(args.meta_out)
    print(f"Indexed {count} articles. Saving index to {index_out} and metadata to {meta_out}...")
    try:
        fim.save(str(index_out), str(meta_out))
    except Exception as e:
        print(f"Failed to save index or metadata: {e}")
        sys.exit(1)

    print("FAISS index build complete.")


if __name__ == "__main__":
    main()
