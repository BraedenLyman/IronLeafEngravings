import { NextResponse } from "next/server";
import { getStripe } from "@/app/lib/stripe";
import admin from "firebase-admin";
import { adminDb } from "@/app/lib/firebaseAdmin";
import {
  normalizeCountry,
  normalizeItemPriceCents,
  SHIPPING_RATE_ID_BY_COUNTRY,
} from "@/app/lib/checkoutPricing";

export const runtime = "nodejs";

type CartItem = {
  name: string;
  quantity: number;
  priceInCents: number;
  coasterSetSize?: number;
  slug?: string;
  uploadedImageUrl?: string;
  imageUrl?: string;
  uploadedFileName?: string;
};

type CartBody = {
  items: CartItem[];
  productSlug?: string;
  uploadedFileName?: string;
  imageUrl?: string;
  uploadedImageUrl?: string;
  shipping?: {
    fullName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
};

type BuyNowBody = {
  slug: string;
  quantity?: number;
  uploadedImageUrl?: string;
  uploadedFileName?: string;
};

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const body = (await req.json()) as Partial<CartBody & BuyNowBody>;
    const allowedShippingCountries = Object.keys(SHIPPING_RATE_ID_BY_COUNTRY);

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const priceOverrideCents = Number(process.env.STRIPE_PRICE_OVERRIDE_CENTS ?? "");
    const hasPriceOverride = Number.isFinite(priceOverrideCents) && priceOverrideCents > 0;

    if (Array.isArray(body.items) && body.items.length > 0) {
      const shippingCountry = normalizeCountry(body.shipping?.country);
      const shippingRateId = SHIPPING_RATE_ID_BY_COUNTRY[shippingCountry];
      if (!shippingRateId) {
        return NextResponse.json(
          { error: "Shipping country is required and must be one of: Canada, United Kingdom, United States, or New Zealand." },
          { status: 400 }
        );
      }

      const items = body.items.map((i) => ({
        ...i,
        priceInCents: normalizeItemPriceCents({
          hasPriceOverride,
          priceOverrideCents,
          slug: i.slug,
          name: i.name,
          priceInCents: i.priceInCents,
          coasterSetSize: i.coasterSetSize,
        }),
      }));

      const db = adminDb;

      const itemImageUrl =
        items.find((i) => i.uploadedImageUrl || i.imageUrl)?.uploadedImageUrl ??
        items.find((i) => i.uploadedImageUrl || i.imageUrl)?.imageUrl ??
        "";
      const uploadedUrl = String(body.uploadedImageUrl ?? body.imageUrl ?? itemImageUrl ?? "");

      const pendingRef = db.collection("pendingCheckouts").doc();
      const shipping = body.shipping ?? null;
      const pendingShipping = shipping
        ? {
            name: shipping.fullName ?? "",
            email: shipping.email ?? "",
            phone: shipping.phone ?? "",
            address: {
              line1: shipping.address1 ?? "",
              line2: shipping.address2 ?? "",
              city: shipping.city ?? "",
              state: shipping.province ?? "",
              postal_code: shipping.postalCode ?? "",
              country: shipping.country ?? "",
            },
          }
        : null;
      await pendingRef.set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
        type: "cart",
        productSlug: body.productSlug ?? "cart",
        uploadedFileName: body.uploadedFileName ?? "",
        imageUrl: uploadedUrl,
        uploadedImageUrl: uploadedUrl,
        shipping: pendingShipping,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          priceInCents: i.priceInCents,
          coasterSetSize: i.coasterSetSize ?? null,
          imageUrl: i.imageUrl ?? i.uploadedImageUrl ?? "",
          uploadedImageUrl: i.uploadedImageUrl ?? i.imageUrl ?? "",
          uploadedFileName: i.uploadedFileName ?? "",
        })),
      });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: items.map((i) => ({
          quantity: i.quantity,
          price_data: {
            currency: "cad",
            unit_amount: i.priceInCents,
            product_data: { name: i.name },
          },
        })),

        billing_address_collection: "auto",
        shipping_address_collection: { allowed_countries: allowedShippingCountries as ("CA" | "GB" | "US" | "NZ")[] },
        shipping_options: [{ shipping_rate: shippingRateId }],
        phone_number_collection: { enabled: true },

        customer_creation: "always",

        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,

        metadata: {
          pendingOrderId: pendingRef.id,
          productSlug: body.productSlug ?? "cart",
        },
      });

      return NextResponse.json({ url: session.url });
    }

    const slug = (body.slug ?? "").trim();
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Buy Now not wired up yet (no cart items sent)" },
      { status: 400 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("POST /api/checkout error:", e);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
