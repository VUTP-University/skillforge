import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBosses, startChallenge } from "../services/underworldService";

// Boss portrait imports
import imgArcanis       from "../assets/img/underworld_realm/Arcanis.png";
import imgDOMinus       from "../assets/img/underworld_realm/DOMinus.png";
import imgEldrin        from "../assets/img/underworld_realm/Eldrin.png";
import imgExceptionor   from "../assets/img/underworld_realm/Exceptionor.png";
import imgFlameatrix    from "../assets/img/underworld_realm/Flameatrix.png";
import imgLambdaen      from "../assets/img/underworld_realm/Lambdaen.png";
import imgNecroPy       from "../assets/img/underworld_realm/NecroPy.png";
import imgNethraxis     from "../assets/img/underworld_realm/Nethraxis.png";
import imgSerpentis     from "../assets/img/underworld_realm/Serpentis.png";
import imgSerpyros      from "../assets/img/underworld_realm/Serpyros.png";
import imgShadowScripter from "../assets/img/underworld_realm/Shadow Scripter.png";
import imgValora        from "../assets/img/underworld_realm/Valora.png";

const BOSS_IMAGES = {
  "Arcanis.png":        imgArcanis,
  "DOMinus.png":        imgDOMinus,
  "Eldrin.png":         imgEldrin,
  "Exceptionor.png":    imgExceptionor,
  "Flameatrix.png":     imgFlameatrix,
  "Lambdaen.png":       imgLambdaen,
  "NecroPy.png":        imgNecroPy,
  "Nethraxis.png":      imgNethraxis,
  "Serpentis.png":      imgSerpentis,
  "Serpyros.png":       imgSerpyros,
  "Shadow Scripter.png": imgShadowScripter,
  "Valora.png":         imgValora,
};

const DIFF_META = {
  cursed:   { label: "Cursed",   color: "#ef4444" },
  damned:   { label: "Damned",   color: "#f97316" },
  infernal: { label: "Infernal", color: "#a855f7" },
};

const LANG_LABELS = {
  python:     "Python",
  javascript: "JavaScript",
  java:       "Java",
  csharp:     "C#",
};

const LANG_TABS = ["all", "python", "javascript", "java", "csharp"];

function formatResetTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function UnderworldPage() {
  const navigate = useNavigate();

  const [bosses,      setBosses]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [langFilter,  setLangFilter]  = useState("all");
  const [starting,    setStarting]    = useState(null);  // boss id currently being challenged

  useEffect(() => {
    getBosses()
      .then((data) => setBosses(data.bosses))
      .catch((err) => setError(err?.response?.data?.error ?? "Failed to load the Underworld"))
      .finally(() => setLoading(false));
  }, []);

  async function handleChallenge(boss) {
    setStarting(boss.id);
    try {
      const data = await startChallenge(boss.id);
      navigate(`/underworld/challenge/${data.challenge.id}`, {
        state: { challenge: data.challenge, boss: data.boss },
      });
    } catch (err) {
      const msg = err?.response?.data?.error ?? "Failed to start challenge";
      alert(msg);
    } finally {
      setStarting(null);
    }
  }

  const filtered =
    langFilter === "all"
      ? bosses
      : bosses.filter((b) => b.language === langFilter);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "radial-gradient(ellipse at top, rgba(127,29,29,0.18) 0%, transparent 65%)",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-decorative)",
            fontSize: "clamp(1.9rem, 5vw, 3rem)",
            color: "#fff",
            marginBottom: "0.5rem",
            textShadow: "0 0 40px rgba(220,38,38,0.45)",
          }}
        >
          The Underworld
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.75rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Dare to face the ancient lords of code
        </p>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #dc2626, transparent)",
            margin: "1rem auto 0",
          }}
        />
      </div>

      {/* Language filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
          justifyContent: "center",
        }}
      >
        {LANG_TABS.map((tab) => {
          const active = langFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setLangFilter(tab)}
              style={{
                padding: "0.35rem 1rem",
                borderRadius: "99px",
                border: active
                  ? "1px solid rgba(220,38,38,0.6)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: active
                  ? "rgba(220,38,38,0.15)"
                  : "rgba(255,255,255,0.03)",
                color: active ? "#fca5a5" : "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              {tab === "all" ? "All" : LANG_LABELS[tab] ?? tab}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <div className="sf-spinner" style={{ width: "28px", height: "28px", borderWidth: "3px", borderColor: "rgba(220,38,38,0.3)", borderTopColor: "#dc2626" }} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "#fca5a5",
            fontFamily: "var(--font-heading)",
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
          }}
        >
          {error}
        </div>
      )}

      {/* Boss grid */}
      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {filtered.map((boss) => (
            <BossCard
              key={boss.id}
              boss={boss}
              onChallenge={handleChallenge}
              isStarting={starting === boss.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BossCard({ boss, onChallenge, isStarting }) {
  const [hovered, setHovered] = useState(false);
  const diff   = DIFF_META[boss.difficulty] ?? { label: boss.difficulty, color: "#ef4444" };
  const imgSrc = BOSS_IMAGES[boss.avatar];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "1rem",
        overflow: "hidden",
        background: "rgba(127,29,29,0.12)",
        border: hovered
          ? "1px solid rgba(220,38,38,0.40)"
          : "1px solid rgba(220,38,38,0.12)",
        boxShadow: hovered
          ? "0 0 28px rgba(220,38,38,0.14), 0 4px 24px rgba(0,0,0,0.45)"
          : "0 2px 12px rgba(0,0,0,0.30)",
        transition: "border-color 0.22s, box-shadow 0.22s",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Portrait */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden" }}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={boss.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
              transition: "transform 0.4s",
              transform: hovered ? "scale(1.04)" : "scale(1)",
              display: "block",
            }}
          />
        )}
        {/* Dark overlay gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.0) 40%, rgba(20,0,0,0.75) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Difficulty badge — top right */}
        <div
          style={{
            position: "absolute",
            top: "0.6rem",
            right: "0.6rem",
            padding: "0.2rem 0.55rem",
            borderRadius: "99px",
            background: "rgba(0,0,0,0.65)",
            border: `1px solid ${diff.color}55`,
            color: diff.color,
            fontFamily: "var(--font-heading)",
            fontSize: "0.58rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          {diff.label}
        </div>

        {/* Language badge — top left */}
        <div
          style={{
            position: "absolute",
            top: "0.6rem",
            left: "0.6rem",
            padding: "0.2rem 0.55rem",
            borderRadius: "99px",
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.70)",
            fontFamily: "var(--font-heading)",
            fontSize: "0.58rem",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          {LANG_LABELS[boss.language] ?? boss.language}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "0.9rem 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1rem",
            color: "#fff",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {boss.name}
        </h3>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.72rem",
            fontFamily: "var(--font-body)",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          {boss.specialty}
        </p>

        {/* XP reward */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            marginTop: "0.25rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.6rem",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.30)",
            }}
          >
            Max XP:
          </span>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: diff.color,
            }}
          >
            {boss.max_xp}
          </span>
        </div>

        {/* Action area */}
        <div style={{ marginTop: "auto", paddingTop: "0.75rem" }}>
          {boss.on_cooldown ? (
            <div
              style={{
                textAlign: "center",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.30)",
                fontFamily: "var(--font-heading)",
                fontSize: "0.62rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Defeated · Resets {formatResetTime(boss.cooldown_resets_at)}
            </div>
          ) : (
            <button
              onClick={() => onChallenge(boss)}
              disabled={isStarting}
              style={{
                width: "100%",
                padding: "0.55rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(220,38,38,0.45)",
                background: hovered
                  ? "rgba(220,38,38,0.22)"
                  : "rgba(220,38,38,0.10)",
                color: isStarting ? "rgba(255,255,255,0.40)" : "#fca5a5",
                fontFamily: "var(--font-heading)",
                fontSize: "0.68rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: isStarting ? "not-allowed" : "pointer",
                transition: "background 0.18s, color 0.18s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {isStarting ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      border: "2px solid rgba(252,165,165,0.3)",
                      borderTopColor: "#fca5a5",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Entering…
                </>
              ) : (
                "Challenge"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
