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
    const session = (await stripe.checkout.sessions.retrieve(sessionFromEvent.id)) as SessionWithShipping;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, ignored: "not_paid" });
    }

    const adminApp = getAdmin();
    const db = adminApp.firestore();

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
          updatedAt: adminApp.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const orderRef = db.collection("orders").doc(session.id);
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
      
      createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
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
          completedAt: adminApp.firestore.FieldValue.serverTimestamp(),
          stripeSessionId: session.id,
        },
        { merge: true }
      );
    }
  }

  return NextResponse.json({ received: true });
}
