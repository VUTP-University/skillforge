import { useEffect, useRef, useState } from "react";

const ASCII_CHARS = 10;

/**
 * Progress bar that animates its fill in from 0 shortly after mount /
 * whenever `value` changes, instead of snapping to width immediately.
 * Pass `ascii` to render a monospace block-character bar (e.g. "[████░░░░░░]")
 * instead of the smooth gradient track — the ascii bar fills character-by-character
 * with a blinking cursor and phosphor shimmer while it's counting up.
 */
export default function ProgressBar({ value = 0, size = "sm", variant = "green", ascii = false, chars = ASCII_CHARS, className = "" }) {
  const [display, setDisplay]   = useState(0);
  const [animating, setAnimating] = useState(true);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!ascii) {
      const t = setTimeout(() => setDisplay(value), 120);
      return () => clearTimeout(t);
    }

    cancelAnimationFrame(frameRef.current);
    setAnimating(true);
    setDisplay(0);

    const duration = 950 + Math.random() * 350; // slight per-bar variance — feels alive, not mechanical
    const startTimer = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now) => {
        const t     = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        if (t < 1) {
          setDisplay(eased * value);
          frameRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(value);
          setAnimating(false);
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    }, 150);

    return () => { clearTimeout(startTimer); cancelAnimationFrame(frameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ascii]);

  if (ascii) {
    const filled     = Math.max(0, Math.min(chars, Math.floor((display / 100) * chars)));
    const showCursor = animating && filled < chars;
    const offCount   = Math.max(0, chars - filled - (showCursor ? 1 : 0));
    const asciiVariant = variant === "blue" ? "ascii-bar--blue" : variant === "red" ? "ascii-bar--red" : "";

    return (
      <span className={`ascii-bar ${asciiVariant} ${animating ? "ascii-bar--loading" : ""} ${className}`.trim()}>
        <span className="ascii-bar-fill">{"█".repeat(filled)}</span>
        {showCursor && <span className="ascii-bar-cursor">▓</span>}
        <span className="ascii-bar-off">{"░".repeat(offCount)}</span>
      </span>
    );
  }

  const fillVariant =
    variant === "blue" ? "progress-fill--blue"
    : variant === "red" ? "progress-fill--red"
    : variant === "neutral" ? "progress-fill--neutral"
    : "progress-fill--green";

  return (
    <div className={`progress-track progress-track--${size} ${className}`.trim()}>
      <div className={`progress-fill ${fillVariant}`} style={{ width: `${display}%` }} />
    </div>
  );
}
