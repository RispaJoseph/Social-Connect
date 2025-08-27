// src/hooks/useAuthUser.ts
import { useMemo } from "react";

type Decoded = {
  user_id?: number;
  sub?: number | string;
  username?: string;
  [k: string]: any;
};

function decodeBase64Url(b64url: string) {
  const pad = (s: string) => (s + "===".slice((s.length + 3) % 4));
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return atob(pad(base64));
  } catch {
    return "";
  }
}

function safeJwtDecode(token: string | null): Decoded | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getCurrentUserIdFromToken(): number | null {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || null;
  const decoded = safeJwtDecode(token);
  if (!decoded) return null;
  if (typeof decoded.user_id === "number") return decoded.user_id;
  if (typeof decoded.sub === "number") return decoded.sub;
  const asNum = Number(decoded.sub);
  return Number.isFinite(asNum) ? asNum : null;
}

export function useAuthUserId(): number | null {
  return useMemo(() => getCurrentUserIdFromToken(), []);
}
