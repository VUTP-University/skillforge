import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/img/skill_forge_logo.png";

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
      <span className="font-brand glow-pulse" style={{ fontSize: "1.9rem", lineHeight: 1, color: "var(--color-green)" }}>
        SkillForge_
      </span>
    </div>
  );
}

/* ── Feature list ───────────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    text: "Free to join — no strings attached.",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    text: "Track your progress across every language.",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    text: "Earn XP, climb the leaderboard, survive the Underworld.",
  },
];

/* ── Password strength meter ─────────────────────── */

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

/* ── Page ───────────────────────────────────────── */

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form.username.trim(), form.email.trim().toLowerCase(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const mismatch = form.confirm && form.confirm !== form.password;

  return (
    <div className="auth-page">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb w-96 h-96 -top-48 -right-48" style={{ background: "rgba(77,255,143,0.07)" }} />
        <div className="orb w-80 h-80 top-1/2 -left-48"  style={{ background: "rgba(94,200,255,0.06)" }} />
        <div className="orb w-72 h-72 -bottom-48 right-1/3" style={{ background: "rgba(77,255,143,0.04)" }} />
      </div>

      {/* Left branding panel */}
      <div className="auth-left">
        <BrandLogo />

        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-5">
              Initialize your profile.
              <br />
              <span className="text-green">Ship your first quest.</span>
            </h1>
            <p className="text-sub text-lg leading-relaxed max-w-sm font-body">
              Create your free account and unlock coding quests, XP tracking, and a leaderboard that grows with you.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-green-dim)", border: "1px solid var(--color-green-border)" }}
                >
                  {f.icon}
                </div>
                <span className="text-sub font-body" style={{ fontSize: "1rem" }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-dim font-body text-sm">© 2026 SkillForge. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden mb-9">
            <BrandLogo />
          </div>

          {/* Form card — terminal window */}
          <div className="auth-card">
            <div className="term-bar">
              <span className="term-dot term-dot--red" />
              <span className="term-dot term-dot--yellow" />
              <span className="term-dot term-dot--green" />
              <span className="term-title">register.sh</span>
            </div>

            <div className="auth-card-body">
              <div className="mb-7">
                <h2 className="text-3xl font-bold text-white mb-1.5">Create account</h2>
                <p className="text-sub font-body text-lg">Start solving quests and tracking XP.</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                {/* Username */}
                <div>
                  <label className="sf-label" htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    className="sf-input"
                    placeholder="brave_adventurer"
                    value={form.username}
                    onChange={update("username")}
                    autoComplete="username"
                    minLength={3}
                    maxLength={30}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="sf-label" htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    className="sf-input"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={update("email")}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="sf-label" htmlFor="password">Password</label>
                  <div className="sf-input-wrap">
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      className="sf-input"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={update("password")}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="sf-input-icon-btn"
                      onClick={() => setShowPw((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                {/* Confirm password */}
                <div>
                  <label className="sf-label" htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    className={`sf-input${mismatch ? " error" : ""}`}
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={update("confirm")}
                    autoComplete="new-password"
                    required
                  />
                  {mismatch && (
                    <p className="mt-1 font-body text-xs" style={{ color: "var(--color-error-text)" }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5 pt-0.5">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="w-4 h-4 mt-0.5 rounded cursor-pointer flex-shrink-0"
                    style={{ accentColor: "var(--color-green)" }}
                  />
                  <label htmlFor="terms" className="font-body text-sm text-dim cursor-pointer select-none leading-snug">
                    I agree to the{" "}
                    <a href="#" style={{ color: "var(--color-blue)" }}>Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" style={{ color: "var(--color-blue)" }}>Privacy Policy</a>
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div className="sf-error">
                    <AlertIcon />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" className="sf-btn" disabled={loading} style={{ marginTop: "0.5rem" }}>
                  {loading ? (
                    <><span className="sf-spinner" />Creating account…</>
                  ) : (
                    "Create Account"
                  )}
                </button>

                <p className="text-center font-body text-dim" style={{ fontSize: "0.92rem" }}>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-heading"
                    style={{ color: "var(--color-blue)", fontSize: "0.7rem", letterSpacing: "0.04em" }}
                  >
                    Sign in
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
