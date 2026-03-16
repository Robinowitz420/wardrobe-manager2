import { NextRequest, NextResponse } from "next/server";

import { ClerkAuthzError, requireAdmin } from "@/lib/clerk/auth";

export const runtime = "nodejs";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") || "";
  const cursor = url.searchParams.get("cursor");

  const baseUrl = process.env.BEFORE_AND_AFTERS_BASE_URL || "https://beforeandafters.vercel.app";
  const secret = process.env.BEFORE_AND_AFTERS_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing BEFORE_AND_AFTERS_ADMIN_SECRET" }, { status: 500 });
  }

  const qs = new URLSearchParams();
  if (limit) qs.set("limit", limit);
  if (cursor) qs.set("cursor", cursor);

  const res = await fetch(`${baseUrl}/api/admin/memberships/list?${qs.toString()}`, {
    method: "GET",
    headers: {
      "x-wardrobe-admin-secret": secret,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error;
    return NextResponse.json({ error: msg || "Failed to list users" }, { status: res.status });
  }

  return NextResponse.json(data, { status: 200 });
}
