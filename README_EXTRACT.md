# Extract resolved tickets

This project includes a helper script to extract "resolved" tickets from the
Hugging Face dataset `Tobi-Bueck/customer-support-tickets` and write them to
JSONL and CSV files.

Files added
- `scripts/extract_resolved_tickets.py` - loads dataset, inspects fields, and
  heuristically identifies resolved tickets. Produces `data/resolved_tickets.jsonl`
  and `data/resolved_tickets.csv`.
- `requirements.txt` - Python dependencies to install.

Quickstart (PowerShell on Windows)

1. Create/activate a Python environment (recommended):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. (If the dataset requires authentication) Log in to Hugging Face:

```powershell
huggingface-cli login
```

4. Run the extractor (dry-run, inspect 200 examples):

```powershell
python .\scripts\extract_resolved_tickets.py --max-sample 200 --output data
```

5. For a full run, omit `--max-sample` or set a high number:

```powershell
python .\scripts\extract_resolved_tickets.py --output data
```

Output
- `data/resolved_tickets.jsonl` - each line is a JSON object with the full
  raw example under `raw` plus `text`, `resolution` and `_split` fields.
- `data/resolved_tickets.csv` - a CSV with columns: `id`, `_split`, `text`,
  `resolution`.

Notes
- The script uses heuristics to detect resolved tickets (fields like `status`,
  `resolution`, linked articles, or tags). If the dataset uses other column
  names, run with `--max-sample` to inspect a small sample and adapt the
  heuristics in `scripts/extract_resolved_tickets.py`.

Next steps
- Use the extracted resolved ticket—article pairs as training data for the
  recommendation pipeline (embeddings + vector DB + re-ranker).
