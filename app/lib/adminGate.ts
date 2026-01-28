import { cookies } from "next/headers";
import { adminAuth } from "./firebaseAdmin";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fb_token")?.value;

  if (!token) return { ok: false as const, reason: "no_token" };

  const decoded = await adminAuth.verifyIdToken(token);
  const email = decoded.email ?? "";

  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!email || !allow.includes(email.toLowerCase())) {
    return { ok: false as const, reason: "not_allowed" };
  }

  return { ok: true as const, email };
}
