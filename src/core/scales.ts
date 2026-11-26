// Scales and the quantizer. Recursions only ever speak in scale degrees;
// this module is the single place where degrees become MIDI notes.

import type { ScaleId } from "./types";

export const SCALES: Record<ScaleId, readonly number[]> = {
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

export const SCALE_LABELS: Record<ScaleId, string> = {
  majorPentatonic: "Major pentatonic",
  minorPentatonic: "Minor pentatonic",
  lydian: "Lydian",
  dorian: "Dorian",
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Map (degree, octave) to MIDI. Degrees may be negative or exceed the scale; they wrap into octaves. */
export function quantize(degree: number, octave: number, scale: readonly number[], rootMidi: number): number {
  const len = scale.length;
  const d = Math.round(degree);
  const oct = octave + Math.floor(d / len);
  return rootMidi + 12 * oct + scale[mod(d, len)];
}

/** True if a MIDI note belongs to the scale built on rootMidi. */
export function isInScale(midi: number, scale: readonly number[], rootMidi: number): boolean {
  return scale.includes(mod(midi - rootMidi, 12));
}

/** Scale degree index whose interval is `semitones` (e.g. 7 = the fifth). Falls back to the nearest lower degree. */
export function degreeOfInterval(scale: readonly number[], semitones: number): number {
  const s = mod(semitones, 12);
  let best = 0;
  for (let i = 0; i < scale.length; i++) if (scale[i] <= s) best = i;
  return best + scale.length * Math.floor(semitones / 12);
}

/** Below this MIDI note only roots and fifths are allowed (no muddy low thirds). */
export const BASS_SAFE_BELOW = 48; // C3

/**
 * Keep the low register clean: below C3, any interval that isn't a root or fifth
 * is moved up an octave. Result is still in key.
 */
export function bassSafe(midi: number, rootMidi: number): number {
  let m = midi;
  while (m < BASS_SAFE_BELOW) {
    const iv = mod(m - rootMidi, 12);
    if (iv === 0 || iv === 7) break;
    m += 12;
  }
  return m;
}

/** Fold a MIDI note into [lo, hi] by octaves (stays in key). */
export function foldIntoRange(midi: number, lo: number, hi: number): number {
  let m = midi;
  while (m < lo) m += 12;
  while (m > hi) m -= 12;
  return m;
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToName(midi: number): string {
  return `${NAMES[mod(midi, 12)]}${Math.floor(midi / 12) - 1}`;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Chord tones as degree offsets: stacking every other scale step
 * (thirds in 7-note scales, open consonances in pentatonic).
 * Siblings pick different entries, so they are never adjacent scale steps.
 */
export const CHORD_STEPS = [0, 2, 4] as const;

/** Nearest "home" degree (0 = tonic, 4 = dominant-ish) in the same octave, for resolutions. */
export function resolveDegree(degree: number, scaleLength: number): number {
  const base = Math.floor(degree / scaleLength) * scaleLength;
  const inOct = degree - base;
  const homeA = 0;
  const homeB = Math.min(4, scaleLength - 1);
  const homeC = scaleLength; // tonic one octave up
  const candidates = [homeA, homeB, homeC];
  let best = candidates[0];
  for (const c of candidates) if (Math.abs(c - inOct) < Math.abs(best - inOct)) best = c;
  return base + best;
}
