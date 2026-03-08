"use client";

import * as React from "react";

export function ReferralTracker() {
  React.useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      // Track the referral visit
      const trackReferral = async () => {
        try {
          const response = await fetch(`/api/referrals?ref=${encodeURIComponent(ref)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ip: "unknown", // IP is captured server-side or via headers
              userAgent: navigator.userAgent,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("[Referral] Tracked visit for:", data.staff?.name || ref);
            
            // Store in session so we don't track multiple times
            sessionStorage.setItem("referralTracked", ref);
          }
        } catch (e) {
          console.error("[Referral] Failed to track:", e);
        }
      };

      // Only track if not already tracked this session
      const alreadyTracked = sessionStorage.getItem("referralTracked");
      if (alreadyTracked !== ref) {
        trackReferral();
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
