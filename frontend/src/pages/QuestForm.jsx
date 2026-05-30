import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createQuest, getQuest, updateQuest } from "../services/questService";

/* ── Constants ──────────────────────────────────────────────────────────── */

const LANGUAGES = [
  { value: "python",     label: "Python"     },
  { value: "javascript", label: "JavaScript" },
  { value: "java",       label: "Java"       },
  { value: "csharp",     label: "C#"         },
];

const DIFFICULTIES = [
  { value: "shallow", label: "Shallow", xp: 30  },
  { value: "cryptic", label: "Cryptic", xp: 60  },
  { value: "abyssal", label: "Abyssal", xp: 100 },
];

const EMPTY_TC = Array.from({ length: 10 }, (_, i) => ({ index: i, input: "", output: "" }));

const EMPTY_FORM = {
  title:            "",
  description:      "",
  example_solution: "",
  language:         "python",
  difficulty:       "shallow",
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
      {required && <span className="text-cyan ml-1">*</span>}
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

export default function QuestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  /* Load existing quest when editing */
  useEffect(() => {
    if (!isEdit) return;
    getQuest(id)
      .then((quest) => {
        const test_cases = Array.from({ length: 10 }, (_, i) => {
          const found = quest.test_cases.find((tc) => tc.index === i);
          return found ?? { index: i, input: "", output: "" };
        });
        setForm({
          title:            quest.title,
          description:      quest.description,
          example_solution: quest.example_solution ?? "",
          language:         quest.language,
          difficulty:       quest.difficulty,
          test_cases,
        });
      })
      .catch(() => setError("Failed to load quest data."))
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
        await updateQuest(id, payload);
      } else {
        await createQuest(payload);
      }
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <div className="sf-spinner" />
        <span className="text-sub text-sm">Loading quest…</span>
      </div>
    );
  }

  const selectedDiff = DIFFICULTIES.find((d) => d.value === form.difficulty);

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {isEdit ? "Edit Quest" : "Create Quest"}
          </h1>
          <p className="text-sub text-sm">
            {isEdit ? "Update the quest details below." : "Fill in the details to publish a new quest."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="sf-btn-ghost"
          style={{ width: "auto" }}
        >
          ← Back to Admin
        </button>
      </div>

      {error && (
        <div className="sf-error">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Section 1: Quest Setup ── */}
      <div>
        <SectionDivider title="Quest Setup" />
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
                      ? "1px solid rgba(3,233,244,0.50)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: form.difficulty === d.value
                      ? "rgba(3,233,244,0.08)"
                      : "rgba(255,255,255,0.03)",
                    color: form.difficulty === d.value ? "var(--color-cyan)" : "rgba(255,255,255,0.50)",
                    fontFamily: "var(--font-heading)",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {d.label}
                  <div style={{ fontSize: "0.65rem", fontFamily: "var(--font-body)", marginTop: "0.2rem", opacity: 0.7 }}>
                    {d.xp} XP
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div
              className="glass-card p-4 text-center w-full"
              style={{ border: "1px solid rgba(3,233,244,0.15)" }}
            >
              <p className="text-cyan text-2xl font-bold">{selectedDiff?.xp ?? 0}</p>
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
            <textarea
              className="sf-input"
              placeholder="# Write your reference solution here…"
              value={form.example_solution}
              onChange={(e) => setField("example_solution", e.target.value)}
              rows={8}
              style={{
                resize: "vertical",
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                fontSize: "0.88rem",
                lineHeight: 1.65,
              }}
            />
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
                    ? "1px solid rgba(3,233,244,0.18)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="badge"
                    style={{
                      background: isRequired ? "rgba(3,233,244,0.10)" : "rgba(255,255,255,0.05)",
                      borderColor: isRequired ? "rgba(3,233,244,0.25)" : "rgba(255,255,255,0.10)",
                      color: isRequired ? "var(--color-cyan)" : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {isRequired ? "Required" : "Optional"}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      fontFamily: "var(--font-heading)",
                      letterSpacing: "0.08em",
                      color: "rgba(255,255,255,0.30)",
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
                        fontSize: "0.85rem",
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
                        fontSize: "0.85rem",
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
            isEdit ? "Save Changes" : "Publish Quest"
          )}
        </button>
      </div>

    </form>
  );
}
