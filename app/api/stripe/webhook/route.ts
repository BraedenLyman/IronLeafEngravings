import Stripe from "stripe";
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getStripe } from "@/app/lib/stripe";

export const runtime = "nodejs";

function getAdmin() {
  if (!admin.apps.length) admin.initializeApp();
  return admin;
}

type SessionWithShipping = Stripe.Checkout.Session & {
  shipping_details?: {
    name?: string | null;
    address?: Stripe.Address | null;
  } | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    address?: Stripe.Address | null;
  } | null;
};

export async function POST(req: Request) {
  const stripe = getStripe();

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sessionFromEvent = event.data.object as Stripe.Checkout.Session;

    // Re-fetch session (more reliable than event payload typing)
    const session = (await stripe.checkout.sessions.retrieve(sessionFromEvent.id)) as SessionWithShipping;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, ignored: "not_paid" });
    }

    const adminApp = getAdmin();
    const db = adminApp.firestore();

    const pendingOrderId = session.metadata?.pendingOrderId ?? null;
    const orderRef = db.collection("orders").doc(session.id);
    const existing = await orderRef.get();

    if (existing.exists) {
      return NextResponse.json({ received: true, deduped: true });
    }

    const shipping = session.shipping_details;
    const customerDetails = session.customer_details;
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

    let pendingData: any = null;
    if (pendingOrderId) {
      const pendingSnap = await db.collection("pendingCheckouts").doc(pendingOrderId).get();
      pendingData = pendingSnap.exists ? pendingSnap.data() : null;
    }

    if (stripeCustomerId) {
      await db.collection("customers").doc(stripeCustomerId).set(
        {
          stripeCustomerId,
          email: customerDetails?.email ?? "",
          name: customerDetails?.name ?? "",
          phone: customerDetails?.phone ?? "",
          shipping: shipping ? { name: shipping.name ?? "", address: shipping.address ?? {} } : null,
          updatedAt: adminApp.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await orderRef.set({
      createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
      stripeSessionId: session.id,
      stripeCustomerId,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      paymentStatus: session.payment_status ?? "unknown",

      pendingOrderId,
      productSlug: pendingData?.productSlug ?? session.metadata?.productSlug ?? "",
      uploadedFileName: pendingData?.uploadedFileName ?? "",
      imageUrl: pendingData?.imageUrl ?? "",
      items: pendingData?.items ?? [],

      customer: {
        email: customerDetails?.email ?? "",
        name: customerDetails?.name ?? "",
        phone: customerDetails?.phone ?? "",
      },
      shipping: shipping ? { name: shipping.name ?? "", address: shipping.address ?? {} } : null,
    });

    if (pendingOrderId) {
      await db.collection("pendingCheckouts").doc(pendingOrderId).set(
        {
          status: "completed",
          completedAt: adminApp.firestore.FieldValue.serverTimestamp(),
          stripeSessionId: session.id,
        },
        { merge: true }
      );
    }
  }

  return NextResponse.json({ received: true });
}
