import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getContracts, getContractTopics } from "../services/contractService";
import Pagination from "../components/Pagination";

/* ── Config ─────────────────────────────────────────────────────────────── */

const DIFF_META = {
  junior: { label: "Junior", color: "var(--color-green)",      border: "var(--color-green-border)", bg: "var(--color-green-dim)", bar: "var(--color-green)" },
  mid:    { label: "Mid",    color: "var(--color-amber)",      border: "var(--color-amber-border)", bg: "var(--color-amber-dim)", bar: "var(--color-amber)" },
  senior: { label: "Senior", color: "var(--color-red-bright)", border: "var(--color-red-border)",   bg: "var(--color-red-dim)",   bar: "var(--color-red-bright)" },
};

const FILTERS   = ["all", "junior", "mid", "senior"];
const PAGE_SIZE = 20;

const pillStyle = (active, m) => ({
  display: "inline-flex", alignItems: "center", gap: "0.35rem",
  padding: "0.32rem 0.8rem", borderRadius: "3px",
  border: active ? `1px solid ${m?.border ?? "var(--color-green-border)"}` : "1px solid var(--color-border-2)",
  background: active ? (m?.bg ?? "var(--color-green-dim)") : "transparent",
  color: active ? (m?.color ?? "var(--color-green)") : "var(--color-text-tertiary)",
  fontFamily: "var(--font-heading)", fontSize: "0.692rem", fontWeight: 700,
  cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
});

/* ── Sub-components ──────────────────────────────────────────────────────── */

function DiffBadge({ difficulty }) {
  const m = DIFF_META[difficulty] ?? DIFF_META.junior;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.28rem",
        padding: "0.2rem 0.6rem", borderRadius: "3px",
        border: `1px solid ${m.border}`, background: m.bg, color: m.color,
        fontFamily: "var(--font-heading)", fontSize: "0.705rem", fontWeight: 700,
        letterSpacing: "0.10em", textTransform: "uppercase",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.color }} />
      {m.label}
    </span>
  );
}

function ContractRow({ contract, index }) {
  const m = DIFF_META[contract.difficulty] ?? DIFF_META.junior;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
        padding: "0.7rem 1rem", minHeight: "52px",
        borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
        borderLeft: `3px solid ${m.bar}`,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ flexShrink: 0, width: "80px" }}>
        <DiffBadge difficulty={contract.difficulty} />
      </div>

      <Link to={`/contracts/${contract.id}`} style={{ flex: "1 1 14rem", minWidth: 0, textDecoration: "none" }}>
        <p
          style={{
            fontFamily: "var(--font-heading)", fontSize: "0.835rem", fontWeight: 700,
            color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.4rem",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {contract.solved && (
            <svg style={{ width: 13, height: 13, color: "var(--color-green)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{contract.title}</span>
        </p>
        <p style={{ fontSize: "0.738rem", color: "var(--color-text-tertiary)", marginTop: "0.1rem" }}>
          {[contract.topic, `${contract.time_limit_ms} ms / test`, `${contract.memory_limit_mb} MB`].filter(Boolean).join(" · ")}
        </p>
      </Link>

      <span style={{ flexShrink: 0, fontFamily: "var(--font-heading)", fontSize: "0.757rem", fontWeight: 700, color: "var(--color-green)" }}>
        {contract.xp_reward} XP
      </span>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ContractsPage() {
  const [items, setItems]             = useState([]);
  const [topics, setTopics]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [topic, setTopic]             = useState("");
  const [sort, setSort]               = useState("newest");
  const [unsolved, setUnsolved]       = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const debounceRef = useRef(null);

  useEffect(() => {
    getContractTopics().then(setTopics).catch(() => setTopics([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = { page, per_page: PAGE_SIZE, sort };
    if (filter !== "all") params.difficulty = filter;
    if (topic) params.topic = topic;
    if (search) params.search = search;
    if (unsolved) params.unsolved = "true";

    getContracts(params)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setPages(1);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filter, topic, sort, unsolved, search, page]);

  function handleSearchInput(v) {
    setSearchInput(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(v); setPage(1); }, 300);
  }

  function clearFilters() {
    clearTimeout(debounceRef.current);
    setSearchInput("");
    setSearch("");
    setFilter("all");
    setTopic("");
    setUnsolved(false);
    setPage(1);
  }

  const filtered = !!(search || topic || unsolved || filter !== "all");

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div>
        <Link
          to="/"
          className="text-sub text-xs flex items-center gap-1.5 mb-5 w-fit"
          style={{ fontFamily: "var(--font-heading)", textDecoration: "none" }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          cd ~/dashboard
        </Link>

        <div>
            <p className="hero-eyebrow">ls ./contracts</p>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700, color: "var(--color-text)", lineHeight: 1.2, marginBottom: "0.4rem" }}>
              Contracts
            </h1>
            <p className="text-sub" style={{ fontSize: "1rem", maxWidth: "44rem" }}>
              Bigger exercises built to a spec — classes, APIs, algorithms, systems. Instead of matching
              output, your code is graded by unit tests: structure, behaviour, edge cases, and per-test
              time &amp; memory limits.
            </p>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        <input
          type="text"
          placeholder="grep contracts…"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="sf-input"
        />
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={pillStyle(filter === f, DIFF_META[f])}>
              {f === "all" ? "All" : DIFF_META[f].label}
            </button>
          ))}
          <div style={{ width: "1px", height: "16px", background: "var(--color-border-2)", margin: "0 0.15rem" }} />
          <button
            onClick={() => { setUnsolved((v) => !v); setPage(1); }}
            style={pillStyle(unsolved, { border: "var(--color-amber-border)", bg: "var(--color-amber-dim)", color: "var(--color-amber)" })}
          >
            Unsolved only
          </button>
          {topics.length > 0 && (
            <select
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setPage(1); }}
              className="sf-input"
              style={{ width: "auto", padding: "0.32rem 1.75rem 0.32rem 0.7rem", fontSize: "0.692rem", fontFamily: "var(--font-heading)", fontWeight: 700 }}
            >
              <option value="">All topics</option>
              {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="sf-input"
            style={{ width: "auto", padding: "0.32rem 1.75rem 0.32rem 0.7rem", fontSize: "0.692rem", fontFamily: "var(--font-heading)", fontWeight: 700 }}
          >
            <option value="newest">Newest</option>
            <option value="xp_desc">Highest XP</option>
            <option value="xp_asc">Lowest XP</option>
          </select>
          {filtered && (
            <span style={{ fontSize: "0.738rem", color: "var(--color-text-tertiary)", marginLeft: "0.25rem" }}>
              {total} result{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="sf-spinner" style={{ width: "20px", height: "20px" }} />
          <span className="text-sub text-sm">Loading contracts…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card" style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.5rem" }}>
          {filtered ? (
            <>
              <p className="text-sub text-sm">No contracts match your filters.</p>
              <button onClick={clearFilters} style={{ marginTop: "0.5rem", fontSize: "0.738rem", color: "var(--color-green)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-heading)" }}>
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-sub text-sm">No contracts published yet.</p>
              <p className="text-dim text-xs">Check back soon — new contracts are being drafted.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {items.map((c, i) => (
              <ContractRow key={c.id} contract={c} index={i} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <Pagination page={page} totalPages={pages} onChange={setPage} />
            <span style={{ fontSize: "0.718rem", color: "var(--color-text-faint)", fontFamily: "var(--font-heading)" }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} contracts
            </span>
          </div>
        </>
      )}
    </div>
  );
}
