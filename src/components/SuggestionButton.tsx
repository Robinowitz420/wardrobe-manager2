import React from 'react';

interface SuggestionButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function SuggestionButton({ isActive, onClick, children }: SuggestionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isActive
          ? "rounded-full border border-destructive bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
          : "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2"
      }
    >
      {children}
    </button>
  );
}
