import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { ClerkAuthzError, requireStaffOrAdmin, requireSignedInUser } from "@/lib/clerk/auth";

export const runtime = "nodejs";

// GET /api/events/[id] - Public, get single event details
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const db = getAdminFirestore();
  const doc = await db.collection("events").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({
    event: { id: doc.id, ...doc.data() },
  });
}

// DELETE /api/events/[id] - Staff/Admin only
export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const db = getAdminFirestore();
  const doc = await db.collection("events").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await db.collection("events").doc(id).delete();
  return NextResponse.json({ success: true });
}

// PATCH /api/events/[id] - Staff/Admin can update event details, any signed-in user can signup/unsignup
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { action, name, email, phone, userId: signupUserId, ...eventFields } = body;

  const db = getAdminFirestore();
  const doc = await db.collection("events").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const event = { id: doc.id, ...doc.data() } as any;

  // Handle signup/unsignup actions
  if (action === "signup") {
    try {
      const { userId } = await requireSignedInUser();
      const signupName = name || email || userId;
      
      // Check if already signed up
      const existingSignup = event.signups?.find(
        (s: any) => s.userId === userId || s.email === email
      );
      if (existingSignup) {
        return NextResponse.json({ error: "Already signed up" }, { status: 400 });
      }

      // Check capacity
      if (event.capacity && event.signups?.length >= event.capacity) {
        return NextResponse.json({ error: "Event is full" }, { status: 400 });
      }

      const newSignup = {
        userId,
        name: signupName,
        email: email || null,
        phone: phone || null,
        signedUpAt: new Date().toISOString(),
      };

      await db.collection("events").doc(id).update({
        signups: [...(event.signups || []), newSignup],
        updatedAt: new Date().toISOString(),
      });

      const updated = await db.collection("events").doc(id).get();
      return NextResponse.json({ event: { id: updated.id, ...updated.data() } });
    } catch (e) {
      if (e instanceof ClerkAuthzError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (action === "unsignup") {
    try {
      const { userId } = await requireSignedInUser();
      
      const filteredSignups = (event.signups || []).filter(
        (s: any) => s.userId !== userId && s.email !== email
      );

      await db.collection("events").doc(id).update({
        signups: filteredSignups,
        updatedAt: new Date().toISOString(),
      });

      const updated = await db.collection("events").doc(id).get();
      return NextResponse.json({ event: { id: updated.id, ...updated.data() } });
    } catch (e) {
      if (e instanceof ClerkAuthzError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Update event fields (staff/admin only)
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates: any = { updatedAt: new Date().toISOString() };
  if (eventFields.title !== undefined) updates.title = eventFields.title;
  if (eventFields.date !== undefined) updates.date = eventFields.date;
  if (eventFields.startTime !== undefined) updates.startTime = eventFields.startTime;
  if (eventFields.endTime !== undefined) updates.endTime = eventFields.endTime;
  if (eventFields.description !== undefined) updates.description = eventFields.description;
  if (eventFields.location !== undefined) updates.location = eventFields.location;
  if (eventFields.capacity !== undefined) updates.capacity = eventFields.capacity;

  await db.collection("events").doc(id).update(updates);
  const updated = await db.collection("events").doc(id).get();
  return NextResponse.json({ event: { id: updated.id, ...updated.data() } });
}
