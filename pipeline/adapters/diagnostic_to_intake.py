"""Convert a self-serve web diagnostic submission into the pipeline's intake format.

The web diagnostic collects multiple-choice answers, each scored 0 (lots of
friction) to 3 (healthy). This adapter scores each dimension 0-100, assigns a
red / yellow / green band, and writes a Markdown intake that reads like
discovery-call notes. Downstream stages never need to know which input they got.

Usage:
    python pipeline/adapters/diagnostic_to_intake.py submission.json [--out intake.md]
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

MAX_ANSWER_SCORE = 3


def band(score: int) -> str:
    if score >= 67:
        return "green"
    if score >= 34:
        return "yellow"
    return "red"


def score_dimensions(answers: list[dict]) -> dict[str, int]:
    """Average each dimension's answers onto a 0-100 scale."""
    totals: dict[str, list[int]] = defaultdict(list)
    for a in answers:
        value = int(a["score"])
        if not 0 <= value <= MAX_ANSWER_SCORE:
            raise ValueError(f"Answer score out of range for {a['question']!r}: {value}")
        totals[a["dimension"]].append(value)
    return {
        dim: round(100 * sum(vals) / (MAX_ANSWER_SCORE * len(vals)))
        for dim, vals in totals.items()
    }


def to_intake_markdown(submission: dict) -> str:
    answers = submission["answers"]
    scores = score_dimensions(answers)
    lines = [
        "# Discovery Intake (self-serve diagnostic)",
        "",
        f"Business: {submission.get('business', 'Not specified')}",
        f"Industry: {submission.get('industry', 'Not specified')}",
        f"Team size: {submission.get('team_size', 'Not specified')}",
        f"Submitted: {submission.get('submitted_at', 'Not specified')}",
        "",
        "## Dimension scores (0 = high friction, 100 = healthy)",
        "",
        "| Dimension | Score | Band |",
        "|---|---|---|",
    ]
    for dim, s in sorted(scores.items(), key=lambda kv: kv[1]):
        lines.append(f"| {dim} | {s} | {band(s)} |")

    lines += ["", "## Answers", ""]
    for a in answers:
        lines.append(f"**{a['dimension']}**: {a['question']}")
        lines.append(f"> {a['answer']} (score {a['score']}/{MAX_ANSWER_SCORE})")
        lines.append("")

    if submission.get("free_text"):
        lines += ["## In their own words", "", f"> {submission['free_text']}", ""]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("submission", type=Path)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()

    submission = json.loads(args.submission.read_text(encoding="utf-8"))
    out = args.out or args.submission.with_name("intake_from_diagnostic.md")
    out.write_text(to_intake_markdown(submission), encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
