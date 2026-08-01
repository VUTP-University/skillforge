/**
 * Sound effects for the retro terminal auth pages (login/register only).
 * UI feedback (clicks, chime, error buzz) is synthesized with the Web Audio
 * API — no files to ship. The boot-sequence ambience is a real recording.
 * Playback silently no-ops while muted() is true; the synthesized tones
 * additionally no-op until the AudioContext has been resumed by a user
 * gesture (browser autoplay policy) — the boot recording handles that
 * same restriction itself via a play()-retry-on-gesture fallback.
 */

import bootSoundUrl from "../sounds/computer-booting.mp3";

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  return ctx;
}

/** Call from a user-gesture handler (click/keydown) to unlock playback. */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume();
}

const MUTE_KEY = "sf_sound_muted";

export function isMuted() {
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted) {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

function tone(freq, duration, { type = "square", peak = 0.05, delay = 0 } = {}) {
  if (isMuted()) return;
  const c = getCtx();
  if (!c || c.state !== "running") return;

  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const t0 = c.currentTime + delay;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Short confirming tick for buttons / toggles. */
export function playClick() {
  tone(320, 0.03, { type: "square", peak: 0.04 });
}

/** Rising three-note chime — boot complete / form success. */
export function playChime() {
  tone(523.25, 0.14, { type: "sine", peak: 0.07 });
  tone(659.25, 0.14, { type: "sine", peak: 0.07, delay: 0.09 });
  tone(783.99, 0.22, { type: "sine", peak: 0.08, delay: 0.18 });
}

/** Low buzz for form errors. */
export function playError() {
  tone(140, 0.18, { type: "sawtooth", peak: 0.05 });
}

/* ─── Boot-sequence ambience (real recording, gapless loop) ─────────────────
   Decoded once into an AudioBuffer and looped via AudioBufferSourceNode
   rather than <audio loop>, which has an audible seam on MP3 files because
   the encoder pads the first/last frame with a few ms of silence. Looping
   the decoded buffer directly loops on exact sample boundaries instead. */

let bootBuffer = null;
let bootBufferPromise = null;
let bootSource = null;
let bootGain = null;
let bootToken = 0;

function loadBootBuffer(c) {
  if (bootBuffer) return Promise.resolve(bootBuffer);
  if (!bootBufferPromise) {
    bootBufferPromise = fetch(bootSoundUrl)
      .then((res) => res.arrayBuffer())
      .then((data) => c.decodeAudioData(data))
      .then((buf) => { bootBuffer = buf; return buf; });
  }
  return bootBufferPromise;
}

/** Starts the looping boot ambience. Safe to call while the AudioContext is
 *  still suspended — playback stays silent until unlockAudio() resumes it. */
export function playBootSound() {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;

  const token = ++bootToken;
  loadBootBuffer(c).then((buffer) => {
    if (token !== bootToken || isMuted()) return; // stopped/superseded while loading

    const source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = c.createGain();
    gain.gain.value = 0.3;

    source.connect(gain);
    gain.connect(c.destination);
    source.start(0);

    bootSource = source;
    bootGain = gain;
  });
}

export function stopBootSound() {
  bootToken++; // invalidate any in-flight load so it won't start after stop
  if (bootSource) {
    try { bootSource.stop(); } catch { /* already stopped */ }
    bootSource.disconnect();
    bootSource = null;
  }
  if (bootGain) {
    bootGain.disconnect();
    bootGain = null;
  }
}
