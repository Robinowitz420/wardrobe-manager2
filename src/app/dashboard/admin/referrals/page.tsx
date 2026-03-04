"use client";

import * as React from "react";

export default function ReferralsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Referral Tracking</h1>
          <p className="text-sm text-muted-foreground">View employee referral stats and member attribution.</p>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
          <div className="text-lg font-semibold">Not Implemented Yet</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Referral tracking has not been implemented yet. This page will show:
          </div>
          <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Employee referral codes and signups</li>
            <li>Attribution from ?ref= links</li>
            <li>Conversion counts and dates</li>
            <li>Reporting by employee and date range</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
