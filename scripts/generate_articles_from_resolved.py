"""Generate a simple articles.jsonl from data/resolved_tickets.jsonl.

This script creates `data/articles.jsonl` where each line is a JSON object:
  {"id": ..., "title": ..., "text": ...}

Title is derived from the first sentence of the ticket text (or id if missing).
Text contains the ticket text and any resolution text concatenated, so the
FAISS index has useful content to match against.

Usage:
  python .\scripts\generate_articles_from_resolved.py --input data/resolved_tickets.jsonl --output data/articles.jsonl
"""
import argparse
import json
from pathlib import Path


def first_sentence(text: str) -> str:
    if not text:
        return "Untitled"
    # Split on period/question/exclamation
    for sep in ['. ', '? ', '! ']:
        if sep in text:
            return text.split(sep)[0].strip()[:120]
    return text.strip()[:120]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='data/resolved_tickets.jsonl')
    parser.add_argument('--output', default='data/articles.jsonl')
    args = parser.parse_args()

    inp = Path(args.input)
    out = Path(args.output)
    if not inp.exists():
        print(f"Error: input file not found: {inp}")
        return

    out.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with inp.open('r', encoding='utf-8') as fh_in, out.open('w', encoding='utf-8') as fh_out:
        for line in fh_in:
            try:
                obj = json.loads(line)
            except Exception:
                continue
            tid = obj.get('id') or obj.get('_split') or f"ticket_{count}"
            text = obj.get('text') or ''
            resolution = obj.get('resolution') or ''
            title = first_sentence(text) if text else str(tid)
            art = {
                'id': tid,
                'title': title,
                'text': (text + '\n\nResolution:\n' + resolution).strip()
            }
            fh_out.write(json.dumps(art, ensure_ascii=False) + '\n')
            count += 1

    print(f"Wrote {count} articles to {out}")


if __name__ == '__main__':
    main()
