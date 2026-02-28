import { NextRequest, NextResponse } from "next/server";

import { getAdminFirestore } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const db = getAdminFirestore();
  
  const garmentIds = [
    "a6455ab8-2f32-4396-ba1a-f7c0a67d2f47",
    "e9d516f3-6f28-4c6b-a241-80313f2f2b1a",
  ];
  
  const batch = db.batch();
  
  for (const id of garmentIds) {
    const ref = db.collection("garments").doc(id);
    const snap = await ref.get();
    
    if (snap.exists) {
      const data = snap.data();
      const attrs = data?.attributes && typeof data.attributes === "object" ? data.attributes : {};
      
      batch.update(ref, {
        "attributes.state": "Available",
        "attributes.reservedAt": null,
        "attributes.reservedByToken": null,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  
  await batch.commit();
  
  return NextResponse.json({ 
    success: true, 
    message: `Unreserved ${garmentIds.length} garments`,
    garmentIds 
  });
}
