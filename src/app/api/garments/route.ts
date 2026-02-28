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

function maybeIso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  return s;
}

export async function GET(request: Request) {
  try {
    await requireFirebaseUser(request);
  } catch (e) {
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();
  
  // Debug: log which project we're querying
  console.log("[Garments GET] Querying Firestore project:", process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id : 'unknown');
  
  const snap = await db.collection("garments").orderBy("updatedAt", "desc").get();
  
  console.log("[Garments GET] Found", snap.docs.length, "garments");

  const garments = snap.docs.map((d) => {
    const r = d.data() as any;
    return {
      id: r.id ?? d.id,
      name: r.name ?? null,
      completionStatus: r.completionStatus,
      photos: Array.isArray(r.photos) ? r.photos : [],
      attributes: r.attributes ?? {},
      intakeSessionId: r.intakeSessionId ?? undefined,
      intakeOrder: typeof r.intakeOrder === "number" ? r.intakeOrder : undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });

  return NextResponse.json({ garments, debug: { count: snap.docs.length, project: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON).project_id : 'unknown' }});
}

export async function POST(request: Request) {
  try {
    await requireFirebaseUser(request);
  } catch (e) {
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const db = getAdminFirestore();
  const ref = db.collection("garments").doc(id);
  const existing = await ref.get();
  const existingCreatedAt = existing.exists ? (existing.data() as any)?.createdAt : null;

  const createdAt =
    typeof existingCreatedAt === "string"
      ? existingCreatedAt
      : maybeIso((payload as any)?.createdAt) ?? nowIso();
  const updatedAt = maybeIso((payload as any)?.updatedAt) ?? nowIso();

  const trimmedName = typeof name === "string" && name.trim() ? name.trim() : null;

  await ref.set(
    {
      id,
      name: trimmedName,
      completionStatus,
      photos,
      attributes,
      intakeSessionId: (payload as any)?.intakeSessionId ?? null,
      intakeOrder: (payload as any)?.intakeOrder ?? null,
      createdAt,
      updatedAt,
    },
    { merge: true },
  );

  return NextResponse.json({
    garment: {
      id,
      name: trimmedName,
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
