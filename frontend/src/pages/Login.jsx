import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg    from "../assets/img/skill_forge_logo.png";
import heroAvatar from "../assets/img/hero_avatar.png";

/* ── Icons ─────────────────────────────────────── */

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

/* ── Brand logo ─────────────────────────────────── */

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <img src={logoImg} alt="SkillForge" className="w-9 h-9 object-contain" />
      <span className="font-brand text-xl text-white tracking-wide">Skill Forge</span>
    </div>
  );
}

/* ── Feature bullets ────────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    text: "Challenging quests across Python, JavaScript, Java and more",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    text: "Real-time code review with AI-powered feedback",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    text: "Progress tracking, achievements and global leaderboards",
  },
];

/* ── Page ───────────────────────────────────────── */

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb w-96 h-96 -top-48 -left-48" style={{ background: "rgba(3,233,244,0.07)" }} />
        <div className="orb w-80 h-80 top-1/2 -right-48"  style={{ background: "rgba(59,130,246,0.07)" }} />
        <div className="orb w-72 h-72 -bottom-48 left-1/3" style={{ background: "rgba(3,233,244,0.04)" }} />
      </div>

      {/* Left branding panel */}
      <div className="auth-left dot-grid">
        <BrandLogo />

        <div className="space-y-10">
          {/* Headline in Cinzel — the medieval feel */}
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-5">
              Master skills.
              <br />
              <span className="text-cyan">Build the future.</span>
            </h1>
            {/* Body copy in Crimson Text */}
            <p className="text-sub text-lg leading-relaxed max-w-sm font-body">
              Solve coding quests, get real-time feedback, and track your progress. Join a community of learners and level up with SkillForge.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(3,233,244,0.10)", border: "1px solid rgba(3,233,244,0.15)" }}
                >
                  {f.icon}
                </div>
                <span className="text-sub font-body" style={{ fontSize: "1rem" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-dim font-body text-sm">© 2026 Skill Forge. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        {/* Decorative hero avatar */}
        <img
          src={heroAvatar}
          alt=""
          aria-hidden="true"
          className="absolute bottom-[15%] right-[5%] w-72 opacity-35 pointer-events-none select-none object-contain hidden lg:block"
        />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden mb-9">
            <BrandLogo />
          </div>

          {/* Form card with corner ornaments */}
          <div className="auth-card">
            <span className="corner-tr" />
            <span className="corner-bl" />

            <div className="mb-7">
              <h2 className="text-3xl font-bold text-white mb-1.5">Welcome back</h2>
              <p className="text-sub font-body text-lg">Sign in to continue your learning journey.</p>
            </div>

            <div className="divider-ornate mb-6">✦</div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="sf-label" htmlFor="identifier">Username or Email</label>
                <input
                  id="identifier"
                  type="text"
                  className="sf-input"
                  placeholder="your_username or you@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5" style={{ marginBottom: "0.4rem" }}>
                  <label className="sf-label" style={{ marginBottom: 0 }} htmlFor="password">
                    Password
                  </label>
                  <a
                    href="#"
                    className="font-heading text-cyan"
                    style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.55 }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="sf-input-wrap">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    className="sf-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="sf-input-icon-btn" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="sf-error">
                  <AlertIcon />
                  {error}
                </div>
              )}

              <button type="submit" className="sf-btn" disabled={loading} style={{ marginTop: "0.5rem" }}>
                {loading ? <><span className="sf-spinner" />Entering realm…</> : "Enter the Realm"}
              </button>

              <div className="divider-ornate">✦</div>

              <p className="text-center font-body text-dim" style={{ fontSize: "1rem" }}>
                Not yet a member?{" "}
                <Link
                  to="/register"
                  className="font-heading"
                  style={{ color: "var(--color-indigo)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}
                >
                  Join the Order
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
