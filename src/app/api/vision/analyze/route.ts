import { NextResponse } from "next/server";

export const runtime = "nodejs";

function gone() {
  return NextResponse.json({ error: "Vision assist has been removed." }, { status: 410 });
}

export async function GET() {
  return gone();
}

export async function POST() {
  return gone();
}

export async function PUT() {
  return gone();
}

export async function DELETE() {
  return gone();
}
