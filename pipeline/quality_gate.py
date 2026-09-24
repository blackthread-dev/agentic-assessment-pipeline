"""Quality gate for assessment report data.

The agent is not allowed to hand off a report until this passes. Each check
encodes a guardrail from skill/SKILL.md, so the rules are enforced in code
instead of relying on the model to remember them.

Usage:
    python pipeline/quality_gate.py path/to/04_report_data.json [--html path/to/report.html]
Exit code 0 = pass, 1 = fail.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

VALID_QUADRANTS = {"quick_win", "major_project", "fill_in", "ignore"}
COST_SOURCE = re.compile(r"^(needs verification|checked on \d{4}-\d{2}-\d{2})$")
PLACEHOLDER = re.compile(r"\{\{.*?\}\}")


def check(data: dict, rendered_html: str | None = None) -> list[str]:
    """Return a list of human-readable failures. Empty list means the gate passes."""
    failures: list[str] = []
    recs = data.get("recommendations", [])
    pains = data.get("pain_points", [])
    pain_ids = {p.get("id") for p in pains}

    if not 3 <= len(recs) <= 7:
        failures.append(f"Expected 3-7 recommendations, found {len(recs)}.")

    top3 = [r for r in recs if r.get("top3")]
    if len(top3) != 3:
        failures.append(f"Expected exactly 3 top3 recommendations, found {len(top3)}.")

    for p in pains:
        if not str(p.get("evidence", "")).strip():
            failures.append(f"Pain point {p.get('id')} has no supporting evidence.")
        if p.get("quadrant") not in VALID_QUADRANTS:
            failures.append(f"Pain point {p.get('id')} has invalid quadrant {p.get('quadrant')!r}.")

    for r in recs:
        title = r.get("title", "<untitled>")
        addresses = r.get("addresses") or []
        if not addresses:
            failures.append(f"Recommendation '{title}' is not linked to any pain point.")
        for pid in addresses:
            if pid not in pain_ids:
                failures.append(f"Recommendation '{title}' references unknown pain point {pid}.")
        if not COST_SOURCE.match(str(r.get("cost_source", ""))):
            failures.append(
                f"Recommendation '{title}' cost must be 'checked on YYYY-MM-DD' or 'needs verification'."
            )

    if not data.get("assumptions"):
        failures.append("No assumptions listed; every estimate needs a stated assumption.")

    if rendered_html is not None:
        leftovers = sorted(set(PLACEHOLDER.findall(rendered_html)))
        if leftovers:
            failures.append(f"Rendered HTML has unreplaced placeholders: {', '.join(leftovers)}")

    return failures


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("data", type=Path)
    parser.add_argument("--html", type=Path, help="default: 04_assessment_report.html next to the data file, if present")
    args = parser.parse_args()

    data = json.loads(args.data.read_text(encoding="utf-8"))
    html_path = args.html or args.data.with_name("04_assessment_report.html")
    rendered = html_path.read_text(encoding="utf-8") if html_path.exists() else None

    failures = check(data, rendered)
    if failures:
        print("QUALITY GATE: FAIL")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("QUALITY GATE: PASS")


if __name__ == "__main__":
    main()
