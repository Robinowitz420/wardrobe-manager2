import { NextResponse } from "next/server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { asAuthError, requireFirebaseUser } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function extFromFileName(fileName: string): string {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext && ext.length <= 10) return ext;
  return "";
}

export async function POST(request: Request) {
  try {
    await requireFirebaseUser(request);
  } catch (e) {
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const rawFiles = form.getAll("files");
  const files = rawFiles.filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "Missing files" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const saved: Array<{ src: string; fileName: string }> = [];

  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const originalName = typeof file.name === "string" && file.name ? file.name : "upload";
    const ext = extFromFileName(originalName) || ".jpg";
    const id = newId("img");
    const diskName = `${id}${ext}`;

    const abs = path.join(uploadsDir, diskName);
    await writeFile(abs, buf);

    saved.push({ src: `/uploads/${diskName}`, fileName: originalName });
  }

  return NextResponse.json({ files: saved });
}
