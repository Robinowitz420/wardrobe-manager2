"use client";

import * as React from "react";

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

export function MultiSelectChips<T extends string>({
  label,
  categoryKey,
  options,
  groups,
  value,
  onChange,
}: Props<T>) {
  const safeValue = React.useMemo(() => (Array.isArray(value) ? (value as T[]) : ([] as T[])), [value]);

  const [customOptions, setCustomOptions] = React.useState<string[]>([]);
  const [addingOther, setAddingOther] = React.useState(false);
  const [otherText, setOtherText] = React.useState("");
  const [savingOther, setSavingOther] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(`/api/options?category=${encodeURIComponent(categoryKey)}`);
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
    for (const o of options as readonly string[]) {
      if (!o) continue;
      const k = o.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(o);
    }
    for (const o of customOptions) {
      if (!o) continue;
      const k = o.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(o);
    }
    return out as T[];
  }, [options, customOptions]);

  const groupedOptions = React.useMemo(() => {
    if (!groups?.length) return null;

    const customSet = new Set(customOptions.map((x) => x.toLowerCase()));

    const groupedLower = new Set<string>();
    const baseGroups: Array<{ label: string; options: T[] }> = groups.map((g) => {
      const groupSet = new Set((g.options as readonly string[]).map((x) => x.toLowerCase()));
      const list = mergedOptions.filter((opt) => groupSet.has(String(opt).toLowerCase()));
      for (const opt of list) groupedLower.add(String(opt).toLowerCase());
      return { label: g.label, options: list };
    });

    const remaining = mergedOptions.filter((opt) => !groupedLower.has(String(opt).toLowerCase()));
    const remainingCustom = remaining.filter((opt) => customSet.has(String(opt).toLowerCase()));
    const remainingUngrouped = remaining.filter((opt) => !customSet.has(String(opt).toLowerCase()));

    const out: Array<{ label: string; options: T[] }> = [...baseGroups].filter((g) => g.options.length);
    if (remainingUngrouped.length) out.push({ label: "Other", options: remainingUngrouped });
    if (remainingCustom.length) out.push({ label: "Custom", options: remainingCustom });

    return out;
  }, [groups, mergedOptions, customOptions]);

  const NOT_APPLICABLE = "Not Applicable" as T;

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
      const res = await fetch("/api/options", {
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
      <div className="text-base font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{safeValue.length ? safeValue.join(", ") : "none"}</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggle(NOT_APPLICABLE)}
          data-active={safeValue.includes(NOT_APPLICABLE) ? "true" : "false"}
          className={
            safeValue.includes(NOT_APPLICABLE)
              ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
              : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2"
          }
        >
          Not Applicable
        </button>

        <button
          type="button"
          onClick={() => setAddingOther((v) => !v)}
          className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2"
        >
          Other…
        </button>
      </div>

      {groupedOptions ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groupedOptions.map((g) => (
            <div key={g.label} className="rounded-xl border border-border bg-background p-3">
              <div className="text-xs font-semibold text-muted-foreground">{g.label}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.options.map((opt) => {
                  const active = safeValue.includes(opt);
                  return (
                    <button
                      key={`${g.label}_${opt}`}
                      type="button"
                      onClick={() => toggle(opt)}
                      data-active={active ? "true" : "false"}
                      className={
                        active
                          ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                          : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2"
                      }
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {mergedOptions.map((opt) => {
            const active = safeValue.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                data-active={active ? "true" : "false"}
                className={
                  active
                    ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                    : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2"
                }
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {addingOther ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Type a new option"
            className="h-9 w-64 rounded-xl border border-border bg-background px-3 text-sm"
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
