import os
import json
from collections import Counter
from typing import Dict, List

ANALYTICS_DIR = os.path.join("data")
ANALYTICS_FILE = os.path.join(ANALYTICS_DIR, "analytics.jsonl")


def track_event(event: Dict) -> None:
    os.makedirs(ANALYTICS_DIR, exist_ok=True)
    with open(ANALYTICS_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")


def get_top_queries(limit: int = 10) -> List[Dict]:
    if not os.path.isfile(ANALYTICS_FILE):
        return []
    questions: List[str] = []
    with open(ANALYTICS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            try:
                event = json.loads(line)
                q = event.get("question")
                if q:
                    questions.append(q)
            except Exception:
                continue
    counter = Counter(questions)
    return [{"question": q, "count": c} for q, c in counter.most_common(limit)]
