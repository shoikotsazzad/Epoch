// Seeded randomness. EVERY random choice in the garden comes from here, so the
// same seed always yields the same garden and the same music (live and export).

/** mulberry32: tiny, fast, good-enough 32-bit PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of a string to a 32-bit unsigned int. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Derive an independent stream for one plant (or any sub-purpose) from the garden seed. */
export function deriveSeed(seed: number, salt: string): number {
  return hashString(`${seed >>> 0}:${salt}`);
}

export function randRange(rand: () => number, min: number, max: number): number {
  return min + (max - min) * rand();
}

export function randInt(rand: () => number, min: number, maxInclusive: number): number {
  return Math.floor(randRange(rand, min, maxInclusive + 1));
}

export function chance(rand: () => number, p: number): boolean {
  return rand() < p;
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

/** A new random seed in a friendly range (4 digits reads well in filenames and share links). */
export function freshSeed(rand: () => number = Math.random): number {
  return 1000 + Math.floor(rand() * 9000);
}
