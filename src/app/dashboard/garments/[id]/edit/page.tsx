"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

import { INVENTORY_STATES, ITEM_TIERS } from "@/constants/garment";
import { fetchGarmentById, generateSku, getGarment, updateGarment } from "@/lib/storage/garments";
import type { Garment } from "@/lib/validations/garment";

export default function GarmentEditPage() {
  const router = useRouter();
  const params = useParams();
  const [garment, setGarment] = React.useState<Garment | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [sku, setSku] = React.useState("");
  const [name, setName] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [state, setState] = React.useState<string>("");
  const [tier, setTier] = React.useState<string>("");
  const [glitcoinBorrow, setGlitcoinBorrow] = React.useState<string>("");
  const [glitcoinLustLost, setGlitcoinLustLost] = React.useState<string>("");
  const [stories, setStories] = React.useState("");

  React.useEffect(() => {
    if (!params?.id) return;
    const garmentId = Array.isArray(params.id) ? params.id[0] : params.id;

    let alive = true;
    setIsLoading(true);

    const applyFound = (found: Garment | null) => {
      if (!alive) return;
      setGarment(found);
      setSku(found?.sku ?? "");
      setName(found?.name ?? "");
      setBrand(found?.brand ?? "");
      setState(found?.state ?? "Available");
      setTier(found?.tier ?? "");
      setGlitcoinBorrow(
        typeof found?.glitcoinBorrow === "number" ? String(found.glitcoinBorrow) : "",
      );
      setGlitcoinLustLost(
        typeof found?.glitcoinLustLost === "number" ? String(found.glitcoinLustLost) : "",
      );
      setStories(found?.stories ?? "");
    };

    const cached = getGarment(garmentId);
    if (cached) {
      applyFound(cached);
      setIsLoading(false);
      return;
    }

    void fetchGarmentById(garmentId)
      .then((found) => applyFound(found))
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [params?.id]);

  function save() {
    if (!garment) return;

    const updated = updateGarment(garment.id, {
      sku: sku.trim() ? sku.trim() : undefined,
      name,
      brand,
      state: state as any,
      tier: tier ? (tier as any) : undefined,
      glitcoinBorrow: glitcoinBorrow === "" ? undefined : Number(glitcoinBorrow),
      glitcoinLustLost: glitcoinLustLost === "" ? undefined : Number(glitcoinLustLost),
      stories,
    });

    if (updated) {
      router.push(`/dashboard/garments/${updated.id}`);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!garment) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h1 className="text-xl font-semibold">Garment not found</h1>
          <div className="mt-6">
            <Link
              href="/dashboard/garments"
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back to garments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Edit garment</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manual overrides only. Suggestions don’t auto-apply.
            </p>
          </div>
          <Link
            href={`/dashboard/garments/${garment.id}`}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium">Garment name</span>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium">Brand</span>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium">SKU</span>
            <div className="flex gap-2">
              <input
                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Auto-generated if blank"
              />
              <button
                type="button"
                onClick={() => setSku(generateSku())}
                className="h-10 shrink-0 rounded-xl border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                Generate
              </button>
            </div>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-medium">Inventory state</span>
              <select
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {INVENTORY_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium">Tier</span>
              <select
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
              >
                <option value="">—</option>
                {ITEM_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-medium">Glitcoin to Borrow (Ġ)</span>
              <input
                inputMode="numeric"
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                value={glitcoinBorrow}
                onChange={(e) => setGlitcoinBorrow(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium">Glitcoin Lust/Lost (Ġ)</span>
              <input
                inputMode="numeric"
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                value={glitcoinLustLost}
                onChange={(e) => setGlitcoinLustLost(e.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-medium">Stories</span>
            <textarea
              className="min-h-[140px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={stories}
              onChange={(e) => setStories(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
