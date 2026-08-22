/**
 * SkillForge mark — a miniature terminal window: traffic-light dots that
 * chase-pulse across the bar, and a ">_" prompt with a blinking cursor
 * in the body. Pure SVG/CSS, no image asset.
 */
export default function TerminalLogo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`terminal-logo ${className}`}
      style={{ color: "var(--color-green)", flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Window frame */}
      <rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="rgba(0,0,0,0.45)" stroke="currentColor" strokeWidth="1.4" />
      {/* Titlebar divider */}
      <line x1="1.5" y1="7.25" x2="22.5" y2="7.25" stroke="currentColor" strokeWidth="1" opacity="0.35" />

      {/* Traffic-light dots */}
      <circle className="logo-dot logo-dot--red"    cx="4.6" cy="4.4" r="1.05" fill="var(--color-dot-red)" />
      <circle className="logo-dot logo-dot--yellow" cx="7.6" cy="4.4" r="1.05" fill="var(--color-dot-yellow)" />
      <circle className="logo-dot logo-dot--green"  cx="10.6" cy="4.4" r="1.05" fill="var(--color-dot-green)" />

      {/* ">" prompt chevron */}
      <path d="M5.2 12.4l4 3-4 3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {/* "_" blinking cursor */}
      <rect className="logo-cursor" x="12.6" y="16.7" width="5.6" height="1.7" rx="0.3" fill="currentColor" />
    </svg>
  );
}
