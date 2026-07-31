import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getQuests } from "../services/questService";

/* ── Config ─────────────────────────────────────────────────────────────── */

const LANG_CONFIG = {
  python:     { name: "Python",     description: "Data structures, algorithms, automation & beyond" },
  javascript: { name: "JavaScript", description: "Build the modern web, from DOM to async patterns"  },
  java:       { name: "Java",       description: "Enterprise patterns, OOP, Android & more"          },
  csharp:     { name: "C#",         description: "Games, desktop apps, cloud & systems programming"  },
};

const DIFF_META = {
  shallow: { label: "Shallow", color: "var(--color-green)",       border: "var(--color-green-border)", bg: "var(--color-green-dim)",  bar: "var(--color-green)" },
  cryptic: { label: "Cryptic", color: "var(--color-amber)",       border: "var(--color-amber-border)", bg: "var(--color-amber-dim)",  bar: "var(--color-amber)" },
  abyssal: { label: "Abyssal", color: "var(--color-red-bright)",  border: "var(--color-red-border)",   bg: "var(--color-red-dim)",    bar: "var(--color-red-bright)" },
};

const DIFF_ORDER = { shallow: 0, cryptic: 1, abyssal: 2 };
const FILTERS    = ["all", "shallow", "cryptic", "abyssal"];
const PAGE_SIZE  = 20;

/* ── Sub-components ──────────────────────────────────────────────────────── */

function DiffBadge({ difficulty }) {
  const m = DIFF_META[difficulty] ?? DIFF_META.shallow;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.18rem 0.55rem",
        borderRadius: "3px",
        border: `1px solid ${m.border}`,
        background: m.bg,
        color: m.color,
        fontFamily: "var(--font-heading)",
        fontSize: "0.60rem",
        fontWeight: 700,
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "1px", background: m.bar, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function FilterPill({ value, active, count, onClick }) {
  const label = value === "all" ? "All" : (DIFF_META[value]?.label ?? value);
  const m     = DIFF_META[value];
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.32rem 0.8rem",
        borderRadius: "3px",
        border: active
          ? value === "all"
            ? "1px solid var(--color-green-border)"
            : `1px solid ${m?.border ?? "var(--color-border-2)"}`
          : "1px solid var(--color-border-2)",
        background: active
          ? value === "all" ? "var(--color-green-dim)" : (m?.bg ?? "rgba(255,255,255,0.05)")
          : "transparent",
        color: active
          ? value === "all" ? "var(--color-green)" : (m?.color ?? "var(--color-text-secondary)")
          : "var(--color-text-tertiary)",
        fontFamily: "var(--font-heading)",
        fontSize: "0.58rem",
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {count !== undefined && (
        <span
          style={{
            fontSize: "0.55rem",
            fontWeight: 700,
            opacity: active ? 0.85 : 0.45,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function QuestRow({ quest, language, index }) {
  const m       = DIFF_META[quest.difficulty] ?? DIFF_META.shallow;
  const tcCount = quest.test_cases?.length ?? 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.7rem 1rem",
        borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
        borderLeft: `3px solid ${m.bar}`,
        transition: "background 0.12s",
        minHeight: "52px",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* Difficulty badge */}
      <div style={{ flexShrink: 0, width: "80px" }}>
        <DiffBadge difficulty={quest.difficulty} />
      </div>

      {/* Title + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--color-text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: "0.1rem",
          }}
        >
          {quest.title}
        </p>
        <p
          style={{
            fontSize: "0.7rem",
            color: "var(--color-text-tertiary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {quest.description}
        </p>
      </div>

      {/* Meta chips */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexShrink: 0,
        }}
      >
        {/* XP */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <svg style={{ width: 12, height: 12, color: "var(--color-green)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-green)", fontFamily: "var(--font-heading)" }}>
            {quest.xp_reward}
          </span>
        </div>

        {/* Test cases */}
        <span
          style={{
            fontSize: "0.68rem",
            color: "var(--color-text-tertiary)",
            fontFamily: "var(--font-heading)",
            whiteSpace: "nowrap",
          }}
        >
          {tcCount} test{tcCount !== 1 ? "s" : ""}
        </span>

        {/* Author */}
        {quest.author && (
          <span
            style={{
              fontSize: "0.65rem",
              color: "var(--color-text-faint)",
              whiteSpace: "nowrap",
              display: "none",
              fontStyle: "italic",
            }}
            className="author-col"
          >
            {quest.author}
          </span>
        )}

        {/* Action */}
        <Link to={`/quests/${language}/${quest.id}`} style={{ textDecoration: "none" }}>
          <button
            className="sf-btn-ghost"
            style={{
              width: "auto",
              padding: "0.28rem 0.75rem",
              fontSize: "0.58rem",
              color: "var(--color-green)",
              borderColor: "var(--color-green-border)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-green-dim)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Start →
          </button>
        </Link>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const btn = (content, key, active, disabled, onClick) => (
    <button
      key={key}
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: "30px",
        height: "30px",
        padding: "0 0.4rem",
        borderRadius: "4px",
        border: active
          ? "1px solid var(--color-green-border)"
          : "1px solid var(--color-border-2)",
        background: active ? "var(--color-green-dim)" : "transparent",
        color: active
          ? "var(--color-green)"
          : disabled
          ? "var(--color-text-faint)"
          : "var(--color-text-secondary)",
        fontFamily: "var(--font-heading)",
        fontSize: "0.62rem",
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.12s",
      }}
    >
      {content}
    </button>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", paddingTop: "1rem" }}>
      {btn("‹", "prev", false, page === 1, () => onChange(page - 1))}
      {pages.map((p, i) =>
        p === "…"
          ? btn("…", `ellipsis-${i}`, false, true, null)
          : btn(p, p, p === page, false, () => onChange(p))
      )}
      {btn("›", "next", false, page === totalPages, () => onChange(page + 1))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function LanguageQuestsPage() {
  const { language } = useParams();
  const navigate     = useNavigate();
  const langCfg      = LANG_CONFIG[language];

  const [quests, setQuests]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);

  useEffect(() => {
    if (!langCfg) { navigate("/", { replace: true }); return; }

    setLoading(true);
    setFilter("all");
    setSearch("");
    setPage(1);
    getQuests({ language })
      .then((data) =>
        setQuests(
          [...data].sort(
            (a, b) => (DIFF_ORDER[a.difficulty] ?? 9) - (DIFF_ORDER[b.difficulty] ?? 9)
          )
        )
      )
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }, [language, langCfg, navigate]);

  const countsByDiff = useMemo(
    () =>
      quests.reduce((acc, q) => {
        acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1;
        return acc;
      }, {}),
    [quests]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quests.filter((quest) => {
      if (filter !== "all" && quest.difficulty !== filter) return false;
      if (!q) return true;
      return (
        quest.title.toLowerCase().includes(q) ||
        (quest.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [quests, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilter = (f) => { setFilter(f); setPage(1); };
  const handleSearch = (v) => { setSearch(v);  setPage(1); };

  if (!langCfg) return null;

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div>
        <Link
          to="/"
          className="text-sub text-xs flex items-center gap-1.5 mb-5 w-fit"
          style={{ fontFamily: "var(--font-heading)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "")}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          cd ~/dashboard
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="hero-eyebrow">ls ./quests --lang={language}</p>
            <h1
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                fontWeight: 700,
                color: "var(--color-text)",
                lineHeight: 1.2,
                marginBottom: "0.4rem",
              }}
            >
              {langCfg.name}
            </h1>
            <p className="text-sub" style={{ fontSize: "1rem" }}>{langCfg.description}</p>
          </div>

          {/* Diff summary + total */}
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flexShrink: 0 }}>
              {["shallow", "cryptic", "abyssal"].map((d) => {
                const m = DIFF_META[d];
                const n = countsByDiff[d] ?? 0;
                if (!n) return null;
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "1px", background: m.bar }} />
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, color: m.color }}>
                      {m.label}
                    </span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: m.color, opacity: 0.80 }}>{n}</span>
                  </div>
                );
              })}
              <div style={{ width: "1px", height: "14px", background: "var(--color-border-2)" }} />
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700, color: "var(--color-text-tertiary)" }}>
                {quests.length} total
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Search + Filters ── */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg
              style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--color-text-tertiary)", pointerEvents: "none" }}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
            </svg>
            <input
              type="text"
              placeholder="grep quests…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="sf-input"
              style={{ padding: "0.55rem 0.85rem 0.55rem 2.4rem" }}
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-text-tertiary)", fontSize: "1rem", lineHeight: 1, padding: "0.1rem",
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Filter pills */}
          {quests.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <FilterPill
                  key={f}
                  value={f}
                  active={filter === f}
                  count={f === "all" ? quests.length : (countsByDiff[f] ?? 0)}
                  onClick={() => handleFilter(f)}
                />
              ))}
              {(search || filter !== "all") && (
                <span style={{ fontSize: "0.65rem", color: "var(--color-text-tertiary)", marginLeft: "0.25rem" }}>
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Quest list ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20">
          <div className="sf-spinner" style={{ width: "20px", height: "20px" }} />
          <span className="text-sub text-sm">Loading quests…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.5rem" }}
        >
          {quests.length === 0 ? (
            <>
              <p className="text-sub text-sm">No quests available for {langCfg.name} yet.</p>
              <p className="text-dim text-xs">Check back soon — new quests are being forged.</p>
            </>
          ) : (
            <>
              <p className="text-sub text-sm">No quests match your search.</p>
              <button
                onClick={() => { handleSearch(""); handleFilter("all"); }}
                style={{ marginTop: "0.5rem", fontSize: "0.65rem", color: "var(--color-green)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-heading)" }}
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* List header row */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.4rem 1rem 0.4rem calc(1rem + 3px)",
                marginBottom: "0.25rem",
              }}
            >
              <span style={{ flexShrink: 0, width: "80px", fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700, color: "var(--color-text-faint)" }}>
                Difficulty
              </span>
              <span style={{ flex: 1, fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700, color: "var(--color-text-faint)" }}>
                Quest
              </span>
              <span style={{ flexShrink: 0, width: "auto", fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700, color: "var(--color-text-faint)", paddingRight: "calc(70px + 1rem)" }}>
                Reward
              </span>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              {pageSlice.map((quest, i) => (
                <QuestRow key={quest.id} quest={quest} language={language} index={i} />
              ))}
            </div>
          </div>

          {/* Pagination + count */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
            <span style={{ fontSize: "0.62rem", color: "var(--color-text-faint)", fontFamily: "var(--font-heading)" }}>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} quests
            </span>
          </div>
        </>
      )}

    </div>
  );
}
