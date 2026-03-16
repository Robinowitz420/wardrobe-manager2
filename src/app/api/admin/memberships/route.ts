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
  const email = (url.searchParams.get("email") || "").trim();
  const clerkUserId = (url.searchParams.get("clerkUserId") || "").trim();
  
  if (!email && !clerkUserId) return badRequest("Missing email or clerkUserId");

  const baseUrl = process.env.BEFORE_AND_AFTERS_BASE_URL || "https://beforeandafters.vercel.app";
  const secret = process.env.BEFORE_AND_AFTERS_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing BEFORE_AND_AFTERS_ADMIN_SECRET" }, { status: 500 });
  }

  const qs = new URLSearchParams();
  if (email) qs.set("email", email);
  if (clerkUserId) qs.set("clerkUserId", clerkUserId);

  const res = await fetch(`${baseUrl}/api/admin/memberships?${qs.toString()}`, {
    method: "GET",
    headers: {
      "x-wardrobe-admin-secret": secret,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  if (!email) return badRequest("Missing email");

  const baseUrl = process.env.BEFORE_AND_AFTERS_BASE_URL || "https://beforeandafters.vercel.app";
  const secret = process.env.BEFORE_AND_AFTERS_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing BEFORE_AND_AFTERS_ADMIN_SECRET" }, { status: 500 });
  }

  const res = await fetch(`${baseUrl}/api/admin/memberships`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-wardrobe-admin-secret": secret,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
