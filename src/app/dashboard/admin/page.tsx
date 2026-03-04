"use client";

import * as React from "react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground">Admin tools and reporting.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-lg font-semibold">Referral Tracking</div>
            <div className="mt-1 text-sm text-muted-foreground">View employee referral stats and member attribution.</div>
            <div className="mt-4">
              <Link
                href="/dashboard/admin/referrals"
                className="inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Open Referrals
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-lg font-semibold">System Health</div>
            <div className="mt-1 text-sm text-muted-foreground">Firestore status, API checks, and logs.</div>
            <div className="mt-4">
              <Link
                href="/dashboard/admin/health"
                className="inline-flex rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Open Health
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-lg font-semibold">User Management</div>
            <div className="mt-1 text-sm text-muted-foreground">View and manage Clerk users and roles.</div>
            <div className="mt-4">
              <Link
                href="/dashboard/admin/users"
                className="inline-flex rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Open Users
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="text-lg font-semibold">Analytics</div>
            <div className="mt-1 text-sm text-muted-foreground">Garments, reservations, and activity metrics.</div>
            <div className="mt-4">
              <Link
                href="/dashboard/admin/analytics"
                className="inline-flex rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Open Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
