import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { ClerkAuthzError, requireStaffOrAdmin } from "@/lib/clerk/auth";

export const runtime = "nodejs";

function nowIso() {
  return new Date().toISOString();
}

export async function GET() {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminFirestore();

  // Garments count
  const garmentsSnap = await db.collection("garments").count().get();
  const garmentsTotal = garmentsSnap.data().count || 0;

  // Reservations (state: Reserved)
  const reservedSnap = await db.collection("garments").where("attributes.state", "==", "Reserved").count().get();
  const reservedCount = reservedSnap.data().count || 0;

  // Available garments
  const availableSnap = await db.collection("garments").where("attributes.state", "==", "Available").count().get();
  const availableCount = availableSnap.data().count || 0;

  // Photos count (simple proxy: count documents with photos array not empty)
  const photosSnap = await db.collection("garments").where("photos", "array-contains", "").limit(1).get();
  const hasPhotos = photosSnap.size > 0;

  // Schedule entries (approximate)
  const scheduleDoc = await db.collection("app_config").doc("schedule").get();
  const scheduleData = scheduleDoc.exists ? scheduleDoc.data()?.schedules || {} : {};
  const scheduleDays = Object.keys(scheduleData).length;

  const metrics = [
    { label: "Total Garments", value: garmentsTotal },
    { label: "Available", value: availableCount },
    { label: "Reserved", value: reservedCount },
    { label: "Schedule Days", value: scheduleDays },
    { label: "Photos Present", value: hasPhotos ? "Yes" : "No" },
  ];

  return NextResponse.json({ metrics });
}
