# Report Data Schema (`04_report_data.json`)

The agent writes structured data; code renders it. Keeping the model's output as data (not HTML) is what
makes the report testable: the quality gate validates this file before anything reaches a client.

```jsonc
{
  "client_name": "string",
  "date": "Month DD, YYYY",

  "impact": {
    "metric_1": { "label": "Weekly Time Returned", "value": "9 hrs" },
    "metric_2": { "label": "Monthly Net Value",    "value": "$2,900" },
    "cost_note": "Total new monthly tool cost: about $85"
  },

  "summary": {
    "pain": "One or two sentences, objective tone.",
    "outcome": "One or two sentences. May contain <strong> for the key number."
  },

  "opportunity": { "value": "9", "label": "Hours You Can Reclaim Weekly", "focus": "Primary focus: time savings" },

  "pain_points": [
    {
      "id": "P1",
      "title": "Short label shown in the matrix",
      "evidence": "Quote or close paraphrase from the input",
      "quadrant": "quick_win | major_project | fill_in | ignore"
    }
  ],

  "recommendations": [
    {
      "title": "string",
      "tool": "string",
      "why": "string",
      "complexity": "plug-and-play | some-setup | project",
      "monthly_cost": "string, e.g. \"$0 (already paid for)\"",
      "cost_source": "checked on YYYY-MM-DD | needs verification",
      "setup": "string",
      "saved": "string",
      "addresses": ["P1"],
      "top3": true
    }
  ],

  "quick_wins_plan": [ { "day": "1", "task": "string", "tool": "string" } ],

  "next_steps": ["string (may contain <b>)"],

  "assumptions": ["Every estimate's assumption, in plain language"],
  "sources": [ { "claim": "string", "url": "https://...", "checked": "YYYY-MM-DD" } ]
}
```

Rules enforced by `pipeline/quality_gate.py`:

- `recommendations`: 3 to 7 items, exactly 3 with `"top3": true`.
- Every `addresses` entry matches a `pain_points[].id`.
- Every pain point has non-empty `evidence` and a valid `quadrant`.
- Every `cost_source` is `needs verification` or `checked on YYYY-MM-DD`.
- `assumptions` is non-empty.
- The rendered HTML contains no `{{` placeholders.
