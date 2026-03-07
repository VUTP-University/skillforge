import { useState, useEffect } from "react";
import { login } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "../Layout/Modal";

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
    <span className="text-lg font-bold text-white tracking-tight">SkillForge</span>
  </div>
);

const features = [
  {
    icon: (
      <svg className="w-4 h-4 text-[#03e9f4]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    label: "500+ interactive courses across all levels",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-[#03e9f4]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    label: "Real-world projects & coding challenges",
  },
  {
    icon: (
      <svg className="w-4 h-4 text-[#03e9f4]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    label: "Vibrant community of 10,000+ developers",
  },
];

export default function LoginForm() {
  const location = useLocation();
  const { login: authLogin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await login(form);
      authLogin(response.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.showModal) {
      setShowModal(true);
      setModalMessage(location.state.modalMessage || "Welcome!");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0d1520] via-[#141e30] to-[#0a1628]">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-[#03e9f4]/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-48 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 w-72 h-72 bg-[#03e9f4]/5 rounded-full blur-3xl" />
      </div>

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14 relative border-r border-white/[0.06]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
        <BrandLogo />

        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-5">
              Master skills.
              <br />
              <span className="text-[#03e9f4]">Build the future.</span>
            </h1>
            <p className="text-white/45 text-base leading-relaxed max-w-sm">
              Join thousands of learners advancing their careers through interactive, hands-on courses.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#03e9f4]/10 border border-[#03e9f4]/15 flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <span className="text-white/60 text-sm">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">© 2026 SkillForge. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden mb-10">
            <BrandLogo />
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-white/40 text-sm">Sign in to continue your learning journey.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-widest">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.18] focus:border-[#03e9f4]/50 focus:ring-2 focus:ring-[#03e9f4]/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-all duration-200 text-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-white/45 uppercase tracking-widest">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-[#03e9f4]/55 hover:text-[#03e9f4] transition-colors duration-150 link_text"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.18] focus:border-[#03e9f4]/50 focus:ring-2 focus:ring-[#03e9f4]/10 rounded-xl px-4 py-3 pr-11 text-white placeholder:text-white/20 focus:outline-none transition-all duration-200 text-sm"
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

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="w-4 h-4 rounded accent-[#03e9f4] cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm text-white/35 cursor-pointer select-none">
                Remember me
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
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            <p className="text-center text-sm text-white/30 pt-1">
              Don't have an account?{" "}
              <a href="/signup" className="text-[#647eff] hover:text-[#8b9fff] transition-colors font-medium link_text">
                Register here
              </a>
            </p>
          </form>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Registration Complete"
        message={modalMessage}
      />
    </div>
  );
}
