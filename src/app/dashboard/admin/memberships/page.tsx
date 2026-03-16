"use client";

import * as React from "react";
import Link from "next/link";

type MembershipTier = "Eeeehs" | "Oooohs" | "Aaaaahs" | "Mmmmms";

type UserRow = {
  id: string;
  clerkUserId: string | null;
  email: string;
  name: string;
  displayName: string | null;
  phone: string | null;
  membershipTier: MembershipTier;
  membershipStartDate: string;
  membershipEndDate: string | null;
  maxItemsAllowed: number;
  monthlyFreeGlitcoins: number;
  depositPaid: boolean;
  updatedAt: string;
  createdAt: string;
};

type MemberListRow = {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
  membershipTier: string | null;
  membershipEndDate: string | null;
};

const TIERS: MembershipTier[] = ["Eeeehs", "Oooohs", "Aaaaahs", "Mmmmms"];

function toDateTimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminMembershipsPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<UserRow | null>(null);

  // Track selected profile from sidebar (for clerkUserId when creating new Prisma user)
  const [selectedProfile, setSelectedProfile] = React.useState<MemberListRow | null>(null);

  const [members, setMembers] = React.useState<MemberListRow[]>([]);
  const [membersLoading, setMembersLoading] = React.useState(false);
  const [membersCursor, setMembersCursor] = React.useState<string | null>(null);
  const [hasMoreMembers, setHasMoreMembers] = React.useState(true);

  const [tier, setTier] = React.useState<MembershipTier>("Eeeehs");
  const [start, setStart] = React.useState(() => toDateTimeLocalValue(new Date()));
  const [end, setEnd] = React.useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return toDateTimeLocalValue(d);
  });
  const [note, setNote] = React.useState("");

  const loadMembers = React.useCallback(
    async ({ reset }: { reset: boolean }) => {
      setMembersLoading(true);
      setError(null);
      try {
        if (reset) {
          setMembersCursor(null);
          setHasMoreMembers(true);
        }

        const qs = new URLSearchParams();
        qs.set("limit", "200");
        if (!reset && membersCursor) qs.set("cursor", membersCursor);

        const res = await fetch(`/api/admin/profiles/list?${qs.toString()}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((json as any)?.error || "Failed to load members");
          return;
        }

        const list = Array.isArray((json as any)?.users) ? ((json as any).users as MemberListRow[]) : [];
        const nextCursor = typeof (json as any)?.nextCursor === "string" ? ((json as any).nextCursor as string) : null;

        setMembers((prev) => (reset ? list : [...prev, ...list]));
        setMembersCursor(nextCursor);
        setHasMoreMembers(Boolean(nextCursor));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load members");
      } finally {
        setMembersLoading(false);
      }
    },
    [membersCursor],
  );

  const lookup = async (emailOverride?: string, clerkUserIdOverride?: string) => {
    const effectiveEmail = (emailOverride ?? email).trim();
    const effectiveClerkUserId = (clerkUserIdOverride ?? "").trim();
    if (!effectiveEmail && !effectiveClerkUserId) return;
    setLoading(true);
    setError(null);
    setUser(null);
    try {
      const qs = new URLSearchParams();
      if (effectiveEmail) qs.set("email", effectiveEmail);
      if (effectiveClerkUserId) qs.set("clerkUserId", effectiveClerkUserId);
      const res = await fetch(`/api/admin/memberships?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as any)?.error || "Failed to lookup user");
        return;
      }

      const found = (json as any)?.user as UserRow | null;
      setUser(found);
      if (found) {
        setEmail(found.email);
        setTier(found.membershipTier || "Eeeehs");
        setStart(toDateTimeLocalValue(new Date(found.membershipStartDate)));
        if (found.membershipEndDate) setEnd(toDateTimeLocalValue(new Date(found.membershipEndDate)));
      } else if (selectedProfile) {
        // No Prisma user, but we have a profile - set defaults for new membership
        setTier("Eeeehs");
        setStart(toDateTimeLocalValue(new Date()));
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        setEnd(toDateTimeLocalValue(d));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to lookup user");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadMembers({ reset: true });
  }, [loadMembers]);

  const save = async () => {
    if (!email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          membershipTier: tier,
          membershipStartDate: new Date(start).toISOString(),
          membershipEndDate: new Date(end).toISOString(),
          note,
          // Include clerkUserId and name for creating new Prisma users
          ...(selectedProfile?.clerkUserId ? { clerkUserId: selectedProfile.clerkUserId } : {}),
          ...(selectedProfile?.displayName ? { name: selectedProfile.displayName } : {}),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as any)?.error || "Failed to update membership");
        return;
      }

      setNote("");
      // Reload the profile list to show updated membership
      await loadMembers({ reset: true });
      // Re-lookup this user to refresh the form
      await lookup(email.trim(), selectedProfile?.clerkUserId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update membership");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Membership Overrides (Cash)</h1>
            <p className="text-sm text-muted-foreground">
              Admin-only tool to set membership tier + start/end dates when someone pays cash.
            </p>
          </div>
          <Link
            href="/dashboard/admin"
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[320px,1fr]">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Profiles</div>
              <button
                onClick={() => loadMembers({ reset: true })}
                disabled={membersLoading}
                className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
            <div className="mt-3 max-h-[70vh] overflow-auto rounded-lg border border-border bg-background">
              {members.length === 0 && !membersLoading ? (
                <div className="p-3 text-sm text-muted-foreground">No members found.</div>
              ) : (
                <div className="divide-y divide-border">
                  {members.map((m) => {
                    const label = m.displayName || m.email || m.clerkUserId;
                    const isSelected = user?.email?.toLowerCase() === (m.email || "").toLowerCase();
                    const tierLabel = m.membershipTier || "none";
                    const endDate = m.membershipEndDate ? new Date(m.membershipEndDate) : null;
                    const isExpired = endDate ? endDate < new Date() : true;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          const nextEmail = (m.email || "").trim();
                          setEmail(nextEmail);
                          setSelectedProfile(m);
                          void lookup(nextEmail, m.clerkUserId);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${isSelected ? "bg-muted" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium truncate">{label}</div>
                          <div className={`text-xs font-mono ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>{tierLabel}</div>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground truncate">{m.email || "(no email on profile)"}</div>
                        {endDate ? (
                          <div className={`mt-0.5 text-xs ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
                            {isExpired ? "Expired" : "Renews"}: {endDate.toLocaleDateString()}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                  {membersLoading ? (
                    <div className="p-3 text-sm text-muted-foreground">Loading…</div>
                  ) : null}
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => loadMembers({ reset: false })}
                disabled={!hasMoreMembers || membersLoading}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                {hasMoreMembers ? "Load more" : "End"}
              </button>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="text-xs font-medium text-muted-foreground">Fallback: lookup by email</div>
              <div className="mt-2 grid gap-2 grid-cols-[1fr,120px]">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@email.com"
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                />
                <button
                  onClick={() => void lookup()}
                  disabled={loading || !email.trim()}
                  className="h-10 rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? "Looking…" : "Lookup"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-sm font-medium">Update membership</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {user
                ? `Editing ${user.email} (${user.displayName || user.name})`
                : selectedProfile
                  ? `New membership for ${selectedProfile.displayName || selectedProfile.email || selectedProfile.clerkUserId}`
                  : "Select a profile from the list."}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as MembershipTier)}
                disabled={!user && !selectedProfile}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                disabled={!user && !selectedProfile}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                disabled={!user && !selectedProfile}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50"
              />
            </div>
            </div>

            <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Internal note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!user && !selectedProfile}
              placeholder="Paid cash at door, receipt #..."
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50"
            />
            </div>

            {user ? (
            <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
              <div>
                Current: <span className="font-medium text-foreground">{user.membershipTier}</span>
                {" "}· Items: {user.maxItemsAllowed}
                {" "}· Free Glitcoins: {user.monthlyFreeGlitcoins}
              </div>
              <div className="mt-1 text-xs">Last updated: {new Date(user.updatedAt).toLocaleString()}</div>
            </div>
          ) : selectedProfile ? (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-3 text-sm text-muted-foreground">
              No existing membership. Saving will create a new one.
            </div>
          ) : null}

            <div className="mt-4 flex justify-end">
            <button
              onClick={save}
              disabled={(!user && !selectedProfile) || saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save membership"}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
