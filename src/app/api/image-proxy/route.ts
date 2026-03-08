import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Validate it's a Firebase Storage URL
  if (!url.includes("storage.googleapis.com") || !url.includes("wardrobe-manager")) {
    return NextResponse.json({ error: "Invalid URL", url }, { status: 400 });
  }

  console.log("[Image Proxy] Fetching:", url);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "image/*",
      },
    });
    
    console.log("[Image Proxy] Response status:", response.status);
    
    if (!response.ok) {
      const text = await response.text().catch(() => "No error body");
      console.error("[Image Proxy] Error response:", text);
      return NextResponse.json({ 
        error: "Image not found", 
        status: response.status,
        details: text.substring(0, 200)
      }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e: any) {
    console.error("[Image Proxy] Error:", e);
    return NextResponse.json({ error: "Failed to fetch image", message: e.message }, { status: 500 });
  }
}
