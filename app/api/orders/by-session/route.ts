import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = String(searchParams.get("session_id") ?? "").trim();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const sessionSnap = await adminDb.collection("orderSessions").doc(sessionId).get();
    if (sessionSnap.exists) {
      const orderId = String(sessionSnap.data()?.orderId ?? "");
      if (orderId) return NextResponse.json({ orderId });
    }

    const ordersSnap = await adminDb
      .collection("orders")
      .where("stripeSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (!ordersSnap.empty) {
      const order = ordersSnap.docs[0]?.data();
      const orderId = String(order?.orderId ?? ordersSnap.docs[0]?.id ?? "");
      if (orderId) return NextResponse.json({ orderId });
    }

    return NextResponse.json({ orderId: null }, { status: 404 });
  } catch (err: any) {
    console.error("GET /api/orders/by-session error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load order ID" },
      { status: 500 }
    );
  }
}
