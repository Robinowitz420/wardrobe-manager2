import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRoleFromClaims } from "@/lib/clerk/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    const role = getRoleFromClaims(sessionClaims);
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        role,
        email: sessionClaims?.email || null,
      }
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
