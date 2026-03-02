import { NextResponse } from "next/server";
import { asAuthError, getAdminFirestore, requireFirebaseUser } from "@/lib/firebase/admin";

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  employee: string;
  color: string;
  details?: string;
}

export interface ScheduleData {
  [dateKey: string]: TimeSlot[];
}

// GET schedule - public read access
export async function GET() {
  try {
    const db = getAdminFirestore();
    const docRef = db.collection("app_config").doc("schedule");
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ schedules: {} });
    }
    
    const data = doc.data() as { schedules?: ScheduleData };
    return NextResponse.json({ schedules: data.schedules || {} });
  } catch (e: any) {
    console.error("[Schedule GET] Error:", e);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// POST schedule - requires auth
export async function POST(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    console.log("[Schedule POST] Authenticated user:", user.uid);
  } catch (e) {
    const ae = asAuthError(e);
    console.error("[Schedule POST] Auth error:", e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { schedules } = body as { schedules: ScheduleData };
    
    console.log("[Schedule POST] Received schedules:", Object.keys(schedules).length, "days");
    
    if (!schedules || typeof schedules !== "object") {
      return NextResponse.json(
        { error: "Invalid schedule data" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const docRef = db.collection("app_config").doc("schedule");
    await docRef.set({ schedules, updatedAt: new Date().toISOString() }, { merge: true });
    
    console.log("[Schedule POST] Saved successfully");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[Schedule POST] Error:", e);
    return NextResponse.json(
      { error: "Failed to save schedule", details: e.message },
      { status: 500 }
    );
  }
}
