"use client";

import { useState } from "react";
import { auth } from "@/app/lib/firebaseClient";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Link from "next/link";


export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function signInGoogle() {
  setLoading(true);
  setMsg("");
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    const idToken = await cred.user.getIdToken(true);

    const r = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data?.error ?? "Failed to create session cookie");
    }

    window.location.href = "/admin/orders";
  } catch (e: any) {
    setMsg(e?.message ?? "Login failed");
  } finally {
    setLoading(false);
  }
}


  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1>Admin Login</h1>
      <p style={{ opacity: 0.8 }}>
        Sign in to manage orders. If you aren’t an admin, you’ll be blocked.
      </p>

      <button
        onClick={signInGoogle}
        disabled={loading}
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #444",
          background: "#111",
          color: "white",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>

      {msg ? <p style={{ marginTop: 12, color: "#ffb4b4" }}>{msg}</p> : null}

      <p style={{ marginTop: 18, opacity: 0.7, fontSize: 13 }}>
        <Link href="/">Back to site</Link>
      </p>
    </main>
  );
}
