import { NextResponse } from "next/server";

import { access, mkdir, rename } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

function safeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const src = (payload as any)?.src as string | undefined;
  const name = (payload as any)?.name as string | undefined;
  const index = (payload as any)?.index as number | undefined;

  if (!src || typeof src !== "string" || !src.startsWith("/uploads/")) {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  }
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const oldFile = src.slice("/uploads/".length);
  const oldAbs = path.join(uploadsDir, oldFile);

  if (!(await exists(oldAbs))) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const parsed = path.parse(oldFile);
  const slug = safeSlug(name) || "garment";
  const idx = Number.isFinite(index) && (index as number) >= 0 ? `-${(index as number) + 1}` : "";
  const suffix = newId("r").slice(0, 10);
  const nextFileName = `${slug}${idx}-${suffix}${parsed.ext || ".jpg"}`;
  const nextAbs = path.join(uploadsDir, nextFileName);

  await rename(oldAbs, nextAbs);

  return NextResponse.json({ src: `/uploads/${nextFileName}` });
}
