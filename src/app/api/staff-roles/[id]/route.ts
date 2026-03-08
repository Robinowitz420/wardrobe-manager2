import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { ClerkAuthzError, requireStaffOrAdmin } from "@/lib/clerk/auth";

export const runtime = "nodejs";

function nowIso() {
  return new Date().toISOString();
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const name = typeof (payload as any)?.name === "string" ? (payload as any).name.trim() : "";
  const emojis = typeof (payload as any)?.emojis === "string" ? (payload as any).emojis.trim() : "";
  const referralCode = typeof (payload as any)?.referralCode === "string" ? (payload as any).referralCode.trim().toUpperCase() : undefined;

  if (!name) return badRequest("Missing name");
  if (!emojis) return badRequest("Missing emojis");

  const db = getAdminFirestore();

  // If referral code is being updated, check for duplicates
  if (referralCode) {
    const existingCode = await db.collection("staff_roles")
      .where("referralCode", "==", referralCode)
      .get();
    
    // Check if any doc with this code is not the current one
    const duplicate = existingCode.docs.find(doc => doc.id !== id);
    if (duplicate) {
      return badRequest(`Referral code "${referralCode}" is already in use`);
    }
  }

  const updatedAt = nowIso();
  const updateData: any = {
    name,
    emojis,
    updatedAt,
  };
  
  if (referralCode) {
    updateData.referralCode = referralCode;
  }

  await db.collection("staff_roles").doc(id).update(updateData);

  return NextResponse.json({ staff: { id, name, emojis, referralCode: referralCode || undefined, updatedAt } });
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const db = getAdminFirestore();
  await db.collection("staff_roles").doc(id).delete();

  return NextResponse.json({ ok: true });
}
