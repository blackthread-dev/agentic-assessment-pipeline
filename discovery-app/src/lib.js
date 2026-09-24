// Pure helpers, kept free of React so they can be unit-tested with `node --test`.

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function safeBoolMap(value) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, Boolean(v)]));
}

export function safeStringMap(value) {
  if (!isPlainObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, typeof v === "string" ? v : String(v ?? "")])
  );
}

export function sanitizeFileName(value) {
  const text = typeof value === "string" ? value : "";
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "discovery"
  );
}

export function getAllPoints(groups) {
  return groups.flatMap((group) =>
    group.points.map((point) => ({ ...point, groupId: group.id, groupTitle: group.title }))
  );
}

/** Build the Markdown export that becomes an input to the assessment pipeline. */
export function buildNotesMarkdown({ client, industry, selectedItems, notes, quantQuestions, summary }) {
  const lines = ["# Workflow Discovery Notes", "", `Client: ${client || "Not specified"}`, `Industry: ${industry || "Not specified"}`, "", "## Selected Friction Points"];
  if (selectedItems.length === 0) {
    lines.push("No friction points selected.");
  } else {
    for (const item of selectedItems) {
      lines.push(`- ${item.groupTitle}: ${item.label}`);
      if (notes[item.id]) lines.push(`  - Notes: ${notes[item.id]}`);
    }
  }
  lines.push("", "## Quantification Prompts Used", ...quantQuestions.map((q) => `- ${q}`));
  lines.push("", "## Call Summary", summary || "No summary entered.");
  return lines.join("\n");
}

/** Validate the question bank's shape. Shown in-app and run in unit tests. */
export function validateTree(groups, { openingQuestions, quantQuestions }) {
  const points = getAllPoints(groups);
  const ids = points.map((p) => p.id);
  return [
    { name: "At least one friction group exists", passed: groups.length > 0 },
    {
      name: "Every group has a title, triggers, core question and points",
      passed: groups.every(
        (g) => g.id && g.title && g.triggerWords?.length > 0 && g.coreQuestion && g.points?.length > 0
      ),
    },
    {
      name: "Every point has an ID, label and follow-up questions",
      passed: points.every((p) => p.id && p.label && p.questions?.length > 0),
    },
    { name: "Point IDs are unique", passed: ids.length === new Set(ids).size },
    { name: "Opening questions available", passed: openingQuestions.length >= 3 },
    { name: "Quantification questions available", passed: quantQuestions.length >= 5 },
  ];
}
