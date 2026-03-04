import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { ClerkAuthzError, requireStaffOrAdmin } from "@/lib/clerk/auth";

export const runtime = "nodejs";

interface StaffRole {
  id: string;
  name: string;
  role: string;
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
    role: doc.data()?.role || "",
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
  const role = typeof (payload as any)?.role === "string" ? (payload as any).role.trim() : "";

  if (!name) return badRequest("Missing name");
  if (!role) return badRequest("Missing role");

  const db = getAdminFirestore();
  const createdAt = nowIso();
  const docRef = await db.collection("staff_roles").add({
    name,
    role,
    createdAt,
    updatedAt: createdAt,
  });

  return NextResponse.json({ staff: { id: docRef.id, name, role, createdAt, updatedAt: createdAt } });
}
