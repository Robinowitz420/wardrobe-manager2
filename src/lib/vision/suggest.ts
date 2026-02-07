import { COLORS, type GarmentType } from "@/constants/garment";

type Rgb = { r: number; g: number; b: number };

const COLOR_TO_RGB: Record<(typeof COLORS)[number], Rgb> = {
  Black: { r: 10, g: 10, b: 10 },
  White: { r: 245, g: 245, b: 245 },
  Gray: { r: 150, g: 150, b: 150 },
  Brown: { r: 120, g: 80, b: 50 },
  Navy: { r: 20, g: 35, b: 80 },
  Blue: { r: 60, g: 120, b: 210 },
  Green: { r: 70, g: 160, b: 95 },
  Red: { r: 200, g: 60, b: 60 },
  Pink: { r: 230, g: 120, b: 160 },
  Purple: { r: 130, g: 90, b: 190 },
  Yellow: { r: 230, g: 205, b: 70 },
  Orange: { r: 230, g: 145, b: 60 },
  Multicolor: { r: 128, g: 128, b: 128 },
};

function dist(a: Rgb, b: Rgb) {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

function nearestColor(rgb: Rgb) {
  let best: (typeof COLORS)[number] = COLORS[0];
  let bestD = Infinity;
  for (const c of COLORS) {
    const d = dist(rgb, COLOR_TO_RGB[c]);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

export function nearestGarmentColorFromRgb(rgb: Rgb) {
  return nearestColor(rgb);
}

export async function suggestDominantColorFromDataUrl(
  dataUrl: string,
): Promise<(typeof COLORS)[number] | undefined> {
  if (typeof window === "undefined") return undefined;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = dataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image load failed"));
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const size = 96;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);

  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 16) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }

  if (n === 0) return undefined;
  const avg = { r: r / n, g: g / n, b: b / n };

  const rough = nearestColor(avg);

  const saturation = Math.max(avg.r, avg.g, avg.b) - Math.min(avg.r, avg.g, avg.b);
  if (saturation > 110) return "Multicolor";

  return rough;
}

export function suggestGarmentTypeFromName(name: string): GarmentType | undefined {
  const s = name.toLowerCase();
  if (s.includes("coat")) return "Coat";
  if (s.includes("jacket")) return "Jacket";
  if (s.includes("robe")) return "Robe";
  if (s.includes("dress")) return "Dress";
  if (s.includes("skirt")) return "Skirt";
  if (s.includes("pant")) return "Pants";
  if (s.includes("jean")) return "Jeans";
  if (s.includes("hat")) return "Hat";
  if (s.includes("bag")) return "Bag";
  if (s.includes("scarf")) return "Scarf";
  if (s.includes("belt")) return "Belt";
  return undefined;
}
