import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Types out a sequence of text segments character-by-character, terminal-style.
 * Each segment renders as its own block; a blinking cursor trails whichever
 * segment is currently being typed, then parks on the final line once done.
 *
 * script: [{ text, className, speed?: ms/char, pause?: ms before next line }]
 */
export default function TerminalTypewriter({ script, onComplete, className = "" }) {
  const lastIndex = script.length - 1;
  const [segIndex, setSegIndex]   = useState(REDUCED_MOTION ? script.length : 0);
  const [charIndex, setCharIndex] = useState(REDUCED_MOTION ? script[lastIndex]?.text.length ?? 0 : 0);
  const firedRef = useRef(false);
  const scrollRef = useRef(null);

  // Fixed-height container — stick to the bottom as new lines arrive, like a
  // real terminal's scrollback rather than letting the box grow forever.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  useEffect(() => {
    if (REDUCED_MOTION) {
      if (!firedRef.current) { firedRef.current = true; onComplete?.(); }
      return;
    }

    if (segIndex > lastIndex) {
      if (!firedRef.current) { firedRef.current = true; onComplete?.(); }
      return;
    }

    const seg = script[segIndex];
    if (charIndex < seg.text.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 1), seg.speed ?? 22);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setSegIndex((i) => i + 1);
      setCharIndex(0);
    }, seg.pause ?? 140);
    return () => clearTimeout(t);
  }, [segIndex, charIndex, script, onComplete, lastIndex]);

  return (
    <div ref={scrollRef} className={className}>
      {script.map((seg, i) => {
        if (i > segIndex) return null;
        const isTyping = i === segIndex && i <= lastIndex;
        const text = isTyping ? seg.text.slice(0, charIndex) : seg.text;
        const showCursor = isTyping || (i === lastIndex && segIndex > lastIndex);
        return (
          <p key={i} className={seg.className}>
            {text}
            {showCursor && <span className="ti-cursor" aria-hidden="true" />}
          </p>
        );
      })}
    </div>
  );
}
