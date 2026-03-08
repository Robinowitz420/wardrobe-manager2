"use client";

import * as React from "react";
import Link from "next/link";

type GarmentListItem = {
  id: string;
  name: string;
  completionStatus?: string;
  photos: Array<{ src?: string; dataUrl?: string; isPrimary?: boolean }>;
  brand?: string;
  state?: string;
  glitcoinBorrow?: number;
  attributes?: any;
};

function stateBadgeClasses(state: string) {
  if (state === "Available") return "border-emerald-300/60 bg-emerald-50 text-emerald-900";
  if (state === "Reserved") return "border-amber-300/60 bg-amber-50 text-amber-900";
  if (state === "Checked Out") return "border-rose-300/60 bg-rose-50 text-rose-900";
  if (state === "In Care") return "border-border bg-muted text-foreground";
  return "border-border bg-muted text-foreground";
}

export default function GarmentsIndexPage() {
  const [items, setItems] = React.useState<GarmentListItem[]>([]);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/garments", { cache: "no-store" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!mounted) return;
        setItems(Array.isArray(data?.garments) ? data.garments : []);
      } catch (e) {
        console.error("Failed to load garments:", e);
        if (!mounted) return;
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleDelete(id: string) {
    if (deletingId) return;
    const ok = window.confirm("Delete this garment? This cannot be undone.");
    if (!ok) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/garments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      const refresh = await fetch("/api/garments", { cache: "no-store" });
      const data = await refresh.json().catch(() => ({}));
      setItems(Array.isArray(data?.garments) ? data.garments : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete garment";
      window.alert(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div />
        <Link
          href="/dashboard/garments/new"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          New garment
        </Link>
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          ← Back to Profile
        </Link>
        <Link
          href="/schedule"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          📅 Schedule
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Loading garments...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            No garments yet. Start with a new intake.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {items.map((g) => {
            const primary = g.photos.find((p) => p.isPrimary) ?? g.photos[0] ?? null;
            const completion = g.completionStatus === "DRAFT" ? "Draft" : "Complete";
            const state = g.state ?? "";
            return (
              <Link
                key={g.id}
                href={`/dashboard/garments/${g.id}`}
                className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/40"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-16 overflow-hidden rounded-xl border border-border bg-muted">
                    {primary ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={primary.src ?? primary.dataUrl} alt={g.name} className="h-full w-full object-contain" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{g.name}</div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {g.brand ? g.brand : "No brand"}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${stateBadgeClasses(state)}`}
                          >
                            {state}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void handleDelete(g.id);
                            }}
                            disabled={deletingId === g.id}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition disabled:opacity-60"
                            title="Delete"
                          >
                            {deletingId === g.id ? "…" : "✕"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{completion}</span>
                      <span>•</span>
                      <span>Borrow: {typeof g.glitcoinBorrow === "number" ? `Ġ${g.glitcoinBorrow}` : "—"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
