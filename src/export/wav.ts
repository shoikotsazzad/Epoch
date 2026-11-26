// Minimal 16-bit PCM WAV encoder (no dependency).

export interface PcmSource {
  numberOfChannels: number;
  sampleRate: number;
  length: number;
  getChannelData(channel: number): Float32Array;
}

export function encodeWav(buf: PcmSource): Blob {
  const channels = Math.min(2, buf.numberOfChannels);
  const frames = buf.length;
  const bytesPerSample = 2;
  const dataBytes = frames * channels * bytesPerSample;
  const out = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(out);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + dataBytes, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true); // PCM chunk size
  v.setUint16(20, 1, true); // format: PCM
  v.setUint16(22, channels, true);
  v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * channels * bytesPerSample, true); // byte rate
  v.setUint16(32, channels * bytesPerSample, true); // block align
  v.setUint16(34, 16, true); // bits per sample
  str(36, "data");
  v.setUint32(40, dataBytes, true);
  const data = Array.from({ length: channels }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([out], { type: "audio/wav" });
}

/** Downsampled peaks for a cheap waveform preview. */
export function peaks(buf: PcmSource, buckets = 240): number[] {
  const data = buf.getChannelData(0);
  const size = Math.max(1, Math.floor(data.length / buckets));
  const out: number[] = [];
  for (let b = 0; b < buckets; b++) {
    let max = 0;
    const end = Math.min(data.length, (b + 1) * size);
    for (let i = b * size; i < end; i += 16) max = Math.max(max, Math.abs(data[i]));
    out.push(max);
  }
  return out;
}
