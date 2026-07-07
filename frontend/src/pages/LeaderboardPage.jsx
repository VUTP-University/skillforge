import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../services/api";

/* ── Icons ───────────────────────────────────────────────────────────────── */

function CrownIcon({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M2 19h20v2H2v-2zM2 8l4 6 6-9 6 9 4-6v9H2V8z" />
    </svg>
  );
}

function SwordsIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" y1="14" x2="9" y2="18" />
      <line x1="7" y1="21" x2="3" y2="17" />
      <line x1="21" y1="11" x2="11" y2="21" />
    </svg>
  );
}

function ShieldIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

/* ── Constants ───────────────────────────────────────────────────────────── */

const RANK_STYLE = {
  "Novice":       { color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.05)",  border: "rgba(255,255,255,0.12)" },
  "Initiate":     { color: "#86efac",                bg: "rgba(134,239,172,0.08)", border: "rgba(134,239,172,0.22)" },
  "Apprentice":   { color: "#4ade80",                bg: "rgba(74,222,128,0.09)",  border: "rgba(74,222,128,0.26)"  },
  "Scribe":       { color: "#34d399",                bg: "rgba(52,211,153,0.09)",  border: "rgba(52,211,153,0.26)"  },
  "Acolyte":      { color: "#2dd4bf",                bg: "rgba(45,212,191,0.09)",  border: "rgba(45,212,191,0.26)"  },
  "Scholar":      { color: "#22d3ee",                bg: "rgba(34,211,238,0.09)",  border: "rgba(34,211,238,0.26)"  },
  "Artisan":      { color: "#38bdf8",                bg: "rgba(56,189,248,0.09)",  border: "rgba(56,189,248,0.26)"  },
  "Adept":        { color: "#60a5fa",                bg: "rgba(96,165,250,0.09)",  border: "rgba(96,165,250,0.26)"  },
  "Journeyman":   { color: "#818cf8",                bg: "rgba(129,140,248,0.09)", border: "rgba(129,140,248,0.26)" },
  "Crusader":     { color: "#a78bfa",                bg: "rgba(167,139,250,0.09)", border: "rgba(167,139,250,0.26)" },
  "Knight":       { color: "#c084fc",                bg: "rgba(192,132,252,0.09)", border: "rgba(192,132,252,0.26)" },
  "Champion":     { color: "#e879f9",                bg: "rgba(232,121,249,0.09)", border: "rgba(232,121,249,0.26)" },
  "Sentinel":     { color: "#f472b6",                bg: "rgba(244,114,182,0.09)", border: "rgba(244,114,182,0.26)" },
  "Warden":       { color: "#fb7185",                bg: "rgba(251,113,133,0.09)", border: "rgba(251,113,133,0.26)" },
  "Paladin":      { color: "#f97316",                bg: "rgba(249,115,22,0.09)",  border: "rgba(249,115,22,0.26)"  },
  "Sage":         { color: "#fb923c",                bg: "rgba(251,146,60,0.09)",  border: "rgba(251,146,60,0.26)"  },
  "Elder":        { color: "#fbbf24",                bg: "rgba(251,191,36,0.09)",  border: "rgba(251,191,36,0.30)"  },
  "Archmage":     { color: "#facc15",                bg: "rgba(250,204,21,0.09)",  border: "rgba(250,204,21,0.32)"  },
  "Master":       { color: "#fcd34d",                bg: "rgba(252,211,77,0.10)",  border: "rgba(252,211,77,0.38)"  },
  "Grand Master": { color: "#fef08a",                bg: "rgba(254,240,138,0.10)", border: "rgba(254,240,138,0.45)" },
};

// Podium slot metadata — rendered left-to-right as 2nd | 1st | 3rd
const SLOTS = [
  {
    dataIndex:    1,               // index in sorted array
    place:        2,
    title:        "Champion",
    Icon:         SwordsIcon,
    color:        "#94a3b8",
    border:       "rgba(148,163,184,0.30)",
    cardBg:       "rgba(148,163,184,0.06)",
    glow:         "rgba(148,163,184,0.10)",
    pedestalH:    76,
    pedestalBg:   "rgba(148,163,184,0.10)",
    pedestalBord: "rgba(148,163,184,0.20)",
    avatarSize:   62,
  },
  {
    dataIndex:    0,               // 1st place — center
    place:        1,
    title:        "Grand Champion",
    Icon:         CrownIcon,
    color:        "#fbbf24",
    border:       "rgba(251,191,36,0.40)",
    cardBg:       "rgba(251,191,36,0.06)",
    glow:         "0 0 32px rgba(251,191,36,0.18)",
    pedestalH:    108,
    pedestalBg:   "rgba(251,191,36,0.12)",
    pedestalBord: "rgba(251,191,36,0.28)",
    avatarSize:   76,
  },
  {
    dataIndex:    2,
    place:        3,
    title:        "Knight",
    Icon:         ShieldIcon,
    color:        "#c07840",
    border:       "rgba(192,120,64,0.28)",
    cardBg:       "rgba(192,120,64,0.05)",
    glow:         "rgba(192,120,64,0.08)",
    pedestalH:    52,
    pedestalBg:   "rgba(192,120,64,0.08)",
    pedestalBord: "rgba(192,120,64,0.18)",
    avatarSize:   54,
  },
];

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Avatar({ url, username, size }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      <img
        src={url}
        alt={username}
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "rgba(3,233,244,0.12)", border: "1.5px solid rgba(3,233,244,0.22)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-heading)", fontWeight: 700,
      fontSize: Math.round(size * 0.38),
      color: "var(--color-cyan)", flexShrink: 0,
    }}>
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function RankBadge({ rank }) {
  const rs = RANK_STYLE[rank] ?? RANK_STYLE["Novice"];
  return (
    <span style={{
      padding: "0.15rem 0.5rem", borderRadius: "99px",
      border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color,
      fontFamily: "var(--font-heading)", fontSize: "0.5rem", fontWeight: 700,
      letterSpacing: "0.10em", textTransform: "uppercase", flexShrink: 0,
    }}>
      {rank}
    </span>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const { user: me } = useAuth();

  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    getUsers()
      .then(r => {
        const players = (r.data ?? [])
          .filter(u => u.role === "user")
          .sort((a, b) => b.total_xp - a.total_xp);
        setEntries(players);
      })
      .catch(() => setError("Could not load the leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  const podium = entries.slice(0, 3);
  const rest   = entries.slice(3);
  const myRank = entries.findIndex(u => u.id === me?.id) + 1; // 0 if not found

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-32">
        <div className="sf-spinner" style={{ width: "22px", height: "22px" }} />
        <span className="text-sub text-sm">Summoning the legends…</span>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <svg style={{ width: 36, height: 36, color: "rgba(255,255,255,0.18)" }} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>
          {error}
        </p>
      </div>
    );
  }

  /* ── Empty ── */
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <svg style={{ width: 36, height: 36, color: "rgba(255,255,255,0.18)" }} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>
          No adventurers on record yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <div className="text-center page-enter" style={{ paddingBottom: "0.5rem" }}>
        <p className="hero-eyebrow" style={{ justifyContent: "center" }}>
          The Eternal Chronicle
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700,
            color: "#fff", letterSpacing: "0.04em", lineHeight: 1.15,
            marginBottom: "0.5rem",
          }}
        >
          Hall of Legends
        </h1>
        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>
          The mightiest adventurers in the realm
        </p>
        {myRank > 0 && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              marginTop: "0.75rem",
              padding: "0.35rem 1rem",
              borderRadius: "99px",
              background: "rgba(3,233,244,0.08)",
              border: "1px solid rgba(3,233,244,0.22)",
            }}
          >
            <svg style={{ width: 12, height: 12, color: "var(--color-cyan)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-cyan)" }}>
              Your Rank: #{myRank}
            </span>
          </div>
        )}
      </div>

      {/* ── Podium (top 3) ── */}
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-3 sm:gap-5 px-2" style={{ position: "relative" }}>
          {/* Ambient glow behind podium */}
          <div style={{
            position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
            width: "280px", height: "200px",
            background: "radial-gradient(ellipse, rgba(251,191,36,0.07) 0%, transparent 70%)",
            filter: "blur(24px)",
            pointerEvents: "none",
          }} />
          {SLOTS.map((slot) => {
            const player = podium[slot.dataIndex];
            if (!player) return null;
            const isMe = player.id === me?.id;
            return (
              <div
                key={slot.place}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 1 220px", minWidth: 0 }}
              >
                {/* Champion card */}
                <Link
                  to={`/users/${player.id}`}
                  style={{ textDecoration: "none", width: "100%" }}
                >
                  <div
                    style={{
                      background: slot.cardBg,
                      border: `1px solid ${slot.border}`,
                      borderBottom: "none",
                      borderRadius: "14px 14px 0 0",
                      padding: "1.1rem 0.75rem 1rem",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.55rem",
                      boxShadow: slot.place === 1 ? slot.glow : "none",
                      transition: "filter 0.15s",
                      outline: isMe ? `2px solid rgba(3,233,244,0.40)` : "none",
                      outlineOffset: "-2px",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.12)")}
                    onMouseLeave={e => (e.currentTarget.style.filter = "none")}
                  >
                    {/* Medal icon */}
                    <div style={{
                      width: "2rem", height: "2rem", borderRadius: "50%",
                      background: `rgba(${slot.place === 1 ? "251,191,36" : slot.place === 2 ? "148,163,184" : "192,120,64"},0.12)`,
                      border: `1px solid ${slot.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <slot.Icon size={slot.place === 1 ? 16 : 14} color={slot.color} />
                    </div>

                    {/* Avatar with colored ring */}
                    <div style={{
                      borderRadius: "50%",
                      padding: "3px",
                      background: `linear-gradient(135deg, ${slot.color}, transparent)`,
                      flexShrink: 0,
                    }}>
                      <Avatar url={player.avatar_url} username={player.username} size={slot.avatarSize} />
                    </div>

                    {/* Name */}
                    <p style={{
                      fontFamily: "var(--font-heading)", fontSize: slot.place === 1 ? "0.9rem" : "0.78rem",
                      fontWeight: 700, color: "#fff", textAlign: "center",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}>
                      {player.username}
                      {isMe && <span style={{ color: "var(--color-cyan)", fontSize: "0.6rem", marginLeft: "0.3rem" }}>you</span>}
                    </p>

                    {/* Rank badge */}
                    <RankBadge rank={player.rank} />

                    {/* XP */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <svg style={{ width: 11, height: 11, color: slot.color, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: slot.color }}>
                        {player.total_xp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Pedestal */}
                <div style={{
                  width: "100%",
                  height: slot.pedestalH,
                  background: slot.pedestalBg,
                  border: `1px solid ${slot.pedestalBord}`,
                  borderTop: "none",
                  borderRadius: "0 0 10px 10px",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "0.2rem",
                }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontSize: slot.place === 1 ? "1.6rem" : "1.25rem",
                    fontWeight: 700, color: slot.color, lineHeight: 1,
                    opacity: 0.9,
                  }}>
                    {slot.place === 1 ? "I" : slot.place === 2 ? "II" : "III"}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-heading)", fontSize: "0.48rem", fontWeight: 700,
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: slot.color, opacity: 0.65,
                  }}>
                    {slot.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Ranked list (4th+) ── */}
      {rest.length > 0 && (
        <div>
          {/* Ornate divider */}
          <div className="section-divider">
            <h2>The Order</h2>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {rest.map((player, i) => {
              const position = i + 4;
              const isMe     = player.id === me?.id;
              const rs       = RANK_STYLE[player.rank] ?? RANK_STYLE["Novice"];
              return (
                <div
                  key={player.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1.1rem",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
                    background: isMe ? "rgba(3,233,244,0.04)" : "transparent",
                    borderLeft: isMe ? "3px solid rgba(3,233,244,0.40)" : "3px solid transparent",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={e => { if (!isMe) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Position */}
                  <span style={{
                    fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700,
                    color: "rgba(255,255,255,0.22)", width: "1.8rem", textAlign: "right", flexShrink: 0,
                  }}>
                    {position}
                  </span>

                  {/* Avatar + name */}
                  <Link
                    to={`/users/${player.id}`}
                    style={{ display: "flex", alignItems: "center", gap: "0.65rem", flex: 1, minWidth: 0, textDecoration: "none" }}
                  >
                    <Avatar url={player.avatar_url} username={player.username} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-heading)", fontSize: "0.8rem", fontWeight: 700,
                          color: isMe ? "var(--color-cyan)" : "rgba(255,255,255,0.85)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          transition: "color 0.12s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--color-cyan)")}
                        onMouseLeave={e => (e.currentTarget.style.color = isMe ? "var(--color-cyan)" : "rgba(255,255,255,0.85)")}
                      >
                        {player.username}
                        {isMe && <span style={{ fontSize: "0.58rem", marginLeft: "0.35rem", opacity: 0.65 }}>you</span>}
                      </p>
                    </div>
                  </Link>

                  {/* Rank badge — hidden on small screens */}
                  <span
                    className="hidden sm:inline-flex"
                    style={{
                      padding: "0.15rem 0.5rem", borderRadius: "99px",
                      border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color,
                      fontFamily: "var(--font-heading)", fontSize: "0.5rem", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0,
                    }}
                  >
                    {player.rank}
                  </span>

                  {/* Level */}
                  <span style={{
                    fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
                    color: "rgba(255,255,255,0.30)", flexShrink: 0, minWidth: "3.5rem", textAlign: "right",
                  }}>
                    Lv. {player.level}
                  </span>

                  {/* XP */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0, minWidth: "5rem", justifyContent: "flex-end" }}>
                    <BoltIcon />
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-cyan)" }}>
                      {player.total_xp.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
