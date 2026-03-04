"use client";

import * as React from "react";

interface Metric {
  label: string;
  value: string | number;
  change?: string;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = React.useState<Metric[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/analytics");
        const data = await res.json();
        setMetrics(data.metrics || []);
      } catch (e) {
        console.error("Failed to load analytics:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Garments, reservations, and activity metrics.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {metrics.length === 0 ? (
            <div className="md:col-span-2 rounded-xl border border-border bg-muted/30 p-4">
              <div className="text-lg font-semibold">Not Implemented Yet</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Analytics will show:
              </div>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Total garments count</li>
                <li>Garments by status (available/reserved)</li>
                <li>Reservations over time</li>
                <li>Photo uploads per week</li>
                <li>Employee schedule coverage</li>
              </ul>
            </div>
          ) : (
            metrics.map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-lg font-semibold">{m.label}</div>
                <div className="mt-2 text-2xl font-bold">{m.value}</div>
                {m.change && (
                  <div className="mt-1 text-sm text-muted-foreground">{m.change}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
