"use client";

import * as React from "react";

import { bubbleEffectsForSeed } from "@/lib/bubble-effects";
import {
  COLOR_SWATCHES,
  PATTERN_BACKGROUNDS,
  PATTERN_BACKGROUND_SIZES,
  PATTERN_LIGHT_TEXT,
  POCKET_BUTTON_IMAGE_MAP,
} from "@/constants/garment";

import { authFetch } from "@/lib/firebase/auth-fetch";

type OptionGroup<T extends string> = {
  label: string;
  options: readonly T[];
};

type Props<T extends string> = {
  label: string;
  categoryKey: string;
  options: readonly T[];
  groups?: readonly OptionGroup<T>[];
  value: T[];
  onChange: (next: T[]) => void;
};

function toKebabCase(s: string): string {
  const t = String(s ?? "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return t;
}

type Hsl = { h: number; s: number; l: number };

function hexToHsl(hex: string): Hsl | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function swatchHexForOption(opt: string): string | null {
  const direct = COLOR_SWATCHES[opt];
  if (direct) return direct;
  const k = opt.toLowerCase();
  for (const [name, hex] of Object.entries(COLOR_SWATCHES)) {
    if (name.toLowerCase() === k) return hex;
  }
  return null;
}

function colorFillVarsForOption(opt: string): { bg1: string; bg2: string; text: string } | null {
  const hex = swatchHexForOption(String(opt));
  if (!hex) return null;
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  const darker = Math.max(0, hsl.l - 8);
  return {
    bg1: `${hsl.h} ${hsl.s}% ${hsl.l}%`,
    bg2: `${hsl.h} ${hsl.s}% ${darker}%`,
    text: hsl.l > 62 ? "0 0% 10%" : "0 0% 100%",
  };
}

function patternStyleForOption(opt: string): React.CSSProperties | undefined {
  const bg = PATTERN_BACKGROUNDS[opt];
  if (!bg) return undefined;
  const size = PATTERN_BACKGROUND_SIZES[opt];
  return {
    backgroundImage: bg,
    ...(size ? { backgroundSize: size } : {}),
    color: PATTERN_LIGHT_TEXT.has(opt) ? "#ffffff" : "#0f172a",
    textShadow: PATTERN_LIGHT_TEXT.has(opt)
      ? "0 1px 2px rgba(0,0,0,.65)"
      : "0 1px 2px rgba(255,255,255,.75)",
  };
}

export function MultiSelectChips<T extends string>({
  label,
  categoryKey,
  options,
  value,
  onChange,
}: Props<T>) {
  const safeValue = React.useMemo(() => (Array.isArray(value) ? (value as T[]) : ([] as T[])), [value]);

  const NOT_APPLICABLE = "Not Applicable" as T;

  const rainbow = categoryKey === "colors" ? " bubble-rainbow" : "";
  const useVibeImages = categoryKey === "vibes";
  const useEraImages = categoryKey === "era";
  const usePocketImages = categoryKey === "pockets";
  const useRectImages = useVibeImages || useEraImages;

  const selectedLower = React.useMemo(() => {
    return new Set(safeValue.map((v) => String(v).toLowerCase()));
  }, [safeValue]);

  const [customOptions, setCustomOptions] = React.useState<string[]>([]);
  const [addingOther, setAddingOther] = React.useState(false);
  const [otherText, setOtherText] = React.useState("");
  const [savingOther, setSavingOther] = React.useState(false);

  React.useEffect(() => {
    const cleaned = safeValue.filter((v) => {
      const k = String(v).toLowerCase();
      return k !== "other" && k !== "unknown";
    });
    if (cleaned.length !== safeValue.length) {
      onChange(cleaned as T[]);
    }
  }, [safeValue, onChange]);

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await authFetch(`/api/options?category=${encodeURIComponent(categoryKey)}`);
        const json = (await res.json().catch(() => null)) as any;
        if (!alive) return;
        if (!res.ok || !json || !Array.isArray(json.options)) {
          setCustomOptions([]);
          return;
        }
        setCustomOptions(json.options.filter((x: any) => typeof x === "string"));
      } catch {
        if (alive) setCustomOptions([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [categoryKey]);

  const mergedOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];

    const candidates: string[] = [
      ...(options as readonly string[]),
      ...customOptions,
      ...safeValue.map((v) => String(v)),
    ];

    for (const o of candidates) {
      if (!o) continue;
      const k = o.toLowerCase();

      if (k === "other" || k === "unknown") continue;
      if (k === String(NOT_APPLICABLE).toLowerCase()) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(o);
    }
    return out as T[];
  }, [options, customOptions, safeValue, selectedLower]);

  function bubbleSizeForLabel(txt: string): React.CSSProperties {
    const t = String(txt ?? "");
    const len = t.length;
    const px = Math.min(140, Math.max(72, 58 + len * 6));
    return { ['--bubble-size' as any]: `${px}px` };
  }

  function toggle(opt: T) {
    if (opt === NOT_APPLICABLE) {
      if (safeValue.includes(NOT_APPLICABLE)) {
        onChange(safeValue.filter((v) => v !== NOT_APPLICABLE));
      } else {
        onChange([NOT_APPLICABLE]);
      }
      return;
    }

    const withoutNa = safeValue.filter((v) => v !== NOT_APPLICABLE);
    if (safeValue.includes(opt)) {
      onChange(withoutNa.filter((v) => v !== opt));
    } else {
      onChange([...withoutNa, opt]);
    }
  }

  async function saveOther() {
    const trimmed = otherText.trim();
    if (!trimmed) {
      setAddingOther(false);
      setOtherText("");
      return;
    }

    setSavingOther(true);
    try {
      const res = await authFetch("/api/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category: categoryKey, value: trimmed }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) return;
      const saved = typeof json?.option?.value === "string" ? json.option.value : trimmed;
      setCustomOptions((prev) => {
        const exists = prev.some((x) => x.toLowerCase() === saved.toLowerCase());
        return exists ? prev : [...prev, saved];
      });
      toggle(saved as T);
      setAddingOther(false);
      setOtherText("");
    } finally {
      setSavingOther(false);
    }
  }

  async function removeCustomOption(opt: string) {
    const ok = window.confirm(`Remove "${opt}" from ${label}? This removes it for everyone.`);
    if (!ok) return;

    const res = await authFetch(
      `/api/options?category=${encodeURIComponent(categoryKey)}&value=${encodeURIComponent(opt)}`,
      { method: "DELETE" },
    );
    if (!res.ok) return;

    setCustomOptions((prev) => prev.filter((x) => x.toLowerCase() !== opt.toLowerCase()));
    onChange(safeValue.filter((v) => String(v).toLowerCase() !== opt.toLowerCase()));
  }

  return (
    <div className="space-y-2">
      {label ? (
        <h3 className="text-2xl font-bold">
          <span className="inline-flex items-center rounded-full border border-border bg-muted px-5 py-2">
            {label}
          </span>
        </h3>
      ) : null}
      <div className="text-sm text-muted-foreground">{safeValue.length ? safeValue.join(", ") : "none"}</div>
      <div className="flex flex-wrap gap-2">
        {mergedOptions.map((opt) => {
          const active = safeValue.includes(opt);
          const fill = categoryKey === "colors" ? colorFillVarsForOption(String(opt)) : null;
          const patternStyle = categoryKey === "patterns" ? patternStyleForOption(String(opt)) : undefined;
          const isCustom = !(options as readonly string[]).some(
            (o) => String(o).toLowerCase() === String(opt).toLowerCase(),
          );
          const pocketImageFile = usePocketImages
            ? (POCKET_BUTTON_IMAGE_MAP as Record<string, string | undefined>)[String(opt)]
            : undefined;
          const useImageTile = useRectImages || Boolean(pocketImageFile);
          const imageSrc = useVibeImages
            ? `/Vibe%20Buttons/${encodeURIComponent(toKebabCase(String(opt)))}.jpg`
            : useEraImages
              ? `/Era%20Buttons/B/${encodeURIComponent(toKebabCase(String(opt)))}.jpg`
              : pocketImageFile
                ? `/PocketsButtons/${encodeURIComponent(pocketImageFile)}`
                : null;
          const style = {
            ...(!useImageTile ? bubbleSizeForLabel(String(opt)) : {}),
            ...(fill
              ? {
                  ['--bubble-bg-1' as any]: fill.bg1,
                  ['--bubble-bg-2' as any]: fill.bg2,
                  ['--bubble-bg-1-active' as any]: fill.bg1,
                  ['--bubble-bg-2-active' as any]: fill.bg2,
                  ['--bubble-text-color' as any]: fill.text,
                  color: `hsl(${fill.text})`,
                }
              : {}),
            ...(patternStyle ?? {}),
            ...(active && (patternStyle || fill)
              ? { outline: "3px solid hsl(var(--ring, 0 0% 10%))", outlineOffset: "2px" }
              : {}),
          } as React.CSSProperties;
          return (
            <span key={opt} className="relative inline-flex">
            <button
              type="button"
              onClick={() => toggle(opt)}
              data-active={active ? "true" : "false"}
              style={style}
              className={
                active
                  ? `${useImageTile ? "vibe-toggle" : `bubble-toggle bubble-chip${rainbow}`} ${bubbleEffectsForSeed(`${categoryKey}:${String(opt)}`)} bg-primary text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2`
                  : `${useImageTile ? "vibe-toggle" : `bubble-toggle bubble-chip${rainbow}`} ${bubbleEffectsForSeed(`${categoryKey}:${String(opt)}`)} bg-card text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2`
              }
            >
              {imageSrc ? (
                <span className="relative grid h-full w-full place-items-center">
                  <img
                    src={imageSrc}
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
              ) : (
                opt
              )}
            </button>
            {isCustom ? (
              <button
                type="button"
                title="Remove this option permanently"
                onClick={(e) => {
                  e.stopPropagation();
                  void removeCustomOption(String(opt));
                }}
                className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full border border-border bg-card text-xs font-bold text-foreground/70 shadow-sm hover:bg-destructive hover:text-white"
              >
                ×
              </button>
            ) : null}
            </span>
          );
        })}

        {addingOther ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1">
            <input
              autoFocus
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void saveOther();
                }
                if (e.key === "Escape") {
                  setAddingOther(false);
                  setOtherText("");
                }
              }}
              placeholder={`New ${label.toLowerCase()} option`}
              className="w-44 bg-transparent px-2 py-1 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => void saveOther()}
              disabled={savingOther}
              className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {savingOther ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingOther(false);
                setOtherText("");
              }}
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAddingOther(true)}
            className="rounded-full border border-dashed border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/70 shadow-sm transition hover:bg-muted"
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );
}
