import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isPublicApiRoute = createRouteMatcher(["/api/public(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isDashboardRoute(req)) {
    auth.protect();
    return;
  }

  if (isPublicApiRoute(req)) return;

  if (req.nextUrl.pathname.startsWith("/api/")) {
    auth.protect();
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
