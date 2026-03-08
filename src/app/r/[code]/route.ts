import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  const ref = (code || "").toUpperCase().trim();

  if (!ref) {
    return NextResponse.redirect(new URL("https://beforeandafters.vercel.app/memberships"));
  }

  try {
    const db = getAdminFirestore();

    const staffSnap = await db.collection("staff_roles").where("referralCode", "==", ref).get();
    if (!staffSnap.empty) {
      const staffDoc = staffSnap.docs[0];
      const staffName = staffDoc.data()?.name || "Unknown";

      const timestamp = new Date().toISOString();
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
      const userAgent = request.headers.get("user-agent") || undefined;

      await db.collection("referral_visits").add({
        staffId: staffDoc.id,
        staffName,
        referralCode: ref,
        timestamp,
        converted: false,
        ip,
        userAgent,
      });
    }
  } catch (e) {
    console.error("[Referral Redirect] Failed to record visit", e);
    // Still redirect even if tracking fails
  }

  return NextResponse.redirect(
    new URL(`https://beforeandafters.vercel.app/memberships?ref=${encodeURIComponent(ref)}`),
  );
}
