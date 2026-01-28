"use client";

import { getIdTokenOrNull } from "@/lib/firebase/client";

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const token = await getIdTokenOrNull();
  const headers = new Headers(init?.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
