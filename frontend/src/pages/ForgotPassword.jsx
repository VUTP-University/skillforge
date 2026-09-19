import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TerminalTypewriter from "../components/TerminalTypewriter";
import TerminalLogo from "../components/TerminalLogo";
import SoundToggle from "../components/SoundToggle";
import { forgotPassword } from "../services/authService";
import { playBootSound, playChime, playClick, playError, stopBootSound, unlockAudio } from "../utils/terminalAudio";
import { APP_VERSION, RELEASE_DATE_LABEL } from "../constants/version";

const FORGOT_SCRIPT = [
  { text: "$ ./recover_access.sh --email", className: "ti-prompt", speed: 34, pause: 380 },
  { text: "Looking up account... done", className: "ti-output", speed: 20, pause: 320 },
  { text: "Generating one-time reset link... done", className: "ti-output", speed: 20, pause: 700 },
  { text: "Locked out?", className: "ti-headline", speed: 55, pause: 260 },
  { text: "We'll get you back in.", className: "ti-headline ti-headline--accent", speed: 55, pause: 650 },
  {
    text: "Enter the email on your account and we'll send a link to choose a new password.",
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

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

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
      await forgotPassword(email.trim().toLowerCase());
      playChime();
      setSent(true);
    } catch (err) {
      playError();
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb w-96 h-96 -top-48 -left-48" style={{ background: "rgba(77,255,143,0.07)" }} />
        <div className="orb w-80 h-80 top-1/2 -right-48"  style={{ background: "rgba(94,200,255,0.06)" }} />
        <div className="orb w-72 h-72 -bottom-48 left-1/3" style={{ background: "rgba(77,255,143,0.04)" }} />
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
          <TerminalTypewriter script={FORGOT_SCRIPT} onComplete={playChime} className="term-body auth-terminal-log" />
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
              <span className="term-title">recover_access.sh</span>
            </div>

            <div className="auth-card-body">
              {sent ? (
                <>
                  <div className="mb-7">
                    <h2 className="text-3xl font-bold text-white mb-1.5">Check your inbox</h2>
                    <p className="text-sub font-body text-lg">
                      If <span style={{ color: "var(--color-green)" }}>{email.trim()}</span> is registered, a reset link is on its way.
                    </p>
                  </div>

                  <div className="sf-success">
                    <CheckIcon />
                    The link expires in 1 hour and can only be used once.
                  </div>

                  <p className="text-center font-body text-dim mt-6" style={{ fontSize: "0.92rem" }}>
                    <Link
                      to="/login"
                      className="font-heading"
                      style={{ color: "var(--color-blue)", fontSize: "0.77rem", letterSpacing: "0.04em" }}
                    >
                      Back to sign in
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-7">
                    <h2 className="text-3xl font-bold text-white mb-1.5">Reset password</h2>
                    <p className="text-sub font-body text-lg">Enter your email and we'll send you a reset link.</p>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div>
                      <label className="sf-label" htmlFor="email">Email address</label>
                      <input
                        id="email"
                        type="email"
                        className="sf-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>

                    {error && (
                      <div className="sf-error">
                        <AlertIcon />
                        {error}
                      </div>
                    )}

                    <button type="submit" className="sf-btn" disabled={loading} style={{ marginTop: "0.5rem" }}>
                      {loading ? <><span className="sf-spinner" />Sending<LoadingDots /></> : "Send Reset Link"}
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
