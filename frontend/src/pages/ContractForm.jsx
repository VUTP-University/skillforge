import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { useAuth } from "../context/AuthContext";
import {
  createContract, generateContractWithAI, getContract, updateContract, verifyContract,
} from "../services/contractService";
import ContractTestResults from "../components/ContractTestResults";

/* ── Constants ──────────────────────────────────────────────────────────── */

const DIFFICULTIES = [
  { value: "junior", label: "Junior", xp: 60  },
  { value: "mid",    label: "Mid",    xp: 120 },
  { value: "senior", label: "Senior", xp: 200 },
];

// Placeholders (not prefilled values) — they show the expected file shape
// without biasing every new contract toward one kind of exercise.
const PLACEHOLDER = {
  starter_code: `# solution.py — what the solver starts with.
# Declare every class/function the tests use, with stub bodies:
#
# class Ledger:
#     def deposit(self, account: str, amount: int) -> None:
#         raise NotImplementedError`,
  example_solution: `# A complete solution.py that passes every public and hidden test.`,
  public_tests: `import unittest
from solution import ...


class TestBasics(unittest.TestCase):
    def test_api_exists(self):
        """Required classes/methods are defined"""
        ...`,
  hidden_tests: `import unittest
from contract import limits   # optional: per-test overrides
from solution import ...


class TestEdgeCases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):          # untimed: build large inputs here
        cls.data = ...

    @limits(time_ms=2000, memory_mb=64)
    def test_large_input(self):
        """Handles 100k operations within the limits"""
        ...`,
};

const EMPTY_FORM = {
  title:            "",
  description:      "",
  topic:            "",
  difficulty:       "mid",
  time_limit_ms:    1000,
  memory_limit_mb:  64,
  starter_code:     "",
  example_solution: "",
  public_tests:     "",
  hidden_tests:     "",
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SectionDivider({ title }) {
  return (
    <div className="section-divider">
      <h2>{title}</h2>
    </div>
  );
}

function FieldLabel({ children, required, hint }) {
  return (
    <>
      <label className="sf-label">
        {children}
        {required && <span className="text-green ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-dim mb-1.5" style={{ fontFamily: "var(--font-body)" }}>{hint}</p>}
    </>
  );
}

function DifficultyPicker({ value, onChange, showXp = true }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DIFFICULTIES.map((d) => (
        <button
          key={d.value}
          type="button"
          onClick={() => onChange(d.value)}
          style={{
            padding: "0.55rem 0.5rem", borderRadius: "0.5rem",
            border: value === d.value ? "1px solid var(--color-green-border)" : "1px solid rgba(255,255,255,0.08)",
            background: value === d.value ? "var(--color-green-dim)" : "rgba(255,255,255,0.03)",
            color: value === d.value ? "var(--color-green)" : "rgba(255,255,255,0.50)",
            fontFamily: "var(--font-heading)", fontSize: "0.718rem", fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
          }}
        >
          {d.label}
          {showXp && (
            <div style={{ fontSize: "0.738rem", fontFamily: "var(--font-body)", marginTop: "0.2rem", opacity: 0.7 }}>{d.xp} XP</div>
          )}
        </button>
      ))}
    </div>
  );
}

function CodeField({ label, hint, value, onChange, placeholder, minHeight = "220px" }) {
  return (
    <div>
      <FieldLabel required hint={hint}>{label}</FieldLabel>
      <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
        <CodeMirror
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          theme={vscodeDark}
          extensions={[python()]}
          minHeight={minHeight}
          style={{ fontSize: "0.83rem" }}
          basicSetup={{ lineNumbers: true, foldGutter: false, dropCursor: false }}
        />
      </div>
    </div>
  );
}

function VerificationReport({ report }) {
  if (!report) return null;
  return (
    <div className="space-y-4">
      {report.ok ? (
        <div className="sf-success">Verified — example solution passes everything and the starter code fails.</div>
      ) : (
        <div className="sf-error">{report.error}</div>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <p className="sf-label">Example solution</p>
          <ContractTestResults result={report.solution} title="Example solution" />
        </div>
        <div>
          <p className="sf-label">Starter code</p>
          <ContractTestResults result={report.starter} title="Starter code" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function ContractForm() {
  const { id }   = useParams();
  const isEdit   = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [busy,    setBusy]    = useState(null);  // "verify" | "save" | null
  const [error,   setError]   = useState(null);
  const [report,  setReport]  = useState(null);
  const [aiOpen,  setAiOpen]  = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getContract(id)
      .then((c) => setForm({
        title:            c.title,
        description:      c.description,
        topic:            c.topic ?? "",
        difficulty:       c.difficulty,
        time_limit_ms:    c.time_limit_ms,
        memory_limit_mb:  c.memory_limit_mb,
        starter_code:     c.starter_code,
        example_solution: c.example_solution ?? "",
        public_tests:     c.public_tests,
        hidden_tests:     c.hidden_tests ?? "",
      }))
      .catch(() => setError("Failed to load contract."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const payload = () => ({
    ...form,
    language:        "python",
    time_limit_ms:   Number(form.time_limit_ms),
    memory_limit_mb: Number(form.memory_limit_mb),
  });

  const handleVerify = async () => {
    setBusy("verify");
    setError(null);
    setReport(null);
    try {
      setReport(await verifyContract(payload()));
    } catch (err) {
      setError(err?.response?.data?.error ?? "Verification failed.");
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    setBusy("save");
    setError(null);
    setReport(null);
    try {
      if (isEdit) await updateContract(id, payload());
      else        await createContract(payload());
      navigate("/admin");
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.error ?? "Failed to save contract.");
      if (data?.verification) setReport(data.verification);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-32">
        <div className="sf-spinner" />
        <span className="text-sub text-sm">Loading contract…</span>
      </div>
    );
  }

  const selectedDiff = DIFFICULTIES.find((d) => d.value === form.difficulty);

  return (
    <>
    <div className="space-y-8 w-full" style={{ maxWidth: "1100px" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{isEdit ? "Edit Contract" : "Create Contract"}</h1>
          <p className="text-sub text-sm" style={{ maxWidth: "44rem" }}>
            A contract is an exercise graded by Python <code>unittest</code> suites instead of fixed input/output —
            the solver implements an API (classes, functions, a small system) and the tests exercise it.
            Saving re-verifies it: the example solution must pass every test and the starter code must fail at least one.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isEdit && user?.role === "admin" && (
            <button type="button" onClick={() => setAiOpen(true)} className="sf-btn-secondary" style={{ width: "auto" }}>
              ✦ AI Assistant
            </button>
          )}
          <button type="button" onClick={() => navigate("/admin")} className="sf-btn-ghost" style={{ width: "auto" }}>
            ← Back to Admin
          </button>
        </div>
      </div>

      {/* ── Basics ── */}
      <div>
        <SectionDivider title="Basics" />
        <div className="space-y-4">
          <div>
            <FieldLabel required>Title</FieldLabel>
            <input className="sf-input" maxLength={200} placeholder="e.g. Transaction Ledger" value={form.title} onChange={(e) => setField("title", e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Topic</FieldLabel>
              <input className="sf-input" maxLength={60} placeholder="e.g. OOP Design, Caching, Graphs, Parsing" value={form.topic} onChange={(e) => setField("topic", e.target.value)} />
            </div>
            <div>
              <FieldLabel required>Difficulty</FieldLabel>
              <DifficultyPicker value={form.difficulty} onChange={(v) => setField("difficulty", v)} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel required hint="Default for every test (50–5000).">Time limit (ms)</FieldLabel>
              <input type="number" min={50} max={5000} className="sf-input" value={form.time_limit_ms} onChange={(e) => setField("time_limit_ms", e.target.value)} />
            </div>
            <div>
              <FieldLabel required hint="Peak memory growth per test (8–512). Data built in setUpClass doesn't count.">Memory limit (MB)</FieldLabel>
              <input type="number" min={8} max={512} className="sf-input" value={form.memory_limit_mb} onChange={(e) => setField("memory_limit_mb", e.target.value)} />
            </div>
            <div className="glass-card p-4 text-center" style={{ border: "1px solid var(--color-green-border)", alignSelf: "end" }}>
              <p className="text-green text-2xl font-bold">{selectedDiff?.xp ?? 0}</p>
              <p className="text-sub text-xs mt-0.5" style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em", textTransform: "uppercase" }}>XP Reward</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Spec ── */}
      <div>
        <SectionDivider title="Specification" />
        <div className="space-y-4">
          <div>
            <FieldLabel required hint="Markdown. Spell out every class/method/function signature, return type and exception the tests rely on — hidden tests can only check what the spec promises.">Description</FieldLabel>
            <textarea
              className="sf-input"
              rows={10}
              style={{ resize: "vertical", lineHeight: 1.7 }}
              placeholder={"Context of the problem…\n\n## API\n- `class Ledger`\n  - `deposit(account: str, amount: int) -> None` — raises `ValueError` if amount <= 0\n\n## Rules\n…"}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>
          <CodeField
            label="Starter code"
            hint="What the solver's editor starts with (solution.py). Stubs that raise NotImplementedError work well."
            value={form.starter_code}
            placeholder={PLACEHOLDER.starter_code}
            onChange={(v) => setField("starter_code", v)}
          />
          <CodeField
            label="Example solution"
            hint="Reference implementation. Admins/moderators only — used to verify the tests."
            value={form.example_solution}
            placeholder={PLACEHOLDER.example_solution}
            onChange={(v) => setField("example_solution", v)}
          />
        </div>
      </div>

      {/* ── Tests ── */}
      <div>
        <SectionDivider title="Tests" />
        <div className="space-y-4">
          <CodeField
            label="Public tests"
            hint="Shown to solvers and run by “Run tests”. Import from `solution`; failures show full assertion output."
            value={form.public_tests}
            placeholder={PLACEHOLDER.public_tests}
            onChange={(v) => setField("public_tests", v)}
            minHeight="260px"
          />
          <CodeField
            label="Hidden tests"
            hint="Run only on Submit. Solvers see each test's name, docstring and pass/fail — never its source or assertion message. Use `@limits(time_ms=…, memory_mb=…)` from `contract` for per-test limits, and build large inputs in `setUpClass` — it runs outside the limits."
            value={form.hidden_tests}
            placeholder={PLACEHOLDER.hidden_tests}
            onChange={(v) => setField("hidden_tests", v)}
            minHeight="260px"
          />
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="space-y-4">
        {error && !report && <div className="sf-error">{error}</div>}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="sf-btn-secondary" style={{ width: "auto" }} onClick={handleVerify} disabled={!!busy}>
            {busy === "verify" ? "Verifying…" : "Verify"}
          </button>
          <button className="sf-btn" style={{ width: "auto" }} onClick={handleSave} disabled={!!busy}>
            {busy === "save" ? "Verifying & saving…" : isEdit ? "Save Changes" : "Publish Contract"}
          </button>
        </div>
        <VerificationReport report={report} />
      </div>
    </div>

    {aiOpen && (
      <AiAssistantModal
        initialDifficulty={form.difficulty}
        onClose={() => setAiOpen(false)}
        onApply={(generated) => {
          setForm({
            title:            generated.title,
            description:      generated.description,
            topic:            generated.topic ?? "",
            difficulty:       generated.difficulty,
            time_limit_ms:    generated.time_limit_ms,
            memory_limit_mb:  generated.memory_limit_mb,
            starter_code:     generated.starter_code,
            example_solution: generated.example_solution,
            public_tests:     generated.public_tests,
            hidden_tests:     generated.hidden_tests,
          });
          setError(null);
          setReport(generated.verification ?? null);
        }}
      />
    )}
    </>
  );
}

/* ── AI Assistant modal ──────────────────────────────────────────────────── */

function AiAssistantModal({ initialDifficulty, onClose, onApply }) {
  const [difficulty,  setDifficulty]  = useState(initialDifficulty);
  const [description, setDescription] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [result,      setResult]      = useState(null);  // verification report of the last draft

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const generated = await generateContractWithAI({ difficulty, description });
      onApply(generated);
      setResult(generated.verification ?? { ok: false, error: "Could not reach the execution engine to verify the draft." });
    } catch (err) {
      setError(err.response?.data?.error ?? "Something went wrong. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
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
          <span className="term-title">AI Assistant — Contracts</span>
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
            Drafts a full Python contract — spec, starter code, example solution, public and hidden unit tests,
            and limits — then verifies it in the sandbox. Nothing is published until you save; review everything first.
          </p>

          <div>
            <FieldLabel required>Difficulty</FieldLabel>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} showXp={false} />
          </div>

          <div>
            <FieldLabel>Topic / short description (optional)</FieldLabel>
            <textarea
              className="sf-input"
              placeholder="e.g. a rate limiter, an LRU cache, a bank ledger with transfers, Dijkstra on a city map, an expression parser…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && <div className="sf-error">{error}</div>}

          {result && !error && (
            result.ok ? (
              <div className="sf-success">
                Generated ✓ — the example solution passes all {result.solution.total} tests and the starter code fails.
              </div>
            ) : (
              <div className="sf-error">
                Generated, but verification failed: {result.error} — the full report is on the form; fix it or regenerate.
              </div>
            )
          )}

          <button type="button" onClick={handleGenerate} className="sf-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="sf-spinner" />
                Drafting & verifying contract…
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
