"use client";

import * as React from "react";

import type { GarmentPhoto } from "@/lib/validations/garment";

type Props = {
  value: GarmentPhoto[];
  onChange: (next: GarmentPhoto[]) => void;
  onBulkPick?: (files: File[]) => void;
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

  const res = await fetch("/api/photos/upload", { method: "POST", body: form });
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok || !json || !Array.isArray(json.files)) {
    throw new Error("Upload failed");
  }

  return json.files
    .map((x: any) => ({ src: x?.src, fileName: x?.fileName }))
    .filter((x: any) => typeof x?.src === "string" && typeof x?.fileName === "string");
}

export function PhotoUploader({ value, onChange, onBulkPick }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function onPickFiles(files: FileList | null) {
    if (!files) return;

    if (onBulkPick && files.length > 1) {
      const normalized = await Promise.all(Array.from(files).map((f) => normalizeImageFile(f)));
      onBulkPick(normalized);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const first = Array.from(files)[0];
    if (!first) return;

    const normalized = await normalizeImageFile(first);

    let next: GarmentPhoto[] = [];
    try {
      const uploaded = await uploadFilesToDisk([normalized]);
      const u = uploaded[0];
      if (u?.src && u?.fileName) {
        next = [{ id: newId(), src: u.src, isPrimary: true, fileName: u.fileName }];
      } else {
        throw new Error("Upload failed");
      }
    } catch {
      const dataUrl = await fileToDataUrl(normalized);
      next = [{ id: newId(), dataUrl, isPrimary: true, fileName: normalized.name }];
    }

    onChange(next);

    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    onChange(value.filter((p) => p.id !== id));
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
          <div className="text-base text-muted-foreground">1 image per item. Select multiple photos to start bulk intake. HEIC/HEIF will be converted to JPEG.</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-border bg-background px-3 py-2 text-base font-medium hover:bg-muted"
          >
            Add photos
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
          {value.map((p) => (
            <div key={p.id} className="space-y-2">
              <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                <img src={p.src ?? p.dataUrl ?? ""} alt="Garment" className="h-full w-full object-contain" />
              </div>
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
      )}

      <div className="text-base text-muted-foreground">
        Note: photos are stored locally on your computer for V1.
      </div>
    </div>
  );
}
