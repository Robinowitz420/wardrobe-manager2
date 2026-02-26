import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCard(docId: string, raw: any) {
  const r = raw && typeof raw === "object" ? raw : {};
  const attrs = r.attributes && typeof r.attributes === "object" ? r.attributes : {};

  const photos = Array.isArray(r.photos) ? r.photos : [];
  const primary = photos.find((p: any) => p?.isPrimary) ?? photos[0] ?? null;

  const photoUrls = photos
    .map((p: any) => p?.src ?? p?.dataUrl)
    .filter((v: any) => typeof v === "string" && v.length > 0);

  return {
    id: String(r.id ?? docId),
    name: typeof r?.name === "string" ? r.name : null,
    brand: typeof attrs?.brand === "string" ? attrs.brand : null,
    category: typeof attrs?.category === "string" ? attrs.category : null,
    size: typeof attrs?.size === "string" ? attrs.size : null,
    tier: Array.isArray(attrs?.tier) ? attrs.tier : typeof attrs?.tier === "string" ? [attrs.tier] : [],
    state: typeof attrs?.state === "string" ? attrs.state : null,
    primaryPhotoUrl: primary ? (primary.src ?? primary.dataUrl ?? null) : null,
    photoUrls,
    tags: {
      vibes: Array.isArray(attrs?.vibes) ? attrs.vibes : [],
      era: Array.isArray(attrs?.era) ? attrs.era : [],
      colorTones: Array.isArray(attrs?.colorTones) ? attrs.colorTones : [],
      pockets: Array.isArray(attrs?.pockets) ? attrs.pockets : [],
      enclosures: Array.isArray(attrs?.enclosures) ? attrs.enclosures : [],
    },
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitRaw ?? 30) || 30, 1), 60);

  const db = getAdminFirestore();

  const snap = await db
    .collection("garments")
    .where("attributes.state", "==", "Available")
    .limit(limit)
    .get();

  const data = snap.docs.map((d) => toCard(d.id, d.data()));

  return NextResponse.json(
    { data, nextCursor: null },
    {
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}
