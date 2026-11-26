// "Record session": capture the live output with MediaRecorder.

const MIME_CANDIDATES: { mime: string; ext: string }[] = [
  { mime: "audio/webm;codecs=opus", ext: "webm" },
  { mime: "audio/mp4", ext: "m4a" },
  { mime: "audio/ogg;codecs=opus", ext: "ogg" },
];

export function pickRecorderFormat(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const c of MIME_CANDIDATES) if (MediaRecorder.isTypeSupported(c.mime)) return c;
  return null;
}

export class SessionRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  readonly format = pickRecorderFormat();
  startedAt = 0;

  constructor(private stream: MediaStream) {}

  get supported() {
    return this.format !== null;
  }

  start() {
    if (!this.format) throw new Error("Recording is not supported in this browser");
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, { mimeType: this.format.mime });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.recorder.start(1000);
    this.startedAt = performance.now();
  }

  stop(): Promise<{ blob: Blob; ext: string; seconds: number }> {
    return new Promise((resolve, reject) => {
      const rec = this.recorder;
      if (!rec || !this.format) return reject(new Error("Not recording"));
      const fmt = this.format;
      rec.onstop = () => {
        resolve({
          blob: new Blob(this.chunks, { type: fmt.mime.split(";")[0] }),
          ext: fmt.ext,
          seconds: (performance.now() - this.startedAt) / 1000,
        });
        this.recorder = null;
      };
      rec.stop();
    });
  }
}
