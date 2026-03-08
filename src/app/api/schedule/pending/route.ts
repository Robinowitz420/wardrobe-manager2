import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export interface PendingTimeSlot {
  id: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  employee: string;
  details?: string;
  submittedBy: string;
  submittedByEmail?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

// GET pending submissions - staff only
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminFirestore();
    const snap = await db.collection("schedule_pending")
      .where("status", "==", "pending")
      .orderBy("submittedAt", "desc")
      .get();
    
    const pending = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ pending });
  } catch (e: any) {
    console.error("[Schedule Pending GET] Error:", e);
    return NextResponse.json({ error: "Failed to fetch pending submissions" }, { status: 500 });
  }
}

// POST new pending submission - any signed-in user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { dateKey, startTime, endTime, employee, details } = body;

    if (!dateKey || !startTime || !endTime || !employee) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminFirestore();
    
    // Get user email from Clerk session if available
    const now = new Date().toISOString();
    const pendingRef = await db.collection("schedule_pending").add({
      dateKey,
      startTime,
      endTime,
      employee: employee.trim(),
      details: details?.trim() || "",
      submittedBy: userId,
      submittedAt: now,
      status: "pending",
    });

    return NextResponse.json({ 
      success: true, 
      id: pendingRef.id,
      message: "Hours submitted for approval" 
    });
  } catch (e: any) {
    console.error("[Schedule Pending POST] Error:", e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
