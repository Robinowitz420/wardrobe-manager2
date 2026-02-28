"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { authFetch } from "@/lib/firebase/auth-fetch";
import {
  COLORS,
  FABRIC_TYPES,
  GARMENT_TYPE_BUTTONS,
  GARMENT_TYPE_BUTTON_IMAGE_MAP,
  GARMENT_TYPES,
  INVENTORY_STATES,
  PATTERNS,
  POCKETS,
  SPECIAL_FEATURES,
  VIBES,
} from "@/constants/garment";
import { PhotoUploader } from "@/components/garments/photo-uploader";
import { MultiSelectChips } from "@/components/garments/multi-select-chips";
import { bubbleEffectsForSeed } from "@/lib/bubble-effects";
import type { GarmentCreateInput } from "@/lib/validations/garment";
import { garmentCreateInputSchema } from "@/lib/validations/garment";
import { createGarment, fetchGarmentById, generateSku, updateGarment } from "@/lib/storage/garments";
import type { GarmentPhoto } from "@/lib/validations/garment";

function nowIso() {
  return new Date().toISOString();
}

function blankGarmentForm(): GarmentCreateInput {
  return {
    state: "Available",
    completionStatus: "COMPLETE",
    photos: [],
    suggested: {},

    sku: "",
    garmentType: undefined,
    name: "",
    brand: "",
    dateAdded: nowIso().slice(0, 10),

    size: "",
    colors: [],

    pockets: [],
    patterns: [],
    specialFeatures: [],
    fabricTypes: [],

    vibes: [],
    stories: "",

    reviews: [],

    glitcoinBorrow: undefined,
    glitcoinLustLost: undefined,

    internalNotes: "",
  };
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function newPhotoId() {
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

async function renameUploadedPhotos(name: string, photos: any[]): Promise<any[]> {
  const clean = name.trim();
  if (!clean || clean === "Untitled garment") return photos;

  const next = photos.slice();
  for (let i = 0; i < next.length; i++) {
    const p = next[i] as any;
    if (!p?.src || typeof p.src !== "string" || !p.src.startsWith("/uploads/")) continue;

    try {
      const res = await authFetch("/api/photos/rename", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ src: p.src, name: clean, index: i }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (res.ok && typeof json?.src === "string") {
        next[i] = { ...p, src: json.src, fileName: clean };
      }
    } catch {
      // best-effort
    }
  }
  return next;
}

export default function NewGarmentPage() {
  const router = useRouter();
  const [editId, setEditId] = React.useState<string | null>(null);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const bulkInputRef = React.useRef<HTMLInputElement | null>(null);
  const [bulkIntaking, setBulkIntaking] = React.useState(false);

  const [form, setForm] = React.useState<GarmentCreateInput>(() => blankGarmentForm());

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const id = sp.get("id");
      setEditId(id);
    } catch {
      setEditId(null);
    }
  }, []);

  React.useEffect(() => {
    if (!editId) return;

    let alive = true;
    void fetchGarmentById(editId).then((found) => {
      if (!alive) return;
      if (!found) return;
      setForm((prev) => ({
        ...prev,
        ...(found as any),
        photos: found.photos,
        suggested: (found as any).suggested ?? prev.suggested,
      }));
    });

    return () => {
      alive = false;
    };
  }, [editId]);

  function onClear() {
    setError(null);

    setEditId(null);
    setForm(blankGarmentForm());
    router.replace("/dashboard/garments/new");
  }

  function setField<K extends keyof GarmentCreateInput>(
    key: K,
    value: GarmentCreateInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onBulkIntake(files: FileList | null) {
    if (!files) return;
    setError(null);
    setBulkIntaking(true);
    try {
      const picked = Array.from(files);
      if (picked.length === 0) return;

      const normalized = await Promise.all(picked.map((f) => normalizeImageFile(f)));
      const uploaded = await uploadFilesToDisk(normalized);
      if (uploaded.length !== normalized.length) throw new Error("Upload failed");

      const createdIds: string[] = [];
      for (let i = 0; i < uploaded.length; i++) {
        const u = uploaded[i];
        if (!u?.src || !u?.fileName) continue;

        const photos: GarmentPhoto[] = [
          {
            id: newPhotoId(),
            src: u.src,
            fileName: u.fileName,
            isPrimary: true,
          },
        ];

        const draft: GarmentCreateInput = {
          ...blankGarmentForm(),
          completionStatus: "DRAFT",
          name: "Untitled garment",
          photos,
          intakeSessionId: undefined,
          intakeOrder: undefined,
        } as any;

        const saved = await createGarment(draft);
        createdIds.push(saved.id);
      }

      router.push("/dashboard/garments");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bulk intake failed";
      setError(msg);
    } finally {
      setBulkIntaking(false);
      if (bulkInputRef.current) bulkInputRef.current.value = "";
    }
  }

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      const draft: GarmentCreateInput = {
        ...form,
        photos: (await renameUploadedPhotos(form.name.trim(), form.photos as any)) as any,
        sku:
          typeof form.sku === "string" && form.sku.trim()
            ? form.sku.trim()
            : undefined,
        garmentType: form.garmentType ?? undefined,
        name: form.name.trim() ? form.name.trim() : "Untitled garment",
      };

      const completionStatus =
        draft.photos.length > 0 && draft.name !== "Untitled garment" ? "COMPLETE" : "DRAFT";
      (draft as any).completionStatus = completionStatus;

      if (completionStatus === "COMPLETE") {
        const parsed = garmentCreateInputSchema.safeParse(draft);
        if (!parsed.success) {
          setError(
            "Please fill required fields (at minimum: photos + garment name).",
          );
          return;
        }
      }

      if (editId) {
        const updated = updateGarment(editId, draft as any);
        router.push(`/dashboard/garments/${updated?.id ?? editId}`);
        return;
      }

      const saved = await createGarment(draft);
      router.push(`/dashboard/garments/${saved.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">New Garment (Intake)</h1>
            <p className="text-base text-muted-foreground">
              Quick, colorful intake.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/garments")}
            className={`bubble-button ${bubbleEffectsForSeed("new:back")}`}
          >
            Back to Closet
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6">
          <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-base font-medium">Bulk photo intake</div>
                <div className="text-base text-muted-foreground">Upload multiple garment photos. We’ll create one new draft listing per photo.</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => bulkInputRef.current?.click()}
                  disabled={bulkIntaking || saving}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-base font-medium hover:bg-muted disabled:opacity-60"
                >
                  {bulkIntaking ? "Creating…" : "Bulk upload"}
                </button>
              </div>
            </div>

            <input
              ref={bulkInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={(e) => void onBulkIntake(e.target.files)}
            />
          </section>

          <PhotoUploader
            value={form.photos}
            onChange={(photos) => setField("photos", photos)}
          />

          <section
            className="rounded-2xl border border-border bg-background p-4 shadow-sm"
            style={{
              ['--bubble-rim-color' as any]: "330 85% 66%",
              ['--bubble-bg-1' as any]: "330 90% 96%",
              ['--bubble-bg-2' as any]: "38 95% 96%",
              ['--bubble-bg-1-active' as any]: "330 90% 88%",
              ['--bubble-bg-2-active' as any]: "38 95% 86%",
            }}
          >
            <h2 className="bubble-section-title font-bold">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                Core identity
              </span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="bubble-mini-header">Garment name *</span>
                <div
                  className={`bubble-field ${bubbleEffectsForSeed("new:name")}`}
                  style={{ ['--bubble-size' as any]: `${Math.min(220, Math.max(92, 72 + String(form.name ?? "").length * 6))}px` }}
                >
                  <input
                    className="bubble-input bubble-autosize"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g., Midnight velvet coat"
                  />
                </div>
              </label>

              <label className="grid gap-1">
                <span className="bubble-mini-header">Brand</span>
                <div
                  className={`bubble-field ${bubbleEffectsForSeed("new:brand")}`}
                  style={{ ['--bubble-size' as any]: `${Math.min(200, Math.max(92, 72 + String(form.brand ?? "").length * 6))}px` }}
                >
                  <input
                    className="bubble-input bubble-autosize"
                    value={form.brand ?? ""}
                    onChange={(e) => setField("brand", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="bubble-mini-header">Garment type</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GARMENT_TYPE_BUTTONS.map((opt) => {
                    const active = form.garmentType === opt;
                    const file = GARMENT_TYPE_BUTTON_IMAGE_MAP[opt];
                    const src = `/Garment%20Type%20Buttons/${encodeURIComponent(file)}`;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setField("garmentType", (active ? undefined : opt) as any)}
                        data-active={active ? "true" : "false"}
                        className={
                          active
                            ? `vibe-toggle ${bubbleEffectsForSeed(`new:garmentType:${String(opt)}`)} bg-primary text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2`
                            : `vibe-toggle ${bubbleEffectsForSeed(`new:garmentType:${String(opt)}`)} bg-card text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2`
                        }
                      >
                        <span className="relative grid h-full w-full place-items-center">
                          <img
                            src={src}
                            alt={String(opt)}
                            loading="lazy"
                            className="vibe-toggle-image"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <span
                            className="pointer-events-none absolute px-2 text-center text-[0.75rem] font-semibold leading-tight"
                            style={{ opacity: active ? 0.08 : 0.12 }}
                          >
                            {opt}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="grid gap-1">
                <span className="bubble-mini-header">SKU</span>
                <div className="flex gap-2">
                  <div
                    className={`bubble-field ${bubbleEffectsForSeed("new:sku")}`}
                    style={{ ['--bubble-size' as any]: `${Math.min(280, Math.max(120, 92 + String(form.sku ?? "").length * 7))}px` }}
                  >
                    <input
                      className="bubble-input bubble-autosize"
                      value={form.sku ?? ""}
                      onChange={(e) => setField("sku", e.target.value as any)}
                      placeholder="Auto-generated if blank"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setField("sku", generateSku() as any)}
                    className={`bubble-button ${bubbleEffectsForSeed("new:sku-generate")}`}
                    style={{ ['--bubble-size' as any]: "112px" }}
                  >
                    Generate
                  </button>
                </div>
              </label>

              <label className="grid gap-1">
                <span className="bubble-mini-header">Inventory state</span>
                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {INVENTORY_STATES.map((s) => {
                    const active = form.state === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setField("state", s as any)}
                        data-active={active ? "true" : "false"}
                        style={{ ['--bubble-size' as any]: `${Math.min(120, Math.max(84, 58 + String(s).length * 6))}px` }}
                        className={
                          active
                            ? `bubble-toggle bubble-chip ${bubbleEffectsForSeed(`new:state:${String(s)}`)} bg-primary text-primary-foreground shadow-sm`
                            : `bubble-toggle bubble-chip ${bubbleEffectsForSeed(`new:state:${String(s)}`)} bg-card text-foreground/80 shadow-sm hover:bg-muted`
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </label>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="bubble-mini-header">Size</span>
                <div
                  className={`bubble-field ${bubbleEffectsForSeed("new:size")}`}
                  style={{ ['--bubble-size' as any]: `${Math.min(200, Math.max(92, 72 + String(form.size ?? "").length * 6))}px` }}
                >
                  <input
                    className="bubble-input bubble-autosize"
                    value={form.size ?? ""}
                    onChange={(e) => setField("size", e.target.value)}
                    placeholder="e.g., S / 8 / 27"
                  />
                </div>
              </label>
            </div>

            <div className="mt-5 grid gap-5">
              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Colors"
                  categoryKey="colors"
                  options={COLORS}
                  value={form.colors}
                  onChange={(next) => setField("colors", next as any)}
                />
                <div className="mt-1 text-sm text-muted-foreground">Visually dominant colors.</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Pockets"
                  categoryKey="pockets"
                  options={POCKETS}
                  value={(form as any).pockets ?? ([] as any)}
                  onChange={(next) => setField("pockets" as any, next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Patterns"
                  categoryKey="patterns"
                  options={PATTERNS}
                  value={(form as any).patterns ?? ([] as any)}
                  onChange={(next) => setField("patterns" as any, next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Special features"
                  categoryKey="specialFeatures"
                  options={SPECIAL_FEATURES}
                  value={(form as any).specialFeatures ?? ([] as any)}
                  onChange={(next) => setField("specialFeatures" as any, next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Fabric types"
                  categoryKey="fabricTypes"
                  options={FABRIC_TYPES}
                  value={(form as any).fabricTypes ?? ([] as any)}
                  onChange={(next) => setField("fabricTypes" as any, next as any)}
                />
              </div>

              <div
                className="rounded-xl border border-border bg-card p-4"
                style={{
                  ['--bubble-rim-color' as any]: "142 70% 40%",
                  ['--bubble-bg-1' as any]: "142 85% 94%",
                  ['--bubble-bg-2' as any]: "166 90% 92%",
                }}
              >
                <MultiSelectChips
                  label="Vibes"
                  categoryKey="vibes"
                  options={VIBES}
                  value={(form as any).vibes ?? ([] as any)}
                  onChange={(next) => setField("vibes" as any, next as any)}
                />
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl border border-border bg-background p-4 shadow-sm"
            style={{
              ['--bubble-rim-color' as any]: "196 80% 55%",
              ['--bubble-bg-1' as any]: "196 95% 96%",
              ['--bubble-bg-2' as any]: "142 90% 96%",
            }}
          >
            <h2 className="bubble-section-title font-bold">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                Economics (manual)
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No auto-pricing. You decide.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="bubble-mini-header">Glitcoin to Borrow (Ġ)</span>
                <input
                  inputMode="numeric"
                  className="h-10 rounded-xl border border-border bg-background px-3 text-base"
                  value={form.glitcoinBorrow ?? ""}
                  onChange={(e) =>
                    setField(
                      "glitcoinBorrow",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                />
              </label>

              <label className="grid gap-1">
                <span className="bubble-mini-header">Glitcoin Lust It / Lost It (Ġ)</span>
                <input
                  inputMode="numeric"
                  className="h-10 rounded-xl border border-border bg-background px-3 text-base"
                  value={form.glitcoinLustLost ?? ""}
                  onChange={(e) =>
                    setField(
                      "glitcoinLustLost",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section
            className="rounded-2xl border border-border bg-background p-4 shadow-sm"
            style={{
              ['--bubble-rim-color' as any]: "268 70% 62%",
              ['--bubble-bg-1' as any]: "268 90% 96%",
              ['--bubble-bg-2' as any]: "330 90% 96%",
            }}
          >
            <h2 className="bubble-section-title font-bold">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                Story & notes
              </span>
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="bubble-mini-header">Stories</span>
                <div
                  className="bubble-field"
                  style={{ ['--bubble-size' as any]: `${Math.min(320, Math.max(160, 120 + String(form.stories ?? "").length * 0.9))}px` }}
                >
                  <textarea
                    className="bubble-textarea"
                    value={form.stories ?? ""}
                    onChange={(e) => setField("stories", e.target.value)}
                  />
                </div>
              </label>

              <label className="grid gap-1">
                <span className="bubble-mini-header">Internal notes</span>
                <div
                  className="bubble-field"
                  style={{ ['--bubble-size' as any]: `${Math.min(320, Math.max(160, 120 + String(form.internalNotes ?? "").length * 0.9))}px` }}
                >
                  <textarea
                    className="bubble-textarea"
                    value={form.internalNotes ?? ""}
                    onChange={(e) => setField("internalNotes", e.target.value)}
                  />
                </div>
              </label>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/dashboard/garments")}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-base font-semibold shadow-sm transition hover:bg-muted hover:shadow-md active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onClear()}
            disabled={saving}
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-base font-semibold shadow-sm transition hover:bg-muted hover:shadow-md active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-white/80 ring-offset-2 ring-offset-primary transition hover:opacity-95 hover:shadow-primary/30 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add to Closet"}
          </button>
        </div>
      </div>
    </div>
  );
}
