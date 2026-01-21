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
    const res = await fetch("/api/garments", { method: "GET" });
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

    setCache(next);
  } catch {
    // ignore
  }
}

async function fetchOneFromApi(id: string): Promise<Garment | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(`/api/garments/${encodeURIComponent(id)}`, { method: "GET" });
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
      await fetch("/api/garments", {
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
    await fetch("/api/garments", {
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
  } catch {
    // ignore
  }
}

async function persistUpdate(garment: Garment) {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch(`/api/garments/${encodeURIComponent(garment.id)}`,
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

export function createGarment(input: GarmentCreateInput): Garment {
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
  void persistCreate(garment);
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
