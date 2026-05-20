import { auth, currentUser } from "@clerk/nextjs/server";

type Role = "admin" | "staff" | "member";

export class ClerkAuthzError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function roleFromPublicMetadata(value: unknown): Role | null {
  if (value === "admin" || value === "staff" || value === "member") return value;
  return null;
}

export function getRoleFromClaims(claims: any): Role | null {
  return roleFromPublicMetadata(claims?.metadata?.role || claims?.role);
}

export async function requireClerkUser() {
  const { userId } = await auth();
  if (!userId) throw new ClerkAuthzError("Unauthorized", 401);
  const user = await currentUser();
  if (!user) throw new ClerkAuthzError("Unauthorized", 401);
  return user;
}

/**
 * NOTE: Role checks disabled — any signed-in Clerk user passes.
 * Restore staff/admin enforcement before exposing sensitive ops publicly.
 */
export async function requireStaffOrAdmin() {
  const user = await requireClerkUser();
  const role = roleFromPublicMetadata(user.publicMetadata?.role) ?? "member";
  return { user, role };
}

/**
 * NOTE: Email allowlist disabled — any signed-in Clerk user passes.
 */
export async function requireAdmin() {
  const user = await requireClerkUser();
  const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  return { user, email };
}

export function isAdminEmail(email: string | undefined): boolean {
  const normalized = email?.toLowerCase();
  return normalized === "robinrussellfrench@gmail.com" || normalized === "michellejonilapidos@gmail.com";
}

export async function requireSignedInUser() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new ClerkAuthzError("Unauthorized", 401);
  const role = getRoleFromClaims(sessionClaims);
  return { userId, role };
}
