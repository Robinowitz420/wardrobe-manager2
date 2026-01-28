import { NextResponse } from "next/server";

import { asAuthError, getAdminFirestore, requireFirebaseUser } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type CompletionStatus = "DRAFT" | "COMPLETE";

function nowIso() {
  return new Date().toISOString();
}

function computeCompletionStatus(name: unknown, photosRaw: unknown): CompletionStatus {
  const hasPhoto = Array.isArray(photosRaw) && photosRaw.length > 0;
  const n = typeof name === "string" ? name.trim() : "";
  const hasName = Boolean(n) && n !== "Untitled garment";
  return hasPhoto && hasName ? "COMPLETE" : "DRAFT";
}

function normalizePhotos(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw;
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireFirebaseUser(request);
  } catch (e) {
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const db = getAdminFirestore();
  const snap = await db.collection("garments").doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = snap.data() as any;
  const photos = Array.isArray(row?.photos) ? row.photos : [];
  const attributes = row?.attributes ?? {};

  return NextResponse.json({
    garment: {
      ...attributes,
      id: row.id ?? id,
      name: row.name ?? "Untitled garment",
      completionStatus: row.completionStatus ?? "DRAFT",
      photos,
      intakeSessionId: row.intakeSessionId ?? undefined,
      intakeOrder: typeof row.intakeOrder === "number" ? row.intakeOrder : undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireFirebaseUser(request);
  } catch (e) {
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.collection("garments").doc(id);
  const existingSnap = await ref.get();
  if (!existingSnap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = existingSnap.data() as any;
  const existingPhotos = Array.isArray(existing?.photos) ? existing.photos : [];
  const existingAttributes = existing?.attributes ?? {};

  const nextAttributes = { ...existingAttributes, ...(payload as any), id };
  const nextPhotos =
    (payload as any)?.photos !== undefined
      ? normalizePhotos((payload as any)?.photos)
      : existingPhotos;

  const nextName =
    (payload as any)?.name !== undefined ? (payload as any)?.name : (existing.name ?? "");

  const completionStatus = computeCompletionStatus(nextName, nextPhotos);

  const updatedAt = nowIso();

  const trimmedName =
    typeof nextName === "string" && nextName.trim() && nextName.trim() !== "Untitled garment"
      ? nextName.trim()
      : null;

  await ref.set(
    {
      id,
      name: trimmedName,
      completionStatus,
      photos: nextPhotos,
      attributes: nextAttributes,
      intakeSessionId: (payload as any)?.intakeSessionId ?? existing.intakeSessionId ?? null,
      intakeOrder: (payload as any)?.intakeOrder ?? existing.intakeOrder ?? null,
      createdAt: existing.createdAt,
      updatedAt,
    },
    { merge: true },
  );

  return NextResponse.json({
    garment: {
      ...nextAttributes,
      id,
      name: typeof nextName === "string" && nextName.trim() ? nextName.trim() : "Untitled garment",
      completionStatus,
      photos: nextPhotos,
      intakeSessionId: (payload as any)?.intakeSessionId ?? existing.intakeSessionId ?? undefined,
      intakeOrder: (payload as any)?.intakeOrder ?? existing.intakeOrder ?? undefined,
      createdAt: existing.createdAt,
      updatedAt,
    },
  });
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireFirebaseUser(request);
  } catch (e) {
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const db = getAdminFirestore();
  const ref = db.collection("garments").doc(id);
  const existing = await ref.get();
  if (!existing.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
