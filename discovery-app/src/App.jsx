import React, { useMemo, useState } from "react";
import { closeScript, frictionGroups, openingQuestions, quantQuestions } from "./discoveryTree.js";
import { buildNotesMarkdown, getAllPoints, safeBoolMap, safeStringMap, sanitizeFileName, validateTree } from "./lib.js";

function Badge({ children }) {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#22304A] bg-[#0B1220] text-[#2BB3A3]">
      {children}
    </span>
  );
}

function Panel({ children, className = "" }) {
  return <section className={`rounded-2xl border border-[#22304A] bg-[#111A2E] ${className}`}>{children}</section>;
}

function PanelBody({ children, className = "" }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm text-[#A9B4C8]">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-[#22304A] bg-[#0B1220] px-3 py-2 text-white outline-none focus:border-[#2BB3A3]"
      />
    </div>
  );
}

function NotesArea({ value, onChange, placeholder, minHeight = "min-h-[90px]" }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`mt-2 w-full rounded-xl border border-[#22304A] bg-[#0B1220] px-3 py-2 text-white outline-none focus:border-[#2BB3A3] ${minHeight}`}
    />
  );
}

export default function App() {
  const [client, setClient] = useState("");
  const [industry, setIndustry] = useState("");
  const [checkedState, setCheckedState] = useState({});
  const [notesState, setNotesState] = useState({});
  const [summary, setSummary] = useState("");
  const [showTests, setShowTests] = useState(false);

  const checked = useMemo(() => safeBoolMap(checkedState), [checkedState]);
  const notes = useMemo(() => safeStringMap(notesState), [notesState]);

  const selectedItems = useMemo(() => {
    return getAllPoints(frictionGroups).filter((point) => Boolean(checked[point.id]));
  }, [checked]);

  const selfTests = useMemo(() => validateTree(frictionGroups, { openingQuestions, quantQuestions }), []);
  const allTestsPassed = selfTests.every((test) => test.passed);

  function toggle(pointId) {
    if (!pointId) return;
    setCheckedState((previous) => {
      const safePrevious = safeBoolMap(previous);
      return { ...safePrevious, [pointId]: !safePrevious[pointId] };
    });
  }

  function updateNote(pointId, value) {
    if (!pointId) return;
    setNotesState((previous) => {
      const safePrevious = safeStringMap(previous);
      return { ...safePrevious, [pointId]: typeof value === "string" ? value : String(value ?? "") };
    });
  }

  function exportNotes() {
    const markdown = buildNotesMarkdown({ client, industry, selectedItems, notes, quantQuestions, summary });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sanitizeFileName(client)}-workflow-discovery.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#0B1220] p-4 text-[#EEF2F8] md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="grid gap-4 border-b border-[#22304A] pb-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2BB3A3]">Workflow Assessment</div>
            <h1 className="mt-2 text-3xl font-bold md:text-5xl">Discovery Tree</h1>
            <p className="mt-3 max-w-2xl text-[#A9B4C8]">
              Tick friction points as they come up. Follow only the revealed questions. Quantify the bottleneck, then identify the first workflow improvement.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <button
              type="button"
              onClick={exportNotes}
              className="rounded-2xl bg-[#2BB3A3] px-4 py-2 font-semibold text-white hover:bg-[#1F8A7D]"
            >
              Export Notes
            </button>
            <button
              type="button"
              onClick={() => setShowTests((previous) => !previous)}
              className="rounded-2xl border border-[#22304A] bg-transparent px-4 py-2 font-semibold text-[#EEF2F8] hover:bg-[#111A2E]"
            >
              {allTestsPassed ? "Self-tests: Pass" : "Self-tests: Check"}
            </button>
          </div>
        </header>

        {showTests && (
          <Panel>
            <PanelBody>
              <h2 className="text-xl font-bold">Built-in Self-Tests</h2>
              <p className="mt-2 text-sm text-[#A9B4C8]">These checks validate the discovery-tree data and defensive state handling.</p>
              <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                {selfTests.map((test) => (
                  <li key={test.name} className="rounded-xl border border-[#22304A] bg-[#0B1220] p-3">
                    <span className={test.passed ? "text-green-400" : "text-red-400"}>{test.passed ? "PASS" : "FAIL"}</span>: {test.name}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>
        )}

        <Panel>
          <PanelBody className="grid gap-4 md:grid-cols-3">
            <TextInput label="Client / Company" value={client} onChange={setClient} placeholder="Company name" />
            <TextInput label="Industry" value={industry} onChange={setIndustry} placeholder="HVAC, accounting, dental office..." />
            <div className="flex items-end">
              <div className="text-sm text-[#A9B4C8]">Suggested flow: open → detect friction → quantify → prioritize → close.</div>
            </div>
          </PanelBody>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <main className="space-y-5">
            <Panel>
              <PanelBody>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Badge>?</Badge> Opening Questions
                </h2>
                <p className="mt-2 text-[#A9B4C8]">Use only one or two to start naturally.</p>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  {openingQuestions.map((question) => (
                    <div key={question} className="rounded-xl border border-[#22304A] bg-[#0B1220] p-3">
                      {question}
                    </div>
                  ))}
                </div>
              </PanelBody>
            </Panel>

            {frictionGroups.map((group) => (
              <Panel key={group.id} className="overflow-hidden">
                <PanelBody>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{group.title}</h2>
                      <p className="mt-1 text-sm text-[#A9B4C8]">Core question: {group.coreQuestion}</p>
                    </div>
                    <div className="max-w-sm text-xs text-[#6B7280]">Triggers: {group.triggerWords.join(", ")}</div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {group.points.map((point) => {
                      const isChecked = Boolean(checked[point.id]);
                      return (
                        <div key={point.id} className="rounded-xl border border-[#22304A] bg-[#0B1220] p-4">
                          <label className="flex cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggle(point.id)}
                              className="h-4 w-4 accent-[#2BB3A3]"
                            />
                            <span className="font-semibold">{point.label}</span>
                          </label>

                          {isChecked && (
                            <div className="mt-4 space-y-4 pl-7">
                              <div>
                                <div className="text-sm font-semibold text-[#2BB3A3]">Follow-up questions</div>
                                <ul className="mt-2 space-y-2 text-sm text-[#EEF2F8]">
                                  {point.questions.map((question) => (
                                    <li key={question}>• {question}</li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <label className="text-sm text-[#A9B4C8]">Notes / answers</label>
                                <NotesArea
                                  value={notes[point.id] || ""}
                                  onChange={(value) => updateNote(point.id, value)}
                                  placeholder="Capture frequency, time loss, impact, examples..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </PanelBody>
              </Panel>
            ))}
          </main>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
            <Panel>
              <PanelBody>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Badge>✓</Badge> Active Friction Points
                </h2>
                {selectedItems.length === 0 ? (
                  <p className="mt-3 text-sm text-[#A9B4C8]">Tick friction points during the conversation. The right follow-up questions will appear automatically.</p>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm">
                    {selectedItems.map((item) => (
                      <li key={item.id} className="rounded-xl border border-[#22304A] bg-[#0B1220] p-3">
                        <span className="font-semibold text-[#2BB3A3]">{item.groupTitle}</span>
                        <br />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                )}
              </PanelBody>
            </Panel>

            <Panel>
              <PanelBody>
                <h2 className="text-xl font-bold">Quantify the Cost</h2>
                <p className="mt-2 text-sm text-[#A9B4C8]">Ask these once a real bottleneck appears.</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {quantQuestions.map((question) => (
                    <li key={question} className="rounded-xl border border-[#22304A] bg-[#0B1220] p-3">
                      {question}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelBody>
                <h2 className="text-xl font-bold">Close</h2>
                <p className="mt-3 text-sm text-[#A9B4C8]">{closeScript}</p>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelBody>
                <h2 className="text-xl font-bold">Call Summary</h2>
                <NotesArea
                  value={summary}
                  onChange={setSummary}
                  placeholder="Summarize biggest bottleneck, estimated time loss, likely first pilot improvement..."
                  minHeight="min-h-[130px]"
                />
              </PanelBody>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}
