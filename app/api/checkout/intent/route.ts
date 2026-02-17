import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getStripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/lib/firebaseAdmin";
import {
  normalizeCountry,
  normalizeItemPriceCents,
  SHIPPING_CENTS_BY_COUNTRY,
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

type RequestBody = {
  items: CartItem[];
  productSlug?: string;
  uploadedFileName?: string;
  imageUrl?: string;
  uploadedImageUrl?: string;
  shipping: {
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

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const db = adminDb;
    const body = (await req.json()) as Partial<RequestBody>;
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const shipping = body.shipping;

    if (!rawItems.length) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    if (!shipping) {
      return NextResponse.json({ error: "Shipping details are required." }, { status: 400 });
    }

    const shippingCountry = normalizeCountry(shipping.country);
    const shippingCents = SHIPPING_CENTS_BY_COUNTRY[shippingCountry];
    if (!shippingCents) {
      return NextResponse.json(
        { error: "Shipping country must be Canada, United Kingdom, United States, or New Zealand." },
        { status: 400 }
      );
    }

    const priceOverrideCents = Number(process.env.STRIPE_PRICE_OVERRIDE_CENTS ?? "");
    const hasPriceOverride = Number.isFinite(priceOverrideCents) && priceOverrideCents > 0;

    const items = rawItems.map((i) => ({
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

    const subtotalCents = items.reduce((sum, i) => sum + i.priceInCents * i.quantity, 0);
    const amountTotalCents = subtotalCents + shippingCents;
    if (!Number.isFinite(amountTotalCents) || amountTotalCents <= 0) {
      return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
    }

    const itemImageUrl =
      items.find((i) => i.uploadedImageUrl || i.imageUrl)?.uploadedImageUrl ??
      items.find((i) => i.uploadedImageUrl || i.imageUrl)?.imageUrl ??
      "";
    const uploadedUrl = String(body.uploadedImageUrl ?? body.imageUrl ?? itemImageUrl ?? "");

    const pendingRef = db.collection("pendingCheckouts").doc();
    const pendingShipping = {
      name: shipping.fullName ?? "",
      email: shipping.email ?? "",
      phone: shipping.phone ?? "",
      address: {
        line1: shipping.address1 ?? "",
        line2: shipping.address2 ?? "",
        city: shipping.city ?? "",
        state: shipping.province ?? "",
        postal_code: shipping.postalCode ?? "",
        country: shippingCountry,
      },
    };

    await pendingRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
      type: "cart",
      productSlug: body.productSlug ?? "cart",
      uploadedFileName: body.uploadedFileName ?? "",
      imageUrl: uploadedUrl,
      uploadedImageUrl: uploadedUrl,
      shipping: pendingShipping,
      subtotalCents,
      shippingCents,
      amountTotalCents,
      items: items.map((i) => ({
        slug: i.slug ?? "",
        name: i.name,
        quantity: i.quantity,
        priceInCents: i.priceInCents,
        coasterSetSize: i.coasterSetSize ?? null,
        imageUrl: i.imageUrl ?? i.uploadedImageUrl ?? "",
        uploadedImageUrl: i.uploadedImageUrl ?? i.imageUrl ?? "",
        uploadedFileName: i.uploadedFileName ?? "",
      })),
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountTotalCents,
      currency: "cad",
      automatic_payment_methods: { enabled: true },
      receipt_email: shipping.email || undefined,
      shipping: {
        name: shipping.fullName || "",
        phone: shipping.phone || undefined,
        address: {
          line1: shipping.address1 || "",
          line2: shipping.address2 || undefined,
          city: shipping.city || "",
          state: shipping.province || "",
          postal_code: shipping.postalCode || "",
          country: shippingCountry,
        },
      },
      metadata: {
        pendingOrderId: pendingRef.id,
        productSlug: body.productSlug ?? "cart",
      },
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Missing PaymentIntent client secret." }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subtotalCents,
      shippingCents,
      amountTotalCents,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("POST /api/checkout/intent error:", e);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
