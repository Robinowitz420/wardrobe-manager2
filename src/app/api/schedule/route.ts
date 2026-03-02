import { NextResponse } from "next/server";
import { asAuthError, getAdminFirestore, requireFirebaseUser } from "@/lib/firebase/admin";

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  employee: string;
  color: string;
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
    await requireFirebaseUser(request);
  } catch (e) {
    const ae = asAuthError(e);
    if (ae) return NextResponse.json({ error: ae.message }, { status: ae.status });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { schedules } = body as { schedules: ScheduleData };
    
    if (!schedules || typeof schedules !== "object") {
      return NextResponse.json(
        { error: "Invalid schedule data" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const docRef = db.collection("app_config").doc("schedule");
    await docRef.set({ schedules, updatedAt: new Date().toISOString() }, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[Schedule POST] Error:", e);
    return NextResponse.json(
      { error: "Failed to save schedule" },
      { status: 500 }
    );
  }
}
