const EFFECTS = ["fx-pulse-border", "fx-hover-lift", "fx-focus-glow"] as const;

type EffectClass = (typeof EFFECTS)[number];

function hashString(seed: string): number {
  // djb2
  let h = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 33) ^ seed.charCodeAt(i);
  }
  return h >>> 0;
}

function pickCount(h: number): 1 | 2 | 3 {
  const n = (h % 3) + 1;
  return (n === 1 ? 1 : n === 2 ? 2 : 3) as 1 | 2 | 3;
}

function pickEffects(seed: string): EffectClass[] {
  const h = hashString(seed);
  const count = pickCount(h);

  // Deterministic shuffle based on hash.
  const order = [...EFFECTS].sort((a, b) => {
    const ha = hashString(`${seed}:${a}`);
    const hb = hashString(`${seed}:${b}`);
    return ha - hb;
  });

  return order.slice(0, count);
}

export function bubbleEffectsForSeed(seed: string): string {
  return pickEffects(seed).join(" ");
}
