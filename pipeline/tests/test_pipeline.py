"""Tests for the rendering, quality gate and input adapter. Run: python -m unittest discover pipeline/tests"""

import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))
sys.path.insert(0, str(ROOT / "pipeline" / "adapters"))

from diagnostic_to_intake import band, score_dimensions, to_intake_markdown  # noqa: E402
from quality_gate import check  # noqa: E402
from render_report import DEFAULT_TEMPLATE, render_report, render_template  # noqa: E402

EXAMPLE = ROOT / "examples" / "harbourline-hvac"
SAMPLE_DATA = json.loads((EXAMPLE / "output" / "04_report_data.json").read_text(encoding="utf-8"))


class TemplateTests(unittest.TestCase):
    def test_escapes_variables(self):
        self.assertEqual(render_template("{{X}}", {"X": "<b>"}), "&lt;b&gt;")

    def test_raw_variables_are_not_escaped(self):
        self.assertEqual(render_template("{{{X}}}", {"X": "<b>hi</b>"}), "<b>hi</b>")

    def test_list_sections_repeat(self):
        out = render_template("{{#L}}[{{V}}]{{/L}}", {"L": [{"V": 1}, {"V": 2}]})
        self.assertEqual(out, "[1][2]")

    def test_boolean_sections(self):
        self.assertEqual(render_template("{{#F}}yes{{/F}}", {"F": False}), "")
        self.assertEqual(render_template("{{#F}}yes{{/F}}", {"F": True}), "yes")

    def test_nested_sections_see_item_values(self):
        out = render_template("{{#L}}{{#TOP}}*{{/TOP}}{{V}} {{/L}}", {"L": [{"V": "a", "TOP": True}, {"V": "b", "TOP": False}]})
        self.assertEqual(out, "*a b ")


class RenderTests(unittest.TestCase):
    def setUp(self):
        self.html = render_report(SAMPLE_DATA, DEFAULT_TEMPLATE.read_text(encoding="utf-8"))

    def test_sample_renders_without_placeholders(self):
        self.assertNotIn("{{", self.html)

    def test_top3_recommendations_render_first(self):
        first_badge = self.html.index("Top 3 priority")
        first_non_top = self.html.index("Maintenance Plans as Recurring Jobs")
        self.assertLess(first_badge, first_non_top)

    def test_matrix_places_pain_points(self):
        self.assertIn("Missed calls at peak times", self.html)
        self.assertIn("Manual Monday report", self.html)


class QualityGateTests(unittest.TestCase):
    def test_sample_passes(self):
        self.assertEqual(check(SAMPLE_DATA), [])

    def test_requires_exactly_three_top_picks(self):
        data = copy.deepcopy(SAMPLE_DATA)
        data["recommendations"][3]["top3"] = True
        self.assertTrue(any("exactly 3 top3" in f for f in check(data)))

    def test_rejects_unknown_pain_point_reference(self):
        data = copy.deepcopy(SAMPLE_DATA)
        data["recommendations"][0]["addresses"] = ["P99"]
        self.assertTrue(any("unknown pain point P99" in f for f in check(data)))

    def test_rejects_unsourced_cost(self):
        data = copy.deepcopy(SAMPLE_DATA)
        data["recommendations"][0]["cost_source"] = "trust me"
        self.assertTrue(any("checked on YYYY-MM-DD" in f for f in check(data)))

    def test_rejects_pain_point_without_evidence(self):
        data = copy.deepcopy(SAMPLE_DATA)
        data["pain_points"][0]["evidence"] = ""
        self.assertTrue(any("no supporting evidence" in f for f in check(data)))

    def test_rejects_too_few_recommendations(self):
        data = copy.deepcopy(SAMPLE_DATA)
        data["recommendations"] = data["recommendations"][:2]
        self.assertTrue(any("3-7 recommendations" in f for f in check(data)))

    def test_flags_leftover_placeholders(self):
        self.assertTrue(any("placeholders" in f for f in check(SAMPLE_DATA, "<p>{{TITLE}}</p>")))


class AdapterTests(unittest.TestCase):
    def test_scoring_scale(self):
        answers = [
            {"dimension": "A", "score": 0},
            {"dimension": "B", "score": 3},
            {"dimension": "C", "score": 1},
            {"dimension": "C", "score": 2},
        ]
        self.assertEqual(score_dimensions(answers), {"A": 0, "B": 100, "C": 50})

    def test_bands(self):
        self.assertEqual([band(0), band(33), band(34), band(66), band(67)], ["red", "red", "yellow", "yellow", "green"])

    def test_rejects_out_of_range_scores(self):
        with self.assertRaises(ValueError):
            score_dimensions([{"dimension": "A", "question": "q", "score": 4}])

    def test_sample_submission_converts(self):
        submission = json.loads((EXAMPLE / "input" / "diagnostic_submission.json").read_text(encoding="utf-8"))
        md = to_intake_markdown(submission)
        self.assertIn("| Customer updates | 0 | red |", md)
        self.assertIn("## In their own words", md)


if __name__ == "__main__":
    unittest.main()
