import { useState } from "react";
import { isMuted, playClick, setMuted, stopBootSound, unlockAudio } from "../utils/terminalAudio";

function SpeakerOnIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.54 8.46a5 5 0 010 7.07M18.36 5.64a9 9 0 010 12.72" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 9l-6 6M17 9l6 6" />
    </svg>
  );
}

/** Persistent mute toggle for the synthesized terminal sound effects. */
export default function SoundToggle({ className = "" }) {
  const [muted, setMutedState] = useState(isMuted());

  function toggle() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (next) {
      stopBootSound();
    } else {
      unlockAudio();
      playClick();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`sound-toggle${muted ? " is-muted" : ""} ${className}`}
      aria-pressed={!muted}
      title={muted ? "Enable sound effects" : "Mute sound effects"}
    >
      {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
    </button>
  );
}
