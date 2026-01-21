import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

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
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const db = getDb();

  const row = db
    .prepare(
      "SELECT id, name, completionStatus, photos, attributes, intakeSessionId, intakeOrder, createdAt, updatedAt FROM garments WHERE id = ?",
    )
    .get(id) as any;

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photos = JSON.parse(row.photos);
  const attributes = JSON.parse(row.attributes);

  return NextResponse.json({
    garment: {
      ...attributes,
      id: row.id,
      name: row.name ?? "Untitled garment",
      completionStatus: row.completionStatus,
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
  const { id } = await ctx.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id, name, completionStatus, photos, attributes, intakeSessionId, intakeOrder, createdAt, updatedAt FROM garments WHERE id = ?",
    )
    .get(id) as any;

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existingPhotos = JSON.parse(existing.photos);
  const existingAttributes = JSON.parse(existing.attributes);

  const nextAttributes = { ...existingAttributes, ...(payload as any), id };
  const nextPhotos =
    (payload as any)?.photos !== undefined
      ? normalizePhotos((payload as any)?.photos)
      : existingPhotos;

  const nextName =
    (payload as any)?.name !== undefined ? (payload as any)?.name : (existing.name ?? "");

  const completionStatus = computeCompletionStatus(nextName, nextPhotos);

  const updatedAt = nowIso();

  db.prepare(
    "UPDATE garments SET name = @name, completionStatus = @completionStatus, photos = @photos, attributes = @attributes, intakeSessionId = @intakeSessionId, intakeOrder = @intakeOrder, updatedAt = @updatedAt WHERE id = @id",
  ).run({
    id,
    name:
      typeof nextName === "string" && nextName.trim() && nextName.trim() !== "Untitled garment"
        ? nextName.trim()
        : null,
    completionStatus,
    photos: JSON.stringify(nextPhotos),
    attributes: JSON.stringify(nextAttributes),
    intakeSessionId: (payload as any)?.intakeSessionId ?? existing.intakeSessionId ?? null,
    intakeOrder: (payload as any)?.intakeOrder ?? existing.intakeOrder ?? null,
    updatedAt,
  });

  return NextResponse.json({
    garment: {
      ...nextAttributes,
      id,
      name:
        typeof nextName === "string" && nextName.trim() ? nextName.trim() : "Untitled garment",
      completionStatus,
      photos: nextPhotos,
      intakeSessionId: (payload as any)?.intakeSessionId ?? existing.intakeSessionId ?? undefined,
      intakeOrder: (payload as any)?.intakeOrder ?? existing.intakeOrder ?? undefined,
      createdAt: existing.createdAt,
      updatedAt,
    },
  });
}
