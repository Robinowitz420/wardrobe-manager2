import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createRequire } from "node:module";

type AuthContext = {
  uid: string;
  email?: string;
};

class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function initAdmin() {
  if (getApps().length > 0) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  let svc: any;
  try {
    svc = JSON.parse(raw);
  } catch {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  initializeApp({
    credential: cert(svc),
  });
}

export function getAdminFirestore() {
  initAdmin();
  const require = createRequire(import.meta.url);
  // Lazy-load Firestore so routes that only need auth don't pull it in during build.
  const { getFirestore } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
  return getFirestore();
}

export function getAdminAuth() {
  initAdmin();
  return getAuth();
}

function allowedConfig() {
  const allowedUid = typeof process.env.FIREBASE_ALLOWED_UID === "string" ? process.env.FIREBASE_ALLOWED_UID.trim() : "";
  const allowedEmail =
    typeof process.env.FIREBASE_ALLOWED_EMAIL === "string" ? process.env.FIREBASE_ALLOWED_EMAIL.trim().toLowerCase() : "";
  return { allowedUid, allowedEmail };
}

export async function requireFirebaseUser(request: Request): Promise<AuthContext> {
  try {
    initAdmin();
  } catch (e: any) {
    throw new AuthError(typeof e?.message === "string" ? e.message : "Failed to initialize Firebase Admin", 500);
  }

  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new AuthError("Missing auth token", 401);
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) throw new AuthError("Missing auth token", 401);

  let decoded: any;
  try {
    decoded = await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new AuthError("Invalid auth token", 401);
  }

  const { allowedUid, allowedEmail } = allowedConfig();

  if (!allowedUid && !allowedEmail) {
    if (process.env.NODE_ENV === "production") {
      throw new AuthError("Missing FIREBASE_ALLOWED_UID or FIREBASE_ALLOWED_EMAIL", 500);
    }
    return { uid: decoded.uid, email: decoded.email };
  }

  if (allowedUid && decoded.uid !== allowedUid) {
    throw new AuthError("Forbidden", 403);
  }

  const email = typeof decoded.email === "string" ? decoded.email : undefined;
  if (allowedEmail && (!email || email.toLowerCase() !== allowedEmail)) {
    throw new AuthError("Forbidden", 403);
  }

  return { uid: decoded.uid, email };
}

export function asAuthError(e: unknown): AuthError | null {
  if (e instanceof AuthError) return e;
  return null;
}
