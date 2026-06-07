import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

// Boss portraits (Underworld Chronicles)
import imgArcanis        from "../assets/img/underworld_realm/Arcanis.png";
import imgDOMinus        from "../assets/img/underworld_realm/DOMinus.png";
import imgEldrin         from "../assets/img/underworld_realm/Eldrin.png";
import imgExceptionor    from "../assets/img/underworld_realm/Exceptionor.png";
import imgFlameatrix     from "../assets/img/underworld_realm/Flameatrix.png";
import imgLambdaen       from "../assets/img/underworld_realm/Lambdaen.png";
import imgNecroPy        from "../assets/img/underworld_realm/NecroPy.png";
import imgNethraxis      from "../assets/img/underworld_realm/Nethraxis.png";
import imgSerpentis      from "../assets/img/underworld_realm/Serpentis.png";
import imgSerpyros       from "../assets/img/underworld_realm/Serpyros.png";
import imgShadowScripter from "../assets/img/underworld_realm/Shadow Scripter.png";
import imgValora         from "../assets/img/underworld_realm/Valora.png";

/* ── Constants ───────────────────────────────────────────────────────────── */

const BOSS_IMAGES = {
  "Arcanis.png":         imgArcanis,
  "DOMinus.png":         imgDOMinus,
  "Eldrin.png":          imgEldrin,
  "Exceptionor.png":     imgExceptionor,
  "Flameatrix.png":      imgFlameatrix,
  "Lambdaen.png":        imgLambdaen,
  "NecroPy.png":         imgNecroPy,
  "Nethraxis.png":       imgNethraxis,
  "Serpentis.png":       imgSerpentis,
  "Serpyros.png":        imgSerpyros,
  "Shadow Scripter.png": imgShadowScripter,
  "Valora.png":          imgValora,
};

const UW_DIFF_META = {
  cursed:   { label: "Cursed",   color: "#ef4444" },
  damned:   { label: "Damned",   color: "#f97316" },
  infernal: { label: "Infernal", color: "#a855f7" },
};

const LANG_CONFIG = {
  python:     { name: "Python",     color: "#3b82f6" },
  javascript: { name: "JavaScript", color: "#fbbf24" },
  java:       { name: "Java",       color: "#f97316" },
  csharp:     { name: "C#",         color: "#a78bfa" },
};

const DIFF_META = {
  shallow: { label: "Shallow", color: "#4ade80" },
  cryptic: { label: "Cryptic", color: "#fbbf24" },
  abyssal: { label: "Abyssal", color: "#f87171" },
};

const RANK_STYLE = {
  "Novice":       { color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.05)",  border: "rgba(255,255,255,0.12)" },
  "Initiate":     { color: "#86efac",                bg: "rgba(134,239,172,0.08)", border: "rgba(134,239,172,0.22)" },
  "Apprentice":   { color: "#4ade80",                bg: "rgba(74,222,128,0.09)",  border: "rgba(74,222,128,0.26)"  },
  "Scribe":       { color: "#34d399",                bg: "rgba(52,211,153,0.09)",  border: "rgba(52,211,153,0.26)"  },
  "Acolyte":      { color: "#2dd4bf",                bg: "rgba(45,212,191,0.09)",  border: "rgba(45,212,191,0.26)"  },
  "Scholar":      { color: "#22d3ee",                bg: "rgba(34,211,238,0.09)",  border: "rgba(34,211,238,0.26)"  },
  "Artisan":      { color: "#38bdf8",                bg: "rgba(56,189,248,0.09)",  border: "rgba(56,189,248,0.26)"  },
  "Adept":        { color: "#60a5fa",                bg: "rgba(96,165,250,0.09)",  border: "rgba(96,165,250,0.26)"  },
  "Journeyman":   { color: "#818cf8",                bg: "rgba(129,140,248,0.09)", border: "rgba(129,140,248,0.26)" },
  "Crusader":     { color: "#a78bfa",                bg: "rgba(167,139,250,0.09)", border: "rgba(167,139,250,0.26)" },
  "Knight":       { color: "#c084fc",                bg: "rgba(192,132,252,0.09)", border: "rgba(192,132,252,0.26)" },
  "Champion":     { color: "#e879f9",                bg: "rgba(232,121,249,0.09)", border: "rgba(232,121,249,0.26)" },
  "Sentinel":     { color: "#f472b6",                bg: "rgba(244,114,182,0.09)", border: "rgba(244,114,182,0.26)" },
  "Warden":       { color: "#fb7185",                bg: "rgba(251,113,133,0.09)", border: "rgba(251,113,133,0.26)" },
  "Paladin":      { color: "#f97316",                bg: "rgba(249,115,22,0.09)",  border: "rgba(249,115,22,0.26)"  },
  "Sage":         { color: "#fb923c",                bg: "rgba(251,146,60,0.09)",  border: "rgba(251,146,60,0.26)"  },
  "Elder":        { color: "#fbbf24",                bg: "rgba(251,191,36,0.09)",  border: "rgba(251,191,36,0.30)"  },
  "Archmage":     { color: "#facc15",                bg: "rgba(250,204,21,0.09)",  border: "rgba(250,204,21,0.32)"  },
  "Master":       { color: "#fcd34d",                bg: "rgba(252,211,77,0.10)",  border: "rgba(252,211,77,0.38)"  },
  "Grand Master": { color: "#fef08a",                bg: "rgba(254,240,138,0.10)", border: "rgba(254,240,138,0.45)" },
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

function Avatar({ avatarUrl, username, size = 88 }) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid rgba(3,233,244,0.30)",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: "50%",
        background: "rgba(3,233,244,0.12)",
        border: "2px solid rgba(3,233,244,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontFamily: "var(--font-heading)", fontWeight: 700,
        color: "var(--color-cyan)", flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function StatChip({ icon, value, label, valueColor }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
      {icon}
      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", fontWeight: 700, color: valueColor ?? "rgba(255,255,255,0.85)" }}>
        {value}
      </span>
      {label && (
        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.30)" }}>{label}</span>
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

  // Reset page whenever the viewed profile changes
  useEffect(() => {
    setSubs(null);
    setSubsPage(1);
  }, [profileKey]);

  // Load submissions for own profile OR any public profile
  useEffect(() => {
    setSubsLoading(true);
    let cancelled = false;
    const req = isOwnProfile
      ? getMySubmissions(subsPage, 20)
      : getUserSubmissions(parseInt(userId, 10), subsPage, 20);
    req
      .then(data  => { if (!cancelled) setSubs(data); })
      .finally(() => { if (!cancelled) setSubsLoading(false); });
    return () => { cancelled = true; };
  }, [profileKey, subsPage]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <p style={{ fontSize: "2.5rem" }}>⚗</p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.60)" }}>
          {loadErr ?? "Profile not found."}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: "0.25rem", padding: "0.45rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.55)",
            fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
            letterSpacing: "0.10em", textTransform: "uppercase", cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const rs              = RANK_STYLE[profile.rank] ?? RANK_STYLE["Novice"];
  const comps           = profile.completions ?? [];
  const bossChallenges  = profile.boss_challenges ?? [];
  const triviaSessions  = profile.trivia_sessions ?? [];
  const vanquishedCount = bossChallenges.filter(c => c.status === "completed").length;
  const triviaCompleted = triviaSessions.filter(s => s.status === "completed").length;
  const triviaXP        = triviaSessions.reduce((sum, s) => sum + (s.score_xp || 0), 0);
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
          style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "")}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          The Guild
        </Link>
      )}

      {/* ── Profile header ── */}
      <div className="glass-card" style={{ padding: "1.75rem" }}>
        <div className="flex flex-col sm:flex-row gap-5 sm:items-center">

          <Avatar avatarUrl={profile.avatar_url} username={profile.username} size={88} />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + badges */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.55rem", marginBottom: "0.25rem" }}>
              <h1 style={{
                fontSize: "1.65rem", fontWeight: 700, color: "#fff",
                fontFamily: "var(--font-heading)", lineHeight: 1.2, margin: 0,
              }}>
                {profile.username}
              </h1>

              {/* Rank badge */}
              <span style={{
                padding: "0.2rem 0.65rem", borderRadius: "99px",
                border: `1px solid ${rs.border}`, background: rs.bg, color: rs.color,
                fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
                letterSpacing: "0.10em", textTransform: "uppercase",
              }}>
                {profile.rank}
              </span>

              {/* Role badge — non-regular users only */}
              {profile.role !== "user" && (
                <span style={{
                  padding: "0.2rem 0.65rem", borderRadius: "99px",
                  border: "1px solid rgba(3,233,244,0.28)", background: "rgba(3,233,244,0.08)",
                  color: "var(--color-cyan)",
                  fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
                  letterSpacing: "0.10em", textTransform: "uppercase",
                }}>
                  {profile.role}
                </span>
              )}
            </div>

            {/* Email — own profile only */}
            {isOwnProfile && profile.email && (
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.38)", marginBottom: "0.5rem" }}>
                {profile.email}
              </p>
            )}

            {/* Member since */}
            <p style={{
              fontSize: "0.68rem", color: "rgba(255,255,255,0.26)",
              fontFamily: "var(--font-heading)", letterSpacing: "0.04em", marginBottom: "1rem",
            }}>
              Member since {new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>

            {/* Stat chips */}
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <StatChip
                icon={
                  <svg style={{ width: 14, height: 14, color: "var(--color-cyan)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                }
                value={profile.total_xp.toLocaleString()}
                label="XP"
                valueColor="var(--color-cyan)"
              />
              <StatChip
                icon={
                  <svg style={{ width: 14, height: 14, color: "rgba(255,255,255,0.35)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                }
                value={`Level ${profile.level}`}
              />
              <StatChip
                icon={
                  <svg style={{ width: 14, height: 14, color: "rgba(255,255,255,0.35)", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                value={comps.length}
                label={comps.length === 1 ? "Quest" : "Quests"}
              />
              {bossChallenges.length > 0 && (
                <StatChip
                  icon={
                    <svg style={{ width: 14, height: 14, color: "#f87171", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                    </svg>
                  }
                  value={vanquishedCount}
                  label={vanquishedCount === 1 ? "Boss" : "Bosses"}
                  valueColor="#fca5a5"
                />
              )}
              {triviaSessions.length > 0 && (
                <StatChip
                  icon={
                    <svg style={{ width: 14, height: 14, color: "#eab308", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  }
                  value={triviaCompleted}
                  label={triviaCompleted === 1 ? "Trial" : "Trials"}
                  valueColor="#eab308"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit forms — own profile only ── */}
      {isOwnProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Email */}
          <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              Update Email
            </p>
            <input
              type="email"
              value={emailVal}
              onChange={(e) => { setEmailVal(e.target.value); setEmailMsg(null); }}
              style={{
                width: "100%", padding: "0.55rem 0.85rem",
                borderRadius: "8px", border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)",
                fontSize: "0.82rem", outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(3,233,244,0.35)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
              placeholder="new@email.com"
            />
            {emailMsg && (
              <p style={{ fontSize: "0.72rem", color: emailMsg.ok ? "#4ade80" : "#f87171", marginTop: "-0.25rem" }}>
                {emailMsg.text}
              </p>
            )}
            <button
              onClick={handleEmailSave}
              disabled={emailBusy || !emailDirty}
              style={{
                padding: "0.5rem 1rem", borderRadius: "8px",
                border: "1px solid rgba(3,233,244,0.25)", background: "rgba(3,233,244,0.08)",
                color: "var(--color-cyan)",
                fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.10em", textTransform: "uppercase",
                cursor: (emailBusy || !emailDirty) ? "not-allowed" : "pointer",
                opacity: (emailBusy || !emailDirty) ? 0.45 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!emailBusy && emailDirty) e.currentTarget.style.background = "rgba(3,233,244,0.14)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(3,233,244,0.08)"; }}
            >
              {emailBusy ? "Saving…" : "Save Email"}
            </button>
          </div>

          {/* Avatar */}
          <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              Avatar
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <Avatar avatarUrl={avatarPreview ?? profile.avatar_url} username={profile.username} size={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.4rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {avatarFile ? avatarFile.name : "JPEG or PNG, max 2 MB"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "0.3rem 0.7rem", borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.60)",
                    fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                >
                  Choose File
                </button>
              </div>
            </div>

            {avatarMsg && (
              <p style={{ fontSize: "0.72rem", color: avatarMsg.ok ? "#4ade80" : "#f87171" }}>
                {avatarMsg.text}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleAvatarUpload}
                disabled={!avatarFile || avatarBusy}
                style={{
                  flex: 1, padding: "0.5rem", borderRadius: "8px",
                  border: "1px solid rgba(3,233,244,0.25)", background: "rgba(3,233,244,0.08)",
                  color: "var(--color-cyan)",
                  fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
                  letterSpacing: "0.10em", textTransform: "uppercase",
                  cursor: (!avatarFile || avatarBusy) ? "not-allowed" : "pointer",
                  opacity: (!avatarFile || avatarBusy) ? 0.45 : 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (avatarFile && !avatarBusy) e.currentTarget.style.background = "rgba(3,233,244,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(3,233,244,0.08)"; }}
              >
                {avatarBusy && !avatarFile ? "Removing…" : avatarBusy ? "Uploading…" : "Upload"}
              </button>

              {profile.avatar_url && !avatarFile && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={avatarBusy}
                  style={{
                    padding: "0.5rem 0.8rem", borderRadius: "8px",
                    border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)",
                    color: "#f87171",
                    fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.10em", textTransform: "uppercase",
                    cursor: avatarBusy ? "not-allowed" : "pointer",
                    opacity: avatarBusy ? 0.45 : 1, transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!avatarBusy) e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Quest progress ── */}
      <div className="space-y-4">
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", flexShrink: 0 }}>
              Progress
            </span>
            <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

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
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.75)", flex: 1 }}>
                    {cfg.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.88rem", fontWeight: 700, color: count > 0 ? "var(--color-cyan)" : "rgba(255,255,255,0.20)" }}>
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
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", flex: 1 }}>
                {isOwnProfile ? "Submission History" : "Quest Submissions"}
                {subs ? ` — ${subs.total.toLocaleString()} run${subs.total !== 1 ? "s" : ""}` : ""}
              </p>
              {!isOwnProfile && (
                <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.18)", flexShrink: 0, fontStyle: "italic" }}>
                  code hidden
                </span>
              )}
              {subs && subs.pages > 1 && (
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", color: "rgba(255,255,255,0.20)", flexShrink: 0 }}>
                  page {subs.page} of {subs.pages}
                </span>
              )}
            </div>

            {/* Table card */}
            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Column headings */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto auto",
                gap: "0.5rem", padding: "0.45rem 1rem 0.45rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}>
                {["Quest", "Language", "Score", "Status", "Date"].map(h => (
                  <span key={h} style={{ fontFamily: "var(--font-heading)", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Loading / empty / rows */}
              {subsLoading && !subs ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-heading)", fontSize: "0.7rem" }}>
                  Loading…
                </div>
              ) : subs && subs.items.length === 0 ? (
                <div style={{ padding: "2.5rem", textAlign: "center" }}>
                  <p style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>⚔</p>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem" }}>
                    No submissions yet
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>
                    {isOwnProfile
                      ? "Start solving quests to earn XP and build your legend."
                      : "This adventurer hasn't submitted any quests yet."}
                  </p>
                </div>
              ) : (subs?.items ?? []).map((s, i) => {
                const lang       = LANG_CONFIG[s.language];
                const passed     = s.passed ?? 0;
                const total      = s.total  ?? 0;
                const scoreColor = s.all_passed ? "#4ade80" : (passed > 0 ? "#fb923c" : "#f87171");
                const rowBase    = {
                  display: "grid", gridTemplateColumns: "1fr auto auto auto auto",
                  gap: "0.5rem", alignItems: "center", width: "100%",
                  padding: "0.6rem 1rem 0.6rem 0.85rem",
                  borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                  borderLeft: `3px solid ${s.all_passed ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.35)"}`,
                  background: "transparent", textAlign: "left",
                  transition: "background 0.10s",
                };
                const rowCells = (
                  <>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.quest_title}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.28rem", flexShrink: 0 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: lang?.color ?? "#fff" }} />
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.07em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
                        {lang?.name ?? s.language}
                      </span>
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.65rem", fontWeight: 700, color: scoreColor, flexShrink: 0, minWidth: "2.8rem", textAlign: "right" }}>
                      {total > 0 ? `${passed}/${total}` : "—"}
                    </span>
                    <span style={{
                      flexShrink: 0, padding: "0.18rem 0.5rem", borderRadius: "4px",
                      fontFamily: "var(--font-heading)", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      background: s.all_passed ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.10)",
                      color:      s.all_passed ? "#4ade80"               : "#f87171",
                      border:     `1px solid ${s.all_passed ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.20)"}`,
                    }}>
                      {s.all_passed ? "Passed" : "Failed"}
                    </span>
                    <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.22)", flexShrink: 0, minWidth: "72px", textAlign: "right" }}>
                      {new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </>
                );

                if (isOwnProfile) {
                  return (
                    <button
                      key={s.id}
                      style={{ ...rowBase, cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      onClick={async () => {
                        setSubModal({ id: s.id, quest_title: s.quest_title, language: s.language, difficulty: s.difficulty, all_passed: s.all_passed });
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.25rem" }}>
                <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.22)" }}>
                  {((subs.page - 1) * subs.per_page + 1).toLocaleString()}–{Math.min(subs.page * subs.per_page, subs.total).toLocaleString()} of {subs.total.toLocaleString()}
                </span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    disabled={subs.page <= 1 || subsLoading}
                    onClick={() => setSubsPage(p => p - 1)}
                    style={{
                      fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "0.3rem 0.7rem", borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.12)", background: "transparent",
                      color: subs.page <= 1 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)",
                      cursor: subs.page <= 1 ? "default" : "pointer",
                    }}
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={subs.page >= subs.pages || subsLoading}
                    onClick={() => setSubsPage(p => p + 1)}
                    style={{
                      fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "0.3rem 0.7rem", borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.12)", background: "transparent",
                      color: subs.page >= subs.pages ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)",
                      cursor: subs.page >= subs.pages ? "default" : "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        </div>

      {/* ── Underworld Chronicles ── */}
      {bossChallenges.length > 0 ? (
        <div className="space-y-4">
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ height: "1px", flex: 1, background: "rgba(220,38,38,0.15)" }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(220,38,38,0.55)", flexShrink: 0 }}>
              Underworld Chronicles
            </span>
            <div style={{ height: "1px", flex: 1, background: "rgba(220,38,38,0.15)" }} />
          </div>

          {/* Challenge list */}
          <div
            style={{
              borderRadius: "0.875rem",
              overflow: "hidden",
              border: "1px solid rgba(220,38,38,0.12)",
              background: "rgba(127,29,29,0.08)",
            }}
          >
            {bossChallenges.map((c, i) => {
              const uwDiff  = UW_DIFF_META[c.difficulty] ?? { label: c.difficulty, color: "#ef4444" };
              const lang    = LANG_CONFIG[c.language];
              const imgSrc  = BOSS_IMAGES[c.boss_avatar];
              const verdict = c.boss_verdict ?? "";

              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderTop: i === 0 ? "none" : "1px solid rgba(220,38,38,0.06)",
                    borderLeft: `3px solid ${uwDiff.color}`,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Boss portrait */}
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                    border: `2px solid ${uwDiff.color}44`,
                    background: "rgba(0,0,0,0.35)",
                  }}>
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt={c.boss_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
                      />
                    )}
                  </div>

                  {/* Boss name + truncated verdict */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-heading)", fontSize: "0.78rem", fontWeight: 700,
                      color: "rgba(255,255,255,0.85)", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {c.boss_name}
                    </p>
                    {verdict && (
                      <p style={{
                        fontSize: "0.60rem", color: "rgba(255,255,255,0.25)", margin: 0,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontStyle: "italic",
                      }}>
                        "{verdict.length > 72 ? verdict.slice(0, 72) + "…" : verdict}"
                      </p>
                    )}
                  </div>

                  {/* Language */}
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: lang?.color ?? "#fff" }} />
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.32)", textTransform: "uppercase" }}>
                      {lang?.name ?? c.language}
                    </span>
                  </span>

                  {/* Difficulty */}
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em", color: uwDiff.color, textTransform: "uppercase", flexShrink: 0 }}>
                    {uwDiff.label}
                  </span>

                  {/* Status badge */}
                  <span style={{
                    padding: "0.15rem 0.55rem", borderRadius: "99px", flexShrink: 0,
                    background: c.status === "completed" ? "rgba(74,222,128,0.10)" : "rgba(239,68,68,0.10)",
                    border: `1px solid ${c.status === "completed" ? "rgba(74,222,128,0.28)" : "rgba(239,68,68,0.28)"}`,
                    color: c.status === "completed" ? "#4ade80" : "#f87171",
                    fontFamily: "var(--font-heading)", fontSize: "0.55rem", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    {c.status === "completed" ? "Vanquished" : "Fallen"}
                  </span>

                  {/* Score bar + XP — completed only */}
                  {c.status === "completed" && (
                    <>
                      <div style={{ width: 44, flexShrink: 0 }}>
                        <div style={{ height: 3, borderRadius: 2, background: "rgba(220,38,38,0.18)", marginBottom: "0.2rem" }}>
                          <div style={{ height: 3, borderRadius: 2, background: uwDiff.color, width: `${c.score_pct ?? 0}%` }} />
                        </div>
                        <span style={{ fontSize: "0.50rem", color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-heading)" }}>
                          {c.score_pct ?? 0}%
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.68rem", fontWeight: 700, color: "#fca5a5", flexShrink: 0 }}>
                        +{c.xp_earned}
                      </span>
                    </>
                  )}

                  {/* Date */}
                  <span style={{ fontSize: "0.60rem", color: "rgba(255,255,255,0.20)", flexShrink: 0, minWidth: "80px", textAlign: "right" }}>
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
            borderRadius: "0.875rem", padding: "2rem", textAlign: "center",
            border: "1px dashed rgba(220,38,38,0.18)", background: "rgba(127,29,29,0.06)",
          }}
        >
          <p style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🔥</p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", marginBottom: "0.3rem" }}>
            No Underworld battles yet
          </p>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", marginBottom: "1rem" }}>
            Dare to challenge the ancient lords of code.
          </p>
          <Link
            to="/underworld"
            style={{
              display: "inline-block", padding: "0.45rem 1.1rem", borderRadius: "8px",
              border: "1px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.10)",
              color: "#fca5a5",
              fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.10em", textTransform: "uppercase", textDecoration: "none",
            }}
          >
            Enter the Underworld
          </Link>
        </div>
      ) : null}

      {/* ── Oracle's Trials ── */}
      {triviaSessions.length > 0 ? (
        <div className="space-y-4">
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ height: "1px", flex: 1, background: "rgba(234,179,8,0.20)" }} />
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(234,179,8,0.65)", flexShrink: 0 }}>
              Oracle's Trials
            </span>
            <div style={{ height: "1px", flex: 1, background: "rgba(234,179,8,0.20)" }} />
          </div>

          {/* Summary chips */}
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            {[
              [`${triviaSessions.length}`, "Trials played"],
              [`${triviaCompleted}`, "Completed"],
              [`+${triviaXP} XP`, "Total earned"],
            ].map(([val, lbl]) => (
              <div key={lbl} style={{ padding: "0.4rem 0.85rem", borderRadius: "8px", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.22)", display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.78rem", fontWeight: 700, color: "#eab308" }}>{val}</span>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>{lbl}</span>
              </div>
            ))}
          </div>

          {/* Session list */}
          <div style={{ borderRadius: "0.875rem", overflow: "hidden", border: "1px solid rgba(234,179,8,0.15)", background: "rgba(120,90,0,0.06)" }}>
            {triviaSessions.map((s, i) => {
              const langMeta = {
                python:     { label: "Python",     glyph: "Py", color: "#4ade80" },
                javascript: { label: "JavaScript", glyph: "JS", color: "#fbbf24" },
                java:       { label: "Java",       glyph: "Jv", color: "#f97316" },
                csharp:     { label: "C#",         glyph: "C#", color: "#a78bfa" },
                mix:        { label: "All Paths",  glyph: "∞",  color: "#03e9f4" },
              }[s.language] ?? { label: s.language, glyph: "?", color: "#fbbf24" };

              const completed = s.status === "completed";
              const accuracy  = s.total_questions > 0 ? Math.round((s.correct_count / s.total_questions) * 100) : 0;
              const barColor  = accuracy >= 75 ? "#4ade80" : accuracy >= 50 ? "#fbbf24" : "#f87171";

              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.85rem",
                    padding: "0.75rem 1rem",
                    borderTop: i === 0 ? "none" : "1px solid rgba(234,179,8,0.07)",
                    borderLeft: `3px solid ${completed ? "rgba(234,179,8,0.60)" : "rgba(255,255,255,0.15)"}`,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(234,179,8,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Language glyph */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "8px", flexShrink: 0,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-heading)", fontSize: "0.62rem", fontWeight: 700,
                    color: langMeta.color,
                  }}>
                    {langMeta.glyph}
                  </div>

                  {/* Language + accuracy bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.82)", margin: 0, marginBottom: "0.25rem" }}>
                      {langMeta.label}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", maxWidth: 80 }}>
                        <div style={{ height: 3, borderRadius: 2, background: barColor, width: `${accuracy}%`, transition: "width 0.4s ease" }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", letterSpacing: "0.06em", color: "rgba(255,255,255,0.30)" }}>
                        {s.correct_count}/{s.total_questions} correct
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    padding: "0.15rem 0.55rem", borderRadius: "99px", flexShrink: 0,
                    background: completed ? "rgba(234,179,8,0.10)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${completed ? "rgba(234,179,8,0.32)" : "rgba(255,255,255,0.10)"}`,
                    color: completed ? "#eab308" : "rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-heading)", fontSize: "0.52rem", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    {completed ? "Completed" : "Expired"}
                  </span>

                  {/* XP */}
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.72rem", fontWeight: 700, color: s.score_xp > 0 ? "#eab308" : "rgba(255,255,255,0.22)", flexShrink: 0 }}>
                    +{s.score_xp} XP
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: "0.60rem", color: "rgba(255,255,255,0.20)", flexShrink: 0, minWidth: "80px", textAlign: "right" }}>
                    {new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : isOwnProfile ? (
        <div style={{ borderRadius: "0.875rem", padding: "2rem", textAlign: "center", border: "1px dashed rgba(234,179,8,0.22)", background: "rgba(120,90,0,0.05)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.40)", marginBottom: "0.3rem" }}>
            No trials completed yet
          </p>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", marginBottom: "1rem" }}>
            Face the Oracle's weekly trial and prove your knowledge.
          </p>
          <Link
            to="/trivia"
            style={{
              display: "inline-block", padding: "0.45rem 1.1rem", borderRadius: "8px",
              border: "1px solid rgba(234,179,8,0.32)", background: "rgba(234,179,8,0.09)",
              color: "#eab308",
              fontFamily: "var(--font-heading)", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.10em", textTransform: "uppercase", textDecoration: "none",
            }}
          >
            Enter the Sanctum
          </Link>
        </div>
      ) : null}

      {/* ── Submission detail modal ── */}
      {(subModal || subModalLoading) && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => { setSubModal(null); setSubModalLoading(false); }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%", maxWidth: "780px", maxHeight: "90vh",
              overflow: "hidden", display: "flex", flexDirection: "column",
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ padding: "1rem 1.4rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.88rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {subModal?.quest_title ?? "Loading…"}
              </span>
              {subModal?.language && (() => {
                const diff = DIFF_META[subModal.difficulty] ?? DIFF_META.shallow;
                const lang = LANG_CONFIG[subModal.language];
                return (
                  <>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.28rem", flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: lang?.color ?? "#fff" }} />
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.32)", textTransform: "uppercase" }}>
                        {lang?.name ?? subModal.language}
                      </span>
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.08em", color: diff.color, textTransform: "uppercase", flexShrink: 0 }}>
                      {diff.label}
                    </span>
                    <span style={{
                      padding: "0.18rem 0.5rem", borderRadius: "4px",
                      fontFamily: "var(--font-heading)", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      background: subModal.all_passed ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.10)",
                      color:      subModal.all_passed ? "#4ade80"               : "#f87171",
                      border:     `1px solid ${subModal.all_passed ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.20)"}`,
                      flexShrink: 0,
                    }}>
                      {subModal.all_passed ? "Passed" : "Failed"}
                    </span>
                  </>
                );
              })()}
              <button
                onClick={() => { setSubModal(null); setSubModalLoading(false); }}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.32)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1, padding: "0.2rem 0.4rem", borderRadius: "4px", flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.72)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.32)")}
              >
                ✕
              </button>
            </div>

            {subModalLoading && !subModal?.solution_code ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.30)", fontFamily: "var(--font-heading)", fontSize: "0.72rem" }}>
                Retrieving submission…
              </div>
            ) : subModal && (
              <div style={{ overflowY: "auto", flex: 1 }}>
                {/* Test results bar */}
                {subModal.test_results && (
                  <div style={{ padding: "0.8rem 1.4rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                      Tests
                    </span>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.78rem", fontWeight: 700, color: subModal.all_passed ? "#4ade80" : "#f87171" }}>
                      {subModal.test_results.passed}/{subModal.test_results.total} passed
                    </span>
                    <div style={{ display: "flex", gap: "0.28rem", flexWrap: "wrap", flex: 1 }}>
                      {(subModal.test_results.results ?? []).map((r, idx) => (
                        <span
                          key={idx}
                          title={`Test ${idx + 1}: ${r.passed ? "passed" : "failed"}`}
                          style={{
                            width: "1.05rem", height: "1.05rem", borderRadius: "3px",
                            background: r.passed ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.15)",
                            border: `1px solid ${r.passed ? "rgba(74,222,128,0.45)" : "rgba(248,113,113,0.40)"}`,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.48rem", color: r.passed ? "#4ade80" : "#f87171",
                          }}
                        >
                          {r.passed ? "✓" : "✗"}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.22)", flexShrink: 0 }}>
                      {new Date(subModal.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                )}

                {/* Code */}
                <div style={{ padding: "0.85rem 1.4rem 1.2rem" }}>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.55rem" }}>
                    Submitted Code
                  </p>
                  <pre style={{
                    margin: 0, padding: "1rem 1.1rem",
                    background: "rgba(0,0,0,0.48)", borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    fontFamily: "'Courier New', Courier, monospace", fontSize: "0.77rem",
                    color: "rgba(255,255,255,0.80)", lineHeight: 1.7,
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
