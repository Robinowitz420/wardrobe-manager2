import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const id = typeof params?.id === "string" ? params.id : "";
  if (!id) {
    return NextResponse.json(
      { error: "NOT_FOUND" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  const db = getAdminFirestore();
  const ref = db.collection("garments").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json(
      { error: "NOT_FOUND" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  const r = snap.data() as any;
  const resolvedId = String(r?.id ?? snap.id);

  return NextResponse.json(
    {
      data: {
        id: resolvedId,
        name: typeof r?.name === "string" ? r.name : null,
        photos: Array.isArray(r?.photos) ? r.photos : [],
        attributes: r?.attributes ?? {},
        intakeSessionId: r?.intakeSessionId ?? undefined,
        intakeOrder: typeof r?.intakeOrder === "number" ? r.intakeOrder : undefined,
        createdAt: r?.createdAt ?? null,
        updatedAt: r?.updatedAt ?? null,
      },
    },
    { headers: { "cache-control": "no-store" } }
  );
}
