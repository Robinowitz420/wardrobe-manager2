import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { ClerkAuthzError, requireStaffOrAdmin } from "@/lib/clerk/auth";

export const runtime = "nodejs";

interface StaffRole {
  id: string;
  name: string;
  emojis: string;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

function generateReferralCode(name: string): string {
  // Generate a clean referral code from the name (e.g., "Varuna" -> "VARUNA")
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10);
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
  const db = getAdminFirestore();
  const snap = await db.collection("staff_roles").orderBy("name").get();
  const staff = snap.docs.map(doc => ({
    id: doc.id,
    name: doc.data()?.name || "",
    emojis: doc.data()?.emojis || "",
    referralCode: doc.data()?.referralCode || generateReferralCode(doc.data()?.name || ""),
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
  const customReferralCode = typeof (payload as any)?.referralCode === "string" ? (payload as any).referralCode.trim().toUpperCase() : "";

  if (!name) return badRequest("Missing name");
  if (!emojis) return badRequest("Missing emojis");

  const referralCode = customReferralCode || generateReferralCode(name);

  const db = getAdminFirestore();

  // Check if referral code is already in use by another staff member
  const existingCode = await db.collection("staff_roles").where("referralCode", "==", referralCode).get();
  if (!existingCode.empty) {
    return badRequest(`Referral code "${referralCode}" is already in use`);
  }

  const createdAt = nowIso();
  const docRef = await db.collection("staff_roles").add({
    name,
    emojis,
    referralCode,
    createdAt,
    updatedAt: createdAt,
  });

  return NextResponse.json({ staff: { id: docRef.id, name, emojis, referralCode, createdAt, updatedAt: createdAt } });
}
