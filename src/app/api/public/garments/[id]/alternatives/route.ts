import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function arr(v: any): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

function overlapScore(a: string[], b: string[]) {
  const bs = new Set(b);
  let score = 0;
  for (const x of a) if (bs.has(x)) score += 1;
  return score;
}

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

export async function GET(request: NextRequest, ctx: { params: { id: string } }) {
  const params = await Promise.resolve(ctx.params as any);
  const id = typeof params?.id === "string" ? params.id : "";
  if (!id) {
    return NextResponse.json(
      { error: "NOT_FOUND" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitRaw ?? 3) || 3, 1), 12);

  const db = getAdminFirestore();
  const seedRef = db.collection("garments").doc(id);
  const seedSnap = await seedRef.get();

  if (!seedSnap.exists) {
    return NextResponse.json(
      { error: "NOT_FOUND" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  const seed = seedSnap.data() as any;
  const seedAttrs = seed?.attributes && typeof seed.attributes === "object" ? seed.attributes : {};

  const seedVibes = arr(seedAttrs?.vibes);
  const seedEra = arr(seedAttrs?.era);
  const seedTones = arr(seedAttrs?.colorTones);
  const seedCategory = typeof seedAttrs?.category === "string" ? seedAttrs.category : null;

  const snap = await db
    .collection("garments")
    .where("attributes.state", "==", "Available")
    .limit(120)
    .get();

  const scored = snap.docs
    .filter((d) => d.id !== seedSnap.id)
    .map((d) => {
      const r = d.data() as any;
      const attrs = r?.attributes && typeof r.attributes === "object" ? r.attributes : {};

      const s =
        (seedCategory && String(attrs?.category) === String(seedCategory) ? 5 : 0) +
        overlapScore(seedVibes, arr(attrs?.vibes)) +
        overlapScore(seedEra, arr(attrs?.era)) +
        overlapScore(seedTones, arr(attrs?.colorTones));

      return { doc: d, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ doc }) => toCard(doc.id, doc.data()));

  return NextResponse.json(
    { data: scored },
    { headers: { "cache-control": "no-store" } }
  );
}
