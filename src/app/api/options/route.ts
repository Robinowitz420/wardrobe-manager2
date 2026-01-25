import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export const runtime = "nodejs";

function nowIso() {
  return new Date().toISOString();
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");

  const db = getDb();

  if (category && category.trim()) {
    const rows = db
      .prepare(
        "SELECT category, value, createdAt FROM custom_options WHERE category = ? ORDER BY value COLLATE NOCASE ASC",
      )
      .all(category.trim()) as Array<any>;

    return NextResponse.json({ category: category.trim(), options: rows.map((r) => r.value) });
  }

  const rows = db
    .prepare("SELECT category, value, createdAt FROM custom_options ORDER BY category COLLATE NOCASE ASC, value COLLATE NOCASE ASC")
    .all() as Array<any>;

  const byCategory: Record<string, string[]> = {};
  for (const r of rows) {
    const cat = typeof r?.category === "string" ? r.category : "";
    const val = typeof r?.value === "string" ? r.value : "";
    if (!cat || !val) continue;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(val);
  }

  return NextResponse.json({ options: byCategory });
}

export async function POST(request: Request) {
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

  const db = getDb();

  db.prepare(
    "INSERT OR IGNORE INTO custom_options (category, value, createdAt) VALUES (?, ?, ?)",
  ).run(category, valueRaw, nowIso());

  const found = db
    .prepare(
      "SELECT category, value, createdAt FROM custom_options WHERE category = ? AND value = ? COLLATE NOCASE LIMIT 1",
    )
    .get(category, valueRaw) as any;

  if (!found) {
    return NextResponse.json({ error: "Failed to save option" }, { status: 500 });
  }

  return NextResponse.json({ option: { category: found.category, value: found.value, createdAt: found.createdAt } });
}
