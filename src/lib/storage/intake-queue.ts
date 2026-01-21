import type { GarmentCreateInput, GarmentPhoto } from "@/lib/validations/garment";

const INTAKE_QUEUE_KEY = "wardrobe_manager_intake_queue_v1";

export type IntakeQueueItem = {
  queueItemId: string;
  garmentId?: string;
  photos: GarmentPhoto[];
  formDraft: Partial<GarmentCreateInput>;
  visionStatus: "pending" | "done" | "error";
  lastSavedAt?: string;
};

export type IntakeQueueState = {
  sessionId: string;
  currentIndex: number;
  items: IntakeQueueItem[];
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function getIntakeQueue(): IntakeQueueState | null {
  if (typeof window === "undefined") return null;
  return safeJsonParse<IntakeQueueState>(window.localStorage.getItem(INTAKE_QUEUE_KEY));
}

export function setIntakeQueue(next: IntakeQueueState | null) {
  if (typeof window === "undefined") return;
  if (!next) {
    window.localStorage.removeItem(INTAKE_QUEUE_KEY);
    return;
  }
  window.localStorage.setItem(INTAKE_QUEUE_KEY, JSON.stringify(next));
}

export function startIntakeQueue(
  items: Array<Pick<IntakeQueueItem, "photos" | "formDraft">>,
): IntakeQueueState {
  const sessionId = newId("s");
  const state: IntakeQueueState = {
    sessionId,
    currentIndex: 0,
    items: items.map((it) => ({
      queueItemId: newId("q"),
      garmentId: undefined,
      photos: it.photos,
      formDraft: {
        ...it.formDraft,
        completionStatus: "DRAFT",
        name: typeof it.formDraft.name === "string" && it.formDraft.name.trim() ? it.formDraft.name : "Untitled garment",
      },
      visionStatus: "pending",
      lastSavedAt: nowIso(),
    })),
  };

  setIntakeQueue(state);
  return state;
}

export function updateIntakeQueueItem(
  queueItemId: string,
  patch: Partial<IntakeQueueItem>,
): IntakeQueueState | null {
  const current = getIntakeQueue();
  if (!current) return null;

  const next: IntakeQueueState = {
    ...current,
    items: current.items.map((it) =>
      it.queueItemId === queueItemId
        ? {
            ...it,
            ...patch,
            queueItemId: it.queueItemId,
            lastSavedAt: nowIso(),
          }
        : it,
    ),
  };

  setIntakeQueue(next);
  return next;
}

export function setIntakeQueueIndex(index: number): IntakeQueueState | null {
  const current = getIntakeQueue();
  if (!current) return null;

  const bounded = Math.max(0, Math.min(index, Math.max(0, current.items.length - 1)));
  const next: IntakeQueueState = { ...current, currentIndex: bounded };
  setIntakeQueue(next);
  return next;
}

export function clearIntakeQueue() {
  setIntakeQueue(null);
}
