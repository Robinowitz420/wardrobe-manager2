import { NextResponse } from "next/server";

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

  try {
    const saved: Array<{ src: string; fileName: string }> = [];

    const { getStorage } = await import("firebase-admin/storage");
    const bucket = getStorage().bucket();

    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const originalName = typeof file.name === "string" && file.name ? file.name : "upload";
      const ext = extFromFileName(originalName) || ".jpg";
      const id = newId("img");
      const objectPath = `uploads/${id}${ext}`;

      const object = bucket.file(objectPath);
      await object.save(buf, {
        contentType: typeof file.type === "string" && file.type ? file.type : "application/octet-stream",
        resumable: false,
      });

      let src: string;
      try {
        await object.makePublic();
        const encoded = objectPath.split("/").map(encodeURIComponent).join("/");
        src = `https://storage.googleapis.com/${bucket.name}/${encoded}`;
      } catch {
        const [signed] = await object.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
        });
        src = signed;
      }

      saved.push({ src, fileName: originalName });
    }

    return NextResponse.json({ files: saved });
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : "Upload failed";
    const code = typeof e?.code === "string" ? e.code : typeof e?.code === "number" ? String(e.code) : undefined;
    let bucketName: string | undefined;
    try {
      const { getStorage } = await import("firebase-admin/storage");
      bucketName = getStorage().bucket().name;
    } catch {
      bucketName = undefined;
    }
    return NextResponse.json({ error: message, code, bucket: bucketName }, { status: 500 });
  }
}
