import { GARMENT_LAYERS, GARMENT_POSITIONS } from "@/constants/garment";
import { authFetch } from "@/lib/firebase/auth-fetch";
import type { Garment, GarmentCreateInput } from "@/lib/validations/garment";

const STORAGE_KEY = "wardrobe_manager_garments_v1";
const CHANGE_EVENT = "wardrobe_manager_garments_changed";

let cache: Garment[] = [];
let bootPromise: Promise<void> | null = null;

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

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

function emitChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function safeLocalGet(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function safeLocalSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
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

  if (next?.tier === "High-Risk") next.tier = "High Risk";

  if (typeof next?.layer === "string" && next.layer.trim()) {
    const v = next.layer.trim();
    next.layer = (GARMENT_LAYERS as readonly string[]).includes(v) ? v : undefined;
  } else {
    next.layer = undefined;
  }

  if (typeof next?.position === "string" && next.position.trim()) {
    const v = next.position.trim();
    next.position = (GARMENT_POSITIONS as readonly string[]).includes(v) ? v : undefined;
  } else {
    next.position = undefined;
  }

  if (typeof next?.tier === "string" && next.tier.trim()) {
    next.tier = [next.tier.trim()];
  } else if (!Array.isArray(next?.tier)) {
    next.tier = [];
  }

  if (typeof next?.fit === "string" && next.fit.trim()) {
    next.fit = [next.fit.trim()];
  } else if (!Array.isArray(next?.fit)) {
    next.fit = [];
  }

  if (typeof next?.care === "string" && next.care.trim()) {
    next.care = [next.care.trim()];
  } else if (!Array.isArray(next?.care)) {
    next.care = [];
  }

  if (typeof next?.pattern === "string" && next.pattern.trim()) {
    next.pattern = [next.pattern.trim()];
  } else if (!Array.isArray(next?.pattern)) {
    next.pattern = [];
  }

  if (typeof next?.texture === "string" && next.texture.trim()) {
    next.texture = [next.texture.trim()];
  } else if (!Array.isArray(next?.texture)) {
    next.texture = [];
  }

  if (typeof next?.silhouette === "string" && next.silhouette.trim()) {
    next.silhouette = [next.silhouette.trim()];
  } else if (!Array.isArray(next?.silhouette)) {
    next.silhouette = [];
  }

  if (typeof next?.length === "string" && next.length.trim()) {
    next.length = [next.length.trim()];
  } else if (!Array.isArray(next?.length)) {
    next.length = [];
  }

  if (typeof next?.pockets === "string" && next.pockets.trim()) {
    next.pockets = [next.pockets.trim()];
  } else if (!Array.isArray(next?.pockets)) {
    next.pockets = [];
  }

  if (typeof next?.era === "string" && next.era.trim()) {
    next.era = [next.era.trim()];
  } else if (!Array.isArray(next?.era)) {
    next.era = [];
  }

  if (typeof next?.specialFeatures === "string" && next.specialFeatures.trim()) {
    next.specialFeatures = [next.specialFeatures.trim()];
  } else if (!Array.isArray(next?.specialFeatures)) {
    next.specialFeatures = [];
  }

  if (typeof next?.enclosures === "string" && next.enclosures.trim()) {
    next.enclosures = [next.enclosures.trim()];
  } else if (!Array.isArray(next?.enclosures)) {
    next.enclosures = [];
  }

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

async function fetchAllFromApi() {
  if (typeof window === "undefined") return;
  try {
    const res = await authFetch("/api/garments", { method: "GET" });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok || !json || !Array.isArray(json.garments)) return;

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

    // Merge instead of clobbering: create can be in-flight (persistCreate is async)
    // and an early fetch would otherwise wipe optimistic cache.
    const byId = new Map<string, Garment>();
    for (const g of next) byId.set(g.id, g);
    for (const local of cache) {
      const existing = byId.get(local.id);
      if (!existing) {
        byId.set(local.id, local);
        continue;
      }
      const localUpdated = typeof (local as any)?.updatedAt === "string" ? (local as any).updatedAt : "";
      const remoteUpdated = typeof (existing as any)?.updatedAt === "string" ? (existing as any).updatedAt : "";
      if (localUpdated && remoteUpdated && localUpdated > remoteUpdated) {
        byId.set(local.id, local);
      }
    }
    const merged = Array.from(byId.values()).sort((a: any, b: any) => {
      const au = typeof a?.updatedAt === "string" ? a.updatedAt : "";
      const bu = typeof b?.updatedAt === "string" ? b.updatedAt : "";
      if (au === bu) return 0;
      return au > bu ? -1 : 1;
    });
    setCache(merged);
  } catch {
    // ignore
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

async function migrateLegacyToSqlite() {
  if (typeof window === "undefined") return;

  const legacyRaw = safeLocalGet(STORAGE_KEY);
  const legacy = safeJsonParse<Garment[]>(legacyRaw) ?? [];
  if (legacy.length === 0) {
    if (legacyRaw) window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  for (const g of legacy) {
    const norm = normalizeLegacyGarment(g);
    try {
      await authFetch("/api/garments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          id: norm.id,
          name: norm.name,
          photos: norm.photos,
          attributes: norm,
          intakeSessionId: norm.intakeSessionId,
          intakeOrder: norm.intakeOrder,
          createdAt: norm.createdAt,
          updatedAt: norm.updatedAt,
        }),
      });
    } catch {
      return;
    }
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

async function ensureBoot() {
  if (typeof window === "undefined") return;
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    await migrateLegacyToSqlite();
    await fetchAllFromApi();
  })();
  return bootPromise;
}

async function persistCreate(garment: Garment) {
  if (typeof window === "undefined") return;
  try {
    const res = await authFetch("/api/garments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        id: garment.id,
        name: garment.name,
        photos: garment.photos,
        attributes: garment,
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
    // Fallback: keep a local copy so a refresh doesn't lose newly created items.
    try {
      safeLocalSet(STORAGE_KEY, JSON.stringify([garment, ...cache]));
    } catch {
      // ignore
    }
    throw e;
  }
}

async function persistUpdate(garment: Garment) {
  if (typeof window === "undefined") return;
  try {
    const res = await authFetch(`/api/garments/${encodeURIComponent(garment.id)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          ...garment,
          photos: garment.photos,
          attributes: garment,
        }),
      },
    );
    if (res.status === 404) {
      await persistCreate(garment);
    }
  } catch {
    // ignore
  }
}

async function persistDelete(id: string) {
  if (typeof window === "undefined") return;
  const res = await authFetch(`/api/garments/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as any;
    throw new Error(typeof json?.error === "string" ? json.error : "Failed to delete garment");
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
  const createdAt = nowIso();
  const sku = typeof input.sku === "string" && input.sku.trim() ? input.sku.trim() : generateSku();
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : "Untitled garment";
  const garment: Garment = {
    ...input,
    name,
    completionStatus: computeCompletionStatus(name, input.photos as any),
    sku,
    id: newId(),
    createdAt,
    updatedAt: createdAt,
  };

  setCache([garment, ...cache]);
  await persistCreate(garment);
  return garment;
}

export function updateGarment(id: string, patch: Partial<Garment>): Garment | null {
  let updated: Garment | null = null;
  const next = cache.map((g) => {
    if (g.id !== id) return g;
    const merged = {
      ...g,
      ...patch,
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
