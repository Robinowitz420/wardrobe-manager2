"use client";

import * as React from "react";

interface ReferralVisit {
  id: string;
  staffId: string;
  staffName: string;
  referralCode: string;
  timestamp: string;
  converted: boolean;
  ip?: string;
  userAgent?: string;
}

interface StaffStats {
  staffId: string;
  staffName: string;
  referralCode: string;
  totalVisits: number;
  conversions: number;
  recentVisits: { timestamp: string; converted: boolean }[];
}

export default function ReferralsPage() {
  const [visits, setVisits] = React.useState<ReferralVisit[]>([]);
  const [stats, setStats] = React.useState<StaffStats[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [days, setDays] = React.useState(30);

  // Load referral data
  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/referrals?days=${days}`);
        const data = await res.json();
        setVisits(data.visits || []);
        setStats(data.stats || []);
      } catch (e) {
        console.error("Failed to load referrals:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

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
          <h1 className="text-xl font-semibold">Referral Tracking</h1>
          <p className="text-sm text-muted-foreground">View employee referral stats and member attribution.</p>
        </div>

        {/* Time range selector */}
        <div className="mt-6 flex items-center gap-4">
          <span className="text-sm font-medium">Time range:</span>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                  days === d
                    ? "bg-black text-white"
                    : "border border-border bg-background hover:bg-muted"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Stats overview */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">
                No referral data yet. Staff can share their custom URLs:
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded">https://wardrobe-manager2.vercel.app/?ref=CODE</code>
              </div>
            </div>
          ) : (
            stats.map((stat) => (
              <div key={stat.staffId} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{stat.staffName}</div>
                  <div className="font-mono text-xs bg-muted px-2 py-1 rounded">{stat.referralCode}</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-background p-2">
                    <div className="text-2xl font-bold">{stat.totalVisits}</div>
                    <div className="text-xs text-muted-foreground">Visits</div>
                  </div>
                  <div className="rounded-lg bg-background p-2">
                    <div className="text-2xl font-bold">{stat.conversions}</div>
                    <div className="text-xs text-muted-foreground">Conversions</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Conversion rate: {stat.totalVisits > 0 ? ((stat.conversions / stat.totalVisits) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent visits table */}
        {visits.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Recent Visits</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Staff</th>
                    <th className="px-3 py-2 text-left font-medium">Code</th>
                    <th className="px-3 py-2 text-left font-medium">Time</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visits.slice(0, 20).map((visit) => (
                    <tr key={visit.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2">{visit.staffName}</td>
                      <td className="px-3 py-2 font-mono text-xs">{visit.referralCode}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(visit.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        {visit.converted ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Converted
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            Visit
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* How to use */}
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
          <h3 className="font-medium">How to use referral links</h3>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Go to <strong>Dashboard → Employee Roles</strong></li>
            <li>Find your name and click <strong>"Copy URL"</strong></li>
            <li>Share your custom link with customers</li>
            <li>Visits and conversions will appear here automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
