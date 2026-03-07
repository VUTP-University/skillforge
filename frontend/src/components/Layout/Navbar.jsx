import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserById, getAvatarUrl } from "../../services/usersService";
import skillForgeLogo from "../../assets/img/skill_forge_logo.png";

const LANGUAGES = [
  { name: "Python",     path: "/quests/Python" },
  { name: "JavaScript", path: "/quests/JavaScript" },
  { name: "Java",       path: "/quests/Java" },
  { name: "C#",         path: "/quests/Csharp" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [avatarUrl, setAvatarUrl]           = useState(null);
  const [stats, setStats]                   = useState(null);
  const [userDropOpen, setUserDropOpen]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [questsDropOpen, setQuestsDropOpen] = useState(false);

  const userDropRef = useRef(null);

  // Fetch avatar + stats whenever the logged-in user changes
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;

    getAvatarUrl(user.id).then((url) => { if (alive) setAvatarUrl(url); });
    getUserById(user.id)
      .then((data) => {
        if (alive)
          setStats({ level: data.level, level_percentage: data.level_percentage });
      })
      .catch(() => {});

    return () => { alive = false; };
  }, [user?.id]);

  // Close everything on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropOpen(false);
  }, [location.pathname]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!userDropOpen) return;
    const handler = (e) => {
      if (userDropRef.current && !userDropRef.current.contains(e.target))
        setUserDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userDropOpen]);

  const isActive       = (path) => location.pathname === path;
  const isQuestsActive = location.pathname.startsWith("/quests") || location.pathname.startsWith("/quest/");
  const initials       = user?.username?.[0]?.toUpperCase() ?? "?";

  const desktopLinkClass = (active) =>
    `text-sm font-medium transition-colors duration-150 normal_text ${
      active ? "text-[#03e9f4]" : "text-white/50 hover:text-white/90"
    }`;

  const mobileLinkClass = (active) =>
    `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
      active
        ? "text-[#03e9f4] bg-[#03e9f4]/[0.08]"
        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
    }`;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0d1520]/80 border-b border-white/[0.06] shadow-[0_1px_24px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <img src={skillForgeLogo} alt="SkillForge" className="w-8 h-8" />
          <span className="hidden sm:block text-white font-bold text-base tracking-tight normal_text">
            SkillForge
          </span>
        </Link>

        {/* ── Center nav (desktop) ── */}
        <div className="hidden md:flex items-center gap-7">
          <Link to="/dashboard" className={desktopLinkClass(isActive("/dashboard"))}>
            Dashboard
          </Link>

          {/* Quests dropdown — CSS group-hover, no JS state needed on desktop */}
          <div className="relative group">
            <button
              className={`flex items-center gap-1 text-sm font-medium transition-colors duration-300 ${
                isQuestsActive ? "text-[#03e9f4]" : "text-white/50 hover:text-white/90"
              }`}
            >
              Quests
              <svg
                className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-44 invisible group-hover:visible opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 origin-top transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
              <div className="bg-[#0f1a2b]/95 backdrop-blur-md border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
                {LANGUAGES.map((lang) => (
                  <Link
                    key={lang.path}
                    to={lang.path}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-300 ${
                      location.pathname === lang.path
                        ? "text-[#03e9f4] bg-white/[0.06]"
                        : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#03e9f4]/50 flex-shrink-0" />
                    {lang.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link to="/leaderboard" className={desktopLinkClass(isActive("/leaderboard"))}>
            Leaderboard
          </Link>
          <Link to="/underworld" className={desktopLinkClass(isActive("/underworld"))}>
            Underworld
          </Link>
        </div>

        {/* ── Right section ── */}
        <div className="flex items-center gap-2">

          {/* User widget (desktop) */}
          {user && (
            <div className="hidden md:block relative" ref={userDropRef}>
              <button
                onClick={() => setUserDropOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-white/[0.05] transition-colors duration-150"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#03e9f4]/40 hover:ring-[#03e9f4]/70 transition-all duration-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#03e9f4]/15 border border-[#03e9f4]/30 flex items-center justify-center text-[#03e9f4] text-xs font-bold">
                    {initials}
                  </div>
                )}

                <div className="text-left leading-none">
                  <p className="text-white text-xs font-semibold">{user.username}</p>
                  {stats && (
                    <p className="text-[#03e9f4]/65 text-[10px] mt-0.5">Lv. {stats.level}</p>
                  )}
                </div>

                <svg
                  className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${userDropOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* XP progress strip under the button */}
              {stats && (
                <div className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-white/[0.04] rounded-full overflow-hidden pointer-events-none">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.level_percentage}%`,
                      background: "linear-gradient(90deg, #03e9f4, #0284c7)",
                    }}
                  />
                </div>
              )}

              {/* Dropdown */}
              {userDropOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-[#0f1a2b]/95 backdrop-blur-md border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-white text-sm font-semibold">{user.username}</p>
                    <p className="text-white/35 text-xs truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View Profile
                    </Link>

                    {/* Admin Panel — only shown when /api/me returns role: "Admin" */}
                    {user?.role === "Admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors duration-150"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-white/[0.06] py-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors duration-150"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0f1a2b]/98 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">

            {/* User info chip */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#03e9f4]/40" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#03e9f4]/15 border border-[#03e9f4]/30 flex items-center justify-center text-[#03e9f4] text-sm font-bold">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-semibold">{user.username}</p>
                  {stats && <p className="text-[#03e9f4]/65 text-xs">Level {stats.level}</p>}
                </div>
              </div>
            )}

            <Link to="/dashboard" className={mobileLinkClass(isActive("/dashboard"))}>
              Dashboard
            </Link>

            {/* Quests accordion */}
            <div>
              <button
                onClick={() => setQuestsDropOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isQuestsActive
                    ? "text-[#03e9f4] bg-[#03e9f4]/[0.08]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Quests
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${questsDropOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {questsDropOpen && (
                <div className="ml-3 mt-1 pl-3 border-l border-white/[0.06] space-y-0.5">
                  {LANGUAGES.map((lang) => (
                    <Link
                      key={lang.path}
                      to={lang.path}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                        location.pathname === lang.path
                          ? "text-[#03e9f4]"
                          : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {lang.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/leaderboard" className={mobileLinkClass(isActive("/leaderboard"))}>
              Leaderboard
            </Link>
            <Link to="/underworld" className={mobileLinkClass(isActive("/underworld"))}>
              Underworld
            </Link>

            {user && (
              <>
                <div className="border-t border-white/[0.06] my-2" />
                <Link to="/profile" className={mobileLinkClass(isActive("/profile"))}>
                  View Profile
                </Link>
                {user?.role === "Admin" && (
                  <Link to="/admin" className={mobileLinkClass(isActive("/admin"))}>
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors duration-150"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
