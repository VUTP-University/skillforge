import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import { useAuth } from "../context/AuthContext";
import { getUserById } from "../services/usersService";

const TOTAL_QUESTS = 30; // 11 Python + 7 JS + 8 Java + 4 C#

const languages = [
  {
    name: "Python",
    path: "/quests/Python",
    image: "src/assets/img/achievements-icons/Python/python-6.png",
    buttonClass: "python_button",
    description: "Data, automation & beyond",
    quests: 11,
  },
  {
    name: "JavaScript",
    path: "/quests/JavaScript",
    image: "src/assets/img/achievements-icons/JavaScript/javascript-1.png",
    buttonClass: "js_button",
    description: "Build the modern web",
    quests: 7,
  },
  {
    name: "Java",
    path: "/quests/Java",
    image: "src/assets/img/achievements-icons/Java/java-5.png",
    buttonClass: "java_button",
    description: "Enterprise, Android & more",
    quests: 8,
  },
  {
    name: "C#",
    path: "/quests/Csharp",
    image: "src/assets/img/achievements-icons/CS/cs-1.png",
    buttonClass: "csharp_button",
    description: "Games, apps & cloud",
    quests: 4,
  },
];

const sections = [
  {
    name: "Leaderboard",
    path: "/leaderboard",
    image: "src/assets/img/stats_avatar.png",
    description: "Compete with the best coders",
  },
  {
    name: "Underworld",
    path: "/underworld",
    image: "src/assets/img/underworld_realm/Underworld.png",
    description: "Face the darkest challenges",
  },
  {
    name: "Trivia",
    path: "/underworld",
    image: "src/assets/img/construction_worker.png",
    description: "Coming soon...",
  },
];

function SectionDivider({ title }) {
  return (
    <div className="flex items-center gap-4 mb-6 normal_text normal_text--medium">
      <h2 className="text-lg font-semibold text-white whitespace-nowrap">{title}</h2>
      <div className="flex-1 h-px bg-white/[0.07]" />
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.username || "Adventurer";

  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getUserById(user.id)
      .then(setUserStats)
      .catch(() => setUserStats(null))
      .finally(() => setStatsLoading(false));
  }, [user?.id]);

  const xp = userStats?.xp ?? 0;
  const level = userStats?.level ?? 1;
  const rank = userStats?.rank ?? "—";
  const levelPct = userStats?.level_percentage ?? 0;
  const nextLevelXp = level * 1000;
  const xpToGo = nextLevelXp - xp;
  const completed = userStats?.total_solved_quests ?? 0;
  const completedPct = Math.round((completed / TOTAL_QUESTS) * 100);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-[#141e30] to-[#123556] relative">

        {/* Ambient background glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 -right-48 w-[500px] h-[500px] bg-[#03e9f4]/[0.04] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-blue-500/[0.04] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-14">

          {/* ── Hero ── */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight normal_text normal_text--large">
                Welcome back,{" "}
                <span className="text-[#03e9f4]">{displayName}</span> 
              </h1>
              <p className="text-white/40 text-sm leading-relaxed max-w-lg normal_text normal_text--medium">
                Your coding journey continues! Choose a quest to level up your skills, track your progress, and compete on the leaderboard. The adventure awaits!
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3 flex-shrink-0">
              {[
                { label: "XP Points", value: statsLoading ? "…" : xp.toLocaleString() },
                { label: "Completed", value: statsLoading ? "…" : String(completed) },
                { label: "Rank", value: statsLoading ? "…" : rank },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="primary_object border border-white/[0.07] rounded-2xl px-5 py-4 text-center min-w-[88px]"
                >
                  <p className="text-[#03e9f4] text-2xl font-bold leading-none secondary_text">
                    {stat.value}
                  </p>
                  <p className="text-white/35 text-[11px] mt-1.5 font-medium normal_text normal_text--small">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Language Quest Cards ── */}
          <div>
            <SectionDivider title="Choose Your Quest" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {languages.map((lang) => (
                <Link key={lang.name} to={lang.path}>
                  <div
                    className={`group relative h-45 rounded-2xl overflow-hidden primary_object cursor-pointer ${lang.buttonClass}`}
                  >
                    {/* Background image */}
                    <img
                      src={lang.image}
                      alt={lang.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-[0.5] group-hover:opacity-[0.4] transition-opacity duration-400"
                    />

                    {/* Bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {/* Quest count badge */}
                    <div className="absolute top-3.5 right-3.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1">
                      <span className="text-white/55 text-[11px] font-medium normal_text normal_text--small">
                        {lang.quests} quests
                      </span>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-bold text-base leading-tight">
                        {lang.name}
                      </h3>
                      <p className="text-white/45 text-xs mt-1 normal_text normal_text--small">
                        {lang.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3.5 text-white/35 group-hover:text-white/65 transition-colors duration-200 text-xs font-medium normal_text normal_text--small">
                        <span>Start quest</span>
                        <ArrowIcon />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Explore Section ── */}
          <div>
            <SectionDivider title="Explore" />
            <div className="grid sm:grid-cols-3 gap-4">
              {sections.map((section) => (
                <Link key={section.name} to={section.path}>
                  <div className="group relative h-44 rounded-2xl overflow-hidden primary_object border border-white/[0.07] cursor-pointer">
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                      style={{ backgroundImage: `url('${section.image}')` }}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                      <div>
                        <h3 className="text-white font-semibold text-base">
                          {section.name}
                        </h3>
                        <p className="text-white/40 text-xs mt-0.5">
                          {section.description}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white/45 group-hover:bg-white/15 group-hover:text-white/70 transition-all duration-200">
                        <ArrowIcon />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Progress / Stats ── */}
          <div>
            <SectionDivider title="Your Progress" />
            <div className="grid md:grid-cols-2 gap-4">
              {/* XP */}
              <div className="primary_object border border-white/[0.07] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h4 className="text-white font-semibold text-sm">XP Points</h4>
                    <p className="text-white/75 text-xs mt-1">
                      {statsLoading ? "Loading…" : `${xp.toLocaleString()} / ${nextLevelXp.toLocaleString()} XP`}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#03e9f4]/10 border border-[#03e9f4]/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-[#03e9f4]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${levelPct}%`,
                      background: "linear-gradient(90deg, #03e9f4, #0284c7)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2.5">
                  <span className="text-[#03e9f4] text-xs font-medium">
                    {statsLoading ? "—" : `${levelPct}% to level ${level + 1}`}
                  </span>
                  <span className="text-white/75 text-xs">
                    {statsLoading ? "" : `${xpToGo.toLocaleString()} XP to go`}
                  </span>
                </div>
              </div>

              {/* Challenges */}
              <div className="primary_object border border-white/[0.07] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h4 className="text-white font-semibold text-sm">Completed Challenges</h4>
                    <p className="text-white/75 text-xs mt-1">
                      {statsLoading ? "Loading…" : `${completed} of ${TOTAL_QUESTS} completed`}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#03e9f4]/10 border border-[#03e9f4]/20 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-[#03e9f4]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${completedPct}%`,
                      background: "linear-gradient(90deg, #03e9f4, #0284c7)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2.5">
                  <span className="text-[#03e9f4] text-xs font-medium">
                    {statsLoading ? "—" : `${completedPct}% complete`}
                  </span>
                  <span className="text-white/75 text-xs">
                    {statsLoading ? "" : `${TOTAL_QUESTS - completed} remaining`}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
