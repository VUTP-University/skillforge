import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TerminalTypewriter from "../components/TerminalTypewriter";
import TerminalLogo from "../components/TerminalLogo";
import SoundToggle from "../components/SoundToggle";
import { playBootSound, playChime, playClick, playError, stopBootSound, unlockAudio } from "../utils/terminalAudio";
import { APP_VERSION, RELEASE_DATE_LABEL } from "../constants/version";

const LOGIN_SCRIPT = [
  { text: "$ ssh operator@skillforge.dev", className: "ti-prompt", speed: 34, pause: 380 },
  { text: "Connecting to skillforge.dev:22 ...", className: "ti-output", speed: 20, pause: 320 },
  { text: "Verifying host fingerprint... OK", className: "ti-output", speed: 20, pause: 320 },
  { text: "Authenticating credentials... access granted", className: "ti-output", speed: 20, pause: 420 },
  { text: "Loading session profile... done", className: "ti-output", speed: 20, pause: 700 },
  { text: "Compile skills.", className: "ti-headline", speed: 55, pause: 260 },
  { text: "Deploy your future.", className: "ti-headline ti-headline--accent", speed: 55, pause: 650 },
  {
    text: "Solve coding jobs, get real-time feedback, and track your progress. Join a community of builders and level up with SkillForge.",
    className: "ti-paragraph",
    speed: 14,
    pause: 750,
  },
  { text: "$ cat ./features.log", className: "ti-prompt", speed: 30, pause: 400 },
  { text: "[+] Challenging jobs across Python, JavaScript, Java and more", className: "ti-feature", speed: 16, pause: 260 },
  { text: "[+] Real-time code review with AI-powered feedback", className: "ti-feature", speed: 16, pause: 260 },
  { text: "[+] Progress tracking, achievements and global leaderboards", className: "ti-feature", speed: 16, pause: 260 },
];

function LoadingDots() {
  return (
    <span className="loading-dots" aria-hidden="true">
      <span>.</span><span>.</span><span>.</span>
    </span>
  );
}

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
      <TerminalLogo size={36} />
      <div className="flex flex-col" style={{ lineHeight: 1 }}>
        <span className="font-brand brand-glitch-in" style={{ fontSize: "1.9rem", lineHeight: 1, color: "var(--color-green)" }}>
          SkillForge
          <span className="brand-cursor-bar">|</span>
        </span>
        <span className="brand-version">v{APP_VERSION} · {RELEASE_DATE_LABEL}</span>
      </div>
    </div>
  );
}

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

  // Browsers block audio until a user gesture — unlock as soon as one lands.
  useEffect(() => {
    document.addEventListener("pointerdown", unlockAudio, { once: true });
    document.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    playBootSound();
    return () => stopBootSound();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    playClick();
    try {
      await login(identifier.trim(), password);
      playChime();
      navigate(from, { replace: true });
    } catch (err) {
      playError();
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb w-96 h-96 -top-48 -left-48" style={{ background: "rgba(77,255,143,0.07)" }} />
        <div className="orb w-80 h-80 top-1/2 -right-48"  style={{ background: "rgba(94,200,255,0.06)" }} />
        <div className="orb w-72 h-72 -bottom-48 left-1/3" style={{ background: "rgba(77,255,143,0.04)" }} />
      </div>

      {/* Left branding panel */}
      <div className="auth-left">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <SoundToggle />
        </div>

        <div className="term-window auth-terminal term-scan crt-power-on">
          <div className="term-bar">
            <span className="term-dot term-dot--red" />
            <span className="term-dot term-dot--yellow" />
            <span className="term-dot term-dot--green" />
            <span className="term-title">operator@skillforge: ~</span>
          </div>
          <TerminalTypewriter script={LOGIN_SCRIPT} onComplete={playChime} className="term-body auth-terminal-log" />
        </div>

        <p className="text-dim font-body text-sm">© 2026 SkillForge. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden mb-9">
            <BrandLogo />
          </div>

          {/* Form card — terminal window */}
          <div className="auth-card crt-power-on" style={{ animationDelay: "0.15s" }}>
            <div className="term-bar">
              <span className="term-dot term-dot--red" />
              <span className="term-dot term-dot--yellow" />
              <span className="term-dot term-dot--green" />
              <span className="term-title">login.sh</span>
            </div>

            <div className="auth-card-body">
              <div className="mb-7">
                <h2 className="text-3xl font-bold text-white mb-1.5">Sign in</h2>
                <p className="text-sub font-body text-lg">Welcome back — pick up where you left off.</p>
              </div>

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
                      className="font-heading"
                      style={{ color: "var(--color-blue)", fontSize: "0.718rem", letterSpacing: "0.05em", opacity: 0.75 }}
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
                    <button type="button" className="sf-input-icon-btn" onClick={() => { playClick(); setShowPw((v) => !v); }} tabIndex={-1}>
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
                  {loading ? <><span className="sf-spinner" />Authenticating<LoadingDots /></> : "Sign In"}
                </button>

                <p className="text-center font-body text-dim" style={{ fontSize: "0.92rem" }}>
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="font-heading"
                    style={{ color: "var(--color-blue)", fontSize: "0.77rem", letterSpacing: "0.04em" }}
                  >
                    Create one
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
