"use client";

import * as React from "react";

type Props<T extends string> = {
  label: string;
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
};

export function MultiSelectChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  React.useEffect(() => {
    console.log("MultiSelectChips mounted:", label);
  }, [label]);

  function toggle(opt: T) {
    console.log("MultiSelectChips toggle:", label, opt);
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-base font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{value.length ? value.join(", ") : "none"}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt);
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
    </div>
  );
}
