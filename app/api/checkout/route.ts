import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://iron-leaf.web.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: body.items.map((i: any) => ({
      quantity: i.quantity,
      price_data: {
        currency: "cad",
        unit_amount: i.priceInCents,
        product_data: { name: i.name },
      },
    })),
    metadata: {
      imageUrl: body.imageUrl ?? "",
      uploadedFileName: body.uploadedFileName ?? "",
      productSlug: body.productSlug ?? "",
    },
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
