import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { useAuth } from "../context/AuthContext";
import {
  createContract, deleteContract, getContract, updateContract, verifyContract,
} from "../services/contractService";
import ContractTestResults from "../components/ContractTestResults";

/* ── Constants ──────────────────────────────────────────────────────────── */

const DIFFICULTIES = [
  { value: "junior", label: "Junior", xp: 60  },
  { value: "mid",    label: "Mid",    xp: 120 },
  { value: "senior", label: "Senior", xp: 200 },
];

const TEMPLATE_STARTER = `class BST:
    """Binary search tree of integers. Duplicates go to the right subtree."""

    def insert(self, value: int) -> None:
        raise NotImplementedError

    def contains(self, value: int) -> bool:
        raise NotImplementedError

    def inorder(self) -> list[int]:
        raise NotImplementedError
`;

const TEMPLATE_PUBLIC = `import unittest
from solution import BST


class TestStructure(unittest.TestCase):
    def test_has_required_methods(self):
        """BST defines insert(), contains() and inorder()"""
        for name in ("insert", "contains", "inorder"):
            self.assertTrue(callable(getattr(BST, name, None)), f"BST.{name}() is missing")


class TestBehaviour(unittest.TestCase):
    def test_inorder_is_sorted(self):
        tree = BST()
        for v in [5, 3, 8, 1, 4]:
            tree.insert(v)
        self.assertEqual(tree.inorder(), [1, 3, 4, 5, 8])
`;

const TEMPLATE_HIDDEN = `import random
import unittest
from contract import limits      # per-test override of the contract-wide limits
from solution import BST


class TestHidden(unittest.TestCase):
    def test_contains_missing(self):
        tree = BST()
        tree.insert(1)
        self.assertFalse(tree.contains(2))

    @limits(time_ms=2000, memory_mb=48)
    def test_large_random_input(self):
        """50k random inserts stay O(n log n) on average"""
        values = random.Random(42).sample(range(10**6), 50_000)
        tree = BST()
        for v in values:
            tree.insert(v)
        self.assertEqual(tree.inorder(), sorted(values))
`;

const EMPTY_FORM = {
  title:            "",
  description:      "",
  topic:            "",
  difficulty:       "mid",
  time_limit_ms:    1000,
  memory_limit_mb:  64,
  starter_code:     TEMPLATE_STARTER,
  example_solution: "",
  public_tests:     TEMPLATE_PUBLIC,
  hidden_tests:     TEMPLATE_HIDDEN,
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

function CodeField({ label, hint, value, onChange, minHeight = "220px" }) {
  return (
    <div>
      <FieldLabel required hint={hint}>{label}</FieldLabel>
      <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
        <CodeMirror
          value={value}
          onChange={onChange}
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

  const [form,          setForm]          = useState(EMPTY_FORM);
  const [loading,       setLoading]       = useState(isEdit);
  const [busy,          setBusy]          = useState(null);  // "verify" | "save" | "delete" | null
  const [error,         setError]         = useState(null);
  const [report,        setReport]        = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      const saved = isEdit ? await updateContract(id, payload()) : await createContract(payload());
      navigate(`/contracts/${saved.id}`);
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.error ?? "Failed to save contract.");
      if (data?.verification) setReport(data.verification);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy("delete");
    try {
      await deleteContract(id);
      navigate("/contracts");
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to delete contract.");
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
    <div className="space-y-8 w-full" style={{ maxWidth: "1100px" }}>

      <div>
        <Link
          to={isEdit ? `/contracts/${id}` : "/contracts"}
          className="text-sub text-xs flex items-center gap-1.5 mb-5 w-fit"
          style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}
        >
          ← {isEdit ? "Back to contract" : "Contracts"}
        </Link>
        <h1 className="text-3xl font-bold text-white mb-1">{isEdit ? "Edit Contract" : "New Contract"}</h1>
        <p className="text-sub text-sm">
          Contracts are graded by Python <code>unittest</code> suites. Saving re-verifies the contract: the example
          solution must pass every test and the starter code must fail at least one.
        </p>
      </div>

      {/* ── Basics ── */}
      <div>
        <SectionDivider title="Basics" />
        <div className="space-y-4">
          <div>
            <FieldLabel required>Title</FieldLabel>
            <input className="sf-input" maxLength={200} placeholder="e.g. Binary Search Tree" value={form.title} onChange={(e) => setField("title", e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Topic</FieldLabel>
              <input className="sf-input" maxLength={60} placeholder="e.g. BST, Graphs, Dynamic Programming" value={form.topic} onChange={(e) => setField("topic", e.target.value)} />
            </div>
            <div>
              <FieldLabel required>Difficulty</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setField("difficulty", d.value)}
                    style={{
                      padding: "0.55rem 0.5rem", borderRadius: "0.5rem",
                      border: form.difficulty === d.value ? "1px solid var(--color-green-border)" : "1px solid rgba(255,255,255,0.08)",
                      background: form.difficulty === d.value ? "var(--color-green-dim)" : "rgba(255,255,255,0.03)",
                      color: form.difficulty === d.value ? "var(--color-green)" : "rgba(255,255,255,0.50)",
                      fontFamily: "var(--font-heading)", fontSize: "0.718rem", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                    }}
                  >
                    {d.label}
                    <div style={{ fontSize: "0.738rem", fontFamily: "var(--font-body)", marginTop: "0.2rem", opacity: 0.7 }}>{d.xp} XP</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel required hint="Default for every test (50–5000).">Time limit (ms)</FieldLabel>
              <input type="number" min={50} max={5000} className="sf-input" value={form.time_limit_ms} onChange={(e) => setField("time_limit_ms", e.target.value)} />
            </div>
            <div>
              <FieldLabel required hint="Peak Python allocations per test (8–512).">Memory limit (MB)</FieldLabel>
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
            <FieldLabel required hint="Markdown. Spell out the exact class/method names and signatures the tests rely on.">Description</FieldLabel>
            <textarea className="sf-input" rows={10} style={{ resize: "vertical", lineHeight: 1.7 }} value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </div>
          <CodeField
            label="Starter code"
            hint="What the solver's editor starts with (solution.py). Stubs that raise NotImplementedError work well."
            value={form.starter_code}
            onChange={(v) => setField("starter_code", v)}
          />
          <CodeField
            label="Example solution"
            hint="Reference implementation. Admins/moderators only — used to verify the tests."
            value={form.example_solution}
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
            onChange={(v) => setField("public_tests", v)}
            minHeight="260px"
          />
          <CodeField
            label="Hidden tests"
            hint="Run only on Submit. Solvers see each test's name, docstring and pass/fail — never its source or assertion message. Use `@limits(time_ms=…, memory_mb=…)` from `contract` for per-test limits."
            value={form.hidden_tests}
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
            {busy === "save" ? "Verifying & saving…" : isEdit ? "Save changes" : "Publish contract"}
          </button>
          {isEdit && user?.role === "admin" && (
            confirmDelete ? (
              <>
                <button className="sf-btn-danger" style={{ width: "auto", marginLeft: "auto" }} onClick={handleDelete} disabled={!!busy}>
                  {busy === "delete" ? "Deleting…" : "Confirm delete"}
                </button>
                <button className="sf-btn-ghost" style={{ width: "auto" }} onClick={() => setConfirmDelete(false)} disabled={!!busy}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="sf-btn-danger" style={{ width: "auto", marginLeft: "auto" }} onClick={() => setConfirmDelete(true)} disabled={!!busy}>
                Delete
              </button>
            )
          )}
        </div>
        <VerificationReport report={report} />
      </div>
    </div>
  );
}
