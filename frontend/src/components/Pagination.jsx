export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const left  = Math.max(1, page - 2);
  const right = Math.min(totalPages, page + 2);
  if (left > 1) pages.push(1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");
  if (right < totalPages) pages.push(totalPages);

  const base = {
    minWidth: "2rem", height: "2rem", padding: "0 0.5rem",
    borderRadius: "0.375rem", fontFamily: "var(--font-heading)",
    fontSize: "0.718rem", fontWeight: 700, letterSpacing: "0.06em",
    cursor: "pointer", transition: "all 0.15s", border: "1px solid",
  };
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        style={{ ...base, borderColor: "rgba(255,255,255,0.10)", background: "transparent", color: page === 1 ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.50)", cursor: page === 1 ? "not-allowed" : "pointer" }}>←</button>
      {pages.map((p, i) =>
        p === "…"
          ? <span key={`e${i}`} style={{ color: "var(--color-text-faint)", fontSize: "0.77rem", padding: "0 0.25rem" }}>…</span>
          : <button key={p} onClick={() => onChange(p)} style={{ ...base, borderColor: p === page ? "var(--color-green-border)" : "rgba(255,255,255,0.08)", background: p === page ? "var(--color-green-dim)" : "transparent", color: p === page ? "var(--color-green)" : "rgba(255,255,255,0.45)" }}>{p}</button>
      )}
      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
        style={{ ...base, borderColor: "rgba(255,255,255,0.10)", background: "transparent", color: page === totalPages ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.50)", cursor: page === totalPages ? "not-allowed" : "pointer" }}>→</button>
    </div>
  );
}
