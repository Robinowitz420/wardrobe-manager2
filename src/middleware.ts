import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const isStaffApiRoute = createRouteMatcher([
  "/api/(?!public/)(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth.protect();

  if (isStaffApiRoute(req)) auth.protect();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
