"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/app/lib/firebaseClient";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setMsg("Enter email and password.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const idToken = await cred.user.getIdToken(true);

      const r = await fetch("/api/session", {
        method: "POST",
        credentials: "include",
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
      await fetch("/api/session", { method: "DELETE", credentials: "include" });
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

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "12px",
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
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "12px",
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
