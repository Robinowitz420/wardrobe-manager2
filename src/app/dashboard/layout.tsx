"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

import { SAVE_ERROR_EVENT } from "@/lib/storage/garments";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    if (!user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [ready, user, router, pathname]);

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
      const auth = getFirebaseAuth();
      await signOut(auth);
    } finally {
      router.replace("/login");
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
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
