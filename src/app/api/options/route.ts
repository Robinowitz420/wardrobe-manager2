import { NextResponse } from "next/server";

import { asAuthError, getAdminFirestore, requireFirebaseUser } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function nowIso() {
  return new Date().toISOString();
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

function safeDocId(input: string) {
  return input.replace(/\//g, "_").slice(0, 500);
}

export async function GET(request: Request) {
  try {
    await requireFirebaseUser(request);

    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    const db = getAdminFirestore();
    const col = db.collection("custom_options");

    if (category && category.trim()) {
      const cat = category.trim();
      const catLower = cat.toLowerCase();

      const snap = await col.where("categoryLower", "==", catLower).get();
      const options = snap.docs
        .map((d) => (d.data() as any)?.value)
        .filter((v) => typeof v === "string")
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

      return NextResponse.json({ category: cat, options });
    }

    const snap = await col.get();
    const rows = snap.docs
      .map((d) => d.data() as any)
      .filter((r) => typeof r?.category === "string" && typeof r?.value === "string");

    rows.sort((a, b) => {
      const ac = String(a.category).localeCompare(String(b.category), undefined, { sensitivity: "base" });
      if (ac !== 0) return ac;
      return String(a.value).localeCompare(String(b.value), undefined, { sensitivity: "base" });
    });

    const byCategory: Record<string, string[]> = {};
    for (const r of rows) {
      const cat = r.category as string;
      const val = r.value as string;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(val);
    }

    return NextResponse.json({ options: byCategory });
  } catch (e) {
    console.error("/api/options GET failed", e);
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return serverError(e instanceof Error ? e.message : "Failed to read options");
  }
}

export async function POST(request: Request) {
  try {
    await requireFirebaseUser(request);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Invalid JSON");
    }

    const category = typeof (payload as any)?.category === "string" ? (payload as any).category.trim() : "";
    const valueRaw = typeof (payload as any)?.value === "string" ? (payload as any).value.trim() : "";

    if (!category) return badRequest("Missing category");
    if (!valueRaw) return badRequest("Missing value");

    const db = getAdminFirestore();
    const createdAt = nowIso();

    const id = safeDocId(`${category}__${valueRaw.toLowerCase()}`);
    await db.collection("custom_options").doc(id).set({
      category,
      categoryLower: category.toLowerCase(),
      value: valueRaw,
      valueLower: valueRaw.toLowerCase(),
      createdAt,
    });

    return NextResponse.json({ option: { category, value: valueRaw, createdAt } });
  } catch (e) {
    console.error("/api/options POST failed", e);
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return serverError(e instanceof Error ? e.message : "Failed to save option");
  }
}
