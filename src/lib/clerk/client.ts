import { createClerkClient } from "@clerk/backend";
import type { User } from "@clerk/backend";

let clerkInstance: ReturnType<typeof createClerkClient> | null = null;

export function clerkClient() {
  if (!clerkInstance) {
    clerkInstance = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }
  return clerkInstance;
}
