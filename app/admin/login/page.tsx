"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/app/lib/firebaseClient";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function signInEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

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
    } catch (err: any) {
      setMsg(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setMsg("");
    try {
      await signOut(auth);
      await fetch("/api/session", { method: "DELETE" }); 
      setEmail("");
      setPassword("");
      setMsg("Signed out.");
    } catch (err: any) {
      setMsg(err?.message ?? "Sign out failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1>Admin Login</h1>
      <p style={{ opacity: 0.8 }}>
        Sign in to manage orders. Only admin users can access the orders page.
      </p>

      <form onSubmit={signInEmailPassword} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #444",
              background: "#0f0f0f",
              color: "white",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #444",
              background: "#0f0f0f",
              color: "white",
            }}
          />
        </label>

        <button
          type="submit"
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
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <button
          type="button"
          onClick={logout}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
            cursor: "pointer",
            width: "100%",
            opacity: 0.9,
          }}
        >
          Sign out
        </button>
      </form>

      {msg ? <p style={{ marginTop: 12, color: "#ffb4b4" }}>{msg}</p> : null}

      <p style={{ marginTop: 18, opacity: 0.7, fontSize: 13 }}>
        <Link href="/">Back to site</Link>
      </p>
    </main>
  );
}
