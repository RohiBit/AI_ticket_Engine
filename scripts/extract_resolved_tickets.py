#!/usr/bin/env python3
"""
Load the Hugging Face 'Tobi-Bueck/customer-support-tickets' dataset,
inspect available fields, and extract tickets that look "resolved" into
JSONL and CSV files for downstream processing.

Usage:
  python scripts/extract_resolved_tickets.py --output data --max-sample 100

Before running: pip install -r requirements.txt and (if needed) run
`huggingface-cli login` to access private or gated datasets.
"""
import argparse
import csv
import json
import os
from collections import Counter
from typing import Any, Dict, List

try:
    from datasets import load_dataset
except Exception as e:
    raise SystemExit(
        "datasets library not found. Install requirements with: pip install -r requirements.txt"
    )


POSSIBLE_STATUS_FIELDS = [
    "status",
    "state",
    "resolution",
    "resolved",
    "is_resolved",
    "outcome",
    "label",
]

POSSIBLE_TEXT_FIELDS = [
    "ticket",
    "text",
    "message",
    "question",
    "complaint",
    "description",
    "body",
]

POSSIBLE_ARTICLE_FIELDS = [
    "article",
    "kb_article",
    "linked_article",
    "support_article",
    "resolution_article",
]


def guess_text_field(example: Dict[str, Any]) -> str:
    for f in POSSIBLE_TEXT_FIELDS:
        if f in example and example.get(f):
            return str(example.get(f))
    # fallback: use first string-like field
    for k, v in example.items():
        if isinstance(v, str) and len(v) > 20:
            return v
    return ""


def guess_resolution_field(example: Dict[str, Any]) -> str:
    for f in POSSIBLE_ARTICLE_FIELDS + ["resolution", "solution", "answer"]:
        if f in example and example.get(f):
            return str(example.get(f))
    return ""


def check_resolved(example: Dict[str, Any]) -> bool:
    # If there's an explicit status field
    for s in ("status", "state", "outcome", "label"):
        if s in example and example.get(s) is not None:
            val = str(example.get(s)).lower()
            if any(k in val for k in ("resolved", "closed", "solved", "done", "completed")):
                return True

    # If there is a non-empty resolution/solution text
    for f in ("resolution", "solution", "answer", "final_response"):
        if f in example and example.get(f):
            txt = str(example.get(f)).strip()
            if len(txt) > 10:
                return True

    # If linked article exists
    for f in POSSIBLE_ARTICLE_FIELDS:
        if f in example and example.get(f):
            return True

    # As a last resort: if example has 'tags' or 'labels' containing 'resolved'
    if "tags" in example and example.get("tags"):
        tags = example.get("tags")
        try:
            joined = " ".join(tags).lower() if isinstance(tags, (list, tuple)) else str(tags).lower()
            if "resolved" in joined or "solution" in joined:
                return True
        except Exception:
            pass

    return False


def write_jsonl(path: str, items: List[Dict[str, Any]]):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        for it in items:
            fh.write(json.dumps(it, ensure_ascii=False) + "\n")


def write_csv(path: str, items: List[Dict[str, Any]], fieldnames: List[str]):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for it in items:
            row = {k: it.get(k, "") for k in fieldnames}
            writer.writerow(row)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default="Tobi-Bueck/customer-support-tickets", help="Hugging Face dataset id")
    parser.add_argument("--output", default="data", help="Output directory")
    parser.add_argument("--max-sample", type=int, default=0, help="If >0, limit total inspected examples (for quick dry-runs)")
    args = parser.parse_args()

    print(f"Loading dataset {args.dataset} (this may download files the first time)...")
    ds = load_dataset(args.dataset)

    # Gather examples across splits
    examples = []
    total_examples = 0
    for split in ds.keys():
        print(f" - split: {split} -> {len(ds[split])} examples")
        if args.max_sample and total_examples >= args.max_sample:
            break
        for ex in ds[split]:
            ex_copy = dict(ex)
            ex_copy["_split"] = split
            examples.append(ex_copy)
            total_examples += 1
            if args.max_sample and total_examples >= args.max_sample:
                break

    print(f"Inspected {len(examples)} examples")

    # Print simple diagnostics for candidate fields
    present = Counter()
    counters = {}
    for f in POSSIBLE_STATUS_FIELDS + POSSIBLE_TEXT_FIELDS + POSSIBLE_ARTICLE_FIELDS:
        values = []
        for ex in examples:
            if f in ex and ex.get(f) is not None:
                values.append(str(ex.get(f)))
        if values:
            present[f] = len(values)
            if len(values) < 10000:
                counters[f] = Counter(values)

    if present:
        print("Field presence summary (field: count)")
        for k, v in present.items():
            print(f"  {k}: {v}")
    else:
        print("No candidate fields detected in the sampled examples. The dataset may use different column names.")

    # Filter resolved tickets
    resolved = []
    for ex in examples:
        if check_resolved(ex):
            rec = {
                "_split": ex.get("_split"),
                "id": ex.get("id") or ex.get("ticket_id") or ex.get("_id") or "",
                "text": guess_text_field(ex),
                "resolution": guess_resolution_field(ex),
                "raw": ex,
            }
            resolved.append(rec)

    print(f"Found {len(resolved)} resolved tickets (based on heuristics)")

    out_jsonl = os.path.join(args.output, "resolved_tickets.jsonl")
    out_csv = os.path.join(args.output, "resolved_tickets.csv")

    # Save JSONL (with full raw payload) and CSV with id/text/resolution
    write_jsonl(out_jsonl, resolved)
    csv_fields = ["id", "_split", "text", "resolution"]
    write_csv(out_csv, resolved, csv_fields)

    print(f"Wrote {len(resolved)} records to:\n  {out_jsonl}\n  {out_csv}")
    print("Next: review the output files. If the dataset uses different column names, re-run with --max-sample N to inspect and adjust heuristics.")


if __name__ == "__main__":
    main()
