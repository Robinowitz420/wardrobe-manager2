type Role = "admin" | "staff" | "member";

type UserWithPublicRole = {
  publicMetadata?: {
    role?: unknown;
  };
};

function roleFromUser(user: UserWithPublicRole | null | undefined): Role | null {
  const role = user?.publicMetadata?.role;
  if (role === "admin" || role === "staff" || role === "member") return role;
  return null;
}

export function isStaffOrAdmin(user: UserWithPublicRole | null | undefined): boolean {
  const role = roleFromUser(user);
  return role === "admin" || role === "staff";
}

export function userRoleLabel(user: UserWithPublicRole | null | undefined): string {
  return roleFromUser(user) ?? "unknown";
}
