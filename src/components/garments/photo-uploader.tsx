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

    if (onBulkPick && files.length > 5) {
      onBulkPick(Array.from(files));
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const existing = value.slice(0, 5);
    const remaining = Math.max(0, 5 - existing.length);
    const toAdd = Array.from(files).slice(0, remaining);

    const added: GarmentPhoto[] = [];
    try {
      const uploaded = await uploadFilesToDisk(toAdd);
      for (const u of uploaded) {
        added.push({ id: newId(), src: u.src, isPrimary: false, fileName: u.fileName });
      }
    } catch {
      for (const f of toAdd) {
        const dataUrl = await fileToDataUrl(f);
        added.push({ id: newId(), dataUrl, isPrimary: false, fileName: f.name });
      }
    }

    const merged = [...existing, ...added];
    const hasPrimary = merged.some((p) => p.isPrimary);
    const next = hasPrimary
      ? merged
      : merged.map((p, idx) => ({ ...p, isPrimary: idx === 0 }));

    onChange(next);

    if (inputRef.current) inputRef.current.value = "";
  }

  function setPrimary(id: string) {
    onChange(value.map((p) => ({ ...p, isPrimary: p.id === id })));
  }

  function remove(id: string) {
    const next = value.filter((p) => p.id !== id);
    const hasPrimary = next.some((p) => p.isPrimary);
    onChange(hasPrimary ? next : next.map((p, idx) => ({ ...p, isPrimary: idx === 0 })));
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
          <div className="text-base text-muted-foreground">1–5 images. Mark one as primary.</div>
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
        accept="image/*"
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {value.map((p) => (
            <div key={p.id} className="space-y-2">
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
                <img src={p.src ?? p.dataUrl ?? ""} alt="Garment" className="h-32 w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="primaryPhoto"
                    checked={p.isPrimary}
                    onChange={() => setPrimary(p.id)}
                  />
                  Primary
                </label>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
              {p.fileName ? (
                <div className="truncate text-[11px] text-muted-foreground">{p.fileName}</div>
              ) : null}
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
