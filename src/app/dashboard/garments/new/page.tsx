"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { authFetch } from "@/lib/firebase/auth-fetch";
import {
  CARE_INSTRUCTIONS,
  CARE_INSTRUCTION_GROUPS,
  COLORS,
  COLOR_GROUPS,
  ENCLOSURES,
  ENCLOSURE_GROUPS,
  ERAS,
  ERA_GROUPS,
  FABRICS,
  FABRIC_GROUPS,
  FITS,
  FIT_GROUPS,
  GARMENT_TYPES,
  GARMENT_LAYERS,
  GARMENT_POSITIONS,
  INVENTORY_STATES,
  ITEM_TIERS,
  LENGTHS,
  LENGTH_GROUPS,
  PATTERNS,
  PATTERN_GROUPS,
  POCKETS,
  POCKET_GROUPS,
  SILHOUETTES,
  SILHOUETTE_GROUPS,
  SPECIAL_FEATURES,
  SPECIAL_FEATURE_GROUPS,
  TEXTURES,
  TEXTURE_GROUPS,
  TONES,
  TONE_GROUPS,
  VIBES,
  VIBE_GROUPS,
} from "@/constants/garment";
import { PhotoUploader } from "@/components/garments/photo-uploader";
import { MultiSelectChips } from "@/components/garments/multi-select-chips";
import type { GarmentCreateInput } from "@/lib/validations/garment";
import { garmentCreateInputSchema } from "@/lib/validations/garment";
import { createGarment, fetchGarmentById, generateSku, updateGarment } from "@/lib/storage/garments";
import type { IntakeQueueState } from "@/lib/storage/intake-queue";
import {
  clearIntakeQueue,
  getIntakeQueue,
  setIntakeQueueIndex,
  startIntakeQueue,
  updateIntakeQueueItem,
} from "@/lib/storage/intake-queue";

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
    garmentType: "",
    name: "",
    brand: "",
    dateAdded: nowIso().slice(0, 10),

    layer: undefined,
    position: undefined,

    size: "",
    fit: [],
    specialFitNotes: "",

    fabrics: [],
    care: [],
    careNotes: "",

    vibes: [],
    colors: [],
    tones: [],
    pattern: [],
    texture: [],

    silhouette: [],
    length: [],

    specialFeatures: [],
    enclosures: [],
    pockets: [],

    era: [],
    stories: "",

    reviews: [],

    glitcoinBorrow: undefined,
    glitcoinLustLost: undefined,
    tier: [],

    internalNotes: "",
  };
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
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
    throw new Error("Upload failed");
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
  const [visionSuggesting, setVisionSuggesting] = React.useState(false);

  const [editingSuggestion, setEditingSuggestion] = React.useState<
    | "garmentType"
    | "dominantColor"
    | "pattern"
    | "texture"
    | "silhouette"
    | "length"
    | null
  >(null);

  const [intakeQueue, setIntakeQueue] = React.useState<IntakeQueueState | null>(null);

  const [form, setForm] = React.useState<GarmentCreateInput>(() => blankGarmentForm());

  const isBulk = Boolean(intakeQueue && intakeQueue.items.length > 0);
  const bulkIndex = intakeQueue?.currentIndex ?? 0;
  const bulkTotal = intakeQueue?.items.length ?? 0;
  const currentQueueItem = isBulk ? intakeQueue!.items[bulkIndex] : null;

  React.useEffect(() => {
    const existing = getIntakeQueue();
    if (!existing || existing.items.length === 0) return;
    setIntakeQueue(existing);
    const it = existing.items[Math.max(0, Math.min(existing.currentIndex, existing.items.length - 1))];
    setForm((prev) => ({
      ...prev,
      ...it.formDraft,
      photos: it.photos,
      suggested: (it.formDraft as any).suggested ?? prev.suggested,
    }));
  }, []);

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

  const primaryPhoto = React.useMemo(() => form.photos[0] ?? null, [form.photos]);

  function onClear() {
    setError(null);
    setEditingSuggestion(null);
    setVisionSuggesting(false);

    if (typeof window !== "undefined") {
      clearIntakeQueue();
    }
    setIntakeQueue(null);

    setEditId(null);
    setForm(blankGarmentForm());
    router.replace("/dashboard/garments/new");
  }

  async function beginBulkIntake(files: File[]) {
    setError(null);
    const items: Array<{ photos: any[]; formDraft: Partial<GarmentCreateInput> }> = [];

    const normalizedFiles = await Promise.all(files.map((f) => normalizeImageFile(f)));

    let uploaded: Array<{ src: string; fileName: string }> = [];
    try {
      uploaded = await uploadFilesToDisk(normalizedFiles);
    } catch {
      uploaded = [];
    }

    for (let i = 0; i < normalizedFiles.length; i++) {
      const f = normalizedFiles[i];
      const disk = uploaded[i];
      const photo = disk?.src
        ? { id: newId("p"), src: disk.src, isPrimary: true, fileName: disk.fileName }
        : { id: newId("p"), dataUrl: await fileToDataUrl(f), isPrimary: true, fileName: f.name };
      items.push({
        photos: [photo],
        formDraft: {
          ...form,
          photos: [photo] as any,
          suggested: {},
          completionStatus: "DRAFT",
          name: "Untitled garment",
        },
      });
    }

    const started = startIntakeQueue(items);
    setIntakeQueue(started);

    const it = started.items[0];
    setForm((prev) => ({
      ...prev,
      ...it.formDraft,
      photos: it.photos,
      suggested: (it.formDraft as any).suggested ?? prev.suggested,
    }));
  }

  const hasAnySuggestions = Boolean(
    form.suggested.garmentType ||
      form.suggested.dominantColor ||
      form.suggested.pattern ||
      form.suggested.texture ||
      form.suggested.silhouette ||
      form.suggested.length,
  );

  function applySuggestedDominantColor() {
    const c = form.suggested.dominantColor;
    if (!c) return;
    if (form.colors.includes(c)) return;
    setField("colors", [...form.colors, c] as any);
  }

  function confirmAllSuggestions() {
    setForm((prev) => {
      const next: GarmentCreateInput = { ...prev };

      const addToArray = (arr: string[], v: string | undefined) => {
        if (!v) return arr;
        if (arr.includes(v)) return arr;
        return [...arr, v];
      };

      if (prev.suggested.garmentType && !next.garmentType) {
        next.garmentType = prev.suggested.garmentType as any;
      }

      if (Array.isArray(next.silhouette)) {
        next.silhouette = addToArray(next.silhouette as any, prev.suggested.silhouette) as any;
      }
      if (Array.isArray(next.length)) {
        next.length = addToArray(next.length as any, prev.suggested.length) as any;
      }

      if (Array.isArray(next.pattern)) {
        next.pattern = addToArray(next.pattern as any, prev.suggested.pattern) as any;
      }
      if (Array.isArray(next.texture)) {
        next.texture = addToArray(next.texture as any, prev.suggested.texture) as any;
      }

      if (prev.suggested.dominantColor && Array.isArray(next.colors)) {
        if (!next.colors.includes(prev.suggested.dominantColor)) {
          next.colors = [...next.colors, prev.suggested.dominantColor] as any;
        }
      }

      return next;
    });
  }

  async function runVisionSuggestions() {
    setError(null);

    if (!primaryPhoto) {
      setError("Upload at least one photo.");
      return;
    }

    setVisionSuggesting(true);
    try {
      const res = await authFetch("/api/vision/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          primaryPhoto.src
            ? { src: primaryPhoto.src }
            : { dataUrl: (primaryPhoto.dataUrl ?? "") as any },
        ),
      });

      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        const msg =
          typeof json?.error === "string"
            ? json.error
            : "Vision API request failed. You can continue manually.";
        setError(msg);
        return;
      }

      setForm((prev) => {
        const nextNotes =
          !prev.suggested.notes &&
          Array.isArray(json?.labels) &&
          json.labels.length > 0
            ? json.labels.slice(0, 6).join(", ")
            : prev.suggested.notes;

        const nextSuggested = {
          ...prev.suggested,
          notes: nextNotes,
        } as any;

        if (!nextSuggested.dominantColor && json?.suggested?.dominantColor) {
          nextSuggested.dominantColor = json.suggested.dominantColor;
        }
        if (!nextSuggested.garmentType && json?.suggested?.garmentType) {
          nextSuggested.garmentType = json.suggested.garmentType;
        }
        if (!nextSuggested.pattern && json?.suggested?.pattern) {
          nextSuggested.pattern = json.suggested.pattern;
        }
        if (!nextSuggested.texture && json?.suggested?.texture) {
          nextSuggested.texture = json.suggested.texture;
        }
        if (!nextSuggested.silhouette && json?.suggested?.silhouette) {
          nextSuggested.silhouette = json.suggested.silhouette;
        }
        if (!nextSuggested.length && json?.suggested?.length) {
          nextSuggested.length = json.suggested.length;
        }

        return {
          ...prev,
          suggested: nextSuggested,
        };
      });
    } catch {
      setError("Vision API request failed. You can continue manually.");
    } finally {
      setVisionSuggesting(false);
    }
  }

  function setField<K extends keyof GarmentCreateInput>(
    key: K,
    value: GarmentCreateInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveBulkCurrent(): Promise<void> {
    if (!currentQueueItem) return;

    const nextName = form.name.trim() ? form.name.trim() : "Untitled garment";
    const completionStatus =
      form.photos.length > 0 && nextName !== "Untitled garment" ? "COMPLETE" : "DRAFT";

    const renamedPhotos = await renameUploadedPhotos(nextName, form.photos as any);

    const draft: GarmentCreateInput = {
      ...form,
      completionStatus,
      photos: renamedPhotos as any,
      sku: typeof form.sku === "string" && form.sku.trim() ? form.sku.trim() : undefined,
      garmentType:
        typeof form.garmentType === "string" && form.garmentType.trim()
          ? form.garmentType.trim()
          : undefined,
      name: nextName,
    };

    if (completionStatus === "COMPLETE") {
      const parsed = garmentCreateInputSchema.safeParse(draft);
      if (!parsed.success) {
        setError("Please fill required fields (at minimum: photos + garment name).");
        return;
      }
    }

    let garmentId = currentQueueItem.garmentId;
    if (garmentId) {
      updateGarment(garmentId, draft as any);
    } else {
      const saved = await createGarment(draft);
      garmentId = saved.id;
    }

    const updated = updateIntakeQueueItem(currentQueueItem.queueItemId, {
      garmentId,
      photos: draft.photos,
      formDraft: draft,
    });
    if (updated) setIntakeQueue(updated);
  }

  function saveBulkForUnload(): void {
    if (!currentQueueItem) return;

    const nextName = form.name.trim() ? form.name.trim() : "Untitled garment";
    const completionStatus =
      form.photos.length > 0 && nextName !== "Untitled garment" ? "COMPLETE" : "DRAFT";

    const draft: GarmentCreateInput = {
      ...form,
      completionStatus,
      sku: typeof form.sku === "string" && form.sku.trim() ? form.sku.trim() : undefined,
      garmentType:
        typeof form.garmentType === "string" && form.garmentType.trim()
          ? form.garmentType.trim()
          : undefined,
      name: nextName,
    };

    // beforeunload must be synchronous; we can't reliably await persistence.
    // If no garmentId exists yet, just keep the draft in the queue and create on the next explicit save.
    const garmentId = currentQueueItem.garmentId;
    if (garmentId) updateGarment(garmentId, draft as any);

    updateIntakeQueueItem(currentQueueItem.queueItemId, {
      garmentId: garmentId ?? undefined,
      photos: draft.photos,
      formDraft: draft,
    });
  }

  React.useEffect(() => {
    if (!isBulk || !currentQueueItem) return;
    const handler = () => {
      try {
        saveBulkForUnload();
      } catch {
        // best-effort
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isBulk, currentQueueItem, form]);

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      if (isBulk && currentQueueItem) {
        await saveBulkCurrent();

        const atLast = bulkIndex >= bulkTotal - 1;
        if (atLast) {
          clearIntakeQueue();
          setIntakeQueue(null);
          router.push("/dashboard/garments");
          return;
        }

        const next = setIntakeQueueIndex(bulkIndex + 1);
        if (next) {
          setIntakeQueue(next);
          const it = next.items[next.currentIndex];
          setForm((prev) => ({
            ...prev,
            ...it.formDraft,
            photos: it.photos,
            suggested: (it.formDraft as any).suggested ?? prev.suggested,
          }));
        }
        return;
      }

      const draft: GarmentCreateInput = {
        ...form,
        photos: (await renameUploadedPhotos(form.name.trim(), form.photos as any)) as any,
        sku:
          typeof form.sku === "string" && form.sku.trim()
            ? form.sku.trim()
            : undefined,
        garmentType:
          typeof form.garmentType === "string" && form.garmentType.trim()
            ? form.garmentType.trim()
            : undefined,
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
              Suggestions are optional. You control every field.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/garments")}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-muted"
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
          <PhotoUploader
            value={form.photos}
            onChange={(photos) => setField("photos", photos)}
            onBulkPick={(files) => void beginBulkIntake(files)}
          />

          <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                    Vision-assisted suggestions
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Basic, best-effort signals only (ex: dominant color). Always
                  editable.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runVisionSuggestions()}
                  disabled={visionSuggesting}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-base font-semibold shadow-sm transition hover:bg-muted hover:shadow-md active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {visionSuggesting ? "Analyzing…" : "Vision API"}
                </button>

                <button
                  type="button"
                  onClick={confirmAllSuggestions}
                  disabled={!hasAnySuggestions}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-base font-semibold shadow-sm transition hover:bg-muted hover:shadow-md active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  Confirm all suggestions
                </button>
              </div>
            </div>

            {!form.suggested.garmentType &&
            !form.suggested.dominantColor &&
            !form.suggested.pattern &&
            !form.suggested.texture &&
            !form.suggested.silhouette &&
            !form.suggested.length ? (
              <div className="mt-3 text-sm text-muted-foreground">
                No suggestions found. Add manually if you want.
              </div>
            ) : null}

            <div className="mt-4 grid gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSuggestion("garmentType")}
                  data-active={editingSuggestion === "garmentType" ? "true" : "false"}
                  className={
                    editingSuggestion === "garmentType"
                      ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                      : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/75 shadow-sm hover:bg-muted"
                  }
                >
                  {form.suggested.garmentType
                    ? `${form.suggested.garmentType} ✎`
                    : "Garment Type ✎"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSuggestion("dominantColor")}
                  data-active={editingSuggestion === "dominantColor" ? "true" : "false"}
                  className={
                    editingSuggestion === "dominantColor"
                      ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                      : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/75 shadow-sm hover:bg-muted"
                  }
                >
                  {form.suggested.dominantColor
                    ? `${form.suggested.dominantColor} ✎`
                    : "Dominant Color ✎"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSuggestion("pattern")}
                  data-active={editingSuggestion === "pattern" ? "true" : "false"}
                  className={
                    editingSuggestion === "pattern"
                      ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                      : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/75 shadow-sm hover:bg-muted"
                  }
                >
                  {form.suggested.pattern
                    ? `${form.suggested.pattern} ✎`
                    : "Pattern ✎"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSuggestion("texture")}
                  data-active={editingSuggestion === "texture" ? "true" : "false"}
                  className={
                    editingSuggestion === "texture"
                      ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                      : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/75 shadow-sm hover:bg-muted"
                  }
                >
                  {form.suggested.texture
                    ? `${form.suggested.texture} ✎`
                    : "Texture ✎"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSuggestion("silhouette")}
                  data-active={editingSuggestion === "silhouette" ? "true" : "false"}
                  className={
                    editingSuggestion === "silhouette"
                      ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                      : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/75 shadow-sm hover:bg-muted"
                  }
                >
                  {form.suggested.silhouette
                    ? `${form.suggested.silhouette} ✎`
                    : "Silhouette ✎"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSuggestion("length")}
                  data-active={editingSuggestion === "length" ? "true" : "false"}
                  className={
                    editingSuggestion === "length"
                      ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                      : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/75 shadow-sm hover:bg-muted"
                  }
                >
                  {form.suggested.length
                    ? `${form.suggested.length} ✎`
                    : "Length ✎"}
                </button>
              </div>

              {editingSuggestion ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">Edit</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            suggested: {
                              ...prev.suggested,
                              [editingSuggestion]: undefined,
                            } as any,
                          }))
                        }
                        className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSuggestion(null)}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
                      >
                        Done
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(editingSuggestion === "garmentType"
                      ? GARMENT_TYPES
                      : editingSuggestion === "dominantColor"
                        ? COLORS
                        : editingSuggestion === "pattern"
                          ? PATTERNS
                          : editingSuggestion === "texture"
                            ? TEXTURES
                            : editingSuggestion === "silhouette"
                              ? SILHOUETTES
                              : LENGTHS
                    ).map((opt) => {
                      const active = (form.suggested as any)[editingSuggestion] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              suggested: {
                                ...prev.suggested,
                                [editingSuggestion]: opt,
                              } as any,
                            }))
                          }
                          data-active={active ? "true" : "false"}
                          className={
                            active
                              ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
                              : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/75 shadow-sm hover:bg-muted"
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <h2 className="text-2xl font-bold">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                Core identity
              </span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-lg font-medium">Garment name *</span>
                <input
                  className="h-10 rounded-xl border border-border bg-background px-3 text-base"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g., Midnight velvet coat"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-lg font-medium">Brand</span>
                <input
                  className="h-10 rounded-xl border border-border bg-background px-3 text-base"
                  value={form.brand ?? ""}
                  onChange={(e) => setField("brand", e.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-lg font-medium">SKU</span>
                <div className="flex gap-2">
                  <input
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-base"
                    value={form.sku ?? ""}
                    onChange={(e) => setField("sku", e.target.value as any)}
                    placeholder="Auto-generated if blank"
                  />
                  <button
                    type="button"
                    onClick={() => setField("sku", generateSku() as any)}
                    className="h-10 shrink-0 rounded-xl border border-border bg-background px-3 text-base font-medium hover:bg-muted"
                  >
                    Generate
                  </button>
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-lg font-medium">Layer</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {GARMENT_LAYERS.map((opt) => {
                    const active = form.layer === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setField("layer", (active ? undefined : opt) as any)}
                        className={
                          active
                            ? "rounded-xl border border-rose-300/50 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 shadow-sm"
                            : "rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-lg font-medium">Top / Bottom</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {GARMENT_POSITIONS.map((opt) => {
                    const active = form.position === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setField("position", (active ? undefined : opt) as any)}
                        className={
                          active
                            ? "rounded-xl border border-rose-300/50 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 shadow-sm"
                            : "rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-lg font-medium">Inventory state</span>
                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {INVENTORY_STATES.map((s) => {
                    const active = form.state === s;
                    const badge =
                      s === "Available"
                        ? "border-emerald-300/50 bg-emerald-50 text-emerald-900"
                        : s === "Reserved"
                          ? "border-amber-300/50 bg-amber-50 text-amber-900"
                          : s === "Checked Out"
                            ? "border-rose-300/50 bg-rose-50 text-rose-900"
                            : "border-border bg-muted text-foreground";

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setField("state", s as any)}
                        className={
                          active
                            ? `rounded-xl border px-3 py-2 text-sm font-semibold ${badge}`
                            : "rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="grid gap-1">
                <span className="text-lg font-medium">Item tier</span>
                <div className="mt-1">
                  <MultiSelectChips
                    label=""
                    categoryKey="tier"
                    options={ITEM_TIERS}
                    value={form.tier as any}
                    onChange={(next) => setField("tier", next as any)}
                  />
                </div>
              </label>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-lg font-medium">Size</span>
                <input
                  className="h-10 rounded-xl border border-border bg-background px-3 text-base"
                  value={form.size ?? ""}
                  onChange={(e) => setField("size", e.target.value)}
                  placeholder="e.g., S / 8 / 27"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-lg font-medium">Fit</span>
                <div className="mt-1">
                  <MultiSelectChips
                    label=""
                    categoryKey="fit"
                    options={FITS}
                    groups={FIT_GROUPS as any}
                    value={form.fit as any}
                    onChange={(next) => setField("fit", next as any)}
                  />
                </div>
              </label>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-lg font-medium">Special fit notes</span>
                <textarea
                  className="min-h-[84px] rounded-xl border border-border bg-background px-3 py-2 text-base"
                  value={form.specialFitNotes ?? ""}
                  onChange={(e) => setField("specialFitNotes", e.target.value)}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-5">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-2xl font-bold">
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                    Material & care
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  The system does not guess fabric or care.
                </div>

                {form.fabrics.some(
                  (f) => f === "Leather" || f === "Faux Fur" || f === "Sequins",
                ) ? (
                  <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-900">
                    High-risk material. Care matters.
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-lg font-medium">Care instruction</span>
                    <div className="mt-1">
                      <MultiSelectChips
                        label=""
                        categoryKey="care"
                        options={CARE_INSTRUCTIONS}
                        groups={CARE_INSTRUCTION_GROUPS as any}
                        value={form.care as any}
                        onChange={(next) => setField("care", next as any)}
                      />
                    </div>
                  </label>

                  <label className="grid gap-1 sm:col-span-2">
                    <span className="text-lg font-medium">Care notes</span>
                    <textarea
                      className="min-h-[84px] rounded-xl border border-border bg-background px-3 py-2 text-base"
                      value={form.careNotes ?? ""}
                      onChange={(e) => setField("careNotes", e.target.value)}
                      placeholder="Anything risk-critical you need to remember."
                    />
                  </label>
                </div>

                <div className="mt-5">
                  <MultiSelectChips
                    label="Fabrics"
                    categoryKey="fabrics"
                    options={FABRICS}
                    groups={FABRIC_GROUPS as any}
                    value={form.fabrics as any}
                    onChange={(next) => setField("fabrics", next as any)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Confirmed colors"
                  categoryKey="colors"
                  options={COLORS}
                  groups={COLOR_GROUPS as any}
                  value={form.colors}
                  onChange={(next) => setField("colors", next as any)}
                />
                <div className="mt-1 text-sm text-muted-foreground">Visually dominant colors.</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Vibes"
                  categoryKey="vibes"
                  options={VIBES}
                  groups={VIBE_GROUPS as any}
                  value={form.vibes as any}
                  onChange={(next) => setField("vibes", next as any)}
                />
                <div className="mt-1 text-sm text-muted-foreground">How it feels when worn.</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Tones"
                  categoryKey="tones"
                  options={TONES}
                  groups={TONE_GROUPS as any}
                  value={form.tones as any}
                  onChange={(next) => setField("tones", next as any)}
                />
                <div className="mt-1 text-sm text-muted-foreground">Overall contrast & mood.</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Patterns"
                  categoryKey="pattern"
                  options={PATTERNS}
                  groups={PATTERN_GROUPS as any}
                  value={form.pattern as any}
                  onChange={(next) => setField("pattern", next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Textures"
                  categoryKey="texture"
                  options={TEXTURES}
                  groups={TEXTURE_GROUPS as any}
                  value={form.texture as any}
                  onChange={(next) => setField("texture", next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Silhouettes"
                  categoryKey="silhouette"
                  options={SILHOUETTES}
                  groups={SILHOUETTE_GROUPS as any}
                  value={form.silhouette as any}
                  onChange={(next) => setField("silhouette", next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Lengths"
                  categoryKey="length"
                  options={LENGTHS}
                  groups={LENGTH_GROUPS as any}
                  value={form.length as any}
                  onChange={(next) => setField("length", next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Pockets"
                  categoryKey="pockets"
                  options={POCKETS}
                  groups={POCKET_GROUPS as any}
                  value={form.pockets as any}
                  onChange={(next) => setField("pockets", next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Era"
                  categoryKey="era"
                  options={ERAS}
                  groups={ERA_GROUPS as any}
                  value={form.era as any}
                  onChange={(next) => setField("era", next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Special features"
                  categoryKey="specialFeatures"
                  options={SPECIAL_FEATURES}
                  groups={SPECIAL_FEATURE_GROUPS as any}
                  value={form.specialFeatures as any}
                  onChange={(next) => setField("specialFeatures", next as any)}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <MultiSelectChips
                  label="Enclosures"
                  categoryKey="enclosures"
                  options={ENCLOSURES}
                  groups={ENCLOSURE_GROUPS as any}
                  value={form.enclosures as any}
                  onChange={(next) => setField("enclosures", next as any)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <h2 className="text-2xl font-bold">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                Economics (manual)
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No auto-pricing. You decide.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-lg font-medium">
                  Glitcoin to Borrow (Ġ)
                </span>
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
                <span className="text-lg font-medium">
                  Glitcoin Lust It / Lost It (Ġ)
                </span>
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

          <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <h2 className="text-2xl font-bold">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                Story & notes
              </span>
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="grid gap-1">
                <span className="text-lg font-medium">Stories</span>
                <textarea
                  className="min-h-[120px] rounded-xl border border-border bg-background px-3 py-2 text-base"
                  value={form.stories ?? ""}
                  onChange={(e) => setField("stories", e.target.value)}
                  placeholder="Memories, compliments, warnings, fit notes, etc."
                />
              </label>
              <label className="grid gap-1">
                <span className="text-lg font-medium">Internal notes</span>
                <textarea
                  className="min-h-[100px] rounded-xl border border-border bg-background px-3 py-2 text-base"
                  value={form.internalNotes ?? ""}
                  onChange={(e) => setField("internalNotes", e.target.value)}
                  placeholder="Optional. Private metadata."
                />
              </label>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          {isBulk ? (
            <div className="mr-auto text-xs text-muted-foreground">
              Saved as you go. {bulkIndex + 1} of {bulkTotal}
            </div>
          ) : null}

          {isBulk && bulkIndex > 0 ? (
            <button
              type="button"
              onClick={() =>
                void (async () => {
                  setSaving(true);
                  try {
                    await saveBulkCurrent();
                    const prev = setIntakeQueueIndex(bulkIndex - 1);
                    if (!prev) return;
                    setIntakeQueue(prev);
                    const it = prev.items[prev.currentIndex];
                    setForm((p) => ({
                      ...p,
                      ...it.formDraft,
                      photos: it.photos,
                      suggested: (it.formDraft as any).suggested ?? p.suggested,
                    }));
                  } finally {
                    setSaving(false);
                  }
                })()
              }
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-base font-semibold shadow-sm transition hover:bg-muted hover:shadow-md active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 focus-visible:ring-offset-2"
            >
              Previous
            </button>
          ) : null}

          <button
            type="button"
            onClick={() =>
              void (async () => {
                if (isBulk && currentQueueItem) {
                  setSaving(true);
                  try {
                    await saveBulkCurrent();
                  } finally {
                    setSaving(false);
                  }
                }
                router.push("/dashboard/garments");
              })()
            }
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
