import { COLOR_SWATCHES, type GarmentType } from "@/constants/garment";

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const int = parseInt(hex.replace("#", ""), 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

const COLOR_TO_RGB: Record<string, Rgb> = Object.fromEntries(
  Object.entries(COLOR_SWATCHES)
    .filter(([name]) => name !== "Multicolor")
    .map(([name, hex]) => [name, hexToRgb(hex)]),
);

function dist(a: Rgb, b: Rgb) {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

function nearestColor(rgb: Rgb): string {
  let best = "Black";
  let bestD = Infinity;
  for (const c of Object.keys(COLOR_TO_RGB)) {
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
): Promise<string | undefined> {
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
