import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import TerminalTypewriter from "../components/TerminalTypewriter";
import TerminalLogo from "../components/TerminalLogo";
import SoundToggle from "../components/SoundToggle";
import { resetPassword } from "../services/authService";
import { playBootSound, playChime, playClick, playError, stopBootSound, unlockAudio } from "../utils/terminalAudio";
import { APP_VERSION, RELEASE_DATE_LABEL } from "../constants/version";

const RESET_SCRIPT = [
  { text: "$ ./recover_access.sh --set-password", className: "ti-prompt", speed: 34, pause: 380 },
  { text: "Verifying reset token... OK", className: "ti-output", speed: 20, pause: 320 },
  { text: "Awaiting new credentials...", className: "ti-output", speed: 20, pause: 700 },
  { text: "Choose a new password.", className: "ti-headline", speed: 55, pause: 260 },
  { text: "Make it a strong one.", className: "ti-headline ti-headline--accent", speed: 55, pause: 650 },
  {
    text: "This link is single-use and expires in 1 hour. Once you set a new password you'll be able to sign in right away.",
    className: "ti-paragraph",
    speed: 14,
    pause: 750,
  },
];

function LoadingDots() {
  return (
    <span className="loading-dots" aria-hidden="true">
      <span>.</span><span>.</span><span>.</span>
    </span>
  );
}

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

function CheckIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

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

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score  = checks.filter(Boolean).length;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["#ff5f56", "#ffcc66", "#8dffb8", "#4dff8f"];
  const color  = colors[score - 1] || colors[0];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: n <= score ? color : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <p className="font-body text-xs" style={{ color }}>{labels[score - 1] || "Weak"}</p>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const navigate = useNavigate();

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

  const mismatch = confirm && confirm !== password;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      playError();
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      playError();
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    playClick();
    try {
      await resetPassword(token, password);
      playChime();
      setDone(true);
    } catch (err) {
      playError();
      setError(err.response?.data?.error || "This reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb w-96 h-96 -top-48 -right-48" style={{ background: "rgba(77,255,143,0.07)" }} />
        <div className="orb w-80 h-80 top-1/2 -left-48"  style={{ background: "rgba(94,200,255,0.06)" }} />
        <div className="orb w-72 h-72 -bottom-48 right-1/3" style={{ background: "rgba(77,255,143,0.04)" }} />
      </div>

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
          <TerminalTypewriter script={RESET_SCRIPT} onComplete={playChime} className="term-body auth-terminal-log" />
        </div>

        <p className="text-dim font-body text-sm">© 2026 SkillForge. All rights reserved.</p>
      </div>

      <div className="auth-right">
        <div className="w-full max-w-[400px] relative z-10">
          <div className="flex lg:hidden mb-9">
            <BrandLogo />
          </div>

          <div className="auth-card crt-power-on" style={{ animationDelay: "0.15s" }}>
            <div className="term-bar">
              <span className="term-dot term-dot--red" />
              <span className="term-dot term-dot--yellow" />
              <span className="term-dot term-dot--green" />
              <span className="term-title">reset_password.sh</span>
            </div>

            <div className="auth-card-body">
              {!token ? (
                <>
                  <div className="mb-7">
                    <h2 className="text-3xl font-bold text-white mb-1.5">Invalid link</h2>
                    <p className="text-sub font-body text-lg">This reset link is missing its token.</p>
                  </div>
                  <div className="sf-error">
                    <AlertIcon />
                    Request a new link from the forgot password page.
                  </div>
                  <p className="text-center font-body text-dim mt-6" style={{ fontSize: "0.92rem" }}>
                    <Link
                      to="/forgot-password"
                      className="font-heading"
                      style={{ color: "var(--color-blue)", fontSize: "0.77rem", letterSpacing: "0.04em" }}
                    >
                      Request a new link
                    </Link>
                  </p>
                </>
              ) : done ? (
                <>
                  <div className="mb-7">
                    <h2 className="text-3xl font-bold text-white mb-1.5">Password updated</h2>
                    <p className="text-sub font-body text-lg">Your password has been changed successfully.</p>
                  </div>

                  <div className="sf-success">
                    <CheckIcon />
                    You can now sign in with your new password.
                  </div>

                  <button type="button" className="sf-btn" style={{ marginTop: "1.25rem" }} onClick={() => navigate("/login")}>
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-7">
                    <h2 className="text-3xl font-bold text-white mb-1.5">Set new password</h2>
                    <p className="text-sub font-body text-lg">Choose a new password for your account.</p>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div>
                      <label className="sf-label" htmlFor="password">New password</label>
                      <div className="sf-input-wrap">
                        <input
                          id="password"
                          type={showPw ? "text" : "password"}
                          className="sf-input"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                          required
                        />
                        <button type="button" className="sf-input-icon-btn" onClick={() => { playClick(); setShowPw((v) => !v); }} tabIndex={-1}>
                          {showPw ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      <PasswordStrength password={password} />
                    </div>

                    <div>
                      <label className="sf-label" htmlFor="confirm">Confirm password</label>
                      <input
                        id="confirm"
                        type="password"
                        className={`sf-input${mismatch ? " error" : ""}`}
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      {mismatch && (
                        <p className="mt-1 font-body text-xs" style={{ color: "var(--color-error-text)" }}>
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    {error && (
                      <div className="sf-error">
                        <AlertIcon />
                        {error}
                      </div>
                    )}

                    <button type="submit" className="sf-btn" disabled={loading} style={{ marginTop: "0.5rem" }}>
                      {loading ? <><span className="sf-spinner" />Updating<LoadingDots /></> : "Update Password"}
                    </button>

                    <p className="text-center font-body text-dim" style={{ fontSize: "0.92rem" }}>
                      Remembered it?{" "}
                      <Link
                        to="/login"
                        className="font-heading"
                        style={{ color: "var(--color-blue)", fontSize: "0.77rem", letterSpacing: "0.04em" }}
                      >
                        Sign in
                      </Link>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
