import { useEffect, useState } from "react";
import { getHealth } from "../services/api";
import { useAuth } from "../context/AuthContext";

function SectionDivider({ title }) {
  return (
    <div className="section-divider">
      <h2>{title}</h2>
    </div>
  );
}

const STACK = [
  { icon: "🐍", label: "Python",     desc: "Data, automation & beyond",   quests: 11 },
  { icon: "⚡", label: "JavaScript", desc: "Build the modern web",          quests: 7  },
  { icon: "☕", label: "Java",        desc: "Enterprise, Android & more",   quests: 8  },
  { icon: "🎮", label: "C#",          desc: "Games, apps & cloud",          quests: 4  },
];

export default function Home() {
  const { user } = useAuth();
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  return (
    <div className="space-y-14">
      {/* ── Hero ── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight text-display">
            Welcome back,{" "}
            <span className="text-cyan">{user?.username}</span>
          </h1>
          <p className="text-sub text-sm leading-relaxed max-w-lg">
            Your coding journey continues. Choose a quest to level up your skills, track your progress, and compete on the leaderboard.
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 flex-shrink-0">
          {[
            { label: "Quests",   value: "30"  },
            { label: "Languages", value: "4"  },
            { label: "Your Rank", value: "—"  },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="text-cyan text-2xl font-bold leading-none mb-1.5 text-display">{s.value}</p>
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Language quest cards ── */}
      <div>
        <SectionDivider title="Choose Your Quest" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STACK.map((lang) => (
            <div
              key={lang.label}
              className="group relative rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.07)",
                minHeight: "180px",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(3,233,244,0.25)";
                e.currentTarget.style.boxShadow  = "0 0 20px rgba(3,233,244,0.06)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.boxShadow  = "none";
              }}
            >
              {/* Quest count badge */}
              <div
                className="absolute top-3.5 right-3.5 badge badge-cyan"
              >
                {lang.quests} quests
              </div>

              <div style={{ fontSize: "2.5rem", lineHeight: 1, marginBottom: "0.75rem", userSelect: "none" }}>
                {lang.icon}
              </div>
              <h3 className="text-white font-bold text-base mb-0.5">{lang.label}</h3>
              <p className="text-xs text-sub">{lang.desc}</p>
              <div
                className="flex items-center gap-1.5 mt-3 text-xs font-medium text-sub group-hover:text-cyan"
                style={{ transition: "color 0.2s" }}
              >
                <span>Start quest</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Forge status ── */}
      <div>
        <SectionDivider title="System Status" />
        <div className="glass-card p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white font-semibold text-sm mb-0.5">API Server</p>
            <p className="text-sub text-xs">Backend connection health</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: apiOnline === null ? "#94a3b8" : apiOnline ? "#4ade80" : "#f87171",
                boxShadow: apiOnline ? "0 0 6px #4ade80" : undefined,
              }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: apiOnline === null ? "#94a3b8" : apiOnline ? "#4ade80" : "#f87171" }}
            >
              {apiOnline === null ? "Checking…" : apiOnline ? "Online" : "Unreachable"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
