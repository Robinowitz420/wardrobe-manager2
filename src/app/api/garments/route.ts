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

function maybeIso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  return s;
}

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, name, completionStatus, photos, attributes, intakeSessionId, intakeOrder, createdAt, updatedAt FROM garments ORDER BY updatedAt DESC",
    )
    .all() as Array<any>;

  const garments = rows.map((r) => ({
    id: r.id,
    name: r.name,
    completionStatus: r.completionStatus,
    photos: JSON.parse(r.photos),
    attributes: JSON.parse(r.attributes),
    intakeSessionId: r.intakeSessionId ?? undefined,
    intakeOrder: typeof r.intakeOrder === "number" ? r.intakeOrder : undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return NextResponse.json({ garments });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = (payload as any)?.id as string | undefined;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const name = (payload as any)?.name as string | undefined;
  const photos = normalizePhotos((payload as any)?.photos);
  const attributes = (payload as any)?.attributes ?? payload;

  const completionStatus = computeCompletionStatus(name, photos);

  const db = getDb();

  const existing = db
    .prepare("SELECT createdAt FROM garments WHERE id = ?")
    .get(id) as any;

  const createdAt =
    typeof existing?.createdAt === "string"
      ? existing.createdAt
      : maybeIso((payload as any)?.createdAt) ?? nowIso();
  const updatedAt = maybeIso((payload as any)?.updatedAt) ?? nowIso();

  db.prepare(
    "INSERT OR REPLACE INTO garments (id, name, completionStatus, photos, attributes, intakeSessionId, intakeOrder, createdAt, updatedAt) VALUES (@id, @name, @completionStatus, @photos, @attributes, @intakeSessionId, @intakeOrder, @createdAt, @updatedAt)",
  ).run({
    id,
    name: typeof name === "string" && name.trim() ? name.trim() : null,
    completionStatus,
    photos: JSON.stringify(photos),
    attributes: JSON.stringify(attributes),
    intakeSessionId: (payload as any)?.intakeSessionId ?? null,
    intakeOrder: (payload as any)?.intakeOrder ?? null,
    createdAt,
    updatedAt,
  });

  return NextResponse.json({
    garment: {
      id,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
      completionStatus,
      photos,
      attributes,
      intakeSessionId: (payload as any)?.intakeSessionId ?? undefined,
      intakeOrder: (payload as any)?.intakeOrder ?? undefined,
      createdAt,
      updatedAt,
    },
  });
}
