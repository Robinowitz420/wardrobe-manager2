import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { ClerkAuthzError, requireStaffOrAdmin } from "@/lib/clerk/auth";

export const runtime = "nodejs";

// PATCH - approve or reject a pending submission
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = getAdminFirestore();
    const pendingRef = db.collection("schedule_pending").doc(id);
    const pendingDoc = await pendingRef.get();

    if (!pendingDoc.exists) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const data = pendingDoc.data();
    if (data?.status !== "pending") {
      return NextResponse.json({ error: "Already processed" }, { status: 400 });
    }

    if (action === "approve") {
      // Add to main schedule
      const scheduleRef = db.collection("app_config").doc("schedule");
      const scheduleDoc = await scheduleRef.get();
      const schedules = scheduleDoc.data()?.schedules || {};
      
      const newSlot = {
        id: Date.now().toString(),
        startTime: data.startTime,
        endTime: data.endTime,
        employee: data.employee,
        color: "blue",
        details: data.details || "",
      };

      const dateKey = data.dateKey;
      schedules[dateKey] = [...(schedules[dateKey] || []), newSlot];

      await scheduleRef.set({ schedules, updatedAt: new Date().toISOString() }, { merge: true });
    }

    // Update pending status
    await pendingRef.update({ 
      status: action === "approve" ? "approved" : "rejected",
      processedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: action === "approve" ? "Hours approved and added to schedule" : "Hours rejected" 
    });
  } catch (e: any) {
    console.error("[Schedule Pending PATCH] Error:", e);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
