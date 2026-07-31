import { useEffect, useState } from "react";

const ASCII_CHARS = 10;

/**
 * Progress bar that animates its fill in from 0 shortly after mount /
 * whenever `value` changes, instead of snapping to width immediately.
 * Pass `ascii` to render a monospace block-character bar (e.g. "[████░░░░░░]")
 * instead of the smooth gradient track.
 */
export default function ProgressBar({ value = 0, size = "sm", variant = "green", ascii = false, chars = ASCII_CHARS, className = "" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplay(value), 120);
    return () => clearTimeout(t);
  }, [value]);

  if (ascii) {
    const filled = Math.max(0, Math.min(chars, Math.round((display / 100) * chars)));
    const asciiVariant = variant === "blue" ? "ascii-bar--blue" : variant === "red" ? "ascii-bar--red" : "";
    return (
      <span className={`ascii-bar ${asciiVariant} ${className}`.trim()}>
        {"█".repeat(filled)}
        <span className="ascii-bar-off">{"░".repeat(chars - filled)}</span>
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
