import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { ClerkAuthzError, requireStaffOrAdmin, requireSignedInUser } from "@/lib/clerk/auth";

export const runtime = "nodejs";

// GET /api/events - Public, list all events
export async function GET() {
  const db = getAdminFirestore();
  const snapshot = await db.collection("events").orderBy("date", "asc").get();
  
  const events = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ events });
}

// POST /api/events - Staff/Admin only, create new event
export async function POST(request: Request) {
  try {
    await requireStaffOrAdmin();
  } catch (e) {
    if (e instanceof ClerkAuthzError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, date, startTime, endTime, description, location, capacity } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  const db = getAdminFirestore();
  const now = new Date().toISOString();
  
  const docRef = await db.collection("events").add({
    title,
    date,
    startTime: startTime || null,
    endTime: endTime || null,
    description: description || "",
    location: location || "",
    capacity: capacity || null,
    signups: [],
    createdAt: now,
    updatedAt: now,
  });

  const doc = await docRef.get();
  return NextResponse.json({
    event: { id: doc.id, ...doc.data() },
  });
}
