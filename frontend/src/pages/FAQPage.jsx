import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import welcomeMd      from "../content/faq/welcome.md?raw";
import jobsMd         from "../content/faq/jobs.md?raw";
import xpMd           from "../content/faq/xp-ranks.md?raw";
import stackTraceMd   from "../content/faq/stack-trace.md?raw";
import leaderboardMd  from "../content/faq/leaderboard.md?raw";
import profileMd      from "../content/faq/profile.md?raw";
import achievementsMd from "../content/faq/achievements.md?raw";

const VOLUMES = [
  { id: "welcome",      glyph: "~",  title: "Welcome",          file: "welcome.md",       content: welcomeMd      },
  { id: "jobs",         glyph: ">_", title: "The Job Board",    file: "jobs.md",          content: jobsMd         },
  { id: "xp",           glyph: "^",  title: "XP & Ranks",       file: "xp-ranks.md",      content: xpMd           },
  { id: "stack-trace",  glyph: "!",  title: "The Stack Trace",  file: "stack-trace.md",   content: stackTraceMd   },
  { id: "achievements", glyph: "*",  title: "Achievements",     file: "achievements.md",  content: achievementsMd },
  { id: "leaderboard",  glyph: "#",  title: "Leaderboard",      file: "leaderboard.md",   content: leaderboardMd  },
  { id: "profile",      glyph: "@",  title: "Your Profile",     file: "profile.md",       content: profileMd      },
];

const mdComponents = {
  hr: () => <div className="faq-prose-divider" aria-hidden="true">// ───────────</div>,
};

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

      {/* ── Header ── */}
      <div className="term-window page-enter">
        <div className="term-bar">
          <span className="term-dot term-dot--red" />
          <span className="term-dot term-dot--yellow" />
          <span className="term-dot term-dot--green" />
          <span className="term-title">man skillforge</span>
        </div>
        <div className="term-body" style={{ textAlign: "center" }}>
          <p className="hero-eyebrow" style={{ justifyContent: "center" }}>$ man skillforge</p>
          <h1 className="glow-pulse" style={{
            fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: "clamp(2.4rem, 5vw, 3.4rem)", lineHeight: 1,
            color: "var(--color-green)", marginBottom: "0.6rem",
          }}>
            SKILLFORGE(1)
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--color-text-secondary)", maxWidth: "480px", margin: "0 auto" }}>
            Reference documentation for the SkillForge platform — pick a section from the index to read it.
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="faq-body">

        {/* Volume index */}
        <aside className="faq-sidebar term-window">
          <div className="term-bar">
            <span className="term-dot term-dot--red" />
            <span className="term-dot term-dot--yellow" />
            <span className="term-dot term-dot--green" />
            <span className="term-title">ls ./docs</span>
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
                    <span className="faq-volume-sub">{vol.file}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Document panel */}
        <article
          key={displayId}
          className={`faq-article term-window${fading ? " faq-article--fading" : ""}`}
        >
          <div className="term-bar">
            <span className="term-dot term-dot--red" />
            <span className="term-dot term-dot--yellow" />
            <span className="term-dot term-dot--green" />
            <span className="term-title">cat ./docs/{currentVolume.file}</span>
          </div>
          <div className="term-body faq-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {currentVolume.content}
            </ReactMarkdown>
          </div>
        </article>

      </div>
    </div>
  );
}
