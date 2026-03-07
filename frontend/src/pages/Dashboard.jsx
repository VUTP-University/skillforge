import { Link } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import { useAuth } from "../context/AuthContext";

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
    description: "Enterprise & Android",
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
    <div className="flex items-center gap-4 mb-6">
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
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                Dashboard
              </p>
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
                Welcome back,{" "}
                <span className="text-[#03e9f4]">{displayName}</span>
              </h1>
              <p className="text-white/40 text-sm leading-relaxed max-w-lg">
                Pick up where you left off. Your quests are waiting — keep
                pushing your limits and climbing the leaderboard.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3 flex-shrink-0">
              {[
                { label: "XP Points", value: "1,200" },
                { label: "Completed", value: "15" },
                { label: "Rank", value: "#24" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="primary_object border border-white/[0.07] rounded-2xl px-5 py-4 text-center min-w-[88px]"
                >
                  <p className="text-[#03e9f4] text-2xl font-bold leading-none">
                    {stat.value}
                  </p>
                  <p className="text-white/35 text-[11px] mt-1.5 font-medium">
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
                    className={`group relative h-56 rounded-2xl overflow-hidden primary_object border border-white/[0.07] cursor-pointer ${lang.buttonClass}`}
                  >
                    {/* Background image */}
                    <img
                      src={lang.image}
                      alt={lang.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-[0.18] group-hover:opacity-[0.28] transition-opacity duration-300"
                    />

                    {/* Bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {/* Quest count badge */}
                    <div className="absolute top-3.5 right-3.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1">
                      <span className="text-white/55 text-[11px] font-medium">
                        {lang.quests} quests
                      </span>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="text-white font-bold text-base leading-tight">
                        {lang.name}
                      </h3>
                      <p className="text-white/45 text-xs mt-1">
                        {lang.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3.5 text-white/35 group-hover:text-white/65 transition-colors duration-200 text-xs font-medium">
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
                    <p className="text-white/35 text-xs mt-1">1,200 / 1,500 XP</p>
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
                    className="h-full rounded-full"
                    style={{
                      width: "80%",
                      background: "linear-gradient(90deg, #03e9f4, #0284c7)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2.5">
                  <span className="text-[#03e9f4] text-xs font-medium">80% to next level</span>
                  <span className="text-white/25 text-xs">300 XP to go</span>
                </div>
              </div>

              {/* Challenges */}
              <div className="primary_object border border-white/[0.07] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h4 className="text-white font-semibold text-sm">Completed Challenges</h4>
                    <p className="text-white/35 text-xs mt-1">15 of 20 completed</p>
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
                    className="h-full rounded-full"
                    style={{
                      width: "75%",
                      background: "linear-gradient(90deg, #03e9f4, #0284c7)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2.5">
                  <span className="text-[#03e9f4] text-xs font-medium">75% complete</span>
                  <span className="text-white/25 text-xs">5 remaining</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
