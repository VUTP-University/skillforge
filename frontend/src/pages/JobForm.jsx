import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { createJob, generateJobWithAI, getJob, updateJob } from "../services/jobService";
import { useAuth } from "../context/AuthContext";

/* ── Constants ──────────────────────────────────────────────────────────── */

const LANGUAGES = [
  { value: "python",     label: "Python"     },
  { value: "javascript", label: "JavaScript" },
  { value: "java",       label: "Java"       },
  { value: "csharp",     label: "C#"         },
  { value: "cpp",        label: "C++"        },
];

const DIFFICULTIES = [
  { value: "junior", label: "Junior", xp: 30  },
  { value: "mid",    label: "Mid",    xp: 60  },
  { value: "senior", label: "Senior", xp: 100 },
];

const LANG_EXT = {
  python:     () => [python()],
  javascript: () => [javascript({ jsx: false })],
  java:       () => [java()],
  csharp:     () => [java()],
  cpp:        () => [cpp()],
};

const EMPTY_TC = Array.from({ length: 10 }, (_, i) => ({ index: i, input: "", output: "" }));

const EMPTY_FORM = {
  title:            "",
  description:      "",
  example_solution: "",
  language:         "python",
  difficulty:       "junior",
  test_cases:       EMPTY_TC,
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SectionDivider({ title }) {
  return (
    <div className="section-divider">
      <h2>{title}</h2>
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="sf-label">
      {children}
      {required && <span className="text-green ml-1">*</span>}
    </label>
  );
}

function SelectField({ label, required, value, onChange, options }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sf-input"
        style={{ cursor: "pointer" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const [aiOpen, setAiOpen] = useState(false);

  /* Load existing job when editing */
  useEffect(() => {
    if (!isEdit) return;
    getJob(id)
      .then((job) => {
        const test_cases = Array.from({ length: 10 }, (_, i) => {
          const found = job.test_cases.find((tc) => tc.index === i);
          return found ?? { index: i, input: "", output: "" };
        });
        setForm({
          title:            job.title,
          description:      job.description,
          example_solution: job.example_solution ?? "",
          language:         job.language,
          difficulty:       job.difficulty,
          test_cases,
        });
      })
      .catch(() => setError("Failed to load job data."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /* Helpers */
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setTC = (index, field, value) =>
    setForm((f) => ({
      ...f,
      test_cases: f.test_cases.map((tc) =>
        tc.index === index ? { ...tc, [field]: value } : tc
      ),
    }));

  /* Submit */
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Include only test cases where both fields are filled, always include index 0
    const test_cases = form.test_cases.filter(
      (tc) => tc.index === 0 || (tc.input.trim() && tc.output.trim())
    );

    setSaving(true);
    try {
      const payload = { ...form, test_cases };
      if (isEdit) {
        await updateJob(id, payload);
      } else {
        await createJob(payload);
      }
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedDiff = DIFFICULTIES.find((d) => d.value === form.difficulty);
  const langExt = useMemo(() => (LANG_EXT[form.language] ?? (() => []))(), [form.language]);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <div className="sf-spinner" />
        <span className="text-sub text-sm">Loading job…</span>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-10 w-full">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {isEdit ? "Edit Job" : "Create Job"}
          </h1>
          <p className="text-sub text-sm">
            {isEdit ? "Update the job details below." : "Fill in the details to publish a new job."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isEdit && user?.role === "admin" && (
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="sf-btn-secondary"
              style={{ width: "auto" }}
            >
              ✦ AI Assistant
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="sf-btn-ghost"
            style={{ width: "auto" }}
          >
            ← Back to Admin
          </button>
        </div>
      </div>

      {error && (
        <div className="sf-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Section 1: Job Setup ── */}
      <div>
        <SectionDivider title="Job Setup" />
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <SelectField
            label="Language"
            required
            value={form.language}
            onChange={(v) => setField("language", v)}
            options={LANGUAGES}
          />
          <div>
            <FieldLabel required>Difficulty</FieldLabel>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setField("difficulty", d.value)}
                  style={{
                    flex: 1,
                    padding: "0.65rem 0.5rem",
                    borderRadius: "0.5rem",
                    border: form.difficulty === d.value
                      ? "1px solid var(--color-green-border)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: form.difficulty === d.value
                      ? "var(--color-green-dim)"
                      : "rgba(255,255,255,0.03)",
                    color: form.difficulty === d.value ? "var(--color-green)" : "rgba(255,255,255,0.50)",
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.718rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {d.label}
                  <div style={{ fontSize: "0.738rem", fontFamily: "var(--font-body)", marginTop: "0.2rem", opacity: 0.7 }}>
                    {d.xp} XP
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div
              className="glass-card p-4 text-center w-full"
              style={{ border: "1px solid var(--color-green-border)" }}
            >
              <p className="text-green text-2xl font-bold">{selectedDiff?.xp ?? 0}</p>
              <p className="text-sub text-xs mt-0.5" style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                XP Reward
              </p>
            </div>
          </div>
        </div>

        <div>
          <FieldLabel required>Title</FieldLabel>
          <input
            type="text"
            className="sf-input"
            placeholder="e.g. Reverse a String"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            maxLength={200}
          />
        </div>
      </div>

      {/* ── Section 2: Problem ── */}
      <div>
        <SectionDivider title="Problem Statement" />
        <div className="space-y-4">
          <div>
            <FieldLabel required>Description</FieldLabel>
            <textarea
              className="sf-input"
              placeholder="Describe the coding problem. Include constraints, input format, and what the user must return."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={8}
              style={{ resize: "vertical", lineHeight: 1.7 }}
            />
          </div>

          <div>
            <FieldLabel>Example Solution</FieldLabel>
            <p className="text-xs text-dim mb-1.5" style={{ fontFamily: "var(--font-body)" }}>
              Visible only to admins and moderators. Not shown to regular users.
            </p>
            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <CodeMirror
                value={form.example_solution}
                onChange={(val) => setField("example_solution", val)}
                theme={vscodeDark}
                extensions={langExt}
                minHeight="220px"
                style={{ fontSize: "0.855rem" }}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: false,
                  dropCursor: false,
                  allowMultipleSelections: false,
                  autocompletion: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Test Cases ── */}
      <div>
        <SectionDivider title="Test Cases" />
        <p className="text-sub text-xs mb-2" style={{ fontFamily: "var(--font-body)" }}>
          Test case <strong className="text-white">0</strong> is required and is the only one shown to users.
          Cases 1–9 are hidden — leave both fields empty to skip.
        </p>
        <p className="text-sub text-xs mb-5" style={{ fontFamily: "var(--font-body)" }}>
          <strong className="text-white">Multiple inputs:</strong> put each value on its own line.
          e.g. for "sum of two integers" write <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.07)", padding: "0 4px", borderRadius: 3 }}>3</code> and <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.07)", padding: "0 4px", borderRadius: 3 }}>5</code> on separate lines;
          read them with <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.07)", padding: "0 4px", borderRadius: 3 }}>input()</code> / <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.07)", padding: "0 4px", borderRadius: 3 }}>Scanner.nextInt()</code> / <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.07)", padding: "0 4px", borderRadius: 3 }}>readline()</code>.
        </p>

        <div className="space-y-3">
          {form.test_cases.map((tc) => {
            const isRequired = tc.index === 0;
            return (
              <div
                key={tc.index}
                className="glass-card p-4"
                style={{
                  border: isRequired
                    ? "1px solid var(--color-green-border)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="badge"
                    style={{
                      background: isRequired ? "var(--color-green-dim)" : "rgba(255,255,255,0.05)",
                      borderColor: isRequired ? "var(--color-green-border)" : "rgba(255,255,255,0.10)",
                      color: isRequired ? "var(--color-green)" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {isRequired ? "Required" : "Optional"}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "var(--font-heading)",
                      letterSpacing: "0.08em",
                      color: "var(--color-text-tertiary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Test Case {tc.index}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel required={isRequired}>Input</FieldLabel>
                    <textarea
                      className="sf-input"
                      placeholder={`stdin for case ${tc.index}\n(one value per line for multiple inputs)`}
                      value={tc.input}
                      onChange={(e) => setTC(tc.index, "input", e.target.value)}
                      rows={3}
                      style={{
                        resize: "vertical",
                        fontFamily: "'Fira Code', monospace",
                        fontSize: "0.867rem",
                      }}
                    />
                  </div>
                  <div>
                    <FieldLabel required={isRequired}>Expected Output</FieldLabel>
                    <textarea
                      className="sf-input"
                      placeholder={`expected stdout / return value for case ${tc.index}`}
                      value={tc.output}
                      onChange={(e) => setTC(tc.index, "output", e.target.value)}
                      rows={3}
                      style={{
                        resize: "vertical",
                        fontFamily: "'Fira Code', monospace",
                        fontSize: "0.867rem",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div
        className="flex items-center justify-between gap-4 pt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="sf-btn-ghost"
          style={{ width: "auto" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="sf-btn"
          disabled={saving}
          style={{ width: "auto", minWidth: "160px" }}
        >
          {saving ? (
            <>
              <div className="sf-spinner" />
              Saving…
            </>
          ) : (
            isEdit ? "Save Changes" : "Publish Job"
          )}
        </button>
      </div>

    </form>

    {aiOpen && (
      <AiAssistantModal
        initialLanguage={form.language}
        initialDifficulty={form.difficulty}
        onClose={() => setAiOpen(false)}
        onApply={(generated) => {
          setForm((f) => ({
            ...f,
            title:            generated.title,
            description:      generated.description,
            example_solution: generated.example_solution,
            language:         generated.language,
            difficulty:       generated.difficulty,
            test_cases:       Array.from({ length: 10 }, (_, i) => {
              const found = generated.test_cases.find((tc) => tc.index === i);
              return found ?? { index: i, input: "", output: "" };
            }),
          }));
        }}
      />
    )}
    </>
  );
}

/* ── AI Assistant modal ──────────────────────────────────────────────────── */

function AiAssistantModal({ initialLanguage, initialDifficulty, onClose, onApply }) {
  const [language, setLanguage]     = useState(initialLanguage);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [description, setDescription] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [result, setResult]         = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const generated = await generateJobWithAI({ language, difficulty, description });
      onApply(generated);
      setResult(generated.verification ?? null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Something went wrong. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="term-window term-window--blue"
        style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="term-bar">
          <span className="term-dot term-dot--red" />
          <span className="term-dot term-dot--yellow" />
          <span className="term-dot term-dot--green" />
          <span className="term-title">AI Assistant</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "0 0.2rem", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "1.2rem 1.4rem", overflowY: "auto", flex: 1 }} className="space-y-4">
          <p className="text-sub text-xs" style={{ fontFamily: "var(--font-body)" }}>
            Generates a full job — title, description, example solution, and 10 test cases — from a
            language, difficulty, and optional topic hint. Review everything before publishing.
          </p>

          <SelectField
            label="Language"
            required
            value={language}
            onChange={setLanguage}
            options={LANGUAGES}
          />

          <div>
            <FieldLabel required>Difficulty</FieldLabel>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    border: difficulty === d.value
                      ? "1px solid var(--color-green-border)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: difficulty === d.value
                      ? "var(--color-green-dim)"
                      : "rgba(255,255,255,0.03)",
                    color: difficulty === d.value ? "var(--color-green)" : "rgba(255,255,255,0.50)",
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Topic / short description (optional)</FieldLabel>
            <textarea
              className="sf-input"
              placeholder="e.g. reversing a string, working with a stack, basic recursion…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && <div className="sf-error">{error}</div>}

          {result && !error && (
            result.verified ? (
              <div className="sf-success">
                Generated ✓ — {result.passed}/{result.total} tests verified against the example solution.
              </div>
            ) : (
              <div className="sf-error">
                {result.compile_error
                  ? `Generated, but the example solution failed to run: ${result.compile_error}`
                  : `Generated, but only ${result.passed}/${result.total} tests verified — review before publishing.`}
              </div>
            )
          )}

          <button
            type="button"
            onClick={handleGenerate}
            className="sf-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="sf-spinner" />
                Compiling job spec…
              </>
            ) : (
              result ? "Regenerate" : "Generate"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
