import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// Track a referral visit
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");

  if (!ref || typeof ref !== "string") {
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 });
  }

  const code = ref.toUpperCase().trim();
  const db = getAdminFirestore();

  try {
    // Find staff member with this referral code
    const staffSnap = await db.collection("staff_roles").where("referralCode", "==", code).get();
    
    if (staffSnap.empty) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const staffDoc = staffSnap.docs[0];
    const staffData = staffDoc.data();
    const staffId = staffDoc.id;
    const staffName = staffData?.name || "Unknown";

    // Get visitor info from request
    const body = await request.json().catch(() => ({}));
    const ip = body?.ip || "unknown";
    const userAgent = body?.userAgent || "unknown";
    const timestamp = new Date().toISOString();

    // Record the referral visit
    const visitData = {
      staffId,
      staffName,
      referralCode: code,
      ip,
      userAgent,
      timestamp,
      converted: false, // Will be set to true if they sign up/make a reservation
    };

    await db.collection("referral_visits").add(visitData);

    // Also update daily stats
    const dateKey = timestamp.split("T")[0]; // YYYY-MM-DD
    const statsRef = db.collection("referral_stats").doc(`${staffId}_${dateKey}`);
    
    await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      if (statsDoc.exists) {
        const data = statsDoc.data();
        transaction.update(statsRef, {
          visits: (data?.visits || 0) + 1,
          lastVisit: timestamp,
        });
      } else {
        transaction.set(statsRef, {
          staffId,
          staffName,
          date: dateKey,
          visits: 1,
          conversions: 0,
          firstVisit: timestamp,
          lastVisit: timestamp,
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      staff: { id: staffId, name: staffName },
      referralCode: code 
    });
  } catch (e) {
    console.error("Referral tracking error:", e);
    return NextResponse.json({ error: "Failed to track referral" }, { status: 500 });
  }
}

// Get referral stats for a staff member or all staff
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");
  const days = parseInt(searchParams.get("days") || "30", 10);

  const db = getAdminFirestore();

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    let query = db.collection("referral_visits")
      .where("timestamp", ">=", sinceStr)
      .orderBy("timestamp", "desc");

    if (staffId) {
      query = query.where("staffId", "==", staffId);
    }

    const visitsSnap = await query.get();
    const visits = visitsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Aggregate stats by staff member
    const statsMap = new Map();
    visits.forEach((visit: any) => {
      const sid = visit.staffId;
      if (!statsMap.has(sid)) {
        statsMap.set(sid, {
          staffId: sid,
          staffName: visit.staffName,
          referralCode: visit.referralCode,
          totalVisits: 0,
          conversions: 0,
          recentVisits: [],
        });
      }
      const stats = statsMap.get(sid);
      stats.totalVisits++;
      if (visit.converted) {
        stats.conversions++;
      }
      // Keep last 5 visits for display
      if (stats.recentVisits.length < 5) {
        stats.recentVisits.push({
          timestamp: visit.timestamp,
          converted: visit.converted,
        });
      }
    });

    return NextResponse.json({ 
      visits: visits.slice(0, 100), // Return last 100 for detail view
      stats: Array.from(statsMap.values()),
      days,
    });
  } catch (e) {
    console.error("Referral stats error:", e);
    return NextResponse.json({ error: "Failed to get referral stats" }, { status: 500 });
  }
}
