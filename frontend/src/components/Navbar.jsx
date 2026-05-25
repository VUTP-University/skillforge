import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

export default function Navbar() {
  const { user, logout }  = useAuth();
  const location          = useLocation();
  const navigate          = useNavigate();

  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  const dropRef = useRef(null);
  const initials = user?.username?.[0]?.toUpperCase() ?? "?";

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
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src={logoImg} alt="SkillForge" className="w-7 h-7 object-contain" />
            <span className="hidden sm:block text-white font-bold text-base tracking-tight text-display">
              SkillForge
            </span>
          </Link>

          {/* Desktop nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className={desktopLinkCls(isActive("/"))}>Dashboard</Link>
              <Link to="/users" className={desktopLinkCls(isActive("/users"))}>Guild</Link>
              {(user.role === "moderator" || user.role === "admin") && (
                <Link to="/moderator" className={desktopLinkCls(isActive("/moderator"))}>Moderator</Link>
              )}
              {user.role === "admin" && (
                <Link to="/admin" className={desktopLinkCls(isActive("/admin"))}>Admin</Link>
              )}
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2">

            {/* User widget — desktop */}
            {user ? (
              <div className="hidden md:block relative" ref={dropRef}>
                <button
                  onClick={() => setUserDropOpen((o) => !o)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors duration-150"
                  style={{ background: userDropOpen ? "rgba(255,255,255,0.05)" : "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={e => { if (!userDropOpen) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="avatar-initials">
                    {initials}
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-white text-xs font-semibold">{user.username}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(3,233,244,0.6)", fontSize: "10px" }}>
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                    </p>
                  </div>
                  <ChevronDown className={`text-white/30 transition-transform duration-200 ${userDropOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {userDropOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 w-52 rounded-xl overflow-hidden shadow-2xl"
                    style={{
                      background: "rgba(13, 23, 40, 0.98)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-white text-sm font-semibold">{user.username}</p>
                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
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
                    color: "var(--color-cyan)",
                    borderColor: "rgba(3,233,244,0.25)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(3,233,244,0.08)"; }}
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
                className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="avatar-initials" style={{ width: "2.25rem", height: "2.25rem", fontSize: "0.875rem" }}>
                  {initials}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{user.username}</p>
                  <p className="text-xs" style={{ color: "rgba(3,233,244,0.60)" }}>
                    {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                  </p>
                </div>
              </div>
            )}

            {user ? (
              <>
                <NavLink to="/"      end className={({ isActive }) => mobileLinkCls(isActive)}>Dashboard</NavLink>
                <NavLink to="/users"     className={({ isActive }) => mobileLinkCls(isActive)}>Guild</NavLink>
                {(user.role === "moderator" || user.role === "admin") && (
                  <NavLink to="/moderator" className={({ isActive }) => mobileLinkCls(isActive)}>Moderator</NavLink>
                )}
                {user.role === "admin" && (
                  <NavLink to="/admin" className={({ isActive }) => mobileLinkCls(isActive)}>Admin</NavLink>
                )}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.5rem 0" }} />
                <NavLink to="/profile"   className={({ isActive }) => mobileLinkCls(isActive)}>View Profile</NavLink>
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
