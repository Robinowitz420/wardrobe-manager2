import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Validate it's a Firebase Storage URL
  if (!url.startsWith("https://storage.googleapis.com/wardrobe-manager-d2e93")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: "Image not found" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("Image proxy error:", e);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
