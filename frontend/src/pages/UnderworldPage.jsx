import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getBosses, startChallenge } from "../services/underworldService";

import imgMeteorGif      from "../assets/img/underworld_realm/Underworld_Meteor.gif";
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

const DIFF_META = {
  cursed:   { label: "Cursed",   color: "#f87171", dimBorder: "rgba(248,113,113,0.20)", hotBorder: "rgba(248,113,113,0.65)", glow: "rgba(248,113,113,0.25)", bg: "rgba(248,113,113,0.10)" },
  damned:   { label: "Damned",   color: "#fb923c", dimBorder: "rgba(251,146,60,0.20)",  hotBorder: "rgba(251,146,60,0.65)",  glow: "rgba(251,146,60,0.25)",  bg: "rgba(251,146,60,0.10)"  },
  infernal: { label: "Infernal", color: "#c084fc", dimBorder: "rgba(192,132,252,0.20)", hotBorder: "rgba(192,132,252,0.65)", glow: "rgba(192,132,252,0.25)", bg: "rgba(192,132,252,0.09)" },
};

const LANG_LABELS = { python: "Python", javascript: "JavaScript", java: "Java", csharp: "C#" };
const LANG_TABS   = ["all", "python", "javascript", "java", "csharp"];

function formatReset(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Meteor shower ───────────────────────────────────────────── */

function MeteorShower() {
  const meteors = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => {
      const rotation = 93 + Math.random() * 32;            // 93–125° from horizontal
      const rotRad   = rotation * Math.PI / 180;
      const duration = 1.4 + Math.random() * 3.2;

      // Physics: for every travelY pixels down, drift travelY × cot(rotation) pixels sideways.
      // cot(90°) = 0 (straight down), cot(120°) ≈ -0.577 (30° diagonal left).
      const travelY = 1500;
      const travelX = travelY * (Math.cos(rotRad) / Math.sin(rotRad));

      const sy = -(130 + Math.random() * 120);             // start above viewport

      return {
        id:       i,
        left:     10 + Math.random() * 78,
        duration,
        delay:    -(Math.random() * duration),             // negative = already mid-fall on load
        width:    55 + Math.random() * 185,
        rotation,
        opacity:  0.45 + Math.random() * 0.55,
        sx:       0,
        sy,
        ex:       travelX,
        ey:       sy + travelY,
      };
    }),
  []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {meteors.map((m) => (
        <div
          key={m.id}
          style={{
            position: "absolute",
            top: 0,
            left: `${m.left}%`,
            "--uw-sx": `${m.sx}px`,
            "--uw-sy": `${m.sy}px`,
            "--uw-ex": `${m.ex.toFixed(1)}px`,
            "--uw-ey": `${m.ey}px`,
            animationName: "uw-meteor-fall",
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        >
          <img
            src={imgMeteorGif}
            alt=""
            draggable={false}
            style={{
              width: `${m.width}px`,
              height: "auto",
              display: "block",
              opacity: m.opacity,
              transform: `rotate(${m.rotation}deg)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Icons ──────────────────────────────────────────────────── */

function IconFlame({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2c0 0-4.5 5-4.5 9.5 0 2 .9 3.9 2.4 5.1C9 15.9 7.5 13 8 10.5 6 12.5 5 15.5 5 18c0 3.9 3.1 7 7 7s7-3.1 7-7c0-7-7-16-7-16z"/>
      <path d="M12 10c0 0-1.5 3-1.5 5.5A1.5 1.5 0 0012 17a1.5 1.5 0 001.5-1.5C13.5 13 12 10 12 10z" fill="#fde68a" opacity="0.85"/>
    </svg>
  );
}

function IconSkull({ size = 14, color = "rgba(255,255,255,0.45)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 3a8 8 0 00-8 8c0 2.8 1.4 5.3 3.6 6.8L8 20h8l.4-2.2A8 8 0 0020 11a8 8 0 00-8-8zm-2 11H9v-2h1v2zm4 0h-1v-2h1v2zm1.5-4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
    </svg>
  );
}

/* ── Boss card (landscape layout) ───────────────────────────── */

function BossCard({ boss, onChallenge, isStarting }) {
  const [hovered, setHovered] = useState(false);
  const diff   = DIFF_META[boss.difficulty] ?? DIFF_META.cursed;
  const imgSrc = BOSS_IMAGES[boss.avatar];

  return (
    <div
      className="uw-boss-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "linear-gradient(135deg, rgba(18,2,2,0.97) 0%, rgba(7,0,0,0.99) 100%)",
        border: hovered ? `1px solid ${diff.hotBorder}` : `1px solid ${diff.dimBorder}`,
        boxShadow: hovered
          ? `0 0 56px ${diff.glow}, 0 12px 48px rgba(0,0,0,0.90), inset 0 1px 0 rgba(255,80,80,0.06)`
          : `0 2px 20px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.025)`,
        transition: "border-color 0.25s, box-shadow 0.25s",
        cursor: "default",
      }}
    >
      {/* ── Portrait panel ── */}
      <div className="uw-boss-portrait">
        {imgSrc && (
          <img
            src={imgSrc}
            alt={boss.name}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "top center",
              display: "block",
              transition: "transform 0.55s ease, filter 0.35s ease",
              transform: hovered ? "scale(1.08)" : "scale(1.02)",
              filter: hovered
                ? "brightness(0.88) saturate(1.20) contrast(1.06)"
                : "brightness(0.65) saturate(0.78)",
            }}
          />
        )}

        {/* Fades portrait into the dark card body */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `
            linear-gradient(to right,  rgba(8,0,0,0.0) 0%, rgba(8,0,0,0.60) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 0%, rgba(6,0,0,0.82) 92%)
          `,
        }}/>

        {/* Ember glow on hover */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 120%, ${diff.glow} 0%, transparent 60%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.30s",
        }}/>

        {/* Difficulty badge */}
        <div style={{
          position: "absolute", top: "0.6rem", left: "0.6rem",
          padding: "0.20rem 0.60rem", borderRadius: "3px",
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          border: `1px solid ${diff.dimBorder}`,
          color: diff.color,
          fontFamily: "var(--font-heading)", fontSize: "0.54rem",
          letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
        }}>
          {diff.label}
        </div>
      </div>

      {/* ── Info panel ── */}
      <div style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "1.1rem 1.15rem",
        gap: "0.6rem",
      }}>
        {/* Name + language + lore + specialty */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
            <h3 style={{
              fontFamily: "var(--font-heading)", fontWeight: 700,
              fontSize: "1.05rem", letterSpacing: "0.02em", lineHeight: 1.2, margin: 0,
              color: hovered ? diff.color : "rgba(255,220,220,0.96)",
              textShadow: hovered ? `0 0 20px ${diff.glow}` : "none",
              transition: "color 0.22s, text-shadow 0.22s",
            }}>
              {boss.name}
            </h3>
            <span style={{
              flexShrink: 0, padding: "0.18rem 0.55rem", borderRadius: "3px",
              background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,215,215,0.65)",
              fontFamily: "var(--font-heading)", fontSize: "0.53rem",
              letterSpacing: "0.10em", textTransform: "uppercase",
            }}>
              {LANG_LABELS[boss.language] ?? boss.language}
            </span>
          </div>

          <p style={{
            fontFamily: "var(--font-heading)", fontStyle: "italic",
            fontSize: "0.64rem", letterSpacing: "0.03em", lineHeight: 1.5,
            color: "rgba(255,180,180,0.60)", margin: 0,
          }}>
            "{boss.lore}"
          </p>

          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.73rem", lineHeight: 1.5,
            color: "rgba(255,210,210,0.65)", margin: 0,
          }}>
            {boss.specialty}
          </p>
        </div>

        {/* Stats + button */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          <div style={{
            height: "1px",
            background: `linear-gradient(to right, ${diff.dimBorder}, transparent 70%)`,
          }}/>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.30rem", color: "rgba(255,195,195,0.60)" }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 2"/>
              </svg>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.57rem", letterSpacing: "0.07em" }}>
                {boss.time_minutes}m
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.30rem", color: diff.color }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
              </svg>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.57rem", letterSpacing: "0.07em", fontWeight: 700 }}>
                {boss.max_xp} XP
              </span>
            </div>
          </div>

          {boss.on_cooldown ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.52rem 1rem", borderRadius: "8px",
              background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <IconSkull size={13}/>
              <span style={{
                fontFamily: "var(--font-heading)", fontSize: "0.59rem",
                letterSpacing: "0.10em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.48)",
              }}>
                Slain · Resets {formatReset(boss.cooldown_resets_at)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => onChallenge(boss)}
              disabled={isStarting}
              style={{
                width: "100%", padding: "0.60rem 1rem", borderRadius: "8px",
                border: hovered ? `1px solid ${diff.hotBorder}` : `1px solid ${diff.dimBorder}`,
                background: hovered ? diff.bg : "rgba(80,0,0,0.20)",
                color: isStarting ? "rgba(252,165,165,0.55)" : (hovered ? diff.color : "rgba(252,165,165,0.80)"),
                fontFamily: "var(--font-heading)", fontSize: "0.65rem",
                letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
                cursor: isStarting ? "not-allowed" : "pointer",
                transition: "all 0.22s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                boxShadow: hovered ? `0 0 28px ${diff.glow}` : "none",
              }}
            >
              {isStarting ? (
                <>
                  <div style={{
                    width: 11, height: 11, borderRadius: "50%",
                    border: "2px solid rgba(252,165,165,0.20)", borderTopColor: "#fca5a5",
                    animation: "spin 0.7s linear infinite",
                  }}/>
                  Entering…
                </>
              ) : (
                <>
                  <IconFlame size={13} color={hovered ? diff.color : "rgba(252,165,165,0.60)"}/>
                  Challenge
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function UnderworldPage() {
  const navigate = useNavigate();

  const [bosses,     setBosses]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [langFilter, setLangFilter] = useState("all");
  const [starting,   setStarting]   = useState(null);

  /* Override the blue page-wrapper background for this page only */
  useEffect(() => {
    document.body.classList.add("underworld-active");
    return () => document.body.classList.remove("underworld-active");
  }, []);

  useEffect(() => {
    getBosses()
      .then((data) => setBosses(data.bosses))
      .catch((err)  => setError(err?.response?.data?.error ?? "Failed to summon the Underworld"))
      .finally(()   => setLoading(false));
  }, []);

  async function handleChallenge(boss) {
    setStarting(boss.id);
    try {
      const data = await startChallenge(boss.id);
      navigate(`/underworld/challenge/${data.challenge.id}`, {
        state: { challenge: data.challenge, boss: data.boss },
      });
    } catch (err) {
      alert(err?.response?.data?.error ?? "Failed to start challenge");
    } finally {
      setStarting(null);
    }
  }

  const filtered = langFilter === "all" ? bosses : bosses.filter((b) => b.language === langFilter);

  return (
    <>
      {createPortal(
        <>
          {/* Ambient sky — portalled to body so fixed positioning is truly viewport-relative */}
          <div style={{
            position: "fixed", inset: 0, zIndex: 0,
            pointerEvents: "none", overflow: "hidden",
            /* Dark red sky, no background image — glow rises from the bottom edge */
            background: `
              radial-gradient(ellipse 90% 55% at 50% 100%, rgba(175,14,0,0.58) 0%, transparent 65%),
              radial-gradient(ellipse 50% 28% at 50% 100%, rgba(220,30,0,0.38) 0%, transparent 45%),
              linear-gradient(180deg, #060000 0%, #0c0101 55%, #150202 100%)
            `,
          }}>
            {/* Subtle top vignette for navbar area */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, rgba(4,0,0,0.65) 0%, rgba(4,0,0,0.20) 12%, transparent 30%)",
            }} />
            {/* Side vignette */}
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse 95% 100% at 50% 50%, transparent 55%, rgba(2,0,0,0.55) 100%)",
            }} />
          </div>

          {/* Meteor shower */}
          <div style={{
            position: "fixed", inset: 0, zIndex: 1,
            pointerEvents: "none", overflow: "hidden",
          }}>
            <MeteorShower />
          </div>
        </>,
        document.body
      )}

      {/* Page content — .page-inner z-index: 2 (via CSS) keeps this above the portalled layers */}
      <div>

      {/* ── HERO ── */}
      <div style={{ textAlign: "center", paddingBottom: "3rem", paddingTop: "0.5rem" }}>

        <h1 style={{
          fontFamily: "var(--font-brand)",
          fontSize: "clamp(2.4rem, 6vw, 4rem)",
          color: "#fff", lineHeight: 1.1, margin: 0, marginBottom: "0.6rem",
          textShadow: "0 0 120px rgba(220,38,38,0.90), 0 0 50px rgba(249,115,22,0.55), 0 0 15px rgba(239,68,68,0.45)",
          letterSpacing: "0.04em",
        }}>
          The Underworld
        </h1>

        <p style={{
          fontFamily: "var(--font-heading)", fontSize: "0.68rem",
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "rgba(252,165,165,0.58)", marginBottom: "1.8rem",
        }}>
          Dare to face the ancient lords of code
        </p>

        {/* Red ornate divider */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ width: 70, height: 1, background: "linear-gradient(to right, transparent, rgba(220,38,38,0.70))" }}/>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(220,38,38,0.55)", boxShadow: "0 0 6px rgba(220,38,38,0.70)" }}/>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#b91c1c", boxShadow: "0 0 14px rgba(185,28,28,1.0)" }}/>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(220,38,38,0.55)", boxShadow: "0 0 6px rgba(220,38,38,0.70)" }}/>
          <div style={{ width: 70, height: 1, background: "linear-gradient(to left,  transparent, rgba(220,38,38,0.70))" }}/>
        </div>

        {!loading && bosses.length > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.65rem",
            padding: "0.58rem 1.3rem", borderRadius: "8px",
            background: "rgba(60,0,0,0.55)", border: "1px solid rgba(180,30,30,0.22)",
            color: "rgba(252,165,165,0.58)",
            fontFamily: "var(--font-heading)", fontSize: "0.63rem",
            letterSpacing: "0.10em", textTransform: "uppercase",
            backdropFilter: "blur(6px)",
          }}>
            <svg style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            {bosses.length} ancient lords await · One challenge per lord per day
          </div>
        )}
      </div>

      {/* ── Language filter ── */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2.5rem" }}>
        {LANG_TABS.map((tab) => {
          const active = tab === langFilter;
          return (
            <button
              key={tab}
              onClick={() => setLangFilter(tab)}
              style={{
                padding: "0.40rem 1.10rem", borderRadius: "4px", cursor: "pointer",
                border:     active ? "1px solid rgba(220,38,38,0.60)" : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(180,0,0,0.22)"             : "rgba(10,0,0,0.35)",
                color:      active ? "#fca5a5"                         : "rgba(255,255,255,0.52)",
                fontFamily: "var(--font-heading)", fontSize: "0.63rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                transition: "all 0.18s",
                boxShadow: active ? "0 0 16px rgba(220,38,38,0.22)" : "none",
              }}
            >
              {tab === "all" ? "All Lords" : LANG_LABELS[tab] ?? tab}
            </button>
          );
        })}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid rgba(220,38,38,0.18)", borderTopColor: "#dc2626",
            animation: "spin 0.85s linear infinite",
          }}/>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          textAlign: "center", padding: "4rem 1rem",
          fontFamily: "var(--font-heading)", fontSize: "0.78rem",
          letterSpacing: "0.08em", color: "#f87171",
        }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "4rem 1rem",
          color: "rgba(252,165,165,0.52)", fontFamily: "var(--font-heading)",
          fontSize: "0.75rem", letterSpacing: "0.10em",
        }}>
          No lords match this realm.
        </div>
      )}

      {/* ── Boss grid ── */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.25rem",
        }}>
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
    </>
  );
}
