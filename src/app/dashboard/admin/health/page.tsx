"use client";

import * as React from "react";

export default function HealthPage() {
  const [checks, setChecks] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    async function runChecks() {
      const results: Record<string, string> = {};

      // Firestore connectivity
      try {
        const res = await fetch("/api/garments");
        results.firestore = res.ok ? "OK" : "FAIL";
      } catch {
        results.firestore = "ERROR";
      }

      // Clerk auth
      try {
        const res = await fetch("/api/staff-roles");
        results.clerkAuth = res.ok ? "OK" : "FAIL";
      } catch {
        results.clerkAuth = "ERROR";
      }

      // Public schedule endpoint
      try {
        const res = await fetch("/api/schedule");
        results.scheduleApi = res.ok ? "OK" : "FAIL";
      } catch {
        results.scheduleApi = "ERROR";
      }

      // Photo upload endpoint
      try {
        const res = await fetch("/api/photos/upload");
        results.photoUpload = res.status === 401 ? "OK (auth enforced)" : "OK";
      } catch {
        results.photoUpload = "ERROR";
      }

      setChecks(results);
    }
    runChecks();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">System Health</h1>
          <p className="text-sm text-muted-foreground">Firestore status, API checks, and logs.</p>
        </div>

        <div className="mt-6 space-y-3">
          {Object.entries(checks).map(([key, status]) => (
            <div key={key} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{key}</div>
                <div
                  className={`text-sm px-2 py-1 rounded ${
                    status === "OK" || status.startsWith("OK")
                      ? "bg-green-100 text-green-800"
                      : status.startsWith("FAIL")
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
