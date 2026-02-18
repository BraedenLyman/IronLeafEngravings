import Stripe from "stripe";
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getStripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { sendOrderNotificationEmail, sendOrderReceiptEmail } from "@/app/lib/orderReceiptEmail";
import { sendMetaConversionEvent } from "@/app/lib/metaConversions";

export const runtime = "nodejs";

function formatOrderId(seq: number) {
  return `IL-${String(seq).padStart(4, "0")}`;
}

function splitName(name?: string | null) {
  const raw = String(name ?? "").trim();
  if (!raw) return { firstName: "", lastName: "" };
  const parts = raw.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function getAddressParts(address: unknown) {
  if (!address || typeof address !== "object") {
    return { city: "", state: "", postalCode: "", country: "" };
  }
  const record = address as Record<string, unknown>;
  return {
    city: String(record.city ?? ""),
    state: String(record.state ?? ""),
    postalCode: String(record.postal_code ?? ""),
    country: String(record.country ?? ""),
  };
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

type StoredShipping = {
  name?: string;
  phone?: string;
  email?: string;
  address?: Stripe.Address | null;
} | null;

type PendingItem = {
  name?: string;
  quantity?: number;
  priceInCents?: number;
  imageUrl?: string;
  uploadedImageUrl?: string;
};

type PendingCheckout = {
  productSlug?: string;
  uploadedFileName?: string;
  imageUrl?: string;
  uploadedImageUrl?: string;
  shipping?: StoredShipping;
  shippingCents?: number;
  items?: PendingItem[];
};

async function allocateOrderId(uniquePaymentRef: string) {
  const db = adminDb;
  return db.runTransaction(async (tx) => {
    const sessionRef = db.collection("orderSessions").doc(uniquePaymentRef);
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
}

function mapPendingItemsForEmail(items: PendingItem[] = []) {
  return items.map((item) => {
    const quantity = Number(item?.quantity ?? 1) || 1;
    const unitAmount = Number(item?.priceInCents ?? 0) || 0;
    return {
      name: String(item?.name ?? "Item"),
      quantity,
      unitAmount,
      totalAmount: unitAmount * quantity,
    };
  });
}

async function markPendingCompleted(pendingOrderId: string | null, values: Record<string, unknown>) {
  if (!pendingOrderId) return;
  await adminDb.collection("pendingCheckouts").doc(pendingOrderId).set(
    {
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...values,
    },
    { merge: true }
  );
}

async function handleCheckoutSessionCompleted(stripe: Stripe, sessionFromEvent: Stripe.Checkout.Session) {
  const db = adminDb;
  const session = (await stripe.checkout.sessions.retrieve(sessionFromEvent.id)) as SessionWithShipping;

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, ignored: "not_paid" });
  }

  const pendingOrderId = session.metadata?.pendingOrderId ?? null;
  const customerDetails = session.customer_details;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

  let pendingData: PendingCheckout | null = null;
  if (pendingOrderId) {
    const pendingSnap = await db.collection("pendingCheckouts").doc(pendingOrderId).get();
    pendingData = pendingSnap.exists ? (pendingSnap.data() as PendingCheckout) : null;
  }

  const firstItemWithImage = pendingData?.items?.find((it) => it?.uploadedImageUrl || it?.imageUrl);
  const uploadedUrl =
    pendingData?.imageUrl ??
    pendingData?.uploadedImageUrl ??
    firstItemWithImage?.uploadedImageUrl ??
    firstItemWithImage?.imageUrl ??
    "";

  const pendingShipping = (pendingData?.shipping ?? null) as StoredShipping;
  const shippingFromStripe = session.shipping_details
    ? { name: session.shipping_details.name ?? "", address: session.shipping_details.address ?? {} }
    : null;
  const shippingFromCustomer = customerDetails?.address
    ? { name: customerDetails.name ?? "", address: customerDetails.address }
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

  const orderId = await allocateOrderId(session.id);
  if (!orderId) {
    return NextResponse.json({ error: "Failed to allocate order id" }, { status: 500 });
  }

  const orderRef = db.collection("orders").doc(orderId);
  const existing = await orderRef.get();
  if (existing.exists) {
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

  await markPendingCompleted(pendingOrderId, { stripeSessionId: session.id });

  const customerEmail = customerDetails?.email ?? pendingShipping?.email ?? pendingData?.shipping?.email ?? "";
  let lineItemsForEmail: Stripe.ApiList<Stripe.LineItem> | null = null;
  if (customerEmail) {
    try {
      lineItemsForEmail = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      await sendOrderReceiptEmail({
        to: customerEmail,
        orderId,
        createdAt: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000),
        currency: session.currency ?? "cad",
        amountTotal: session.amount_total ?? null,
        shippingAmount: session.total_details?.amount_shipping ?? pendingData?.shippingCents ?? null,
        items: lineItemsForEmail.data.map((item) => ({
          name: item.description ?? "Item",
          quantity: item.quantity ?? 1,
          unitAmount: item.price?.unit_amount ?? null,
          totalAmount: item.amount_total ?? null,
        })),
        shipping: shippingToStore,
      });
    } catch (err) {
      console.error("Receipt email failed:", err);
    }
  }

  try {
    if (!lineItemsForEmail) {
      lineItemsForEmail = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    }
    await sendOrderNotificationEmail({
      orderId,
      createdAt: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000),
      currency: session.currency ?? "cad",
      amountTotal: session.amount_total ?? null,
      items: lineItemsForEmail.data.map((item) => ({
        name: item.description ?? "Item",
        quantity: item.quantity ?? 1,
        unitAmount: item.price?.unit_amount ?? null,
        totalAmount: item.amount_total ?? null,
      })),
      customerEmail,
      customerName: customerDetails?.name ?? pendingShipping?.name ?? null,
      customerPhone: customerDetails?.phone ?? pendingShipping?.phone ?? null,
      shipping: shippingToStore,
    });
  } catch (err) {
    console.error("Order notification failed:", err);
  }

  const shippingAddress = getAddressParts(shippingToStore?.address ?? null);
  const { firstName, lastName } = splitName(customerDetails?.name ?? pendingShipping?.name ?? "");
  await sendMetaConversionEvent({
    eventName: "Purchase",
    eventId: `purchase_${session.id}`,
    eventTime: session.created ?? Math.floor(Date.now() / 1000),
    actionSource: "website",
    customData: {
      currency: String((session.currency ?? "cad")).toUpperCase(),
      value: Number(session.amount_total ?? 0) / 100,
      order_id: orderId,
    },
    userData: {
      email: customerDetails?.email ?? pendingShipping?.email ?? "",
      phone: customerDetails?.phone ?? pendingShipping?.phone ?? "",
      firstName,
      lastName,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.postalCode,
      country: shippingAddress.country,
    },
  });

  return NextResponse.json({ received: true });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const db = adminDb;
  const pendingOrderId = paymentIntent.metadata?.pendingOrderId ?? null;
  const stripeCustomerId = typeof paymentIntent.customer === "string" ? paymentIntent.customer : null;

  let pendingData: PendingCheckout | null = null;
  if (pendingOrderId) {
    const pendingSnap = await db.collection("pendingCheckouts").doc(pendingOrderId).get();
    pendingData = pendingSnap.exists ? (pendingSnap.data() as PendingCheckout) : null;
  }

  const pendingShipping = (pendingData?.shipping ?? null) as StoredShipping;
  const shippingToStore = paymentIntent.shipping
    ? { name: paymentIntent.shipping.name ?? "", address: paymentIntent.shipping.address ?? {} }
    : pendingShipping;

  const latestCharge = paymentIntent.latest_charge
    ? typeof paymentIntent.latest_charge === "string"
      ? null
      : paymentIntent.latest_charge
    : null;
  const billingDetails = latestCharge?.billing_details;
  const customerEmail =
    paymentIntent.receipt_email ?? billingDetails?.email ?? pendingShipping?.email ?? pendingData?.shipping?.email ?? "";
  const customerName = billingDetails?.name ?? shippingToStore?.name ?? pendingShipping?.name ?? null;
  const customerPhone = billingDetails?.phone ?? pendingShipping?.phone ?? null;

  if (stripeCustomerId) {
    await db.collection("customers").doc(stripeCustomerId).set(
      {
        stripeCustomerId,
        email: customerEmail ?? "",
        name: customerName ?? "",
        phone: customerPhone ?? "",
        shipping: shippingToStore,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  const orderId = await allocateOrderId(paymentIntent.id);
  if (!orderId) {
    return NextResponse.json({ error: "Failed to allocate order id" }, { status: 500 });
  }

  const orderRef = db.collection("orders").doc(orderId);
  const existing = await orderRef.get();
  if (existing.exists) {
    return NextResponse.json({ received: true, deduped: true });
  }

  const firstItemWithImage = pendingData?.items?.find((it) => it?.uploadedImageUrl || it?.imageUrl);
  const uploadedUrl =
    pendingData?.imageUrl ??
    pendingData?.uploadedImageUrl ??
    firstItemWithImage?.uploadedImageUrl ??
    firstItemWithImage?.imageUrl ??
    "";

  await orderRef.set({
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    orderId,
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId,
    amountTotal: paymentIntent.amount_received || paymentIntent.amount || null,
    currency: paymentIntent.currency ?? null,
    paymentStatus: paymentIntent.status ?? "unknown",
    pendingOrderId,
    productSlug: pendingData?.productSlug ?? paymentIntent.metadata?.productSlug ?? "",
    uploadedFileName: pendingData?.uploadedFileName ?? "",
    imageUrl: uploadedUrl,
    uploadedImageUrl: uploadedUrl,
    items: pendingData?.items ?? [],
    customer: {
      email: customerEmail ?? "",
      name: customerName ?? "",
      phone: customerPhone ?? "",
    },
    shipping: shippingToStore,
  });

  await markPendingCompleted(pendingOrderId, { stripePaymentIntentId: paymentIntent.id });

  const notifyItems = mapPendingItemsForEmail(pendingData?.items ?? []);
  if (customerEmail) {
    try {
      await sendOrderReceiptEmail({
        to: customerEmail,
        orderId,
        createdAt: new Date((paymentIntent.created ?? Math.floor(Date.now() / 1000)) * 1000),
        currency: paymentIntent.currency ?? "cad",
        amountTotal: paymentIntent.amount_received || paymentIntent.amount || null,
        shippingAmount: pendingData?.shippingCents ?? null,
        items: notifyItems,
        shipping: shippingToStore,
      });
    } catch (err) {
      console.error("Receipt email failed:", err);
    }
  }

  try {
    await sendOrderNotificationEmail({
      orderId,
      createdAt: new Date((paymentIntent.created ?? Math.floor(Date.now() / 1000)) * 1000),
      currency: paymentIntent.currency ?? "cad",
      amountTotal: paymentIntent.amount_received || paymentIntent.amount || null,
      items: notifyItems,
      customerEmail,
      customerName,
      customerPhone,
      shipping: shippingToStore,
    });
  } catch (err) {
    console.error("Order notification failed:", err);
  }

  const shippingAddress = getAddressParts(shippingToStore?.address ?? null);
  const { firstName, lastName } = splitName(customerName ?? "");
  await sendMetaConversionEvent({
    eventName: "Purchase",
    eventId: `purchase_${paymentIntent.id}`,
    eventTime: paymentIntent.created ?? Math.floor(Date.now() / 1000),
    actionSource: "website",
    customData: {
      currency: String((paymentIntent.currency ?? "cad")).toUpperCase(),
      value: Number(paymentIntent.amount_received || paymentIntent.amount || 0) / 100,
      order_id: orderId,
    },
    userData: {
      email: customerEmail ?? "",
      phone: customerPhone ?? "",
      firstName,
      lastName,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.postalCode,
      country: shippingAddress.country,
    },
  });

  return NextResponse.json({ received: true });
}

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    return handleCheckoutSessionCompleted(stripe, event.data.object as Stripe.Checkout.Session);
  }

  if (event.type === "payment_intent.succeeded") {
    return handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
  }

  return NextResponse.json({ received: true });
}
