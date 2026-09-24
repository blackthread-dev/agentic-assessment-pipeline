---
name: workflow-assessment-pipeline
description: Turn a business discovery input (call transcript, live discovery notes, or a self-serve diagnostic export) into a staged, evidence-backed workflow assessment report. Use when an agent needs to clean the input, extract pain points, score effort vs impact, research tools, and produce a Markdown + HTML (+ PDF) report.
---

# Workflow Assessment Pipeline

An agent skill that takes one discovery input through a fixed sequence of stages. Each stage writes one
artifact to disk, and each later stage reads only the artifacts before it. The agent never jumps straight
from raw input to recommendations.

> This is a public, generalized version of a private production skill. The stage structure, guardrails and
> quality gate are real; the question bank, scoring weights, prompt wording and branding are simplified examples.

## Inputs

Any one of the following, normalized into `input/` for the engagement:

| Input | Produced by | Shape |
|---|---|---|
| Call transcript | Meeting recorder export | Markdown / text |
| Live discovery notes | `discovery-app/` (Export Notes) | Markdown |
| Self-serve diagnostic | Web diagnostic → `pipeline/adapters/diagnostic_to_intake.py` | JSON → Markdown |

All three are converted into the same intake shape, so every downstream stage is input-agnostic.

## Stages and artifacts

```text
output/<engagement>/
  00_source_reference.md     # pointer to the untouched raw input (source of truth)
  01_cleaned_notes.md        # structured notes, no recommendations
  02_pain_point_analysis.md  # ranked pain points with IDs (P1..Pn) + effort/impact scores
  03_tool_research.md        # candidate tools per pain point, sources + date checked
  04_report_data.json        # structured report data (validated by the quality gate)
  04_assessment_report.md    # client-facing Markdown
  04_assessment_report.html  # rendered from assets/report-template.html
  04_assessment_report.pdf   # optional, print CSS export
  05_follow_up_prep.md       # walkthrough agenda for the review call
```

1. **Preserve**: never edit the raw input; flag regulated data (health, financial, HR, minors, customer PII).
2. **Clean**: restructure into fixed sections. No tools or recommendations at this stage. Unclear items are marked `needs confirmation`.
3. **Extract pain points**: give each a stable ID (`P1`..`Pn`) and a supporting quote or paraphrase from the input.
4. **Score**: impact, effort, readiness and risk (1 to 5); place each pain point in one quadrant of the effort/impact matrix.
5. **Research**: a small, bounded candidate set per pain point; prefer the existing stack and off-the-shelf tools; include non-AI options when they fit better; record source URL and date checked.
6. **Select**: 3 to 7 recommendations, exactly 3 flagged `top3`, each linked to at least one pain point ID.
7. **Estimate impact**: conservative; every number carries its assumption.
8. **Render**: write `04_report_data.json`, then run `pipeline/render_report.py`.
9. **Gate**: run `pipeline/quality_gate.py`. Do not hand off a report that fails.
10. **Follow-up prep**: agenda, likely questions, and the strongest next step.

See `references/stage-prompts.md` for the per-stage instructions.

## Guardrails

- Do not invent facts. Anything not in the input is an assumption and must be labeled as one.
- Every recommendation must trace to a pain point ID, and every pain point to input evidence.
- No recommendations before stage 6; no tool names in cleaned notes unless the input already names them.
- Pricing and vendor claims must show `checked on YYYY-MM-DD` or `needs verification`.
- Keep sensitive details out of client-facing artifacts; add a privacy caution when regulated data is involved.
- Objective, respectful tone: describe friction in the workflow, not failings of the people.

## Quality gate (enforced by `pipeline/quality_gate.py`)

- 3 to 7 recommendations, exactly 3 marked `top3`.
- Every recommendation references an existing pain point ID; every pain point has evidence.
- Every cost is sourced (`checked on` date) or marked `needs verification`.
- Rendered HTML contains no unreplaced `{{placeholders}}`.
- Impact metrics state their assumptions.
