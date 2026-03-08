import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// This endpoint is intended to be called server-to-server from beforeandafters
// (e.g. from its Stripe webhook handler). Protect with a shared secret.
export async function POST(request: Request) {
  const secret = request.headers.get("x-referral-secret");
  const expected = process.env.REFERRAL_CONVERSION_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "Server not configured: missing REFERRAL_CONVERSION_SECRET" },
      { status: 500 },
    );
  }

  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referralCode = typeof payload?.referralCode === "string" ? payload.referralCode.trim().toUpperCase() : "";
  const stripeEventId = typeof payload?.stripeEventId === "string" ? payload.stripeEventId.trim() : "";
  const stripeCheckoutSessionId = typeof payload?.stripeCheckoutSessionId === "string" ? payload.stripeCheckoutSessionId.trim() : "";

  if (!referralCode) {
    return NextResponse.json({ error: "Missing referralCode" }, { status: 400 });
  }

  if (!stripeEventId && !stripeCheckoutSessionId) {
    return NextResponse.json(
      { error: "Missing stripeEventId or stripeCheckoutSessionId" },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();

  try {
    // Find staff member
    const staffSnap = await db.collection("staff_roles").where("referralCode", "==", referralCode).get();
    if (staffSnap.empty) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const staffDoc = staffSnap.docs[0];
    const staffId = staffDoc.id;
    const staffName = staffDoc.data()?.name || "Unknown";

    // Dedupe conversions
    const dedupeKey = stripeEventId || stripeCheckoutSessionId;
    const conversionRef = db.collection("referral_conversions").doc(dedupeKey);

    const now = new Date().toISOString();

    await db.runTransaction(async (tx) => {
      const existing = await tx.get(conversionRef);
      if (existing.exists) {
        return;
      }

      tx.set(conversionRef, {
        staffId,
        staffName,
        referralCode,
        createdAt: now,
        stripeEventId: stripeEventId || null,
        stripeCheckoutSessionId: stripeCheckoutSessionId || null,
        amountTotal: typeof payload?.amountTotal === "number" ? payload.amountTotal : null,
        currency: typeof payload?.currency === "string" ? payload.currency : null,
        customerEmail: typeof payload?.customerEmail === "string" ? payload.customerEmail : null,
        membershipPlan: typeof payload?.membershipPlan === "string" ? payload.membershipPlan : null,
      });

      const staffStatsRef = db.collection("referral_staff_stats").doc(staffId);
      const staffStatsSnap = await tx.get(staffStatsRef);
      const prevConversions = staffStatsSnap.exists ? (staffStatsSnap.data()?.conversions || 0) : 0;
      tx.set(
        staffStatsRef,
        {
          staffId,
          staffName,
          referralCode,
          conversions: prevConversions + 1,
          updatedAt: now,
        },
        { merge: true },
      );
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Referral Convert] Failed", e);
    return NextResponse.json({ error: "Failed to record conversion" }, { status: 500 });
  }
}
