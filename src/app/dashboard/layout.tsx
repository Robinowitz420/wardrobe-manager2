"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";

import { SAVE_ERROR_EVENT } from "@/lib/storage/garments";
import { isStaffOrAdmin, userRoleLabel } from "@/lib/authz";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [isLoaded, user, router, pathname]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const err = (e as CustomEvent<Error>).detail;
      const message = err?.message ?? "Could not save changes.";
      console.error("Wardrobe save failed:", err);
      setSaveError(message);
    };
    window.addEventListener(SAVE_ERROR_EVENT, handler);
    return () => window.removeEventListener(SAVE_ERROR_EVENT, handler);
  }, []);

  async function onLogout() {
    try {
      await signOut();
    } finally {
      router.replace("/login");
    }
  }

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isStaffOrAdmin(user)) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-lg font-semibold">Not authorized</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Your account does not have staff access. Role: {userRoleLabel(user)}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void onLogout()}
              className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-muted"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isNewGarmentPage = pathname === "/dashboard/garments/new";

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      {!isNewGarmentPage && (
        <div className="mb-4">
          <img src="/herobannere.jpg" alt="Before And Afters' Closet" className="w-full rounded-xl" />
        </div>
      )}
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => void onLogout()}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-muted"
        >
          Log out
        </button>
      </div>
      {saveError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm flex items-start justify-between">
          <div>
            <strong>Save failed:</strong> {saveError}
          </div>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="ml-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
