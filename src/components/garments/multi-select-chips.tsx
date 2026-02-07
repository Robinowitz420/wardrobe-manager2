"use client";

import * as React from "react";

import { bubbleEffectsForSeed } from "@/lib/bubble-effects";
import { ENCLOSURE_BUTTON_IMAGE_MAP, POCKET_BUTTON_IMAGE_MAP } from "@/constants/garment";

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

function colorTextStyleForOption(categoryKey: string, opt: string): React.CSSProperties | undefined {
  if (categoryKey !== "colors") return undefined;
  const k = opt.toLowerCase();
  if (k === "black") return { color: "#111827" };
  if (k === "white") return { color: "#6b7280" };
  if (k === "gray") return { color: "#6b7280" };
  if (k === "brown") return { color: "#7c4a2d" };
  if (k === "navy") return { color: "#1f3a8a" };
  if (k === "blue") return { color: "#2563eb" };
  if (k === "green") return { color: "#16a34a" };
  if (k === "red") return { color: "#dc2626" };
  if (k === "pink") return { color: "#db2777" };
  if (k === "purple") return { color: "#7c3aed" };
  if (k === "yellow") return { color: "#ca8a04" };
  if (k === "orange") return { color: "#ea580c" };
  if (k === "multicolor") return { color: "#7c3aed" };
  return undefined;
}

function colorFillVarsForOption(opt: string): { bg1: string; bg2: string; text: string } | null {
  const k = String(opt).toLowerCase();
  if (k === "black") return { bg1: "0 0% 10%", bg2: "0 0% 6%", text: "0 0% 100%" };
  if (k === "white") return { bg1: "0 0% 100%", bg2: "0 0% 96%", text: "0 0% 10%" };
  if (k === "gray") return { bg1: "220 10% 80%", bg2: "220 10% 72%", text: "0 0% 10%" };
  if (k === "brown") return { bg1: "22 45% 45%", bg2: "22 45% 38%", text: "0 0% 100%" };
  if (k === "navy") return { bg1: "222 70% 35%", bg2: "222 70% 28%", text: "0 0% 100%" };
  if (k === "blue") return { bg1: "220 85% 58%", bg2: "220 85% 50%", text: "0 0% 100%" };
  if (k === "green") return { bg1: "142 70% 45%", bg2: "142 70% 38%", text: "0 0% 100%" };
  if (k === "red") return { bg1: "0 85% 55%", bg2: "0 85% 47%", text: "0 0% 100%" };
  if (k === "pink") return { bg1: "330 85% 65%", bg2: "330 85% 58%", text: "0 0% 100%" };
  if (k === "purple") return { bg1: "268 80% 62%", bg2: "268 80% 54%", text: "0 0% 100%" };
  if (k === "yellow") return { bg1: "56 95% 60%", bg2: "56 95% 52%", text: "0 0% 10%" };
  if (k === "orange") return { bg1: "24 95% 56%", bg2: "24 95% 48%", text: "0 0% 100%" };
  if (k === "multicolor") return { bg1: "268 80% 62%", bg2: "196 85% 55%", text: "0 0% 100%" };
  return null;
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
  const useEnclosureImages = categoryKey === "enclosures";
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
        <button
          type="button"
          onClick={() => toggle(NOT_APPLICABLE)}
          data-active={safeValue.includes(NOT_APPLICABLE) ? "true" : "false"}
          style={bubbleSizeForLabel("Not Applicable")}
          className={
            safeValue.includes(NOT_APPLICABLE)
              ? `bubble-toggle bubble-chip${rainbow} ${bubbleEffectsForSeed(`${categoryKey}:not-applicable`)} bg-primary text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2`
              : `bubble-toggle bubble-chip${rainbow} ${bubbleEffectsForSeed(`${categoryKey}:not-applicable`)} bg-card text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2`
          }
        >
          Not Applicable
        </button>

        <button
          type="button"
          onClick={() => setAddingOther((v) => !v)}
          style={bubbleSizeForLabel("Other")}
          className={`bubble-toggle bubble-chip${rainbow} ${bubbleEffectsForSeed(`${categoryKey}:other`)} bg-card text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2`}
        >
          Other…
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {mergedOptions.map((opt) => {
          const active = safeValue.includes(opt);
          const fill = categoryKey === "colors" && active ? colorFillVarsForOption(String(opt)) : null;
          const imageSrc = useVibeImages
            ? `/Vibe%20Buttons/${encodeURIComponent(toKebabCase(String(opt)))}.jpg`
            : useEraImages
              ? `/Era%20Buttons/B/${encodeURIComponent(toKebabCase(String(opt)))}.jpg`
              : usePocketImages
                ? `/PocketsButtons/${encodeURIComponent((POCKET_BUTTON_IMAGE_MAP as any)[String(opt)] ?? "")}`
                : useEnclosureImages
                  ? `/EnclosureButtons/${encodeURIComponent((ENCLOSURE_BUTTON_IMAGE_MAP as any)[String(opt)] ?? "")}`
                  : null;
          const style = {
            ...(!(useRectImages || usePocketImages || useEnclosureImages) ? bubbleSizeForLabel(String(opt)) : {}),
            ...(active && fill
              ? {
                  ['--bubble-bg-1' as any]: fill.bg1,
                  ['--bubble-bg-2' as any]: fill.bg2,
                  ['--bubble-bg-1-active' as any]: fill.bg1,
                  ['--bubble-bg-2-active' as any]: fill.bg2,
                  ['--bubble-text-color' as any]: fill.text,
                }
              : {}),
            ...(!active ? colorTextStyleForOption(categoryKey, String(opt)) : undefined),
          } as React.CSSProperties;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              data-active={active ? "true" : "false"}
              style={style}
              className={
                active
                  ? `${useRectImages || usePocketImages || useEnclosureImages ? "vibe-toggle" : `bubble-toggle bubble-chip${rainbow}`} ${bubbleEffectsForSeed(`${categoryKey}:${String(opt)}`)} bg-primary text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2`
                  : `${useRectImages || usePocketImages || useEnclosureImages ? "vibe-toggle" : `bubble-toggle bubble-chip${rainbow}`} ${bubbleEffectsForSeed(`${categoryKey}:${String(opt)}`)} bg-card text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2`
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
          );
        })}
      </div>

      {addingOther ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Type a new option"
            className="h-10 w-72 rounded-xl border border-border bg-background px-3 text-sm"
          />
          <button
            type="button"
            onClick={() => void saveOther()}
            disabled={savingOther}
            className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {savingOther ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingOther(false);
              setOtherText("");
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold shadow-sm hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}
