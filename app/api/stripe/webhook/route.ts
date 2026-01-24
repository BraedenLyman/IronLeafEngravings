import { stripe } from "@/app/lib/stripe";
import { db } from "@/app/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const payload = await req.text();

  const event = stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      await db.collection("orders").doc(session.id).set({
        amount: session.amount_total,
        currency: session.currency,
        email: session.customer_details?.email,
        metadata: session.metadata,
        createdAt: new Date(),
      });
    }
  }

  return NextResponse.json({ received: true });
}
