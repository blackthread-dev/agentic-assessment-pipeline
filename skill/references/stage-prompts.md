# Stage Prompts

Generic, simplified instructions for each stage. The agent runs them in order and writes each result to
the artifact named under the stage. The production version uses more detailed, domain-tuned wording.

## Stage 1: Preserve

- Copy or link the raw input. It is the source of truth and is never edited.
- Record engagement name, date, industry, and current tools in `00_source_reference.md`.
- Flag regulated data (health, financial, HR, minors, customer PII).

## Stage 2: Clean  →  `01_cleaned_notes.md`

```text
Clean this discovery input into structured notes.

Rules:
- Do not invent facts or add recommendations.
- Preserve the speaker's own wording for important points.
- Remove filler and repetition.
- Mark anything unclear as "needs confirmation".

Sections:
1. Business overview
2. Team and roles
3. Current tools
4. Customer / job flow
5. Repetitive tasks
6. Bottlenecks and delays
7. Manual reports and spreadsheets
8. Quotes worth preserving
```

## Stage 3: Extract pain points  →  `02_pain_point_analysis.md`

```text
From the cleaned notes, list the strongest workflow pain points.

For each, give:
- id (P1, P2, ...)
- what happens today, who is affected, how often
- evidence: a quote or close paraphrase from the notes
- estimated time or revenue at stake, with the assumption stated
- confidence: low / medium / high

Rank by business value. Describe friction in the process, not failings of people.
```

## Stage 4: Score  →  append to `02_pain_point_analysis.md`

```text
Score each pain point 1-5 for impact, effort, readiness and risk.
Place each in one quadrant:
- quick_win        (high impact, low effort)
- major_project    (high impact, high effort)
- fill_in          (low impact, high effort)
- ignore           (low impact, low effort)
Give a one-line reason for each placement.
```

## Stage 5: Research  →  `03_tool_research.md`

```text
For each quick_win and major_project pain point, evaluate a small set of candidate tools or workflows.

Rules:
- Prefer tools that extend the current stack.
- Include non-AI options when they solve the problem better.
- Record the source URL and the date checked for every price or feature claim.
  If you cannot verify, write "needs verification".
- Note privacy fit when regulated data is involved.
```

## Stage 6-7: Select and estimate  →  `04_report_data.json`

```text
Select 3-7 recommendations. Mark exactly 3 as top3.
Each recommendation must list the pain point IDs it addresses.
Estimate impact conservatively and state every assumption.
Write the result using the schema in report-data-schema.md.
```

## Stage 8-9: Render and gate

```bash
python pipeline/render_report.py  output/<engagement>/04_report_data.json
python pipeline/quality_gate.py   output/<engagement>/04_report_data.json
```

Fix and re-run until the gate passes.

## Stage 10: Follow-up prep  →  `05_follow_up_prep.md`

```text
Prepare the review-call walkthrough:
1. Short agenda
2. The three points to emphasize
3. Likely questions and plain answers
4. The strongest next step and why
```
