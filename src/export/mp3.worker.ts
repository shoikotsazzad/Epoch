/// <reference lib="webworker" />
// MP3 encoding off the main thread (lamejs ESM fork; avoids "MPEGMode is not defined").

import { Mp3Encoder } from "@breezystack/lamejs";

interface Job {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
  kbps: number;
}

const toInt16 = (f: Float32Array) => {
  const out = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) {
    const s = Math.max(-1, Math.min(1, f[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
};

self.onmessage = (ev: MessageEvent<Job>) => {
  try {
    const { left, right, sampleRate, kbps } = ev.data;
    const enc = new Mp3Encoder(2, sampleRate, kbps);
    const l = toInt16(left);
    const r = toInt16(right);
    const block = 1152;
    const chunks: Uint8Array[] = [];
    const total = l.length;
    let lastReport = 0;
    for (let i = 0; i < total; i += block) {
      const out = enc.encodeBuffer(l.subarray(i, i + block), r.subarray(i, i + block));
      if (out.length) chunks.push(new Uint8Array(out));
      if (i - lastReport > sampleRate * 2) {
        lastReport = i;
        self.postMessage({ type: "progress", value: i / total });
      }
    }
    const end = enc.flush();
    if (end.length) chunks.push(new Uint8Array(end));
    self.postMessage({ type: "done", chunks });
  } catch (err) {
    self.postMessage({ type: "error", message: String(err) });
  }
};
