import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsers } from "../services/api";
import { getRankStyle } from "../constants/ranks";
import Avatar from "../components/Avatar";

/* ── Icons ───────────────────────────────────────────────────────────────── */

function BoltIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

/* ── Constants ───────────────────────────────────────────────────────────── */

// Podium slot metadata — rendered left-to-right as 2nd | 1st | 3rd.
// Sizes taper down from 1st so the row naturally staggers in height
// (row uses align-items: flex-end) without a separate pedestal block.
const SLOTS = [
  { dataIndex: 1, place: 2, color: "var(--color-blue)",  avatarSize: 58, glyphSize: "2.2rem" },
  { dataIndex: 0, place: 1, color: "var(--color-green)", avatarSize: 76, glyphSize: "3rem"   },
  { dataIndex: 2, place: 3, color: "var(--color-amber)", avatarSize: 50, glyphSize: "1.9rem" },
];

/* ── Sub-components ──────────────────────────────────────────────────────── */

function RankBadge({ rank }) {
  const rs = getRankStyle(rank);
  return (
    <span style={{
      padding: "0.15rem 0.5rem", borderRadius: "3px",
      border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color,
      fontFamily: "var(--font-heading)", fontSize: "0.5rem", fontWeight: 700,
      flexShrink: 0,
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
        <span className="text-sub text-sm">Loading rankings…</span>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <svg style={{ width: 36, height: 36, color: "var(--color-text-faint)" }} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          {error}
        </p>
      </div>
    );
  }

  /* ── Empty ── */
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <svg style={{ width: 36, height: 36, color: "var(--color-text-faint)" }} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
          No players on record yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <div className="text-center page-enter" style={{ paddingBottom: "0.5rem" }}>
        <p className="hero-eyebrow" style={{ justifyContent: "center" }}>
          sort ./users --by=xp
        </p>
        <h1
          style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: 700,
            color: "var(--color-text)", lineHeight: 1.15,
            marginBottom: "0.5rem",
          }}
        >
          Leaderboard
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-body)" }}>
          Top players ranked by total XP
        </p>
        {myRank > 0 && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              marginTop: "0.75rem",
              padding: "0.35rem 1rem",
              borderRadius: "4px",
              background: "var(--color-green-dim)",
              border: "1px solid var(--color-green-border)",
            }}
          >
            <svg style={{ width: 12, height: 12, color: "var(--color-green)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700, color: "var(--color-green)" }}>
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
            position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
            width: "280px", height: "200px",
            background: "radial-gradient(ellipse, var(--color-green-glow) 0%, transparent 70%)",
            filter: "blur(24px)",
            pointerEvents: "none",
          }} />
          {SLOTS.map((slot) => {
            const player = podium[slot.dataIndex];
            if (!player) return null;
            const isMe = player.id === me?.id;
            return (
              <Link
                key={slot.place}
                to={`/users/${player.id}`}
                className={`podium-card${isMe ? " podium-card--me" : ""}`}
                style={{ "--card-accent": slot.color, textDecoration: "none", flex: "0 1 220px", minWidth: 0 }}
              >
                <div className="podium-card-bar">
                  <span className="term-dot term-dot--red" />
                  <span className="term-dot term-dot--yellow" />
                  <span className="term-dot term-dot--green" />
                  <span className="term-title">rank_0{slot.place}</span>
                </div>

                <div className="podium-card-body">
                  <div className="podium-rank-glyph" style={{ fontSize: slot.glyphSize }}>0{slot.place}</div>

                  {/* Avatar */}
                  <div style={{
                    borderRadius: "5px",
                    padding: "3px",
                    background: `linear-gradient(135deg, ${slot.color}, transparent)`,
                    flexShrink: 0,
                  }}>
                    <Avatar src={player.avatar_url} username={player.username} size={slot.avatarSize} ring="none" />
                  </div>

                  {/* Name */}
                  <p style={{
                    fontFamily: "var(--font-heading)", fontSize: slot.place === 1 ? "0.9rem" : "0.78rem",
                    fontWeight: 700, color: "var(--color-text)", textAlign: "center",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}>
                    {player.username}
                    {isMe && <span style={{ color: "var(--color-green)", fontSize: "0.6rem", marginLeft: "0.3rem" }}>you</span>}
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
            );
          })}
        </div>
      )}

      {/* ── Ranked list (4th+) ── */}
      {rest.length > 0 && (
        <div>
          <div className="section-divider">
            <h2>Full Ranking</h2>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {rest.map((player, i) => {
              const position = i + 4;
              const isMe     = player.id === me?.id;
              const rs       = getRankStyle(player.rank);
              return (
                <div
                  key={player.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1.1rem",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
                    background: isMe ? "var(--color-green-dim)" : "transparent",
                    borderLeft: isMe ? "3px solid var(--color-green-border)" : "3px solid transparent",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={e => { if (!isMe) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Position */}
                  <span style={{
                    fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700,
                    color: "var(--color-text-faint)", width: "1.8rem", textAlign: "right", flexShrink: 0,
                  }}>
                    {position}
                  </span>

                  {/* Avatar + name */}
                  <Link
                    to={`/users/${player.id}`}
                    style={{ display: "flex", alignItems: "center", gap: "0.65rem", flex: 1, minWidth: 0, textDecoration: "none" }}
                  >
                    <Avatar src={player.avatar_url} username={player.username} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "var(--font-heading)", fontSize: "0.8rem", fontWeight: 700,
                          color: isMe ? "var(--color-green)" : "var(--color-text-secondary)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          transition: "color 0.12s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--color-green)")}
                        onMouseLeave={e => (e.currentTarget.style.color = isMe ? "var(--color-green)" : "var(--color-text-secondary)")}
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
                      padding: "0.15rem 0.5rem", borderRadius: "3px",
                      border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color,
                      fontFamily: "var(--font-heading)", fontSize: "0.5rem", fontWeight: 700, flexShrink: 0,
                    }}
                  >
                    {player.rank}
                  </span>

                  {/* Level */}
                  <span style={{
                    fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
                    color: "var(--color-text-tertiary)", flexShrink: 0, minWidth: "3.5rem", textAlign: "right",
                  }}>
                    Lv. {player.level}
                  </span>

                  {/* XP */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0, minWidth: "5rem", justifyContent: "flex-end" }}>
                    <BoltIcon />
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: "var(--color-green)" }}>
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
