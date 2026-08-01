import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PlayerHUD from "./PlayerHUD";
import logoImg from "../assets/img/skill_forge_logo.png";

function ChevronDown({ className = "" }) {
  return (
    <svg className={`w-3.5 h-3.5 ${className}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout }  = useAuth();
  const location          = useLocation();
  const navigate          = useNavigate();

  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  const dropRef  = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!userDropOpen) return;
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setUserDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userDropOpen]);

  // Close everything on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserDropOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const isActive = (path) => location.pathname === path;

  const desktopLinkCls = (active) =>
    `nav-link text-sm font-medium${active ? " active" : ""}`;

  const mobileLinkCls = (active) =>
    `mobile-link${active ? " active" : ""}`;

  return (
    <>
      <nav className="navbar">
        <div className="term-bar">
          <span className="term-dot term-dot--red" />
          <span className="term-dot term-dot--yellow" />
          <span className="term-dot term-dot--green" />
          <span className="term-title">{user?.username ?? "guest"}@skillforge — zsh</span>
        </div>
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0" style={{ textDecoration: "none" }}>
            <img src={logoImg} alt="SkillForge" className="w-7 h-7 object-contain" />
            <span
              className="hidden sm:block glow-pulse"
              style={{
                fontFamily: "var(--font-brand)",
                fontWeight: 800,
                fontSize: "1.5rem",
                lineHeight: 1,
                color: "var(--color-green)",
                letterSpacing: "0.02em",
              }}
            >
              SkillForge_
            </span>
          </Link>

          {/* Desktop nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className={desktopLinkCls(isActive("/"))}>Dashboard</Link>
              <Link to="/faq" className={desktopLinkCls(isActive("/faq"))}>FAQ</Link>
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2">

            {/* User widget — desktop */}
            {user ? (
              <div className="hidden md:block relative" ref={dropRef}>
                <button
                  onClick={() => setUserDropOpen((o) => !o)}
                  className={`hud${userDropOpen ? " hud--open" : ""}`}
                >
                  <PlayerHUD user={user} variant="desktop" />
                  <ChevronDown className={`text-white/30 transition-transform duration-200 ${userDropOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {userDropOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 w-52 rounded-lg overflow-hidden shadow-2xl"
                    style={{
                      background: "rgba(10, 16, 12, 0.98)",
                      border: "1px solid var(--color-green-border)",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-white text-sm font-semibold">{user.username}</p>
                      <p className="text-xs truncate" style={{ color: "var(--color-text-tertiary)" }}>
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-150"
                        style={{ color: "rgba(255,255,255,0.60)" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.60)"; e.currentTarget.style.background = "transparent"; }}
                      >
                        <ProfileIcon />
                        View Profile
                      </Link>
                      {user.role === "moderator" && (
                        <Link
                          to="/moderator"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-150"
                          style={{ color: "rgba(255,255,255,0.60)" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.60)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <ShieldIcon />
                          Moderator
                        </Link>
                      )}
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-150"
                          style={{ color: "rgba(255,255,255,0.60)" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.60)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <CogIcon />
                          Admin
                        </Link>
                      )}
                    </div>
                    <div className="py-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-150"
                        style={{ color: "rgba(248,113,113,0.70)", background: "transparent", border: "none" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(248,113,113,0.70)"; e.currentTarget.style.background = "transparent"; }}
                      >
                        <LogoutIcon />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in — desktop */
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="sf-btn-ghost">Sign in</Link>
                <Link
                  to="/register"
                  className="sf-btn-ghost"
                  style={{
                    color: "var(--color-green)",
                    borderColor: "var(--color-green-border)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(77,255,143,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  Register
                </Link>
              </div>
            )}

            {/* Hamburger — mobile */}
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center transition-colors duration-150"
              style={{ color: mobileOpen ? "#fff" : "rgba(255,255,255,0.50)", background: "none", border: "none" }}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
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
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-drawer md:hidden">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* User chip */}
            {user && (
              <div
                className="px-3 py-3 mb-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <PlayerHUD user={user} variant="mobile" />
              </div>
            )}

            {user ? (
              <>
                <NavLink to="/" end className={({ isActive }) => mobileLinkCls(isActive)}>Dashboard</NavLink>
                <NavLink to="/faq" className={({ isActive }) => mobileLinkCls(isActive)}>FAQ</NavLink>
                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.5rem 0" }} />
                <NavLink to="/profile" className={({ isActive }) => mobileLinkCls(isActive)}>View Profile</NavLink>
                {user.role === "moderator" && (
                  <NavLink to="/moderator" className={({ isActive }) => mobileLinkCls(isActive)}>Moderator</NavLink>
                )}
                {user.role === "admin" && (
                  <NavLink to="/admin" className={({ isActive }) => mobileLinkCls(isActive)}>Admin</NavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="sf-btn-danger"
                  style={{ justifyContent: "flex-start", paddingLeft: "0.75rem" }}
                >
                  <LogoutIcon />
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login"    className={({ isActive }) => mobileLinkCls(isActive)}>Sign in</NavLink>
                <NavLink to="/register" className={({ isActive }) => mobileLinkCls(isActive)}>Register</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
