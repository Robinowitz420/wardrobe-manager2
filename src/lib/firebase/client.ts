import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    throw new Error("Missing Firebase client environment variables");
  }

  const config = {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  firestore = getFirestore(app);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) getFirebaseApp();
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestore) getFirebaseApp();
  return firestore;
}

export async function getIdTokenOrNull(): Promise<string | null> {
  const a = getFirebaseAuth();
  const user = a.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
