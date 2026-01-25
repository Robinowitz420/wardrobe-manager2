"use client";

import * as React from "react";
import Link from "next/link";

import { listGarments } from "@/lib/storage/garments";

const CHANGE_EVENT = "wardrobe_manager_garments_changed";

function stateBadgeClasses(state: string) {
  if (state === "Available") return "border-emerald-300/60 bg-emerald-50 text-emerald-900";
  if (state === "Reserved") return "border-amber-300/60 bg-amber-50 text-amber-900";
  if (state === "Checked Out") return "border-rose-300/60 bg-rose-50 text-rose-900";
  if (state === "In Care") return "border-border bg-muted text-foreground";
  return "border-border bg-muted text-foreground";
}

export default function GarmentsIndexPage() {
  const [items, setItems] = React.useState(() => listGarments());

  React.useEffect(() => {
    setItems(listGarments());

    const onChange = () => setItems(listGarments());
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Garments</h1>
          <p className="text-sm text-muted-foreground">
            Inventory records. Clear state, manual edits, no dead pages.
          </p>
        </div>
        <Link
          href="/dashboard/garments/new"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          New garment
        </Link>
      </div>

      {items.length === 0 ? (
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
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${stateBadgeClasses(g.state)}`}
                      >
                        {g.state}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{completion}</span>
                      <span>•</span>
                      <span>Borrow: {typeof g.glitcoinBorrow === "number" ? `Ġ${g.glitcoinBorrow}` : "—"}</span>
                      <span>•</span>
                      <span>Tier: {Array.isArray(g.tier) && g.tier.length ? g.tier.join(", ") : "—"}</span>
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
