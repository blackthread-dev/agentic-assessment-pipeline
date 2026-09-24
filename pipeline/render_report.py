"""Render an assessment report from structured data.

The agent produces 04_report_data.json; this script turns it into HTML using a
small Mustache-style template (variables, raw variables, sections). Keeping the
model's output as data and rendering in code means the layout is deterministic
and the data can be validated before anything reaches a client.

Usage:
    python pipeline/render_report.py path/to/04_report_data.json [--template T] [--out OUT]
"""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATE = ROOT / "skill" / "assets" / "report-template.html"

QUADRANTS = {
    "quick_win": "QUICK_WINS",
    "major_project": "MAJOR_PROJECTS",
    "ignore": "IGNORE_THESE",
    "fill_in": "FILL_INS",
}
# First bullet y-position inside each matrix box (top row vs bottom row) and line spacing.
QUADRANT_Y_START = {"QUICK_WINS": 155, "MAJOR_PROJECTS": 155, "IGNORE_THESE": 315, "FILL_INS": 315}
Y_STEP = 17
MAX_PER_QUADRANT = 3  # the SVG boxes fit three lines


# ---------------------------------------------------------------- templating

_SECTION = re.compile(r"\{\{#(\w+)\}\}(.*?)\{\{/\1\}\}", re.S)
_RAW = re.compile(r"\{\{\{(\w+)\}\}\}")
_VAR = re.compile(r"\{\{(\w+)\}\}")


def render_template(template: str, ctx: dict) -> str:
    """Minimal Mustache: {{#list}}..{{/list}}, {{#flag}}..{{/flag}}, {{{raw}}}, {{escaped}}."""

    def section(match: re.Match) -> str:
        key, body = match.group(1), match.group(2)
        value = ctx.get(key)
        if isinstance(value, list):
            return "".join(render_template(body, {**ctx, **item}) for item in value)
        return render_template(body, ctx) if value else ""

    out = _SECTION.sub(section, template)
    out = _RAW.sub(lambda m: str(ctx.get(m.group(1), m.group(0))), out)
    return _VAR.sub(
        lambda m: html.escape(str(ctx[m.group(1)])) if m.group(1) in ctx else m.group(0), out
    )


# ---------------------------------------------------------------- data mapping

def build_context(data: dict) -> dict:
    """Map the report-data schema onto template variables."""
    impact, summary, opp = data["impact"], data["summary"], data["opportunity"]

    ctx: dict = {
        "CLIENT_NAME": data["client_name"],
        "DATE": data["date"],
        "METRIC_1_LABEL": impact["metric_1"]["label"],
        "METRIC_1_VALUE": impact["metric_1"]["value"],
        "METRIC_2_LABEL": impact["metric_2"]["label"],
        "METRIC_2_VALUE": impact["metric_2"]["value"],
        "COST_NOTE": impact["cost_note"],
        "PAIN_SUMMARY": summary["pain"],
        "OUTCOME_SUMMARY": summary["outcome"],
        "OPP_VALUE": opp["value"],
        "OPP_LABEL": opp["label"],
        "OPP_FOCUS": opp["focus"],
    }

    ctx["PAIN_POINTS"] = [
        {"ID": p["id"], "TITLE": p["title"], "EVIDENCE": p["evidence"]} for p in data["pain_points"]
    ]

    # Matrix: group pain points by quadrant and compute bullet positions.
    for key in QUADRANTS.values():
        ctx[key] = []
    for p in data["pain_points"]:
        key = QUADRANTS[p["quadrant"]]
        items = ctx[key]
        if len(items) < MAX_PER_QUADRANT:
            items.append({"ITEM": p["title"], "Y_POS": QUADRANT_Y_START[key] + Y_STEP * len(items)})

    # Top-3 recommendations first, original order otherwise.
    recs = sorted(data["recommendations"], key=lambda r: not r.get("top3", False))
    ctx["RECS"] = [
        {
            "INDEX": str(i),
            "TITLE": r["title"],
            "TOOL": r["tool"],
            "WHY": r["why"],
            "COMPLEXITY": r["complexity"],
            "COST": r["monthly_cost"],
            "COST_SOURCE": r["cost_source"],
            "SETUP": r["setup"],
            "SAVED": r["saved"],
            "ADDRESSES": ", ".join(r["addresses"]),
            "TOP3": bool(r.get("top3")),
        }
        for i, r in enumerate(recs, start=1)
    ]

    ctx["QUICK_WINS_PLAN"] = [
        {"DAY_NUM": d["day"], "DAY_TITLE": f"Day {d['day']}", "TASK": d["task"], "TOOL": d["tool"]}
        for d in data["quick_wins_plan"]
    ]
    ctx["NEXT_STEPS"] = [
        {"NUM": f"{i:02d}", "DESC": desc} for i, desc in enumerate(data["next_steps"], start=1)
    ]
    ctx["ASSUMPTIONS"] = [{"TEXT": a} for a in data.get("assumptions", [])]
    ctx["SOURCES"] = [
        {"CLAIM": s["claim"], "URL": s["url"], "CHECKED": s["checked"]} for s in data.get("sources", [])
    ]
    return ctx


def render_report(data: dict, template: str) -> str:
    return render_template(template, build_context(data))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("data", type=Path)
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--out", type=Path, help="default: 04_assessment_report.html next to the data file")
    args = parser.parse_args()

    data = json.loads(args.data.read_text(encoding="utf-8"))
    out = args.out or args.data.with_name("04_assessment_report.html")
    out.write_text(render_report(data, args.template.read_text(encoding="utf-8")), encoding="utf-8")
    print(f"Rendered {out}")


if __name__ == "__main__":
    main()
