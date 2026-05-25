import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getQuests } from "../services/questService";

import pythonImg     from "../assets/img/achievements-icons/Python/python-6.png";
import jsImg         from "../assets/img/achievements-icons/JavaScript/javascript-1.png";
import javaImg       from "../assets/img/achievements-icons/Java/java-5.png";
import csImg         from "../assets/img/achievements-icons/CS/cs-1.png";
import statsImg      from "../assets/img/stats_avatar.png";
import underworldImg from "../assets/img/underworld_realm/Underworld.png";
import triviaImg     from "../assets/img/construction_worker.png";

const TOTAL_QUESTS = 30;

const LANGUAGES = [
  { slug: "python",     name: "Python",     image: pythonImg, description: "Data, automation & beyond"  },
  { slug: "javascript", name: "JavaScript", image: jsImg,     description: "Build the modern web"        },
  { slug: "java",       name: "Java",       image: javaImg,   description: "Enterprise, Android & more"  },
  { slug: "csharp",     name: "C#",         image: csImg,     description: "Games, apps & cloud"         },
];

const SECTIONS = [
  { name: "Leaderboard", path: "#", image: statsImg,      description: "Compete with the best coders" },
  { name: "Underworld",  path: "#", image: underworldImg,  description: "Face the darkest challenges"  },
  { name: "Trivia",      path: "#", image: triviaImg,      description: "Coming soon…"                 },
];

const CARD_HOVER_ON  = { borderColor: "rgba(3,233,244,0.25)", boxShadow: "0 0 22px rgba(3,233,244,0.06)" };
const CARD_HOVER_OFF = { borderColor: "rgba(255,255,255,0.07)", boxShadow: "none" };

function SectionDivider({ title }) {
  return (
    <div className="section-divider">
      <h2>{title}</h2>
    </div>
  );
}

function ArrowIcon({ className = "" }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();
  const displayName = user?.username || "Adventurer";

  const [questCounts, setQuestCounts] = useState({});
  const [totalLive, setTotalLive]     = useState(null);

  useEffect(() => {
    getQuests().then((quests) => {
      const counts = quests.reduce((acc, q) => {
        acc[q.language] = (acc[q.language] ?? 0) + 1;
        return acc;
      }, {});
      setQuestCounts(counts);
      setTotalLive(quests.length);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-14">

      {/* ── Hero ── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
            Welcome back,{" "}
            <span className="text-cyan">{displayName}</span>
          </h1>
          <p className="text-sub text-sm leading-relaxed max-w-lg">
            Your coding journey continues. Choose a quest to level up your skills,
            track your progress, and compete on the leaderboard.
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 flex-shrink-0">
          {[
            { label: "Quests",    value: totalLive !== null ? String(totalLive) : String(TOTAL_QUESTS) },
            { label: "Languages", value: "4"  },
            { label: "Your Rank", value: "—"  },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="text-cyan text-2xl font-bold leading-none mb-1.5">{s.value}</p>
              <p
                className="text-xs"
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Language Quest Cards ── */}
      <div>
        <SectionDivider title="Choose Your Quest" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LANGUAGES.map((lang) => (
            <Link key={lang.slug} to={`/quests/${lang.slug}`} style={{ textDecoration: "none" }}>
              <div
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  height: "192px",
                  background: "rgba(0,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, CARD_HOVER_ON)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, CARD_HOVER_OFF)}
              >
                {/* Background image */}
                <img
                  src={lang.image}
                  alt={lang.name}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    opacity: 0.45,
                    transition: "opacity 0.4s",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                  className="group-hover:opacity-[0.35]"
                />
                {/* Bottom gradient */}
                <div
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 60%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Quest count badge */}
                <div className="absolute top-3.5 right-3.5 badge badge-cyan">
                  {questCounts[lang.slug] ?? "—"} quests
                </div>

                {/* Content */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.25rem" }}>
                  <h3
                    className="text-white font-bold text-base mb-0.5"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {lang.name}
                  </h3>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.60)" }}>
                    {lang.description}
                  </p>
                  <div
                    className="flex items-center gap-1.5 mt-3 text-xs text-sub group-hover:text-cyan"
                    style={{
                      fontFamily: "var(--font-heading)",
                      letterSpacing: "0.06em",
                      transition: "color 0.2s",
                    }}
                  >
                    <span>Start quest</span>
                    <ArrowIcon />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Explore ── */}
      <div>
        <SectionDivider title="Explore" />
        <div className="grid sm:grid-cols-3 gap-4">
          {SECTIONS.map((section) => (
            <Link key={section.name} to={section.path} style={{ textDecoration: "none" }}>
              <div
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  height: "176px",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, CARD_HOVER_ON)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, CARD_HOVER_OFF)}
              >
                {/* Background image */}
                <div
                  className="group-hover:scale-105 group-hover:opacity-[0.50]"
                  style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url('${section.image}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: 0.32,
                    transition: "opacity 0.5s, transform 0.5s",
                  }}
                />
                {/* Overlay */}
                <div
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Content */}
                <div
                  style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "1.25rem",
                    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h3
                      className="text-white font-semibold text-base"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {section.name}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>
                      {section.description}
                    </p>
                  </div>
                  <div
                    className="group-hover:text-white/70"
                    style={{
                      width: "2rem", height: "2rem",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,255,255,0.45)",
                      flexShrink: 0,
                      transition: "background 0.2s, color 0.2s",
                    }}
                  >
                    <ArrowIcon />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Progress ── */}
      <div>
        <SectionDivider title="Your Progress" />
        <div className="grid md:grid-cols-2 gap-4">

          {/* XP card */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h4
                  className="text-white font-semibold text-sm"
                  style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.06em" }}
                >
                  XP Points
                </h4>
                <p className="text-xs mt-1 text-sub">0 / 1,000 XP</p>
              </div>
              <div
                style={{
                  width: "2.25rem", height: "2.25rem",
                  borderRadius: "0.75rem",
                  background: "rgba(3,233,244,0.10)",
                  border: "1px solid rgba(3,233,244,0.20)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "0%" }} />
            </div>
            <div className="flex justify-between mt-2.5">
              <span
                className="text-cyan text-xs"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.04em" }}
              >
                0% to level 2
              </span>
              <span className="text-xs text-sub">1,000 XP to go</span>
            </div>
          </div>

          {/* Challenges card */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h4
                  className="text-white font-semibold text-sm"
                  style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.06em" }}
                >
                  Completed Challenges
                </h4>
                <p className="text-xs mt-1 text-sub">0 of {TOTAL_QUESTS} completed</p>
              </div>
              <div
                style={{
                  width: "2.25rem", height: "2.25rem",
                  borderRadius: "0.75rem",
                  background: "rgba(3,233,244,0.10)",
                  border: "1px solid rgba(3,233,244,0.20)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "0%" }} />
            </div>
            <div className="flex justify-between mt-2.5">
              <span
                className="text-cyan text-xs"
                style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.04em" }}
              >
                0% complete
              </span>
              <span className="text-xs text-sub">{TOTAL_QUESTS} remaining</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
