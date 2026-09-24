import { test } from "node:test";
import assert from "node:assert/strict";
import { safeBoolMap, safeStringMap, sanitizeFileName, buildNotesMarkdown, validateTree } from "./lib.js";
import { frictionGroups, openingQuestions, quantQuestions } from "./discoveryTree.js";

test("question bank passes its own validation", () => {
  for (const check of validateTree(frictionGroups, { openingQuestions, quantQuestions })) {
    assert.ok(check.passed, check.name);
  }
});

test("validation catches duplicate point IDs", () => {
  const dupes = [
    { id: "a", title: "A", triggerWords: ["x"], coreQuestion: "?", points: [{ id: "p", label: "P", questions: ["q"] }] },
    { id: "b", title: "B", triggerWords: ["x"], coreQuestion: "?", points: [{ id: "p", label: "P", questions: ["q"] }] },
  ];
  const result = validateTree(dupes, { openingQuestions, quantQuestions });
  assert.equal(result.find((c) => c.name === "Point IDs are unique").passed, false);
});

test("state sanitizers handle bad input", () => {
  assert.deepEqual(safeBoolMap(undefined), {});
  assert.deepEqual(safeStringMap(null), {});
  assert.equal(safeBoolMap({ a: "yes" }).a, true);
  assert.equal(safeStringMap({ a: 123 }).a, "123");
});

test("file names are sanitized with a fallback", () => {
  assert.equal(sanitizeFileName(""), "discovery");
  assert.equal(sanitizeFileName("ACME Inc.! "), "acme-inc");
});

test("markdown export includes selected points and notes", () => {
  const md = buildNotesMarkdown({
    client: "Acme",
    industry: "HVAC",
    selectedItems: [{ id: "status_chasing", groupTitle: "Coordination", label: "Chasing status updates" }],
    notes: { status_chasing: "About 10 calls a day" },
    quantQuestions: ["How often?"],
    summary: "",
  });
  assert.match(md, /Client: Acme/);
  assert.match(md, /- Coordination: Chasing status updates/);
  assert.match(md, /Notes: About 10 calls a day/);
  assert.match(md, /No summary entered\./);
});
