"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

import { fetchGarmentById, getGarment, updateGarment } from "@/lib/storage/garments";
import type { Garment } from "@/lib/validations/garment";

const CHANGE_EVENT = "wardrobe_manager_garments_changed";

export default function GarmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [garment, setGarment] = React.useState<Garment | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reviewText, setReviewText] = React.useState("");
  const [savingReview, setSavingReview] = React.useState(false);

  function nowIso() {
    return new Date().toISOString();
  }

  function newReviewId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `rev_${crypto.randomUUID()}`;
    }
    return `rev_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  React.useEffect(() => {
    if (!params?.id) return;

    let alive = true;
    setIsLoading(true);
    setError(null);

    const garmentId = Array.isArray(params.id) ? params.id[0] : params.id;
    const fromCache = getGarment(garmentId);
    if (fromCache) {
      setGarment(fromCache);
      setIsLoading(false);
      return;
    }

    void fetchGarmentById(garmentId)
      .then((found) => {
        if (!alive) return;
        if (!found) {
          setError("Garment not found");
          return;
        }
        setGarment(found);
      })
      .catch((err) => {
        console.error("Error loading garment:", err);
        if (alive) setError("Failed to load garment. Please try again.");
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [params?.id]);

  React.useEffect(() => {
    const onChange = () => {
      if (!params?.id) return;
      const garmentId = Array.isArray(params.id) ? params.id[0] : params.id;
      const found = getGarment(garmentId);
      if (found) setGarment(found);
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (error || !garment) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h1 className="text-xl font-semibold">Garment not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ? error : "No garment found."}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/garments")}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to garments
            </button>
            <Link
              href="/dashboard/garments/new"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              New intake
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primary = garment.photos.find((p) => p.isPrimary) ?? garment.photos[0] ?? null;
  const completion = garment.completionStatus === "DRAFT" ? "Draft" : "Complete";
  const completionBadge =
    garment.completionStatus === "DRAFT"
      ? "border-amber-300/60 bg-amber-50 text-amber-900"
      : "border-emerald-300/60 bg-emerald-50 text-emerald-900";

  const reviews = Array.isArray((garment as any).reviews) ? ((garment as any).reviews as any[]) : [];

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{garment.name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {garment.brand ? garment.brand : "No brand"}
          </div>
          {garment.sku ? (
            <div className="mt-1 text-xs text-muted-foreground">SKU: {garment.sku}</div>
          ) : null}
          <div className="mt-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${completionBadge}`}>{completion}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/garments/new?id=${encodeURIComponent(garment.id)}`}
            className="rounded-xl bg-primary px-4 py-2.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-white/80 ring-offset-2 ring-offset-primary transition hover:opacity-95 hover:shadow-primary/30 active:translate-y-px"
          >
            Edit
          </Link>
          <Link
            href="/dashboard/garments"
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to inventory
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-muted">
            {primary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary.src ?? primary.dataUrl} alt={garment.name} className="h-80 w-full object-contain" />
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                No photo
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {garment.photos.slice(0, 4).map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src ?? p.dataUrl} alt={garment.name} className="h-16 w-full object-contain" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Core identity</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {garment.name}</div>
              <div><span className="text-muted-foreground">Brand:</span> {garment.brand ? garment.brand : "—"}</div>
              <div><span className="text-muted-foreground">SKU:</span> {garment.sku ? garment.sku : "—"}</div>
              <div><span className="text-muted-foreground">State:</span> {garment.state}</div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Aesthetic</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Colors:</span> {Array.isArray(garment.colors) && garment.colors.length ? garment.colors.join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Pockets:</span> {Array.isArray((garment as any).pockets) && (garment as any).pockets.length ? (garment as any).pockets.join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Patterns:</span> {Array.isArray((garment as any).patterns) && (garment as any).patterns.length ? (garment as any).patterns.join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Special features:</span> {Array.isArray((garment as any).specialFeatures) && (garment as any).specialFeatures.length ? (garment as any).specialFeatures.join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Fabric types:</span> {Array.isArray((garment as any).fabricTypes) && (garment as any).fabricTypes.length ? (garment as any).fabricTypes.join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Vibes:</span> {Array.isArray((garment as any).vibes) && (garment as any).vibes.length ? (garment as any).vibes.join(", ") : "—"}</div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Size</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Size:</span> {garment.size ? garment.size : "—"}</div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Reviews / Stories</div>

            <div className="mt-3 grid gap-3">
              <textarea
                className="min-h-[92px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Add a note about how it wears, memories, compliments, warnings, etc."
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingReview || !reviewText.trim()}
                  onClick={() => {
                    if (!garment) return;
                    const body = reviewText.trim();
                    if (!body) return;
                    setSavingReview(true);
                    try {
                      const nextEntry = { id: newReviewId(), body, createdAt: nowIso() };
                      const updated = updateGarment(garment.id, {
                        reviews: [...reviews, nextEntry] as any,
                      } as any);
                      if (updated) {
                        setGarment(updated);
                        setReviewText("");
                      }
                    } finally {
                      setSavingReview(false);
                    }
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {savingReview ? "Saving…" : "Add"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {reviews.length ? (
                reviews
                  .slice()
                  .reverse()
                  .map((r: any) => (
                    <div key={String(r?.id ?? Math.random())} className="rounded-xl border border-border bg-background p-3">
                      <div className="text-xs text-muted-foreground">{typeof r?.createdAt === "string" ? r.createdAt : ""}</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm">{typeof r?.body === "string" ? r.body : ""}</div>
                    </div>
                  ))
              ) : (
                <div className="text-sm text-muted-foreground">No reviews yet.</div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Story & notes</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Stories:</span> {garment.stories ? garment.stories : "—"}</div>
              <div><span className="text-muted-foreground">Internal:</span> {garment.internalNotes ? garment.internalNotes : "—"}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
