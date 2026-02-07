"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

import {
  COLORS,
  COLOR_TONES,
  COLOR_TONE_IMAGE_MAP,
  ENCLOSURES,
  ERAS,
  FABRIC_TYPES,
  GARMENT_LAYERS,
  GARMENT_POSITIONS,
  GARMENT_TYPE_BUTTONS,
  GARMENT_TYPE_BUTTON_IMAGE_MAP,
  INVENTORY_STATES,
  ITEM_TIERS,
  LAUNDRY_DETAILS,
  PATTERNS,
  POCKETS,
  SPECIAL_FEATURES,
  SIZES,
  TEXTURES,
  VIBES,
} from "@/constants/garment";
import { MultiSelectChips } from "@/components/garments/multi-select-chips";
import { bubbleEffectsForSeed } from "@/lib/bubble-effects";
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
  const [garmentType, setGarmentType] = React.useState<string>("");
  const [state, setState] = React.useState<string>("");
  const [layer, setLayer] = React.useState<string>("");
  const [position, setPosition] = React.useState<any[]>([]);
  const [tier, setTier] = React.useState<string>("");
  const [glitcoinBorrow, setGlitcoinBorrow] = React.useState<string>("");
  const [glitcoinLustLost, setGlitcoinLustLost] = React.useState<string>("");
  const [stories, setStories] = React.useState("");
  const [colors, setColors] = React.useState<any[]>([]);
  const [colorTones, setColorTones] = React.useState<any[]>([]);
  const [pockets, setPockets] = React.useState<any[]>([]);
  const [enclosures, setEnclosures] = React.useState<any[]>([]);
  const [patterns, setPatterns] = React.useState<any[]>([]);
  const [specialFeatures, setSpecialFeatures] = React.useState<any[]>([]);
  const [fabricTypes, setFabricTypes] = React.useState<any[]>([]);
  const [texture, setTexture] = React.useState<any[]>([]);
  const [laundryDetails, setLaundryDetails] = React.useState<any[]>([]);
  const [sizes, setSizes] = React.useState<any[]>([]);
  const [era, setEra] = React.useState<any[]>([]);
  const [vibes, setVibes] = React.useState<any[]>([]);

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
      setGarmentType(typeof (found as any)?.garmentType === "string" ? (found as any).garmentType : "");
      setState(found?.state ?? "Available");
      setLayer(typeof (found as any)?.layer === "string" ? (found as any).layer : "");
      setPosition(Array.isArray((found as any)?.position) ? (found as any).position : typeof (found as any)?.position === "string" ? [(found as any).position] : []);
      setTier(Array.isArray(found?.tier) ? found!.tier.join(", ") : "");
      setGlitcoinBorrow(
        typeof found?.glitcoinBorrow === "number" ? String(found.glitcoinBorrow) : "",
      );
      setGlitcoinLustLost(
        typeof found?.glitcoinLustLost === "number" ? String(found.glitcoinLustLost) : "",
      );
      setStories(found?.stories ?? "");
      setColors(Array.isArray(found?.colors) ? found.colors : []);
      setColorTones(Array.isArray((found as any)?.colorTones) ? (found as any).colorTones : []);
      setPockets(Array.isArray((found as any)?.pockets) ? (found as any).pockets : []);
      setEnclosures(Array.isArray((found as any)?.enclosures) ? (found as any).enclosures : []);
      setPatterns(Array.isArray((found as any)?.patterns) ? (found as any).patterns : []);
      setSpecialFeatures(Array.isArray((found as any)?.specialFeatures) ? (found as any).specialFeatures : []);
      setFabricTypes(Array.isArray((found as any)?.fabricTypes) ? (found as any).fabricTypes : []);
      setTexture(Array.isArray((found as any)?.texture) ? (found as any).texture : []);
      setLaundryDetails(Array.isArray((found as any)?.laundryDetails) ? (found as any).laundryDetails : []);
      setSizes(Array.isArray((found as any)?.fit) ? (found as any).fit : []);
      setEra(Array.isArray((found as any)?.era) ? (found as any).era : []);
      setVibes(Array.isArray((found as any)?.vibes) ? (found as any).vibes : []);
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
      garmentType: garmentType.trim() ? (garmentType as any) : undefined,
      state: state as any,
      layer: layer.trim() ? (layer as any) : undefined,
      position: Array.isArray(position) ? (position as any) : ([] as any),
      tier:
        tier.trim()
          ? (tier
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean) as any)
          : ([] as any),
      glitcoinBorrow: glitcoinBorrow === "" ? undefined : Number(glitcoinBorrow),
      glitcoinLustLost: glitcoinLustLost === "" ? undefined : Number(glitcoinLustLost),
      stories,
      colors: colors as any,
      colorTones: colorTones as any,
      pockets: pockets as any,
      enclosures: enclosures as any,
      patterns: patterns as any,
      specialFeatures: specialFeatures as any,
      fabricTypes: fabricTypes as any,
      texture: texture as any,
      laundryDetails: laundryDetails as any,
      fit: sizes as any,
      era: era as any,
      vibes: vibes as any,
    });

    if (updated) {
      router.push(`/dashboard/garments/${updated.id}`);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!garment) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
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
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div
        className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        style={{
          ['--bubble-rim-color' as any]: "196 80% 55%",
          ['--bubble-bg-1' as any]: "196 95% 96%",
          ['--bubble-bg-2' as any]: "142 90% 96%",
          ['--bubble-bg-1-active' as any]: "196 90% 88%",
          ['--bubble-bg-2-active' as any]: "142 85% 86%",
        }}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Edit garment</h1>
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
            <span className="bubble-mini-header">Garment name</span>
            <div
              className={`bubble-field ${bubbleEffectsForSeed("edit:name")}`}
              style={{ ['--bubble-size' as any]: `${Math.min(220, Math.max(92, 72 + String(name ?? "").length * 6))}px` }}
            >
              <input
                className="bubble-input bubble-autosize"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </label>

          <label className="grid gap-1">
            <span className="bubble-mini-header">Brand</span>
            <div
              className={`bubble-field ${bubbleEffectsForSeed("edit:brand")}`}
              style={{ ['--bubble-size' as any]: `${Math.min(200, Math.max(92, 72 + String(brand ?? "").length * 6))}px` }}
            >
              <input
                className="bubble-input bubble-autosize"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </label>

          <label className="grid gap-1">
            <span className="bubble-mini-header">Garment type</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {GARMENT_TYPE_BUTTONS.map((opt) => {
                const active = garmentType === opt;
                const file = GARMENT_TYPE_BUTTON_IMAGE_MAP[opt];
                const src = `/Garment%20Type%20Buttons/${encodeURIComponent(file)}`;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGarmentType(active ? "" : (opt as any))}
                    data-active={active ? "true" : "false"}
                    className={
                      active
                        ? `vibe-toggle ${bubbleEffectsForSeed(`edit:garmentType:${String(opt)}`)} bg-primary text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2`
                        : `vibe-toggle ${bubbleEffectsForSeed(`edit:garmentType:${String(opt)}`)} bg-card text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2`
                    }
                  >
                    <span className="relative grid h-full w-full place-items-center">
                      <img
                        src={src}
                        alt={String(opt)}
                        loading="lazy"
                        className="vibe-toggle-image"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span
                        className="pointer-events-none absolute px-2 text-center text-[0.75rem] font-semibold leading-tight"
                        style={{ opacity: active ? 0.08 : 0.12 }}
                      >
                        {opt}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </label>

          <label className="grid gap-1">
            <span className="bubble-mini-header">SKU</span>
            <div className="flex gap-2">
              <div
                className={`bubble-field ${bubbleEffectsForSeed("edit:sku")}`}
                style={{ ['--bubble-size' as any]: `${Math.min(280, Math.max(120, 92 + String(sku ?? "").length * 7))}px` }}
              >
                <input
                  className="bubble-input bubble-autosize"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Auto-generated if blank"
                />
              </div>
              <button
                type="button"
                onClick={() => setSku(generateSku())}
                className={`bubble-button ${bubbleEffectsForSeed("edit:sku-generate")}`}
                style={{ ['--bubble-size' as any]: "112px" }}
              >
                Generate
              </button>
            </div>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="bubble-mini-header">Inventory state</span>
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
              <span className="bubble-mini-header">Layer</span>
              <select
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                value={layer}
                onChange={(e) => setLayer(e.target.value)}
              >
                <option value="">—</option>
                {GARMENT_LAYERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="bubble-mini-header">Top / Bottom</span>
              <div className="mt-1">
                <MultiSelectChips
                  label=""
                  categoryKey="position"
                  options={GARMENT_POSITIONS}
                  value={position as any}
                  onChange={(next) => setPosition(next as any)}
                />
              </div>
            </label>

            <label className="grid gap-1">
              <span className="bubble-mini-header">Tier</span>
              <input
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                placeholder="Comma-separated (e.g., Everyday, High Risk)"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="bubble-mini-header">Glitcoin to Borrow (Ġ)</span>
              <div
                className={`bubble-field ${bubbleEffectsForSeed("edit:glitcoin-borrow")}`}
                style={{ ['--bubble-size' as any]: `${Math.min(160, Math.max(92, 72 + String(glitcoinBorrow ?? "").length * 10))}px` }}
              >
                <input
                  inputMode="numeric"
                  className="bubble-input bubble-autosize"
                  value={glitcoinBorrow}
                  onChange={(e) => setGlitcoinBorrow(e.target.value)}
                />
              </div>
            </label>

            <label className="grid gap-1">
              <span className="bubble-mini-header">Glitcoin Lust/Lost (Ġ)</span>
              <div
                className={`bubble-field ${bubbleEffectsForSeed("edit:glitcoin-lustlost")}`}
                style={{ ['--bubble-size' as any]: `${Math.min(160, Math.max(92, 72 + String(glitcoinLustLost ?? "").length * 10))}px` }}
              >
                <input
                  inputMode="numeric"
                  className="bubble-input bubble-autosize"
                  value={glitcoinLustLost}
                  onChange={(e) => setGlitcoinLustLost(e.target.value)}
                />
              </div>
            </label>
          </div>

          <div
            className="grid gap-5"
            style={{
              ['--bubble-rim-color' as any]: "330 85% 66%",
              ['--bubble-bg-1' as any]: "330 90% 96%",
              ['--bubble-bg-2' as any]: "38 95% 96%",
            }}
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Colors"
                categoryKey="colors"
                options={COLORS}
                value={colors}
                onChange={(next) => setColors(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Pockets"
                categoryKey="pockets"
                options={POCKETS}
                value={pockets}
                onChange={(next) => setPockets(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Enclosures"
                categoryKey="enclosures"
                options={ENCLOSURES}
                value={enclosures}
                onChange={(next) => setEnclosures(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Patterns"
                categoryKey="patterns"
                options={PATTERNS}
                value={patterns}
                onChange={(next) => setPatterns(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Special features"
                categoryKey="specialFeatures"
                options={SPECIAL_FEATURES}
                value={specialFeatures}
                onChange={(next) => setSpecialFeatures(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Fabric types"
                categoryKey="fabricTypes"
                options={FABRIC_TYPES}
                value={fabricTypes}
                onChange={(next) => setFabricTypes(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Texture"
                categoryKey="texture"
                options={TEXTURES}
                value={texture}
                onChange={(next) => setTexture(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Laundry details"
                categoryKey="laundryDetails"
                options={LAUNDRY_DETAILS}
                value={laundryDetails}
                onChange={(next) => setLaundryDetails(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Fit/Size"
                categoryKey="fit"
                options={SIZES}
                value={sizes}
                onChange={(next) => setSizes(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Era"
                categoryKey="era"
                options={ERAS}
                value={era}
                onChange={(next) => setEra(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <MultiSelectChips
                label="Vibes"
                categoryKey="vibes"
                options={VIBES}
                value={vibes}
                onChange={(next) => setVibes(next as any)}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-2xl font-bold">
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
                  Color tones
                </span>
              </h3>
              <div className="mt-1 text-sm text-muted-foreground">
                {Array.isArray(colorTones) && colorTones.length ? colorTones.join(", ") : "none"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {COLOR_TONES.map((opt) => {
                  const active = Array.isArray(colorTones) && colorTones.includes(opt as any);
                  const file = (COLOR_TONE_IMAGE_MAP as any)[opt] as string;
                  const src = `/ColorTones/${encodeURIComponent(file)}`;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const prev = Array.isArray(colorTones) ? (colorTones as any[]) : [];
                        const next = active ? prev.filter((x) => x !== opt) : [...prev, opt];
                        setColorTones(next as any);
                      }}
                      data-active={active ? "true" : "false"}
                      className={
                        active
                          ? `vibe-toggle ${bubbleEffectsForSeed(`edit:colorTones:${String(opt)}`)} bg-primary text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2`
                          : `vibe-toggle ${bubbleEffectsForSeed(`edit:colorTones:${String(opt)}`)} bg-card text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2`
                      }
                    >
                      <span className="relative grid h-full w-full place-items-center">
                        <img
                          src={src}
                          alt={String(opt)}
                          loading="lazy"
                          className="vibe-toggle-image"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <span
                          className="pointer-events-none absolute px-2 text-center text-[0.75rem] font-semibold leading-tight"
                          style={{ opacity: active ? 0.08 : 0.12 }}
                        >
                          {opt}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="grid gap-1">
            <span className="bubble-mini-header">Stories</span>
            <div className={`bubble-field ${bubbleEffectsForSeed("edit:stories")}`}>
              <textarea
                className="bubble-textarea"
                value={stories}
                onChange={(e) => setStories(e.target.value)}
              />
            </div>
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
