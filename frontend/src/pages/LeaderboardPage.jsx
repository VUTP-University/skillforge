import { useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import { useAuth } from "../context/AuthContext";
import { getLeaderboard } from "../services/usersService";

/* ── Rank badge config ────────────────────────────────── */
const RANK_STYLES = {
  Novice:      { bg: "bg-white/[0.06]",      text: "text-white/40",    border: "border-white/[0.08]"   },
  Apprentice:  { bg: "bg-emerald-500/[0.12]", text: "text-emerald-400", border: "border-emerald-500/20"  },
  Expert:      { bg: "bg-blue-500/[0.12]",    text: "text-blue-400",    border: "border-blue-500/20"     },
  Master:      { bg: "bg-purple-500/[0.12]",  text: "text-purple-400",  border: "border-purple-500/20"   },
  Grandmaster: { bg: "bg-amber-500/[0.12]",   text: "text-amber-400",   border: "border-amber-500/20"    },
};

function RankBadge({ rank }) {
  const s = RANK_STYLES[rank] ?? RANK_STYLES.Novice;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${s.bg} ${s.text} ${s.border}`}>
      {rank}
    </span>
  );
}

/* ── Medal colours for top-3 ─────────────────────────── */
const MEDAL = {
  1: { label: "1st", ring: "ring-amber-400/60",   glow: "rgba(251,191,36,0.20)",  crown: "text-amber-400",   bg: "from-amber-500/[0.12] to-transparent", badge: "bg-amber-400 text-black" },
  2: { label: "2nd", ring: "ring-slate-300/50",   glow: "rgba(203,213,225,0.15)", crown: "text-slate-300",   bg: "from-slate-400/[0.10] to-transparent", badge: "bg-slate-300 text-black" },
  3: { label: "3rd", ring: "ring-orange-600/50",  glow: "rgba(194,120,78,0.18)",  crown: "text-orange-500",  bg: "from-orange-600/[0.10] to-transparent", badge: "bg-orange-500 text-white" },
};

/* ── Avatar with image + initials fallback ────────────── */
function Avatar({ userId, username, size = "md", ringClass = "", bgClass = "bg-white/[0.06]", textClass = "text-white/60" }) {
  const [failed, setFailed] = useState(false);
  const initials = username?.[0]?.toUpperCase() ?? "?";
  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-9 h-9 text-sm";

  if (!failed) {
    return (
      <img
        src={`/api/users/${userId}/avatar`}
        alt={username}
        onError={() => setFailed(true)}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClass} ${ringClass}`}
      />
    );
  }
  return (
    <div className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${sizeClass} ${ringClass} ${bgClass} ${textClass}`}>
      {initials}
    </div>
  );
}

function PodiumCard({ entry, isCurrentUser }) {
  const m = MEDAL[entry.position];

  return (
    <div className={`relative flex flex-col items-center ${entry.position === 1 ? "order-2 scale-[1.06]" : entry.position === 2 ? "order-1" : "order-3"}`}>
      {/* Crown / position label */}
      <div className={`text-xs font-bold mb-3 ${m.crown} uppercase tracking-widest`}>
        {m.label}
      </div>

      {/* Avatar */}
      <div className="relative mb-4">
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60"
          style={{ background: m.glow }}
        />
        <div className={`relative ring-2 ${m.ring} rounded-full`}>
          <Avatar
            userId={entry.user_id}
            username={entry.username}
            size="lg"
            bgClass="bg-[#0f1a2b]"
            textClass="text-white"
          />
        </div>
        {/* Position badge */}
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${m.badge}`}>
          {entry.position}
        </span>
      </div>

      {/* Card */}
      <div className={`w-full rounded-2xl border border-white/[0.07] bg-gradient-to-b ${m.bg} bg-[#0d1a2b]/80 p-4 text-center ${isCurrentUser ? "ring-1 ring-[#03e9f4]/30" : ""}`}>
        <p className="text-white font-bold text-sm truncate">{entry.username}</p>
        {isCurrentUser && <p className="text-[#03e9f4] text-[10px] font-medium mb-1">You</p>}
        <p className="text-white/35 text-[10px] mt-0.5 mb-3">Lv. {entry.level}</p>
        <RankBadge rank={entry.rank} />
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <p className="text-white font-bold text-base leading-none">{entry.xp.toLocaleString()}</p>
          <p className="text-white/30 text-[10px] mt-0.5">XP</p>
        </div>
        {/* XP progress strip */}
        <div className="mt-3 h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${entry.level_percentage}%`, background: "linear-gradient(90deg,#03e9f4,#0284c7)" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton row ─────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
      <div className="w-6 h-3 bg-white/[0.06] rounded" />
      <div className="w-9 h-9 rounded-full bg-white/[0.06]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 bg-white/[0.06] rounded" />
        <div className="h-2 w-16 bg-white/[0.04] rounded" />
      </div>
      <div className="h-2.5 w-16 bg-white/[0.04] rounded" />
      <div className="h-3 w-14 bg-white/[0.06] rounded" />
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch(() => setError("Failed to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  const top3 = entries.slice(0, 3);
  const currentUserEntry = entries.find((e) => e.user_id === user?.id);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-[#141e30] to-[#123556] relative">

        {/* Ambient glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 -right-48 w-[500px] h-[500px] bg-[#03e9f4]/[0.03] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 space-y-10">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight primary_text">
                Leaderboard
              </h1>
              <p className="text-white/40 text-sm mt-2 normal_text normal_text--medium">
                Top coders ranked by XP earned across all quests.
              </p>
            </div>

            {/* Current user rank chip */}
            {currentUserEntry && (
              <div className="primary_object border border-[#03e9f4]/20 rounded-2xl px-5 py-3 flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#03e9f4]/15 border border-[#03e9f4]/30 flex items-center justify-center text-[#03e9f4] text-xs font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white/75 text-[10px] uppercase tracking-widest">Your rank</p>
                  <p className="text-[#03e9f4] text-xl font-bold leading-none">#{currentUserEntry.position}</p>
                </div>
                <div className="pl-3 border-l border-white/[0.06]">
                  <p className="text-white/75 text-[10px] uppercase tracking-widest">XP</p>
                  <p className="text-white font-bold text-sm">{currentUserEntry.xp.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Podium ── */}
          {!loading && !error && top3.length === 3 && (
            <div>
              <div className="flex items-end justify-center gap-4 mb-6">
                {top3.map((entry) => (
                  <div key={entry.user_id} className="flex-1 max-w-[180px]">
                    <PodiumCard entry={entry} isCurrentUser={entry.user_id === user?.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Ranked list ── */}
          <div className="primary_object border border-white/[0.07] rounded-2xl overflow-hidden">
            {/* List header */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="w-6 text-[10px] text-white/75 font-semibold uppercase tracking-widest">#</span>
              <span className="flex-1 text-[10px] text-white/75 font-semibold uppercase tracking-widest">Player</span>
              <span className="hidden sm:block text-[10px] text-white/75 font-semibold uppercase tracking-widest w-20 text-right">Level</span>
              <span className="text-[10px] text-white/75 font-semibold uppercase tracking-widest w-20 text-right">XP</span>
            </div>

            {/* Loading skeletons */}
            {loading && [1,2,3,4,5,6,7,8].map((i) => <SkeletonRow key={i} />)}

            {/* Error */}
            {error && (
              <div className="px-5 py-10 text-center text-white/30 text-sm">{error}</div>
            )}

            {/* Empty */}
            {!loading && !error && entries.length === 0 && (
              <div className="px-5 py-10 text-center text-white/75 text-sm">No players yet. Be the first!</div>
            )}

            {/* All rows */}
            {!loading && !error && entries.map((entry, idx) => {
              const isMe = entry.user_id === user?.id;
              const medal = MEDAL[entry.position];
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 ${
                    isMe
                      ? "bg-[#03e9f4]/[0.05] border-l-2 border-[#03e9f4]/40"
                      : medal
                      ? "bg-white/[0.02]"
                      : idx % 2 === 0
                      ? "hover:bg-white/[0.02]"
                      : "bg-white/[0.015] hover:bg-white/[0.03]"
                  } ${idx < entries.length - 1 ? "border-b border-white/[0.04]" : ""}`}
                >
                  {/* Position — medal badge for top 3, number otherwise */}
                  <div className="w-6 flex justify-center flex-shrink-0">
                    {medal ? (
                      <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${medal.badge}`}>
                        {entry.position}
                      </span>
                    ) : (
                      <span className={`text-sm font-bold ${isMe ? "text-[#03e9f4]" : "text-white/25"}`}>
                        {entry.position}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar
                    userId={entry.user_id}
                    username={entry.username}
                    size="md"
                    ringClass={
                      isMe
                        ? "ring-2 ring-[#03e9f4]/40"
                        : medal
                        ? `ring-1 ${medal.ring}`
                        : ""
                    }
                    bgClass={isMe ? "bg-[#03e9f4]/15" : "bg-white/[0.06]"}
                    textClass={isMe ? "text-[#03e9f4]" : "text-white/60"}
                  />

                  {/* Name + rank */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold truncate ${isMe ? "text-[#03e9f4]" : "text-white"}`}>
                        {entry.username}
                      </span>
                      {isMe && <span className="text-[10px] text-[#03e9f4]/60 font-medium">(you)</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RankBadge rank={entry.rank} />
                    </div>
                  </div>

                  {/* Level */}
                  <div className="hidden sm:block w-20 text-right">
                    <span className="text-white/75 text-xs">Lv. {entry.level}</span>
                    <div className="mt-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${entry.level_percentage}%`, background: "linear-gradient(90deg,#03e9f4,#0284c7)" }}
                      />
                    </div>
                  </div>

                  {/* XP */}
                  <div className="w-20 text-right">
                    <span className={`text-sm font-bold ${isMe ? "text-[#03e9f4]" : "text-white"}`}>
                      {entry.xp.toLocaleString()}
                    </span>
                    <p className="text-white/75 text-[10px]">XP</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
