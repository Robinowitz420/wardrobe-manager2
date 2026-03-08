import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { ClerkAuthzError, requireStaffOrAdmin } from "@/lib/clerk/auth";

export const runtime = "nodejs";

interface StaffRole {
  id: string;
  name: string;
  emojis: string;
  createdAt: string;
  updatedAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();
  const snap = await db.collection("staff_roles").orderBy("name").get();
  const staff = snap.docs.map(doc => ({
    id: doc.id,
    name: doc.data()?.name || "",
    emojis: doc.data()?.emojis || "",
    createdAt: doc.data()?.createdAt || nowIso(),
    updatedAt: doc.data()?.updatedAt || nowIso(),
  }));
  return NextResponse.json({ staff });
}

export async function POST(request: Request) {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const name = typeof (payload as any)?.name === "string" ? (payload as any).name.trim() : "";
  const emojis = typeof (payload as any)?.emojis === "string" ? (payload as any).emojis.trim() : "";

  if (!name) return badRequest("Missing name");
  if (!emojis) return badRequest("Missing emojis");

  const db = getAdminFirestore();
  const createdAt = nowIso();
  const docRef = await db.collection("staff_roles").add({
    name,
    emojis,
    createdAt,
    updatedAt: createdAt,
  });

  return NextResponse.json({ staff: { id: docRef.id, name, emojis, createdAt, updatedAt: createdAt } });
}
