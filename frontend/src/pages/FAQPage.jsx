import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import welcomeMd     from "../content/faq/welcome.md?raw";
import questsMd      from "../content/faq/quests.md?raw";
import xpMd          from "../content/faq/xp-ranks.md?raw";
import underworldMd  from "../content/faq/underworld.md?raw";
import leaderboardMd from "../content/faq/leaderboard.md?raw";
import profileMd     from "../content/faq/profile.md?raw";

const VOLUMES = [
  { id: "welcome",     glyph: "✦", title: "Welcome",          subtitle: "What is SkillForge?",  content: welcomeMd     },
  { id: "quests",      glyph: "⚔", title: "The Quest System", subtitle: "Conquer challenges",   content: questsMd      },
  { id: "xp",          glyph: "✧", title: "XP & Ranks",       subtitle: "Power & progression",  content: xpMd          },
  { id: "underworld",  glyph: "☽", title: "The Underworld",   subtitle: "Dare the dark realm",  content: underworldMd  },
  { id: "leaderboard", glyph: "♔", title: "Hall of Legends",  subtitle: "The great rankings",   content: leaderboardMd },
  { id: "profile",     glyph: "◈", title: "Your Profile",     subtitle: "Identity & avatar",    content: profileMd     },
];

const mdComponents = {
  hr: () => <div className="faq-prose-divider" aria-hidden="true">⋆ ── ✦ ── ⋆</div>,
};

/* Floating dust motes — generated once, stable across re-renders */
function DustParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left:     `${4 + Math.random() * 92}%`,
        top:      `${8 + Math.random() * 84}%`,
        size:     0.7 + Math.random() * 1.8,
        delay:    `${Math.random() * 16}s`,
        duration: `${10 + Math.random() * 12}s`,
      })),
    [],
  );

  return (
    <div className="faq-dust" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="faq-dust-mote"
          style={{
            left:              p.left,
            top:               p.top,
            width:             `${p.size}px`,
            height:            `${p.size}px`,
            animationDelay:    p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

/* Gothic wrought-iron candelabra */
function Candelabra() {
  return (
    <div className="candelabra" aria-hidden="true">

      {/* ── Flame ── */}
      <div className="candelabra-flame-area">
        <div className="candelabra-flame-glow" />
        <div className="candelabra-flame-outer" />
        <div className="candelabra-flame-mid" />
        <div className="candelabra-flame-core" />
      </div>

      {/* Wick */}
      <div className="candelabra-wick" />

      {/* Wax body with drips */}
      <div className="candelabra-wax">
        <div className="candelabra-drip candelabra-drip--1" />
        <div className="candelabra-drip candelabra-drip--2" />
        <div className="candelabra-drip candelabra-drip--3" />
      </div>

      {/* Bobeche — wax-catcher saucer */}
      <div className="candelabra-bobeche" />

      {/* Upper shaft */}
      <div className="candelabra-shaft candelabra-shaft--upper" />

      {/* Decorative knot ring */}
      <div className="candelabra-ring" />

      {/* Lower shaft */}
      <div className="candelabra-shaft candelabra-shaft--lower" />

      {/* Gothic cross-guard */}
      <div className="candelabra-guard" />

      {/* Stem below guard */}
      <div className="candelabra-shaft candelabra-shaft--stem" />

      {/* Base */}
      <div className="candelabra-base-cap" />
      <div className="candelabra-base-foot" />

    </div>
  );
}

export default function FAQPage() {
  const [activeId,  setActiveId]  = useState("welcome");
  const [displayId, setDisplayId] = useState("welcome");
  const [fading,    setFading]    = useState(false);

  function selectVolume(id) {
    if (id === displayId || fading) return;
    setFading(true);
    setTimeout(() => {
      setDisplayId(id);
      setActiveId(id);
      setFading(false);
    }, 220);
  }

  const currentVolume = VOLUMES.find(v => v.id === displayId);

  return (
    <div className="faq-page">

      {/* ── Library Header ── */}
      <header className="faq-header">
        <DustParticles />
        <div className="faq-header-glow faq-header-glow--left"  aria-hidden="true" />
        <div className="faq-header-glow faq-header-glow--right" aria-hidden="true" />

        <Candelabra />

        <div className="faq-header-center">
          <div className="faq-header-ornament">✦ ──── ✦</div>
          <h1 className="faq-header-title">Grand Codex</h1>
          <p className="faq-header-sub">
            Ancient volumes of knowledge — all you need to know about the realm of SkillForge
          </p>
          <div className="faq-header-ornament">✦ ──── ✦</div>
        </div>

        <Candelabra />
      </header>

      {/* ── Body ── */}
      <div className="faq-body">

        {/* Bookshelf sidebar */}
        <aside className="faq-sidebar">
          <div className="faq-sidebar-heading">
            <span className="faq-sidebar-heading-icon" aria-hidden="true">📖</span>
            Volumes
          </div>
          <nav className="faq-volumes-list">
            {VOLUMES.map((vol) => {
              const isActive = vol.id === activeId;
              return (
                <button
                  key={vol.id}
                  className={`faq-volume-btn${isActive ? " faq-volume-btn--active" : ""}`}
                  onClick={() => selectVolume(vol.id)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="faq-volume-glyph">{vol.glyph}</span>
                  <span className="faq-volume-text">
                    <span className="faq-volume-title">{vol.title}</span>
                    <span className="faq-volume-sub">{vol.subtitle}</span>
                  </span>
                  {isActive && <span className="faq-volume-pip" aria-hidden="true" />}
                </button>
              );
            })}
          </nav>
          <div className="faq-sidebar-shelf" aria-hidden="true" />
        </aside>

        {/* Manuscript article */}
        <article
          key={displayId}
          className={`faq-article${fading ? " faq-article--fading" : ""}`}
        >
          {/* All-four-corner manuscript ornaments (::before/::after cover TL + BR) */}
          <span className="faq-corner faq-corner--tr" aria-hidden="true" />
          <span className="faq-corner faq-corner--bl" aria-hidden="true" />

          <div className="faq-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {currentVolume.content}
            </ReactMarkdown>
          </div>
        </article>

      </div>
    </div>
  );
}
