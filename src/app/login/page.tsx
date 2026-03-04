"use client";

import * as React from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;
    const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
    router.replace(next);
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="mx-auto w-full max-w-md p-4 sm:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Staff access.</p>
        </div>

        <div className="mt-6">
          <SignIn routing="hash" />
        </div>
      </div>
    </div>
  );
}
