import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

function sanitizeLookupId(raw: string | null) {
  return String(raw ?? "").trim().replace(/[|]+$/g, "");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = sanitizeLookupId(searchParams.get("session_id"));
    const paymentIntentId = sanitizeLookupId(searchParams.get("payment_intent"));

    if (!sessionId && !paymentIntentId) {
      return NextResponse.json({ error: "Missing session_id or payment_intent" }, { status: 400 });
    }

    const lookupId = sessionId || paymentIntentId;
    const sessionSnap = await adminDb.collection("orderSessions").doc(lookupId).get();
    if (sessionSnap.exists) {
      const orderId = String(sessionSnap.data()?.orderId ?? "");
      if (orderId) return NextResponse.json({ orderId });
    }

    if (sessionId) {
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
    }

    if (paymentIntentId) {
      const ordersSnap = await adminDb
        .collection("orders")
        .where("stripePaymentIntentId", "==", paymentIntentId)
        .limit(1)
        .get();

      if (!ordersSnap.empty) {
        const order = ordersSnap.docs[0]?.data();
        const orderId = String(order?.orderId ?? ordersSnap.docs[0]?.id ?? "");
        if (orderId) return NextResponse.json({ orderId });
      }
    }

    return NextResponse.json({ orderId: null }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load order ID";
    console.error("GET /api/orders/by-session error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
