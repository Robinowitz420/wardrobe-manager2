"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

import { fetchGarmentById, getGarment } from "@/lib/storage/garments";
import type { Garment } from "@/lib/validations/garment";

const CHANGE_EVENT = "wardrobe_manager_garments_changed";

export default function GarmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [garment, setGarment] = React.useState<Garment | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (error || !garment) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h1 className="text-xl font-semibold">Garment not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ? error : "This record may have been deleted."}
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

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
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
              <img src={primary.src ?? primary.dataUrl} alt={garment.name} className="h-80 w-full object-cover" />
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
                <img src={p.src ?? p.dataUrl} alt={garment.name} className="h-16 w-full object-cover" />
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
            <div className="text-sm font-semibold">Size & fit</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Size:</span> {garment.size ? garment.size : "—"}</div>
              <div><span className="text-muted-foreground">Fit:</span> {garment.fit ? garment.fit : "—"}</div>
              <div><span className="text-muted-foreground">Notes:</span> {garment.specialFitNotes ? garment.specialFitNotes : "—"}</div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold">Material & care</div>
            <div className="mt-3 grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Fabrics:</span> {garment.fabrics?.length ? garment.fabrics.join(", ") : "—"}</div>
              <div><span className="text-muted-foreground">Care:</span> {garment.care ? garment.care : "—"}</div>
              <div><span className="text-muted-foreground">Care notes:</span> {garment.careNotes ? garment.careNotes : "—"}</div>
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
