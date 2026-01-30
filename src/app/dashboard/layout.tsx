"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";

import { SAVE_ERROR_EVENT } from "@/lib/storage/garments";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);

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
      alert(`Could not save: ${message}`);
    };
    window.addEventListener(SAVE_ERROR_EVENT, handler);
    return () => window.removeEventListener(SAVE_ERROR_EVENT, handler);
  }, []);

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

  return <>{children}</>;
}
