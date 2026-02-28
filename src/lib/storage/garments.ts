import { authFetch } from "@/lib/firebase/auth-fetch";
import type { Garment, GarmentCreateInput } from "@/lib/validations/garment";

const CHANGE_EVENT = "wardrobe_manager_garments_changed";
export const SAVE_ERROR_EVENT = "wardrobe_manager_save_error";

let cache: Garment[] = [];
let bootPromise: Promise<void> | null = null;

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `g_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function computeCompletionStatus(name: string, photos: Garment["photos"]) {
  const hasPhoto = Array.isArray(photos) && photos.length > 0;
  const n = typeof name === "string" ? name.trim() : "";
  const hasName = Boolean(n) && n !== "Untitled garment";
  return hasPhoto && hasName ? "COMPLETE" : "DRAFT";
}

function normalizePhotosForStorage(photos: any): Garment["photos"] {
  const safe = Array.isArray(photos) ? photos : [];
  const filtered = safe
    .map((p: any) => ({ ...p, dataUrl: undefined }))
    .filter((p: any) => typeof p?.src === "string" && p.src.trim())
    .slice(0, 1);

  if (filtered.length > 0 && !filtered.some((p: any) => p?.isPrimary)) {
    filtered[0] = { ...filtered[0], isPrimary: true };
  }

  return filtered as any;
}

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function yyyymmdd(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function generateSku(): string {
  const suffix = String(Date.now()).slice(-4);
  return `WM-${yyyymmdd()}-${suffix}`;
}

function normalizeLegacyGarment(raw: any): Garment {
  const next = { ...raw } as any;

  if (next?.state === "Late") next.state = "Checked Out";
  if (next?.state === "In Care / Repair") next.state = "In Care";

  if (typeof next?.reviews === "string" && next.reviews.trim()) {
    next.reviews = [
      {
        id: `rev_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
        body: next.reviews.trim(),
        createdAt: nowIso(),
      },
    ];
  } else if (!Array.isArray(next?.reviews)) {
    next.reviews = [];
  }

  if (next?.completionStatus !== "DRAFT" && next?.completionStatus !== "COMPLETE") {
    next.completionStatus = "COMPLETE";
  }

  if ("closetClassification" in next) {
    delete next.closetClassification;
  }

  if (typeof next?.sku === "string" && next.sku.trim() === "") {
    delete next.sku;
  }

  return next as Garment;
}

function setCache(next: Garment[]) {
  cache = next;
  emitChanged();
}

async function fetchAllFromApi(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await authFetch("/api/garments", { method: "GET" });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok || !json || !Array.isArray(json.garments)) return false;

    const next: Garment[] = json.garments
      .map((r: any) => {
        const attrs = r?.attributes && typeof r.attributes === "object" ? r.attributes : {};
        const photos = Array.isArray(r?.photos) ? r.photos : [];
        const name = typeof r?.name === "string" && r.name.trim() ? r.name : "Untitled garment";
        return normalizeLegacyGarment({
          ...attrs,
          id: r.id,
          name,
          completionStatus: r.completionStatus,
          photos,
          intakeSessionId: r.intakeSessionId,
          intakeOrder: r.intakeOrder,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        });
      })
      .filter(Boolean);

    setCache(next);
    return true;
  } catch {
    return false;
  }
}

async function fetchOneFromApi(id: string): Promise<Garment | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await authFetch(`/api/garments/${encodeURIComponent(id)}`, { method: "GET" });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok || !json || !json.garment) return null;
    const g = normalizeLegacyGarment(json.garment);

    const existingIdx = cache.findIndex((x) => x.id === id);
    if (existingIdx >= 0) {
      const next = cache.slice();
      next[existingIdx] = g;
      setCache(next);
    } else {
      setCache([g, ...cache]);
    }

    return g;
  } catch {
    return null;
  }
}

async function ensureBoot() {
  if (typeof window === "undefined") return;
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    await fetchAllFromApi();
  })();
  return bootPromise;
}

async function persistCreate(garment: Garment) {
  if (typeof window === "undefined") return;
  try {
    const photos = normalizePhotosForStorage(garment.photos);
    if (Array.isArray(garment.photos) && garment.photos.length > 0 && photos.length === 0) {
      throw new Error("Photo upload failed. Please retry on a stable connection.");
    }
    const { photos: _ignoredPhotos, ...attributes } = garment as any;

    const res = await authFetch("/api/garments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: garment.id,
        name: garment.name,
        photos,
        attributes,
        intakeSessionId: garment.intakeSessionId,
        intakeOrder: garment.intakeOrder,
        createdAt: garment.createdAt,
        updatedAt: garment.updatedAt,
      }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as any;
      throw new Error(typeof json?.error === "string" ? json.error : "Failed to save garment");
    }
  } catch (e) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SAVE_ERROR_EVENT, { detail: e instanceof Error ? e : new Error(String(e)) }));
    }
    throw e;
  }
}

async function persistUpdate(garment: Garment) {
  if (typeof window === "undefined") return;
  try {
    const photos = normalizePhotosForStorage(garment.photos);
    if (Array.isArray(garment.photos) && garment.photos.length > 0 && photos.length === 0) {
      throw new Error("Photo upload failed. Please retry on a stable connection.");
    }
    const { photos: _ignoredPhotos, ...attributes } = garment as any;

    const res = await authFetch(`/api/garments/${encodeURIComponent(garment.id)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...garment,
          photos,
          attributes,
        }),
      },
    );
    if (res.status === 404) {
      await persistCreate(garment);
      return;
    }
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      const message = typeof json?.error === "string" ? json.error : `Save failed (${res.status})`;
      const err = new Error(message);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(SAVE_ERROR_EVENT, { detail: err }));
      }
      throw err;
    }
  } catch (e) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SAVE_ERROR_EVENT, { detail: e instanceof Error ? e : new Error(String(e)) }));
    }
    // Best-effort resync so the UI doesn't get stuck showing unsaved edits.
    void fetchOneFromApi(garment.id);
    throw e;
  }
}

async function persistDelete(id: string) {
  if (typeof window === "undefined") return;
  try {
    const res = await authFetch(`/api/garments/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.status === 404) {
      // Idempotent delete: already deleted on the server.
      return;
    }
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as any;
      throw new Error(typeof json?.error === "string" ? json.error : "Failed to delete garment");
    }
  } catch (e) {
    throw e;
  }
}

export async function fetchGarmentById(id: string): Promise<Garment | null> {
  await ensureBoot();
  return fetchOneFromApi(id);
}

export function listGarments(): Garment[] {
  if (typeof window === "undefined") return [];
  void ensureBoot();
  return cache;
}

export function getGarment(id: string): Garment | null {
  if (typeof window === "undefined") return null;
  const found = cache.find((g) => g.id === id) ?? null;
  if (!found) {
    void ensureBoot().then(() => fetchOneFromApi(id));
  }
  return found;
}

export async function createGarment(input: GarmentCreateInput): Promise<Garment> {
  await ensureBoot();
  const createdAt = nowIso();
  const sku = typeof input.sku === "string" && input.sku.trim() ? input.sku.trim() : generateSku();
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : "Untitled garment";
  const photos = normalizePhotosForStorage((input as any).photos);
  const garment: Garment = {
    ...input,
    name,
    photos: photos as any,
    completionStatus: computeCompletionStatus(name, photos as any),
    sku,
    id: newId(),
    createdAt,
    updatedAt: createdAt,
  };

  const prev = cache;
  setCache([garment, ...cache]);
  try {
    await persistCreate(garment);
  } catch (e) {
    setCache(prev);
    throw e;
  }
  return garment;
}

export function updateGarment(id: string, patch: Partial<Garment>): Garment | null {
  let updated: Garment | null = null;
  const next = cache.map((g) => {
    if (g.id !== id) return g;
    const nextPhotos = "photos" in patch ? normalizePhotosForStorage((patch as any).photos) : g.photos;
    const merged = {
      ...g,
      ...patch,
      photos: nextPhotos,
      id: g.id,
      createdAt: g.createdAt,
      updatedAt: nowIso(),
    } as Garment;
    merged.completionStatus = computeCompletionStatus(merged.name, merged.photos);
    updated = merged;
    return merged;
  });

  setCache(next);
  if (updated) void persistUpdate(updated);
  return updated;
}

export async function deleteGarment(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  await ensureBoot();

  const prev = cache;
  setCache(cache.filter((g) => g.id !== id));
  try {
    await persistDelete(id);
  } catch (e) {
    setCache(prev);
    throw e;
  }
}
