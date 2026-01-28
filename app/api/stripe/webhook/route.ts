import { NextResponse } from "next/server";
import { getStripe } from "@/app/lib/stripe";
import { getDb } from "@/app/lib/firebaseAdmin";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const payload = await req.text();
  const stripe = getStripe();
  const db = getDb();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "customer_details"],
      });

      const cd = full.customer_details;
      const md = full.metadata ?? {};

      const shipping =
        cd?.address
          ? {
              name: cd.name ?? "",
              email: cd.email ?? "",
              phone: cd.phone ?? "",
              address: {
                line1: cd.address.line1 ?? "",
                line2: cd.address.line2 ?? "",
                city: cd.address.city ?? "",
                state: cd.address.state ?? "",
                postal_code: cd.address.postal_code ?? "",
                country: cd.address.country ?? "",
              },
            }
          : null;

      const lineItems =
        full.line_items?.data?.map((li) => ({
          description: li.description ?? "",
          quantity: li.quantity ?? 0,
          amountTotal: li.amount_total ?? 0,
          currency: li.currency ?? "cad",
          priceId: li.price?.id ?? null,
        })) ?? [];

      await db.collection("orders").doc(full.id).set({
        createdAt: new Date(),
        status: "paid",

        amount: full.amount_total,
        currency: full.currency,

        stripe: {
          sessionId: full.id,
          paymentIntent: full.payment_intent ?? null,
        },

        shipping,
        lineItems,

        order: {
          slug: md.slug ?? "",
          quantity: Number(md.quantity ?? "1"),
          uploadedImageUrl: md.uploadedImageUrl ?? "",
          uploadedFileName: md.uploadedFileName ?? "",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
