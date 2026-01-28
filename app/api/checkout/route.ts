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

    // ✅ Save shipping + existing fields to the session
    metadata: {
      imageUrl: body.imageUrl ?? "",
      uploadedFileName: body.uploadedFileName ?? "",
      productSlug: body.productSlug ?? "",

      // Shipping details from checkout-confirm page
      ship_fullName: body.shipping?.fullName ?? "",
      ship_email: body.shipping?.email ?? "",
      ship_phone: body.shipping?.phone ?? "",
      ship_address1: body.shipping?.address1 ?? "",
      ship_address2: body.shipping?.address2 ?? "",
      ship_city: body.shipping?.city ?? "",
      ship_province: body.shipping?.province ?? "",
      ship_postalCode: body.shipping?.postalCode ?? "",
      ship_country: body.shipping?.country ?? "",
    },

    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
