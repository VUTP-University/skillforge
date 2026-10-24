import { useState } from "react";

/* Per-test report for a Contract run — shared by the solve page (run/submit)
   and the author form (verification). Hidden-suite entries arrive from the
   API without message/stdout, so they render as name + status + metrics. */

const STATUS_META = {
  passed:  { label: "PASS",  color: "var(--color-green)",      border: "var(--color-green-border)", bg: "var(--color-green-dim)" },
  failed:  { label: "FAIL",  color: "var(--color-red-bright)", border: "var(--color-red-border)",   bg: "var(--color-red-dim)"   },
  error:   { label: "ERROR", color: "var(--color-red-bright)", border: "var(--color-red-border)",   bg: "var(--color-red-dim)"   },
  timeout: { label: "TLE",   color: "var(--color-amber)",      border: "var(--color-amber-border)", bg: "var(--color-amber-dim)" },
  memory:  { label: "MLE",   color: "var(--color-amber)",      border: "var(--color-amber-border)", bg: "var(--color-amber-dim)" },
  skipped: { label: "SKIP",  color: "var(--color-text-tertiary)", border: "var(--color-border-2)", bg: "transparent" },
};

const RUN_ERROR_LABEL = {
  import_error: "Import / Structure Error",
  timeout:      "Run Timed Out",
  crash:        "Runtime Crash",
};

const headingStyle = {
  fontFamily: "var(--font-heading)", fontSize: "0.705rem", fontWeight: 700,
  letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-text-tertiary)",
};

const preStyle = {
  margin: 0, padding: "0.6rem 0.85rem", borderRadius: "8px",
  background: "rgba(0,0,0,0.30)", border: "1px solid rgba(255,255,255,0.07)",
  fontFamily: "monospace", fontSize: "0.79rem", color: "rgba(255,255,255,0.75)",
  whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.55,
};

function formatMemory(kb) {
  if (kb == null) return null;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function TestRow({ test }) {
  const m = STATUS_META[test.status] ?? STATUS_META.error;
  const hasDetail = !!(test.message || test.stdout);
  const [open, setOpen] = useState(test.status !== "passed" && hasDetail);
  const hidden = test.suite === "hidden";

  return (
    <div style={{ borderRadius: "10px", border: `1px solid ${m.border}`, background: m.bg, overflow: "hidden" }}>
      <button
        onClick={() => hasDetail && setOpen((p) => !p)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap",
          padding: "0.55rem 0.9rem", background: "none", border: "none", textAlign: "left",
          cursor: hasDetail ? "pointer" : "default",
        }}
      >
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.672rem", fontWeight: 800, letterSpacing: "0.08em", color: m.color, width: "3.2rem", flexShrink: 0 }}>
          {m.label}
        </span>
        <span style={{ flex: "1 1 12rem", minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "monospace", fontSize: "0.802rem", color: "rgba(255,255,255,0.85)", wordBreak: "break-all" }}>
            {test.name}
          </span>
          {test.doc && (
            <span style={{ display: "block", fontSize: "0.738rem", color: "var(--color-text-tertiary)", marginTop: "0.1rem" }}>
              {test.doc}
            </span>
          )}
        </span>
        <span style={{ display: "flex", gap: "0.75rem", fontFamily: "var(--font-heading)", fontSize: "0.692rem", color: "var(--color-text-tertiary)", flexShrink: 0 }}>
          {test.duration_ms != null && <span>{test.duration_ms} ms</span>}
          {test.memory_kb != null && <span>{formatMemory(test.memory_kb)}</span>}
          {hidden && <span style={{ fontStyle: "italic", color: "var(--color-text-faint)" }}>hidden</span>}
          {hasDetail && <span>{open ? "▲" : "▼"}</span>}
        </span>
      </button>

      {open && hasDetail && (
        <div style={{ padding: "0 0.9rem 0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {test.message && <pre style={preStyle}>{test.message}</pre>}
          {test.stdout && (
            <div>
              <p style={{ ...headingStyle, fontSize: "0.65rem", marginBottom: "0.3rem" }}>stdout</p>
              <pre style={preStyle}>{test.stdout}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContractTestResults({ result, title = "Results" }) {
  if (!result) return null;

  const ok        = result.status === "ok";
  const allPassed = ok && result.total > 0 && result.passed === result.total;
  const barColor  = allPassed ? "var(--color-green)" : result.passed === 0 ? "var(--color-red-bright)" : "var(--color-amber)";
  const barPct    = result.total ? Math.round((result.passed / result.total) * 100) : 0;
  const suites    = ["public", "hidden"]
    .map((s) => ({ suite: s, tests: (result.tests ?? []).filter((t) => t.suite === s) }))
    .filter((g) => g.tests.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {ok && (
        <div className="glass-card" style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
            <span style={headingStyle}>{title}</span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.802rem", fontWeight: 700, color: barColor }}>
              {result.passed} / {result.total} passed
            </span>
          </div>
          <div style={{ height: "5px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "99px", width: `${barPct}%`, background: barColor, transition: "width 0.4s ease" }} />
          </div>
        </div>
      )}

      {!ok && (
        <div style={{ borderRadius: "10px", border: "1px solid var(--color-red-border)", background: "var(--color-red-dim)", overflow: "hidden" }}>
          <div style={{ padding: "0.55rem 0.9rem", borderBottom: "1px solid rgba(248,113,113,0.15)" }}>
            <span style={{ ...headingStyle, color: "var(--color-red-bright)" }}>
              {RUN_ERROR_LABEL[result.status] ?? "Error"}
            </span>
          </div>
          <pre style={{ ...preStyle, background: "none", border: "none", color: "rgba(255,200,200,0.85)" }}>
            {result.error}
          </pre>
        </div>
      )}

      {suites.map(({ suite, tests }) => (
        <div key={suite} style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          <p style={{ ...headingStyle, fontSize: "0.672rem" }}>
            {suite === "public" ? "Public tests" : "Hidden tests"}
          </p>
          {tests.map((t) => (
            <TestRow key={`${t.suite}.${t.class}.${t.name}`} test={t} />
          ))}
        </div>
      ))}
    </div>
  );
}
