"use client";

import * as React from "react";

import { authFetch } from "@/lib/firebase/auth-fetch";
import { bubbleEffectsForSeed } from "@/lib/bubble-effects";

type Props = {
  categoryKey: string;
  addLabel: string;
  value?: string;
  onSelect: (next: string | undefined) => void;
};

/**
 * Renders the staff-added options for a single-select field plus an inline
 * "+ Add" control. Added options persist in the shared custom_options store.
 */
export function CustomOptionChips({ categoryKey, addLabel, value, onSelect }: Props) {
  const [options, setOptions] = React.useState<string[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await authFetch(`/api/options?category=${encodeURIComponent(categoryKey)}`);
        const json = (await res.json().catch(() => null)) as { options?: unknown } | null;
        if (!alive) return;
        setOptions(
          res.ok && Array.isArray(json?.options)
            ? (json.options as unknown[]).filter((x): x is string => typeof x === "string")
            : [],
        );
      } catch {
        if (alive) setOptions([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [categoryKey]);

  async function save() {
    const trimmed = text.trim();
    if (!trimmed) {
      setAdding(false);
      setText("");
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch("/api/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category: categoryKey, value: trimmed }),
      });
      if (!res.ok) return;
      setOptions((prev) =>
        prev.some((x) => x.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed],
      );
      onSelect(trimmed);
      setAdding(false);
      setText("");
    } finally {
      setSaving(false);
    }
  }

  async function remove(opt: string) {
    const ok = window.confirm(`Remove "${opt}"? This removes it for everyone.`);
    if (!ok) return;
    const res = await authFetch(
      `/api/options?category=${encodeURIComponent(categoryKey)}&value=${encodeURIComponent(opt)}`,
      { method: "DELETE" },
    );
    if (!res.ok) return;
    setOptions((prev) => prev.filter((x) => x.toLowerCase() !== opt.toLowerCase()));
    if (value && value.toLowerCase() === opt.toLowerCase()) onSelect(undefined);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <span key={opt} className="relative inline-flex">
            <button
              type="button"
              onClick={() => onSelect(active ? undefined : opt)}
              data-active={active ? "true" : "false"}
              style={{ ['--bubble-size' as string]: `${Math.min(140, Math.max(72, 58 + opt.length * 6))}px` } as React.CSSProperties}
              className={`bubble-toggle bubble-chip ${bubbleEffectsForSeed(`${categoryKey}:${opt}`)} ${
                active ? "bg-primary text-primary-foreground" : "bg-card text-foreground/80"
              } shadow-sm transition hover:opacity-95`}
            >
              {opt}
            </button>
            <button
              type="button"
              title="Remove this option permanently"
              onClick={() => void remove(opt)}
              className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full border border-border bg-card text-xs font-bold text-foreground/70 shadow-sm hover:bg-destructive hover:text-white"
            >
              ×
            </button>
          </span>
        );
      })}

      {adding ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void save();
              }
              if (e.key === "Escape") {
                setAdding(false);
                setText("");
              }
            }}
            placeholder={addLabel}
            className="w-44 bg-transparent px-2 py-1 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setText("");
            }}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full border border-dashed border-border bg-card px-4 py-2 text-sm font-semibold text-foreground/70 shadow-sm transition hover:bg-muted"
        >
          + Add
        </button>
      )}
    </div>
  );
}
