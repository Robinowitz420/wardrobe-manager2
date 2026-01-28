import { NextResponse } from "next/server";

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  GARMENT_CATEGORIES,
  GARMENT_TYPES,
  PATTERNS,
  SILHOUETTES,
  TEXTURES,
  type GarmentCategory,
  type GarmentType,
} from "@/constants/garment";
import { nearestGarmentColorFromRgb } from "@/lib/vision/suggest";
import { asAuthError, requireFirebaseUser } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type VisionRgb = { r: number; g: number; b: number };

type Pattern = (typeof PATTERNS)[number];
type Texture = (typeof TEXTURES)[number];
type Silhouette = (typeof SILHOUETTES)[number];

type VisionResponse = {
  labels: string[];
  dominantColor?: {
    rgb: VisionRgb;
    score?: number;
    pixelFraction?: number;
  };
  suggested: {
    dominantColor?: ReturnType<typeof nearestGarmentColorFromRgb>;
    garmentType?: GarmentType;
    category?: GarmentCategory;
    pattern?: Pattern;
    texture?: Texture;
    silhouette?: Silhouette;
  };
};

function norm(s: string) {
  return s.toLowerCase().trim();
}

function includesAny(terms: string[], needles: string[]) {
  for (const t of terms) {
    for (const n of needles) {
      if (t.includes(n)) return true;
    }
  }
  return false;
}

function inferCategoryFromType(type: GarmentType): GarmentCategory {
  if (type === "Dress") return "Dress";
  if (type === "Coat" || type === "Jacket" || type === "Robe") return "Outerwear";
  if (type === "Pants" || type === "Jeans" || type === "Skirt") return "Bottom";
  if (
    type === "Top" ||
    type === "Blouse" ||
    type === "Shirt" ||
    type === "Tee" ||
    type === "Sweater"
  ) {
    return "Top";
  }
  if (
    type === "Hat" ||
    type === "Bag" ||
    type === "Scarf" ||
    type === "Belt" ||
    type === "Accessory"
  ) {
    return "Accessory";
  }
  if (type === "Suit") return "Set";
  return "Other";
}

function inferSuggestedFromTerms(terms: string[]) {
  let garmentType: GarmentType | undefined;
  let category: GarmentCategory | undefined;
  let pattern: Pattern | undefined;
  let texture: Texture | undefined;
  let silhouette: Silhouette | undefined;

  const t = terms;

  if (includesAny(t, ["dress", "gown"])) garmentType = "Dress";
  else if (includesAny(t, ["coat", "trench"])) garmentType = "Coat";
  else if (includesAny(t, ["jacket", "blazer"])) garmentType = "Jacket";
  else if (includesAny(t, ["robe", "kimono"])) garmentType = "Robe";
  else if (includesAny(t, ["jumpsuit", "romper"])) garmentType = "Jumpsuit";
  else if (includesAny(t, ["suit"])) garmentType = "Suit";
  else if (includesAny(t, ["skirt"])) garmentType = "Skirt";
  else if (includesAny(t, ["jeans", "denim"])) garmentType = "Jeans";
  else if (includesAny(t, ["pants", "trouser"])) garmentType = "Pants";
  else if (includesAny(t, ["sweater", "cardigan"])) garmentType = "Sweater";
  else if (includesAny(t, ["blouse"])) garmentType = "Blouse";
  else if (includesAny(t, ["t-shirt", "tee"])) garmentType = "Tee";
  else if (includesAny(t, ["shirt", "button up", "button-up", "button down", "button-down"])) garmentType = "Shirt";
  else if (includesAny(t, ["hat", "cap", "beanie"])) garmentType = "Hat";
  else if (includesAny(t, ["bag", "handbag", "purse", "backpack"])) garmentType = "Bag";
  else if (includesAny(t, ["scarf"])) garmentType = "Scarf";
  else if (includesAny(t, ["belt"])) garmentType = "Belt";
  else if (includesAny(t, ["accessory", "jewelry", "necklace", "earring", "bracelet"])) garmentType = "Accessory";

  if (garmentType) category = inferCategoryFromType(garmentType);
  if (category && !GARMENT_CATEGORIES.includes(category)) category = undefined;
  if (garmentType && !GARMENT_TYPES.includes(garmentType)) garmentType = undefined;

  if (includesAny(t, ["plaid", "tartan", "checkered", "checker"])) pattern = "Plaid";
  else if (includesAny(t, ["stripe", "striped"])) pattern = "Stripe";
  else if (includesAny(t, ["polka dot", "polkadot"])) pattern = "Polka Dot";
  else if (includesAny(t, ["floral", "flower"])) pattern = "Floral";
  else if (includesAny(t, ["leopard", "cheetah", "zebra", "snake", "animal print"])) pattern = "Animal";
  else if (includesAny(t, ["geometric"])) pattern = "Geometric";
  else if (includesAny(t, ["graphic", "logo", "text"])) pattern = "Graphic";
  else if (includesAny(t, ["solid", "plain"])) pattern = "Solid";

  if (pattern && !PATTERNS.includes(pattern)) pattern = undefined;

  if (includesAny(t, ["sequins", "sequin", "shiny", "glossy", "metallic"])) texture = "Shiny";
  else if (includesAny(t, ["matte"])) texture = "Matte";
  else if (includesAny(t, ["velvet", "faux fur", "fur", "plush"])) texture = "Plush";
  else if (includesAny(t, ["sheer", "transparent"])) texture = "Sheer";
  else if (includesAny(t, ["stretch", "spandex", "elastic"])) texture = "Stretchy";
  else if (includesAny(t, ["crisp"])) texture = "Crisp";
  else if (includesAny(t, ["distressed", "worn"])) texture = "Worn-in";
  else if (includesAny(t, ["structured", "tailored"])) texture = "Structured";
  else if (includesAny(t, ["smooth"])) texture = "Smooth";

  if (texture && !TEXTURES.includes(texture)) texture = undefined;

  if (includesAny(t, ["oversized", "baggy", "loose"])) silhouette = "Oversized";
  else if (includesAny(t, ["cropped"])) silhouette = "Cropped";
  else if (includesAny(t, ["boxy"])) silhouette = "Boxy";
  else if (includesAny(t, ["draped", "flowy", "drape"])) silhouette = "Draped";
  else if (includesAny(t, ["a-line", "aline"])) silhouette = "A-Line";
  else if (includesAny(t, ["flared", "flare"])) silhouette = "Flared";
  else if (includesAny(t, ["tailored"])) silhouette = "Tailored";
  else if (includesAny(t, ["fitted", "tight", "skinny"])) silhouette = "Fitted";

  if (silhouette && !SILHOUETTES.includes(silhouette)) silhouette = undefined;

  return { garmentType, category, pattern, texture, silhouette };
}

function dataUrlToBase64(dataUrl: string) {
  const idx = dataUrl.indexOf(",");
  if (idx === -1) return null;
  return dataUrl.slice(idx + 1);
}

function srcToAbsPath(src: string): string | null {
  if (!src.startsWith("/uploads/")) return null;
  const rel = src.slice("/uploads/".length);
  if (!rel) return null;
  if (rel.includes("..")) return null;
  if (rel.includes("\\")) return null;
  return path.join(process.cwd(), "public", "uploads", rel);
}

export async function POST(request: Request) {
  try {
    await requireFirebaseUser(request);
  } catch (e) {
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_CLOUD_VISION_API_KEY" },
      { status: 501 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dataUrl = (payload as any)?.dataUrl as string | undefined;
  const src = (payload as any)?.src as string | undefined;
  if ((!dataUrl || typeof dataUrl !== "string") && (!src || typeof src !== "string")) {
    return NextResponse.json({ error: "Missing dataUrl or src" }, { status: 400 });
  }

  let content: string | null = null;
  if (src && typeof src === "string") {
    const abs = srcToAbsPath(src);
    if (!abs) {
      return NextResponse.json({ error: "Invalid src" }, { status: 400 });
    }
    const buf = await readFile(abs).catch(() => null);
    if (!buf) {
      return NextResponse.json({ error: "Could not read image" }, { status: 400 });
    }
    content = Buffer.from(buf).toString("base64");
  } else if (dataUrl) {
    content = dataUrlToBase64(dataUrl);
  }

  if (!content) {
    return NextResponse.json({ error: "Invalid image input" }, { status: 400 });
  }

  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content },
            features: [
              { type: "IMAGE_PROPERTIES", maxResults: 5 },
              { type: "LABEL_DETECTION", maxResults: 10 },
              { type: "WEB_DETECTION", maxResults: 10 },
            ],
          },
        ],
      }),
    },
  );

  if (!visionRes.ok) {
    const text = await visionRes.text().catch(() => "");
    return NextResponse.json(
      { error: "Vision API request failed", details: text.slice(0, 1000) },
      { status: 502 },
    );
  }

  const json = (await visionRes.json()) as any;
  const first = json?.responses?.[0] ?? {};

  const labels: string[] = Array.isArray(first?.labelAnnotations)
    ? first.labelAnnotations
        .map((l: any) => (typeof l?.description === "string" ? l.description : null))
        .filter(Boolean)
    : [];

  const webTerms: string[] = [];
  const webEntities = first?.webDetection?.webEntities;
  if (Array.isArray(webEntities)) {
    for (const e of webEntities) {
      if (typeof e?.description === "string") webTerms.push(e.description);
    }
  }
  const bestGuessLabels = first?.webDetection?.bestGuessLabels;
  if (Array.isArray(bestGuessLabels)) {
    for (const e of bestGuessLabels) {
      if (typeof e?.label === "string") webTerms.push(e.label);
    }
  }

  const dom = first?.imagePropertiesAnnotation?.dominantColors?.colors?.[0];
  const rgb: VisionRgb | undefined =
    dom?.color &&
    typeof dom.color.red === "number" &&
    typeof dom.color.green === "number" &&
    typeof dom.color.blue === "number"
      ? { r: dom.color.red, g: dom.color.green, b: dom.color.blue }
      : undefined;

  const dominantColor = rgb
    ? {
        rgb,
        score: typeof dom?.score === "number" ? dom.score : undefined,
        pixelFraction: typeof dom?.pixelFraction === "number" ? dom.pixelFraction : undefined,
      }
    : undefined;

  const suggestedDominant = rgb ? nearestGarmentColorFromRgb(rgb) : undefined;

  const terms = [...labels, ...webTerms].map(norm);
  const inferred = inferSuggestedFromTerms(terms);

  const response: VisionResponse = {
    labels,
    dominantColor,
    suggested: {
      dominantColor: suggestedDominant,
      garmentType: inferred.garmentType,
      category: inferred.category,
      pattern: inferred.pattern,
      texture: inferred.texture,
      silhouette: inferred.silhouette,
    },
  };

  return NextResponse.json(response);
}
