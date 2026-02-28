"use client";

import * as React from "react";

import { authFetch } from "@/lib/firebase/auth-fetch";
import { SAVE_ERROR_EVENT } from "@/lib/storage/garments";
import type { GarmentPhoto } from "@/lib/validations/garment";

type Props = {
  value: GarmentPhoto[];
  onChange: (next: GarmentPhoto[]) => void;
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

async function fileToDataUrl(file: File) {
  const reader = new FileReader();
  return await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function isHeicLike(file: File): boolean {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) return true;
  const t = (file.type || "").toLowerCase();
  return t === "image/heic" || t === "image/heif" || t === "image/heic-sequence" || t === "image/heif-sequence";
}

async function normalizeImageFile(file: File): Promise<File> {
  if (!isHeicLike(file)) return file;

  try {
    if (typeof window === "undefined") return file;
    const mod = await import("heic2any");
    const heic2any = mod.default as unknown as (args: any) => Promise<Blob | Blob[]>;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(out) ? out[0] : out;
    const baseName = (file.name || "photo").replace(/\.(heic|heif)$/i, "");
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

async function uploadFilesToDisk(files: File[]): Promise<Array<{ src: string; fileName: string }>> {
  const form = new FormData();
  for (const f of files) form.append("files", f);

  const res = await authFetch("/api/photos/upload", { method: "POST", body: form });
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok || !json || !Array.isArray(json.files)) {
    const base =
      typeof json?.error === "string" ? json.error : `Upload failed (${res.status || "unknown"})`;
    const extraParts: string[] = [];
    if (typeof json?.code === "string" && json.code.trim()) extraParts.push(`code: ${json.code.trim()}`);
    if (typeof json?.bucket === "string" && json.bucket.trim()) extraParts.push(`bucket: ${json.bucket.trim()}`);
    const extra = extraParts.length > 0 ? ` (${extraParts.join(", ")})` : "";
    throw new Error(`${base}${extra}`);
  }

  return json.files
    .map((x: any) => ({ src: x?.src, fileName: x?.fileName }))
    .filter((x: any) => typeof x?.src === "string" && typeof x?.fileName === "string");
}

export function PhotoUploader({ value, onChange }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const MAX_PHOTOS = 1;

  function emitUploadError(err: unknown) {
    if (typeof window === "undefined") return;
    const e = err instanceof Error ? err : new Error(typeof err === "string" ? err : "Upload failed");
    window.dispatchEvent(new CustomEvent(SAVE_ERROR_EVENT, { detail: e }));
  }

  async function onPickFiles(files: FileList | null) {
    if (!files) return;

    const existing = Array.isArray(value) ? value : [];
    const remaining = Math.max(0, MAX_PHOTOS - existing.length);
    if (remaining === 0) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const picked = Array.from(files).slice(0, remaining);
    const normalized = await Promise.all(picked.map((f) => normalizeImageFile(f)));

    let next: GarmentPhoto[] = existing.slice();
    try {
      const uploaded = await uploadFilesToDisk(normalized);
      if (uploaded.length !== normalized.length) throw new Error("Upload failed");

      const incoming: GarmentPhoto[] = uploaded.map((u) => {
        if (!u?.src || !u?.fileName) throw new Error("Upload failed");
        return { id: newId(), src: u.src, isPrimary: false, fileName: u.fileName };
      });

      next = [...next, ...incoming].slice(0, MAX_PHOTOS);

      const hasPrimary = next.some((p) => p.isPrimary);
      if (!hasPrimary && next.length > 0) {
        next[0] = { ...next[0], isPrimary: true };
      }
    } catch (e) {
      emitUploadError(e);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onChange(next);

    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    const next = value.filter((p) => p.id !== id);
    if (next.length > 0 && !next.some((p) => p.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  }

  function setPrimary(id: string) {
    const next = value.map((p) => ({ ...p, isPrimary: p.id === id }));
    onChange(next);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    void onPickFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-base font-medium">Photos</div>
          <div className="text-base text-muted-foreground">1 photo per garment. HEIC/HEIF will be converted to JPEG.</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-border bg-background px-3 py-2 text-base font-medium hover:bg-muted"
          >
            Add photo
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => void onPickFiles(e.target.files)}
      />

      {value.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-xl border border-dashed border-border bg-background p-4 text-base text-muted-foreground"
        >
          Upload garment photos to begin.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {value.map((p) => (
              <div key={p.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPrimary(p.id)}
                  className={
                    p.isPrimary
                      ? "relative flex h-56 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-primary bg-muted"
                      : "relative flex h-56 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
                  }
                >
                  <img src={p.src ?? p.dataUrl ?? ""} alt="Garment" className="h-full w-full object-contain" />
                  {p.isPrimary ? (
                    <div className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                      Primary
                    </div>
                  ) : null}
                </button>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {p.fileName ? (
                      <div className="truncate text-[11px] text-muted-foreground">{p.fileName}</div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
