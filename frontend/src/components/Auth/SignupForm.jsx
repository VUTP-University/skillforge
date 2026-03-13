import { useState } from "react";
import { signup } from "../../services/authService";
import { useNavigate } from "react-router-dom";

// Custom images
import heroAvatar from "../../assets/img/hero_avatar.png";

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

const BrandLogo = () => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-[#03e9f4]/15 border border-[#03e9f4]/25 flex items-center justify-center">
      <svg className="w-5 h-5 text-[#03e9f4]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    </div>
    <span className="text-lg font-bold text-white tracking-tight primary_text">Skill Forge</span>
  </div>
);

const features = [
  {
    icon: (
      <svg className="w-4 h-4 text-[#03e9f4]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    label: "Always free, forever. No credit card required.",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-[#03e9f4]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    label: "Track your progress across all courses",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-[#03e9f4]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    label: "Earn badges and compete with others",
  },
];

export default function SignupForm() {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await signup(form);
      if (result.success) {
        navigate("/", {
          state: {
            showModal: true,
            modalMessage: "Your account was created successfully!",
          },
        });
      } else {
        setError(result.message || "Signup failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred while signing up.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.18] focus:border-[#03e9f4]/50 focus:ring-2 focus:ring-[#03e9f4]/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-all duration-200 text-sm";

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0d1520] via-[#141e30] to-[#0a1628]">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-[#03e9f4]/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 right-1/3 w-72 h-72 bg-[#03e9f4]/5 rounded-full blur-3xl" />
      </div>

      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative border-r border-white/[0.06]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      >
        <BrandLogo />

        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-5 primary_text">
              Start your journey.
              <br />
              <span className="text-[#03e9f4]">Level up fast.</span>
            </h1>
            <p className="text-white/45 text-base leading-relaxed max-w-sm normal_text normal_text--medium">
              Create your free account and unlock a world of skills, projects, and a community that grows with you.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#03e9f4]/10 border border-[#03e9f4]/15 flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <span className="text-white/60 text-sm normal_text normal_text--small">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs normal_text normal_text--small">© 2026 Skill Forge. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[420px] relative z-10">
        <img
          src={heroAvatar}
          alt=""
          aria-hidden="true"
          className="absolute bottom-[-5%] right-[-55%] w-80 opacity-[0.5] pointer-events-none select-none object-contain"
        />
          {/* Mobile logo */}
          <div className="flex lg:hidden mb-10">
            <BrandLogo />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 primary_text">Create an account</h2>
            <p className="text-white/40 text-sm normal_text normal_text--small">It's free and only takes a minute.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-widest normal_text normal_text--small">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                value={form.username}
                onChange={handleChange}
                placeholder="cooldev42"
                className={inputClass}
              />
            </div>

            {/* First + Last name side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-widest normal_text normal_text--small">
                  First name
                </label>
                <input
                  name="firstName"
                  type="text"
                  required
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Alex"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-widest normal_text normal_text--small">
                  Last name
                </label>
                <input
                  name="lastName"
                  type="text"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Smith"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-widest normal_text normal_text--small">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-widest normal_text normal_text--small">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors duration-150"
                  style={{ background: "none", border: "none", padding: 0 }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="w-4 h-4 mt-0.5 rounded accent-[#03e9f4] cursor-pointer flex-shrink-0"
              />
              <label htmlFor="agree-terms" className="text-sm text-white/35 cursor-pointer select-none leading-snug normal_text normal_text--small">
                I agree to the{" "}
                <a href="#" className="text-[#647eff] hover:text-[#8b9fff] transition-colors link_text">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#647eff] hover:text-[#8b9fff] transition-colors link_text">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full primary_button py-3 rounded-xl text-sm font-semibold tracking-wide mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>

            <p className="text-center text-sm text-white/30 pt-1 normal_text normal_text--small">
              Already have an account?{" "}
              <a href="/" className="text-[#647eff] hover:text-[#8b9fff] transition-colors font-medium link_text">
                Sign in here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
