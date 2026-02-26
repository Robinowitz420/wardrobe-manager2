import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function nowIso() {
  return new Date().toISOString();
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const id = typeof params?.id === "string" ? params.id : "";

  if (!id) {
    return NextResponse.json(
      { error: "NOT_FOUND" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const reservationToken = typeof body?.reservationToken === "string" ? body.reservationToken.trim() : "";
  if (!reservationToken) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "reservationToken required" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const db = getAdminFirestore();
  const ref = db.collection("garments").doc(id);

  try {
    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return { type: "not_found" as const };
      }

      const r = snap.data() as any;
      const attrs = r?.attributes && typeof r.attributes === "object" ? r.attributes : {};
      const state = typeof attrs?.state === "string" ? attrs.state : null;

      if (state !== "Available") {
        return { type: "not_available" as const, state: state ?? "Unknown" };
      }

      const nextAttrs = {
        ...attrs,
        state: "Reserved",
        reservedAt: nowIso(),
        reservedByToken: reservationToken,
      };

      tx.update(ref, {
        attributes: nextAttrs,
        updatedAt: nowIso(),
      });

      return { type: "ok" as const, docId: snap.id };
    });

    if (updated.type === "not_found") {
      return NextResponse.json(
        { error: "NOT_FOUND" },
        { status: 404, headers: { "cache-control": "no-store" } }
      );
    }

    if (updated.type === "not_available") {
      return NextResponse.json(
        { error: "NOT_AVAILABLE", data: { state: updated.state } },
        { status: 409, headers: { "cache-control": "no-store" } }
      );
    }

    const snap = await ref.get();
    const r = snap.data() as any;

    return NextResponse.json(
      {
        data: {
          id: String(r?.id ?? snap.id),
          name: typeof r?.name === "string" ? r.name : null,
          photos: Array.isArray(r?.photos) ? r.photos : [],
          attributes: r?.attributes ?? {},
          createdAt: r?.createdAt ?? null,
          updatedAt: r?.updatedAt ?? null,
        },
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to reserve";
    return NextResponse.json(
      { error: "FAILED_TO_RESERVE", message },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
