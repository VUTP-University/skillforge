import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RANK_STYLE } from "../constants/ranks";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import SectionDivider from "../components/SectionDivider";
import {
  deleteAvatar,
  getMyProfile,
  getMySubmissions,
  getProfile,
  getSubmissionDetail,
  getUserSubmissions,
  updateEmail,
  uploadAvatar,
} from "../services/profileService";

/* ── Constants ───────────────────────────────────────────────────────────── */

const PROCESS_SEVERITY_META = {
  warning:  { label: "Warning",  color: "var(--color-amber)" },
  critical: { label: "Critical", color: "#ff8a5c" },
  fatal:    { label: "Fatal",    color: "var(--color-red-bright)" },
};

const LANG_CONFIG = {
  python:     { name: "Python",     color: "var(--gem-python)" },
  javascript: { name: "JavaScript", color: "var(--gem-javascript)" },
  java:       { name: "Java",       color: "var(--gem-java)" },
  csharp:     { name: "C#",         color: "var(--gem-csharp)" },
  cpp:        { name: "C++",        color: "var(--gem-cpp)" },
};

const LANG_OPTIONS = [
  { value: "", label: "All Languages" },
  { value: "python",     label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java",       label: "Java" },
  { value: "csharp",     label: "C#" },
  { value: "cpp",        label: "C++" },
];

const DIFF_META = {
  junior: { label: "Junior", color: "var(--color-green)" },
  mid:    { label: "Mid",    color: "var(--color-amber)" },
  senior: { label: "Senior", color: "var(--color-red-bright)" },
};

const ACH_CATEGORY_META = {
  job:        { label: "Job",         color: "var(--color-green)",     border: "var(--color-green-border)", glow: "var(--color-green-glow)" },
  process:    { label: "Stack Trace", color: "var(--color-red-bright)", border: "var(--color-red-border)",   glow: "var(--color-red-glow)" },
  test_suite: { label: "Test Suite",  color: "var(--color-amber)",     border: "var(--color-amber-border)", glow: "var(--color-amber-glow)" },
  general:    { label: "General",     color: "var(--color-blue)",      border: "var(--color-blue-border)",  glow: "var(--color-blue-glow)" },
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatChip({ icon, value, label, valueColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      {icon}
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.802rem", fontWeight: 700, color: valueColor ?? "var(--color-text)" }}>
        {value}
      </span>
      {label && (
        <span style={{ fontSize: "0.738rem", color: "var(--color-text-tertiary)" }}>{label}</span>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { userId }                   = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate                     = useNavigate();

  const isOwnProfile = !userId;

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState(null);

  // Email edit
  const [emailVal,  setEmailVal]  = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg,  setEmailMsg]  = useState(null); // { ok, text }

  // Avatar upload
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBusy,    setAvatarBusy]    = useState(false);
  const [avatarMsg,     setAvatarMsg]     = useState(null);
  const fileInputRef = useRef(null);

  // Submissions table (own + public profiles)
  const [subs,        setSubs]        = useState(null);  // { items, total, page, pages, per_page }
  const [subsPage,    setSubsPage]    = useState(1);
  const [subsLoading, setSubsLoading] = useState(false);

  // Submissions table filters
  const [subsSearch,      setSubsSearch]      = useState("");   // debounced job-title search
  const [subsLanguage,    setSubsLanguage]    = useState("");
  const [subsStatus,      setSubsStatus]      = useState("");   // "" | "true" | "false"
  const subsSearchRef     = useRef(subsSearch);
  const subsSearchTimer   = useRef(null);

  function applySubsSearch(value) {
    subsSearchRef.current = value;
    clearTimeout(subsSearchTimer.current);
    subsSearchTimer.current = setTimeout(() => {
      setSubsSearch(subsSearchRef.current);
      setSubsPage(1);
    }, 350);
  }

  // Submission detail modal (own profile only)
  const [subModal,        setSubModal]        = useState(null);
  const [subModalLoading, setSubModalLoading] = useState(false);

  // Stable key to detect which profile is being viewed
  const profileKey = isOwnProfile ? "me" : (userId ?? "me");

  useEffect(() => {
    setLoading(true);
    setLoadErr(null);
    setAvatarFile(null);
    setAvatarPreview(null);

    const req = isOwnProfile ? getMyProfile() : getProfile(parseInt(userId, 10));
    req
      .then(data => {
        setProfile(data);
        if (isOwnProfile) setEmailVal(data.email ?? "");
      })
      .catch(() => setLoadErr("Profile not found."))
      .finally(() => setLoading(false));
  }, [userId, isOwnProfile]);

  // Reset page + filters whenever the viewed profile changes
  useEffect(() => {
    setSubs(null);
    setSubsPage(1);
    setSubsSearch("");
    subsSearchRef.current = "";
    setSubsLanguage("");
    setSubsStatus("");
  }, [profileKey]);

  // Load submissions for own profile OR any public profile
  useEffect(() => {
    setSubsLoading(true);
    let cancelled = false;
    const filters = {};
    if (subsSearch)   filters.search      = subsSearch;
    if (subsLanguage) filters.language    = subsLanguage;
    if (subsStatus)   filters.all_passed  = subsStatus;
    const req = isOwnProfile
      ? getMySubmissions(subsPage, 20, filters)
      : getUserSubmissions(parseInt(userId, 10), subsPage, 20, filters);
    req
      .then(data  => { if (!cancelled) setSubs(data); })
      .finally(() => { if (!cancelled) setSubsLoading(false); });
    return () => { cancelled = true; };
  }, [profileKey, subsPage, subsSearch, subsLanguage, subsStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarMsg(null);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleAvatarUpload() {
    if (!avatarFile || avatarBusy) return;
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      const updated = await uploadAvatar(avatarFile);
      setProfile(prev => ({ ...prev, avatar_url: updated.avatar_url }));
      updateUser({ avatar_url: updated.avatar_url });
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAvatarMsg({ ok: true, text: "Avatar updated." });
    } catch (err) {
      setAvatarMsg({ ok: false, text: err?.response?.data?.error ?? "Upload failed." });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleAvatarRemove() {
    if (avatarBusy) return;
    setAvatarBusy(true);
    setAvatarMsg(null);
    try {
      const updated = await deleteAvatar();
      setProfile(prev => ({ ...prev, avatar_url: null }));
      updateUser({ avatar_url: null });
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAvatarMsg({ ok: true, text: "Avatar removed." });
    } catch {
      setAvatarMsg({ ok: false, text: "Failed to remove avatar." });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleEmailSave() {
    if (emailBusy) return;
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const updated = await updateEmail(emailVal.trim());
      setProfile(prev => ({ ...prev, email: updated.email }));
      updateUser({ email: updated.email });
      setEmailMsg({ ok: true, text: "Email updated." });
    } catch (err) {
      setEmailMsg({ ok: false, text: err?.response?.data?.error ?? "Failed to update email." });
    } finally {
      setEmailBusy(false);
    }
  }

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-32">
        <div className="sf-spinner" style={{ width: "22px", height: "22px" }} />
        <span className="text-sub text-sm">Loading profile…</span>
      </div>
    );
  }

  if (loadErr || !profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <p style={{ fontFamily: "var(--font-brand)", fontSize: "2.5rem", color: "var(--color-red-bright)" }}>404</p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.867rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>
          {loadErr ?? "Profile not found."}
        </p>
        <button onClick={() => navigate(-1)} className="sf-btn-ghost">
          Go Back
        </button>
      </div>
    );
  }

  const rs              = RANK_STYLE[profile.rank] ?? RANK_STYLE["Guest"];
  const comps           = profile.completions ?? [];
  const processChallenges  = profile.process_challenges ?? [];
  const testRuns  = profile.test_runs ?? [];
  const achievements = profile.achievements ?? [];
  const vanquishedCount = processChallenges.filter(c => c.status === "completed").length;
  const runsCompleted = testRuns.filter(s => s.status === "completed").length;
  const runsXP        = testRuns.reduce((sum, s) => sum + (s.score_xp || 0), 0);
  const byLang = comps.reduce((acc, c) => {
    acc[c.language] = (acc[c.language] || 0) + 1;
    return acc;
  }, {});

  const emailDirty = emailVal.trim() !== (profile.email ?? "");

  return (
    <div className="space-y-8">

      {/* Back link — only on public view */}
      {!isOwnProfile && (
        <Link
          to="/users"
          className="text-sub text-xs flex items-center gap-1.5 w-fit"
          style={{ fontFamily: "var(--font-heading)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "")}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          cd ../users
        </Link>
      )}

      {/* ── Profile header — the page's one major panel ── */}
      <div className="term-window">
        <div className="term-bar">
          <span className="term-dot term-dot--red" />
          <span className="term-dot term-dot--yellow" />
          <span className="term-dot term-dot--green" />
          <span className="term-title">cat ~/users/{profile.username}.json</span>
        </div>
        <div className="term-body">
          <div className="flex flex-col sm:flex-row gap-5 sm:items-center">

            <Avatar src={profile.avatar_url} username={profile.username} size={88} />

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name + badges */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.55rem", marginBottom: "0.25rem" }}>
                <h1 style={{
                  fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)",
                  fontFamily: "var(--font-heading)", lineHeight: 1.2, margin: 0,
                }}>
                  {profile.username}
                </h1>

                {/* Rank badge */}
                <span style={{
                  padding: "0.2rem 0.65rem", borderRadius: "3px",
                  border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color,
                  fontFamily: "var(--font-heading)", fontSize: "0.672rem", fontWeight: 700,
                }}>
                  {profile.rank}
                </span>

                {/* Role badge — non-regular users only */}
                {profile.role !== "user" && (
                  <Badge variant="green">{profile.role}</Badge>
                )}
              </div>

              {/* Email — own profile only */}
              {isOwnProfile && profile.email && (
                <p style={{ fontSize: "0.835rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                  {profile.email}
                </p>
              )}

              {/* Member since */}
              <p style={{
                fontSize: "0.757rem", color: "var(--color-text-tertiary)",
                fontFamily: "var(--font-heading)", marginBottom: "1rem",
              }}>
                // member since {new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>

              {/* Stat chips */}
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <StatChip
                  icon={
                    <svg style={{ width: 14, height: 14, color: "var(--color-green)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  }
                  value={profile.total_xp.toLocaleString()}
                  label="XP"
                  valueColor="var(--color-green)"
                />
                <StatChip
                  icon={
                    <svg style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  }
                  value={`Level ${profile.level}`}
                />
                <StatChip
                  icon={
                    <svg style={{ width: 14, height: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  value={comps.length}
                  label={comps.length === 1 ? "Job" : "Jobs"}
                />
                {processChallenges.length > 0 && (
                  <StatChip
                    icon={
                      <svg style={{ width: 14, height: 14, color: "var(--color-red-bright)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                      </svg>
                    }
                    value={vanquishedCount}
                    label={vanquishedCount === 1 ? "Process" : "Processes"}
                    valueColor="var(--color-red-bright)"
                  />
                )}
                {testRuns.length > 0 && (
                  <StatChip
                    icon={
                      <svg style={{ width: 14, height: 14, color: "var(--color-amber)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                    }
                    value={runsCompleted}
                    label={runsCompleted === 1 ? "Run" : "Runs"}
                    valueColor="var(--color-amber)"
                  />
                )}
                {achievements.length > 0 && (
                  <StatChip
                    icon={
                      <svg style={{ width: 14, height: 14, color: "var(--color-blue)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.75A1.125 1.125 0 0113.5 13.125v-1.5M8.25 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.75c.621 0 1.125-.504 1.125-1.125v-1.5m0 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v5.25m5.25 0h-5.25" />
                      </svg>
                    }
                    value={achievements.length}
                    label={achievements.length === 1 ? "Achievement" : "Achievements"}
                    valueColor="var(--color-blue)"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit forms — own profile only ── */}
      {isOwnProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Email */}
          <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p className="sf-label" style={{ marginBottom: 0 }}>Update email</p>
            <input
              type="email"
              className="sf-input"
              value={emailVal}
              onChange={(e) => { setEmailVal(e.target.value); setEmailMsg(null); }}
              placeholder="new@email.com"
            />
            {emailMsg && (
              <p style={{ fontSize: "0.783rem", color: emailMsg.ok ? "var(--color-green)" : "var(--color-red-bright)", marginTop: "-0.25rem" }}>
                {emailMsg.text}
              </p>
            )}
            <button
              onClick={handleEmailSave}
              disabled={emailBusy || !emailDirty}
              className="sf-btn-ghost"
              style={{
                justifyContent: "center",
                color: "var(--color-green)",
                borderColor: "var(--color-green-border)",
                background: "var(--color-green-dim)",
                opacity: (emailBusy || !emailDirty) ? 0.45 : 1,
                cursor: (emailBusy || !emailDirty) ? "not-allowed" : "pointer",
              }}
            >
              {emailBusy ? "Saving…" : "Save Email"}
            </button>
          </div>

          {/* Avatar */}
          <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p className="sf-label" style={{ marginBottom: 0 }}>Avatar</p>

            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <Avatar src={avatarPreview ?? profile.avatar_url} username={profile.username} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.757rem", color: "var(--color-text-secondary)", marginBottom: "0.4rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {avatarFile ? avatarFile.name : "JPEG or PNG, max 2 MB"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <button onClick={() => fileInputRef.current?.click()} className="sf-btn-ghost">
                  Choose File
                </button>
              </div>
            </div>

            {avatarMsg && (
              <p style={{ fontSize: "0.783rem", color: avatarMsg.ok ? "var(--color-green)" : "var(--color-red-bright)" }}>
                {avatarMsg.text}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleAvatarUpload}
                disabled={!avatarFile || avatarBusy}
                className="sf-btn-ghost"
                style={{
                  flex: 1, justifyContent: "center",
                  color: "var(--color-green)",
                  borderColor: "var(--color-green-border)",
                  background: "var(--color-green-dim)",
                  opacity: (!avatarFile || avatarBusy) ? 0.45 : 1,
                  cursor: (!avatarFile || avatarBusy) ? "not-allowed" : "pointer",
                }}
              >
                {avatarBusy && !avatarFile ? "Removing…" : avatarBusy ? "Uploading…" : "Upload"}
              </button>

              {profile.avatar_url && !avatarFile && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={avatarBusy}
                  className="sf-btn-ghost"
                  style={{
                    color: "var(--color-red-bright)",
                    borderColor: "var(--color-red-border)",
                    background: "var(--color-red-dim)",
                    opacity: avatarBusy ? 0.45 : 1,
                    cursor: avatarBusy ? "not-allowed" : "pointer",
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Achievements — trophy case ── */}
      {achievements.length > 0 ? (
        <div className="space-y-4">
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ height: "1px", flex: 1, background: "var(--color-blue-dim)" }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.718rem", fontWeight: 700, color: "var(--color-blue)", flexShrink: 0 }}>
              // achievements_log
            </span>
            <div style={{ height: "1px", flex: 1, background: "var(--color-blue-dim)" }} />
          </div>

          {/* Category legend */}
          <div style={{ display: "flex", gap: "1.1rem", flexWrap: "wrap", justifyContent: "center" }}>
            {Object.values(ACH_CATEGORY_META).map(meta => (
              <span key={meta.label} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, boxShadow: `0 0 6px ${meta.glow}` }} />
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.672rem", color: "var(--color-text-tertiary)" }}>
                  {meta.label}
                </span>
              </span>
            ))}
          </div>

          {/* Trophy grid — fixed 4 columns, capped to ~3 rows before it scrolls.
              Everything (name, description, category, date) sits directly on
              the card — no hover-to-reveal. */}
          <div className="ach-trophy-case">
            {achievements.map((a, i) => {
              const meta = ACH_CATEGORY_META[a.category] ?? ACH_CATEGORY_META.general;
              return (
                <div
                  key={a.slug}
                  className="ach-card"
                  style={{ "--cat-color": meta.color, "--cat-border": meta.border, "--cat-glow": meta.glow, animationDelay: `${i * 30}ms` }}
                >
                  <div className="ach-card-head">
                    <div className="ach-card-glyph">{a.glyph}</div>
                    <span className="ach-card-name">{a.name}</span>
                  </div>
                  <p className="ach-card-desc">{a.description}</p>
                  <div className="ach-card-meta">
                    <span className="ach-card-category" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="ach-card-date">
                      {new Date(a.earned_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : isOwnProfile ? (
        <div style={{ borderRadius: "6px", padding: "2rem", textAlign: "center", border: "1px dashed var(--color-blue-border)", background: "rgba(111,214,255,0.03)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.835rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
            No achievements yet
          </p>
          <p style={{ fontSize: "0.783rem", color: "var(--color-text-tertiary)" }}>
            Complete jobs, patch processes, and clear test suites to start unlocking them.
          </p>
        </div>
      ) : null}

      {/* ── Job progress ── */}
      <div className="space-y-4">
          <SectionDivider title="Progress" />

          {/* Language breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(LANG_CONFIG).map(([lang, cfg]) => {
              const count = byLang[lang] || 0;
              return (
                <div
                  key={lang}
                  className="glass-card"
                  style={{ padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", opacity: count === 0 ? 0.40 : 1 }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "2px", background: cfg.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.783rem", fontWeight: 700, color: "var(--color-text-secondary)", flex: 1 }}>
                    {cfg.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.887rem", fontWeight: 700, color: count > 0 ? "var(--color-green)" : "var(--color-text-faint)" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Submissions table (own: clickable + modal; public: read-only) ── */}
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "0.25rem" }}>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.718rem", fontWeight: 700, color: "var(--color-text-tertiary)", flex: 1 }}>
                {isOwnProfile ? "// submission_history" : "// job_submissions"}
                {subs ? ` (${subs.total.toLocaleString()} run${subs.total !== 1 ? "s" : ""})` : ""}
              </p>
              {!isOwnProfile && (
                <span style={{ fontSize: "0.692rem", color: "var(--color-text-faint)", flexShrink: 0, fontStyle: "italic" }}>
                  code hidden
                </span>
              )}
              {subs && subs.pages > 1 && (
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.692rem", color: "var(--color-text-faint)", flexShrink: 0 }}>
                  page {subs.page} of {subs.pages}
                </span>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap" style={{ paddingLeft: "0.25rem" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "320px" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-faint)", pointerEvents: "none" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text" className="sf-input" placeholder="Search job…"
                  defaultValue={subsSearch}
                  onChange={(e) => applySubsSearch(e.target.value)}
                  style={{ paddingLeft: "2.25rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
                />
              </div>

              {/* Language filter */}
              <select
                value={subsLanguage}
                onChange={(e) => { setSubsLanguage(e.target.value); setSubsPage(1); }}
                className="sf-input"
                style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", minWidth: "130px" }}
              >
                {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Status toggle */}
              <div className="flex gap-1">
                {[["", "All"], ["true", "Passed"], ["false", "Failed"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setSubsStatus(val); setSubsPage(1); }}
                    style={{
                      fontFamily: "var(--font-heading)", fontSize: "0.692rem", fontWeight: 700,
                      letterSpacing: "0.07em", textTransform: "uppercase",
                      padding: "0.38rem 0.75rem", borderRadius: "6px",
                      border: "1px solid",
                      borderColor: subsStatus === val
                        ? (val === "true" ? "rgba(74,222,128,0.4)" : val === "false" ? "rgba(248,113,113,0.4)" : "var(--color-green-border)")
                        : "rgba(255,255,255,0.10)",
                      background: subsStatus === val
                        ? (val === "true" ? "var(--color-green-dim)" : val === "false" ? "var(--color-red-dim)" : "var(--color-green-dim)")
                        : "transparent",
                      color: subsStatus === val
                        ? (val === "true" ? "var(--color-green)" : val === "false" ? "var(--color-red-bright)" : "var(--color-green)")
                        : "rgba(255,255,255,0.40)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table card */}
            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Column headings */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto auto",
                gap: "0.5rem", padding: "0.45rem 1rem 0.45rem 1.25rem",
                borderBottom: "1px solid var(--color-border-2)",
                background: "rgba(77,255,143,0.02)",
              }}>
                {["Job", "Language", "Score", "Status", "Date"].map(h => (
                  <span key={h} style={{ fontFamily: "var(--font-heading)", fontSize: "0.653rem", fontWeight: 700, color: "var(--color-text-faint)" }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Loading / empty / rows */}
              {subsLoading && !subs ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)", fontFamily: "var(--font-heading)", fontSize: "0.77rem" }}>
                  Loading…
                </div>
              ) : subs && subs.items.length === 0 ? (
                <div style={{ padding: "2.5rem", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.802rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
                    {(subsSearch || subsLanguage || subsStatus) ? "No matches" : "No submissions yet"}
                  </p>
                  <p style={{ fontSize: "0.783rem", color: "var(--color-text-tertiary)" }}>
                    {(subsSearch || subsLanguage || subsStatus)
                      ? "No submissions match your filters."
                      : isOwnProfile
                        ? "Start solving jobs to earn XP and build your history."
                        : "This user hasn't submitted any jobs yet."}
                  </p>
                </div>
              ) : (subs?.items ?? []).map((s, i) => {
                const lang       = LANG_CONFIG[s.language];
                const passed     = s.passed ?? 0;
                const total      = s.total  ?? 0;
                const scoreColor = s.all_passed ? "var(--color-green)" : (passed > 0 ? "var(--color-amber)" : "var(--color-red-bright)");
                const rowBase    = {
                  display: "grid", gridTemplateColumns: "1fr auto auto auto auto",
                  gap: "0.5rem", alignItems: "center", width: "100%",
                  padding: "0.6rem 1rem 0.6rem 0.85rem",
                  borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                  borderLeft: `3px solid ${s.all_passed ? "var(--color-green-border)" : "var(--color-red-border)"}`,
                  background: "transparent", textAlign: "left",
                  transition: "background 0.10s",
                };
                const rowCells = (
                  <>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.802rem", fontWeight: 700, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.job_title}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.28rem", flexShrink: 0 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "1px", background: lang?.color ?? "var(--color-text)" }} />
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.64rem", fontWeight: 700, color: "var(--color-text-tertiary)" }}>
                        {lang?.name ?? s.language}
                      </span>
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.738rem", fontWeight: 700, color: scoreColor, flexShrink: 0, minWidth: "2.8rem", textAlign: "right" }}>
                      {total > 0 ? `${passed}/${total}` : "—"}
                    </span>
                    <span style={{
                      flexShrink: 0, padding: "0.18rem 0.5rem", borderRadius: "3px",
                      fontFamily: "var(--font-heading)", fontSize: "0.627rem", fontWeight: 700,
                      background: s.all_passed ? "var(--color-green-dim)" : "var(--color-red-dim)",
                      color:      s.all_passed ? "var(--color-green)"    : "var(--color-red-bright)",
                      border:     `1px solid ${s.all_passed ? "var(--color-green-border)" : "var(--color-red-border)"}`,
                    }}>
                      {s.all_passed ? "PASS" : "FAIL"}
                    </span>
                    <span style={{ fontSize: "0.692rem", color: "var(--color-text-faint)", flexShrink: 0, minWidth: "72px", textAlign: "right" }}>
                      {new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </>
                );

                if (isOwnProfile) {
                  return (
                    <button
                      key={s.id}
                      style={{ ...rowBase, cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(77,255,143,0.03)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      onClick={async () => {
                        setSubModal({ id: s.id, job_title: s.job_title, language: s.language, difficulty: s.difficulty, all_passed: s.all_passed });
                        setSubModalLoading(true);
                        try {
                          const detail = await getSubmissionDetail(s.id);
                          setSubModal(detail);
                        } catch {
                          setSubModal(null);
                        } finally {
                          setSubModalLoading(false);
                        }
                      }}
                    >
                      {rowCells}
                    </button>
                  );
                }

                return (
                  <div key={s.id} style={{ ...rowBase, cursor: "default" }}>
                    {rowCells}
                  </div>
                );
              })}
            </div>

            {/* Pagination controls */}
            {subs && subs.pages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", paddingTop: "0.25rem" }}>
                <span style={{ fontSize: "0.718rem", color: "var(--color-text-faint)" }}>
                  {((subs.page - 1) * subs.per_page + 1).toLocaleString()}–{Math.min(subs.page * subs.per_page, subs.total).toLocaleString()} of {subs.total.toLocaleString()}
                  {` · page ${subs.page} of ${subs.pages}`}
                </span>
                <Pagination
                  page={subs.page}
                  totalPages={subs.pages}
                  onChange={(p) => { if (!subsLoading) setSubsPage(p); }}
                />
              </div>
            )}
          </>
        </div>

      {/* ── Stack Trace Log ── */}
      {processChallenges.length > 0 ? (
        <div className="space-y-4">
          {/* Section label — red, matches The Stack Trace */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ height: "1px", flex: 1, background: "var(--color-red-dim)" }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.718rem", fontWeight: 700, color: "var(--color-red-bright)", flexShrink: 0 }}>
              // stack_trace_log
            </span>
            <div style={{ height: "1px", flex: 1, background: "var(--color-red-dim)" }} />
          </div>

          {/* Challenge list */}
          <div
            style={{
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid var(--color-red-dim)",
              background: "rgba(255,95,86,0.04)",
            }}
          >
            {processChallenges.map((c, i) => {
              const procDiff  = PROCESS_SEVERITY_META[c.difficulty] ?? { label: c.difficulty, color: "var(--color-red-bright)" };
              const lang    = LANG_CONFIG[c.language];
              const verdict = c.process_verdict ?? "";

              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,95,86,0.10)",
                    borderLeft: `3px solid ${procDiff.color}`,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,95,86,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Entity glyph */}
                  <div style={{
                    width: 38, height: 38, borderRadius: "4px", overflow: "hidden", flexShrink: 0,
                    border: `2px solid ${procDiff.color}`,
                    "--tier-color": procDiff.color,
                  }}>
                    <div className="st-glyph st-glyph--sm">{c.process_glyph}</div>
                  </div>

                  {/* Process name + truncated verdict */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-heading)", fontSize: "0.822rem", fontWeight: 700,
                      color: "var(--color-text-secondary)", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {c.process_name}
                    </p>
                    {verdict && (
                      <p style={{
                        fontSize: "0.705rem", color: "var(--color-text-tertiary)", margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontStyle: "italic",
                      }}>
                        "{verdict.length > 72 ? verdict.slice(0, 72) + "…" : verdict}"
                      </p>
                    )}
                  </div>

                  {/* Language */}
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "1px", background: lang?.color ?? "var(--color-text)" }} />
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.672rem", fontWeight: 700, color: "var(--color-text-tertiary)" }}>
                      {lang?.name ?? c.language}
                    </span>
                  </span>

                  {/* Difficulty */}
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.672rem", fontWeight: 700, color: procDiff.color, flexShrink: 0 }}>
                    {procDiff.label}
                  </span>

                  {/* Status badge */}
                  <span style={{
                    padding: "0.15rem 0.55rem", borderRadius: "3px", flexShrink: 0,
                    background: c.status === "completed" ? "var(--color-green-dim)" : "var(--color-red-dim)",
                    border: `1px solid ${c.status === "completed" ? "var(--color-green-border)" : "var(--color-red-border)"}`,
                    color: c.status === "completed" ? "var(--color-green)" : "var(--color-red-bright)",
                    fontFamily: "var(--font-heading)", fontSize: "0.672rem", fontWeight: 700,
                  }}>
                    {c.status === "completed" ? "PATCHED" : "UNRESOLVED"}
                  </span>

                  {/* Score bar + XP — completed only */}
                  {c.status === "completed" && (
                    <>
                      <div style={{ width: 44, flexShrink: 0 }}>
                        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,95,86,0.15)", marginBottom: "0.2rem" }}>
                          <div style={{ height: 3, borderRadius: 2, background: procDiff.color, width: `${c.score_pct ?? 0}%` }} />
                        </div>
                        <span style={{ fontSize: "0.64rem", color: "var(--color-text-tertiary)", fontFamily: "var(--font-heading)" }}>
                          {c.score_pct ?? 0}%
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.757rem", fontWeight: 700, color: "var(--color-red-bright)", flexShrink: 0 }}>
                        +{c.xp_earned}
                      </span>
                    </>
                  )}

                  {/* Date */}
                  <span style={{ fontSize: "0.705rem", color: "var(--color-text-faint)", flexShrink: 0, minWidth: "80px", textAlign: "right" }}>
                    {new Date(c.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : isOwnProfile ? (
        <div
          style={{
            borderRadius: "6px", padding: "2rem", textAlign: "center",
            border: "1px dashed var(--color-red-border)", background: "rgba(255,95,86,0.04)",
          }}
        >
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.835rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
            No stack traces yet
          </p>
          <p style={{ fontSize: "0.783rem", color: "var(--color-text-tertiary)", marginBottom: "1rem" }}>
            Take on a hostile process and see if your code holds up.
          </p>
          <Link
            to="/stack-trace"
            className="sf-btn-ghost"
            style={{ display: "inline-flex", color: "var(--color-red-bright)", borderColor: "var(--color-red-border)", background: "var(--color-red-dim)" }}
          >
            Trace the Stack
          </Link>
        </div>
      ) : null}

      {/* ── Test Suite Log ── */}
      {testRuns.length > 0 ? (
        <div className="space-y-4">
          {/* Section label — amber, matches The Test Suite */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ height: "1px", flex: 1, background: "var(--color-amber-dim)" }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.718rem", fontWeight: 700, color: "var(--color-amber)", flexShrink: 0 }}>
              // test_suite_log
            </span>
            <div style={{ height: "1px", flex: 1, background: "var(--color-amber-dim)" }} />
          </div>

          {/* Summary chips */}
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            {[
              [`${testRuns.length}`, "Runs played"],
              [`${runsCompleted}`, "Completed"],
              [`+${runsXP} XP`, "Total earned"],
            ].map(([val, lbl]) => (
              <div key={lbl} style={{ padding: "0.4rem 0.85rem", borderRadius: "4px", background: "var(--color-amber-dim)", border: "1px solid var(--color-amber-border)", display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.822rem", fontWeight: 700, color: "var(--color-amber)" }}>{val}</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.672rem", color: "var(--color-text-tertiary)" }}>{lbl}</span>
              </div>
            ))}
          </div>

          {/* Session list */}
          <div style={{ borderRadius: "6px", overflow: "hidden", border: "1px solid var(--color-amber-dim)", background: "rgba(255,204,102,0.03)" }}>
            {testRuns.map((s, i) => {
              const langMeta = {
                python:     { label: "Python",     glyph: "py", color: "var(--gem-python)" },
                javascript: { label: "JavaScript", glyph: "js", color: "var(--gem-javascript)" },
                java:       { label: "Java",       glyph: "jv", color: "var(--gem-java)" },
                csharp:     { label: "C#",         glyph: "c#", color: "var(--gem-csharp)" },
                cpp:        { label: "C++",        glyph: "c++", color: "var(--gem-cpp)" },
                mix:        { label: "All Paths",  glyph: "**", color: "var(--color-blue)" },
              }[s.language] ?? { label: s.language, glyph: "?", color: "var(--color-amber)" };

              const completed = s.status === "completed";
              const accuracy  = s.total_questions > 0 ? Math.round((s.correct_count / s.total_questions) * 100) : 0;
              const barColor  = accuracy >= 75 ? "var(--color-green)" : accuracy >= 50 ? "var(--color-amber)" : "var(--color-red-bright)";

              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.85rem",
                    padding: "0.75rem 1rem",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,204,102,0.08)",
                    borderLeft: `3px solid ${completed ? "var(--color-amber)" : "rgba(255,255,255,0.15)"}`,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,204,102,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Language glyph */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "4px", flexShrink: 0,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--color-border-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-heading)", fontSize: "0.718rem", fontWeight: 700,
                    color: langMeta.color,
                  }}>
                    {langMeta.glyph}
                  </div>

                  {/* Language + accuracy bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.802rem", fontWeight: 700, color: "var(--color-text-secondary)", margin: 0, marginBottom: "0.25rem" }}>
                      {langMeta.label}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", maxWidth: 80 }}>
                        <div style={{ height: 3, borderRadius: 2, background: barColor, width: `${accuracy}%`, transition: "width 0.4s ease" }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.653rem", color: "var(--color-text-tertiary)" }}>
                        {s.correct_count}/{s.total_questions} correct
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: "0.15rem 0.55rem", borderRadius: "3px", flexShrink: 0,
                    background: completed ? "var(--color-amber-dim)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${completed ? "var(--color-amber-border)" : "var(--color-border-2)"}`,
                    color: completed ? "var(--color-amber)" : "var(--color-text-tertiary)",
                    fontFamily: "var(--font-heading)", fontSize: "0.653rem", fontWeight: 700,
                  }}>
                    {completed ? "COMPLETED" : "EXPIRED"}
                  </span>

                  {/* XP */}
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.783rem", fontWeight: 700, color: s.score_xp > 0 ? "var(--color-amber)" : "var(--color-text-faint)", flexShrink: 0 }}>
                    +{s.score_xp} XP
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: "0.705rem", color: "var(--color-text-faint)", flexShrink: 0, minWidth: "80px", textAlign: "right" }}>
                    {new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : isOwnProfile ? (
        <div style={{ borderRadius: "6px", padding: "2rem", textAlign: "center", border: "1px dashed var(--color-amber-border)", background: "rgba(255,204,102,0.03)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.835rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
            No runs completed yet
          </p>
          <p style={{ fontSize: "0.783rem", color: "var(--color-text-tertiary)", marginBottom: "1rem" }}>
            Clear the weekly test suite and prove your knowledge.
          </p>
          <Link
            to="/test-suite"
            className="sf-btn-ghost"
            style={{ display: "inline-flex", color: "var(--color-amber)", borderColor: "var(--color-amber-border)", background: "var(--color-amber-dim)" }}
          >
            Run the Suite
          </Link>
        </div>
      ) : null}

      {/* ── Submission detail modal — floats as its own terminal window ── */}
      {(subModal || subModalLoading) && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => { setSubModal(null); setSubModalLoading(false); }}
        >
          <div
            className="term-window"
            style={{ width: "100%", maxWidth: "780px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="term-bar">
              <span className="term-dot term-dot--red" />
              <span className="term-dot term-dot--yellow" />
              <span className="term-dot term-dot--green" />
              <span className="term-title">{subModal?.job_title ?? "loading…"}</span>
              <button
                onClick={() => { setSubModal(null); setSubModalLoading(false); }}
                style={{ background: "none", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "0 0.2rem", flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
              >
                ✕
              </button>
            </div>

            {/* Meta row */}
            {subModal?.language && (
              <div style={{ padding: "0.6rem 1.4rem", borderBottom: "1px solid var(--color-border-2)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {(() => {
                  const diff = DIFF_META[subModal.difficulty] ?? DIFF_META.junior;
                  const lang = LANG_CONFIG[subModal.language];
                  return (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.28rem", flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "1px", background: lang?.color ?? "var(--color-text)" }} />
                        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.653rem", fontWeight: 700, color: "var(--color-text-tertiary)" }}>
                          {lang?.name ?? subModal.language}
                        </span>
                      </span>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.653rem", fontWeight: 700, color: diff.color, flexShrink: 0 }}>
                        {diff.label}
                      </span>
                      <span style={{
                        padding: "0.18rem 0.5rem", borderRadius: "3px",
                        fontFamily: "var(--font-heading)", fontSize: "0.627rem", fontWeight: 700,
                        background: subModal.all_passed ? "var(--color-green-dim)" : "var(--color-red-dim)",
                        color:      subModal.all_passed ? "var(--color-green)"    : "var(--color-red-bright)",
                        border:     `1px solid ${subModal.all_passed ? "var(--color-green-border)" : "var(--color-red-border)"}`,
                        flexShrink: 0,
                      }}>
                        {subModal.all_passed ? "PASS" : "FAIL"}
                      </span>
                    </>
                  );
                })()}
              </div>
            )}

            {subModalLoading && !subModal?.solution_code ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-tertiary)", fontFamily: "var(--font-heading)", fontSize: "0.783rem" }}>
                Retrieving submission…
              </div>
            ) : subModal && (
              <div style={{ overflowY: "auto", flex: 1 }}>
                {/* Test results bar */}
                {subModal.test_results && (
                  <div style={{ padding: "0.8rem 1.4rem", borderBottom: "1px solid var(--color-border-2)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.692rem", fontWeight: 700, color: "var(--color-text-tertiary)" }}>
                      Tests
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.822rem", fontWeight: 700, color: subModal.all_passed ? "var(--color-green)" : "var(--color-red-bright)" }}>
                      {subModal.test_results.passed}/{subModal.test_results.total} passed
                    </span>
                    <div style={{ display: "flex", gap: "0.28rem", flexWrap: "wrap", flex: 1 }}>
                      {(subModal.test_results.results ?? []).map((r, idx) => (
                        <span
                          key={idx}
                          title={`Test ${idx + 1}: ${r.passed ? "passed" : "failed"}`}
                          style={{
                            width: "1.05rem", height: "1.05rem", borderRadius: "2px",
                            background: r.passed ? "var(--color-green-dim)" : "var(--color-red-dim)",
                            border: `1px solid ${r.passed ? "var(--color-green-border)" : "var(--color-red-border)"}`,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.627rem", color: r.passed ? "var(--color-green)" : "var(--color-red-bright)",
                          }}
                        >
                          {r.passed ? "✓" : "✗"}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: "0.692rem", color: "var(--color-text-faint)", flexShrink: 0 }}>
                      {new Date(subModal.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                )}

                {/* Code */}
                <div style={{ padding: "0.85rem 1.4rem 1.2rem" }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.672rem", fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: "0.55rem" }}>
                    // submitted_code
                  </p>
                  <pre style={{
                    margin: 0, padding: "1rem 1.1rem",
                    background: "rgba(0,0,0,0.4)", borderRadius: "4px",
                    border: "1px solid var(--color-border-2)",
                    fontFamily: "var(--font-heading)", fontSize: "0.816rem",
                    color: "var(--color-text-secondary)", lineHeight: 1.7,
                    overflowX: "auto", whiteSpace: "pre", tabSize: 4,
                  }}>
                    {subModal.solution_code}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
