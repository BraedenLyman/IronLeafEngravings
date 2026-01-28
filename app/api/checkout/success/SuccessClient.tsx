"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");

  if (!session_id) {
    return <main style={{ padding: 24 }}>Missing session_id</main>;
  }

  return <main style={{ padding: 24 }}>Success! Session: {session_id}</main>;
}
