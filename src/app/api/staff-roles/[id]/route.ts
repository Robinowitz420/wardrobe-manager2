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

  if (!name) return badRequest("Missing name");
  if (!emojis) return badRequest("Missing emojis");

  const db = getAdminFirestore();
  const updatedAt = nowIso();
  await db.collection("staff_roles").doc(id).update({
    name,
    emojis,
    updatedAt,
  });

  return NextResponse.json({ staff: { id, name, emojis, updatedAt } });
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
