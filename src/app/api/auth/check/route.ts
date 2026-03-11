import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getRoleFromClaims } from "@/lib/clerk/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    const role = getRoleFromClaims(sessionClaims);
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || null;
    const isAdmin = email?.toLowerCase() === "robinrussellfrench@gmail.com";
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        role,
        email,
        isAdmin,
      }
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
