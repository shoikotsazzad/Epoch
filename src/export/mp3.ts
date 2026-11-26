// Main-thread wrapper around the MP3 worker.

import type { PcmSource } from "./wav";

export function encodeMp3(buf: PcmSource, onProgress: (p: number) => void, kbps = 176): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./mp3.worker.ts", import.meta.url), { type: "module" });
    const left = new Float32Array(buf.getChannelData(0));
    const right = new Float32Array(buf.numberOfChannels > 1 ? buf.getChannelData(1) : buf.getChannelData(0));
    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data as { type: string; value?: number; chunks?: Uint8Array[]; message?: string };
      if (msg.type === "progress") onProgress(msg.value ?? 0);
      else if (msg.type === "done") {
        worker.terminate();
        onProgress(1);
        resolve(new Blob((msg.chunks ?? []) as BlobPart[], { type: "audio/mpeg" }));
      } else if (msg.type === "error") {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || "MP3 worker failed"));
    };
    worker.postMessage({ left, right, sampleRate: buf.sampleRate, kbps }, [left.buffer, right.buffer]);
  });
}
