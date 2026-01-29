import Stripe from "stripe";
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getStripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { sendOrderReceiptEmail } from "@/app/lib/orderReceiptEmail";

export const runtime = "nodejs";

function formatOrderId(seq: number) {
  return `IL-WC-${String(seq).padStart(6, "0")}`;
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
    console.log("Webhook: checkout.session.completed");
    const sessionFromEvent = event.data.object as Stripe.Checkout.Session;
    const session = (await stripe.checkout.sessions.retrieve(sessionFromEvent.id)) as SessionWithShipping;

    if (session.payment_status !== "paid") {
      console.log("Webhook: session not paid", {
        id: session.id,
        paymentStatus: session.payment_status,
      });
      return NextResponse.json({ received: true, ignored: "not_paid" });
    }

    const db = adminDb;

    const pendingOrderId = session.metadata?.pendingOrderId ?? null;
    const shipping = session.shipping_details;
    const customerDetails = session.customer_details;
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

    let pendingData: any = null;
    if (pendingOrderId) {
      const pendingSnap = await db.collection("pendingCheckouts").doc(pendingOrderId).get();
      pendingData = pendingSnap.exists ? pendingSnap.data() : null;
    }

    const uploadedUrl =
      pendingData?.imageUrl ??
      pendingData?.uploadedImageUrl ??
      pendingData?.items?.find((it: any) => it?.uploadedImageUrl || it?.imageUrl)?.uploadedImageUrl ??
      pendingData?.items?.find((it: any) => it?.uploadedImageUrl || it?.imageUrl)?.imageUrl ??
      "";

    const pendingShipping = pendingData?.shipping ?? null;
    const shippingFromStripe = shipping
      ? { name: shipping.name ?? "", address: shipping.address ?? {} }
      : null;
    const shippingFromCustomer = customerDetails?.address
      ? { name: customerDetails?.name ?? "", address: customerDetails.address }
      : null;
    const shippingToStore = shippingFromStripe ?? pendingShipping ?? shippingFromCustomer;

    if (stripeCustomerId) {
      await db.collection("customers").doc(stripeCustomerId).set(
        {
          stripeCustomerId,
          email: customerDetails?.email ?? "",
          name: customerDetails?.name ?? "",
          phone: customerDetails?.phone ?? "",
          shipping: shippingToStore,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const orderId = await db.runTransaction(async (tx) => {
      const sessionRef = db.collection("orderSessions").doc(session.id);
      const counterRef = db.collection("meta").doc("orderCounter");

      const sessionSnap = await tx.get(sessionRef);
      if (sessionSnap.exists) {
        return String(sessionSnap.data()?.orderId ?? "");
      }

      const counterSnap = await tx.get(counterRef);
      const next = Number(counterSnap.data()?.next ?? 1);
      const newId = formatOrderId(next);

      tx.set(counterRef, { next: next + 1 }, { merge: true });
      tx.set(sessionRef, { orderId: newId, createdAt: admin.firestore.FieldValue.serverTimestamp() });

      return newId;
    });

    if (!orderId) {
      return NextResponse.json({ error: "Failed to allocate order id" }, { status: 500 });
    }

    const orderRef = db.collection("orders").doc(orderId);
    const existing = await orderRef.get();
    if (existing.exists) {
      const existingData = existing.data() as any;
      if (!existingData?.shipping && shippingToStore) {
        await orderRef.update({
          shipping: shippingToStore,
          customer: {
            email: existingData?.customer?.email ?? customerDetails?.email ?? pendingShipping?.email ?? "",
            name: existingData?.customer?.name ?? customerDetails?.name ?? pendingShipping?.name ?? "",
            phone: existingData?.customer?.phone ?? customerDetails?.phone ?? pendingShipping?.phone ?? "",
          },
        });
      }
      return NextResponse.json({ received: true, deduped: true });
    }
    
    await orderRef.set({
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      orderId,
      stripeSessionId: session.id,
      stripeCustomerId,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      paymentStatus: session.payment_status ?? "unknown",

      pendingOrderId,
      productSlug: pendingData?.productSlug ?? session.metadata?.productSlug ?? "",
      uploadedFileName: pendingData?.uploadedFileName ?? "",
      imageUrl: uploadedUrl,
      uploadedImageUrl: uploadedUrl,
      items: pendingData?.items ?? [],

      customer: {
        email: customerDetails?.email ?? pendingShipping?.email ?? "",
        name: customerDetails?.name ?? pendingShipping?.name ?? "",
        phone: customerDetails?.phone ?? pendingShipping?.phone ?? "",
      },
      shipping: shippingToStore,
    });

    if (pendingOrderId) {
      await db.collection("pendingCheckouts").doc(pendingOrderId).set(
        {
          status: "completed",
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          stripeSessionId: session.id,
        },
        { merge: true }
      );
    }

    const customerEmail =
      customerDetails?.email ??
      pendingShipping?.email ??
      pendingData?.shipping?.email ??
      "";

    if (customerEmail) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 100,
        });
        console.log("Receipt email: preparing", {
          orderId,
          to: customerEmail,
          lineItems: lineItems.data.length,
        });

        const result = await sendOrderReceiptEmail({
          to: customerEmail,
          orderId,
          createdAt: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000),
          currency: session.currency ?? "cad",
          amountTotal: session.amount_total ?? null,
          items: lineItems.data.map((item) => ({
            name: item.description ?? "Item",
            quantity: item.quantity ?? 1,
            unitAmount: item.price?.unit_amount ?? null,
            totalAmount: item.amount_total ?? null,
          })),
          shipping: shippingToStore,
        });
        if (result.ok) {
          console.log("Receipt email: sent", { orderId, to: customerEmail });
        } else {
          console.warn("Receipt email: skipped", { orderId, reason: result.reason });
        }
      } catch (err) {
        console.error("Receipt email failed:", err);
      }
    } else {
      console.warn("Receipt email: missing customer email", {
        orderId,
        sessionId: session.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
