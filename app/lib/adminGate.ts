import { cookies } from "next/headers";
import { adminAuth } from "./firebaseAdmin";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;

  if (!token) return { ok: false as const, reason: "no_token" };

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    if (decoded.admin !== true) {
      return { ok: false as const, reason: "not_admin" };
    }

    return { ok: true as const, email: decoded.email ?? "" };
  } catch {
    return { ok: false as const, reason: "bad_token" };
  }
}
