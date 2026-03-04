import { NextResponse } from "next/server";
import { ClerkAuthzError, requireStaffOrAdmin } from "@/lib/clerk/auth";
import { clerkClient } from "@/lib/clerk/client";
import type { User } from "@clerk/backend";

export const runtime = "nodejs";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = clerkClient();
  const users = await client.users.getUserList({
    limit: 100,
  });

  const mapped = users.data.map((u: User) => ({
    id: u.id,
    email: u.primaryEmailAddress?.emailAddress || "",
    role: u.publicMetadata?.role ?? "unknown",
    createdAt: u.createdAt,
    lastSignInAt: u.lastSignInAt,
  }));

  return NextResponse.json({ users: mapped });
}

export async function PATCH(request: Request) {
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

  const userId = typeof (payload as any)?.userId === "string" ? (payload as any).userId.trim() : "";
  const role = typeof (payload as any)?.role === "string" ? (payload as any).role.trim() : "";

  if (!userId) return badRequest("Missing userId");
  if (!["admin", "staff"].includes(role)) return badRequest("Invalid role");

  const client = clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: { role },
  });

  return NextResponse.json({ ok: true });
}
