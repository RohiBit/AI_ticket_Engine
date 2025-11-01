"""
Run the FastAPI server with static file serving for the UI.
"""
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from src.api import app
import os
from pathlib import Path



# Serve the existing UI from the project root so you can keep your
# `index.html`, `app.js`, and `style.css` where they are (no /static folder required).
ROOT_DIR = Path(__file__).parent
index_path = ROOT_DIR / "index.html"

if index_path.exists():
    # Mount project root at "/" and enable html mode so index.html is served.
    app.mount("/", StaticFiles(directory=str(ROOT_DIR), html=True), name="root_ui")
else:
    # If index.html is missing, fall back to previously created `static` dir if present.
    static_dir = ROOT_DIR / "static"
    if static_dir.exists():
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="root_ui")
    else:
        print("Warning: no index.html or static/ directory found — UI will not be served by the backend.")

# Try to auto-load FAISS index into the API's faiss_manager if index files exist.
try:
    from src import api as api_module
    FAISS_INDEX_PATH = ROOT_DIR / "data" / "faiss.index"
    FAISS_META_PATH = ROOT_DIR / "data" / "faiss_meta.json"
    if FAISS_INDEX_PATH.exists() and FAISS_META_PATH.exists():
        try:
            print(f"Loading FAISS index from {FAISS_INDEX_PATH}...")
            api_module.faiss_manager.load(str(FAISS_INDEX_PATH), str(FAISS_META_PATH))
            print("FAISS index loaded into API (faiss_manager).")
        except Exception as e:
            print(f"Failed to load FAISS index: {e}")
    else:
        print("FAISS index files not found; /recommend will be unavailable until index is loaded.")
except Exception as e:
    print(f"Could not auto-load FAISS index: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)