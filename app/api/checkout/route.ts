import { NextResponse } from "next/server";
import { getStripe } from "@/app/lib/stripe";
import admin from "firebase-admin";

export const runtime = "nodejs";

type CartItem = {
  name: string;
  quantity: number;
  priceInCents: number;
  uploadedImageUrl?: string;
  imageUrl?: string;
};

type CartBody = {
  items: CartItem[];
  productSlug?: string;
  uploadedFileName?: string;
  imageUrl?: string;
  uploadedImageUrl?: string;
};

type BuyNowBody = {
  slug: string;
  quantity?: number;
  uploadedImageUrl?: string;
  uploadedFileName?: string;
};

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin;
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const body = (await req.json()) as Partial<CartBody & BuyNowBody>;

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    if (Array.isArray(body.items) && body.items.length > 0) {
      const items = body.items;

      const adminApp = getAdmin();
      const db = adminApp.firestore();

      const itemImageUrl =
        items.find((i) => i.uploadedImageUrl || i.imageUrl)?.uploadedImageUrl ??
        items.find((i) => i.uploadedImageUrl || i.imageUrl)?.imageUrl ??
        "";
      const uploadedUrl = String(body.uploadedImageUrl ?? body.imageUrl ?? itemImageUrl ?? "");

      const pendingRef = db.collection("pendingCheckouts").doc();
      await pendingRef.set({
        createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
        status: "pending",
        type: "cart",
        productSlug: body.productSlug ?? "cart",
        uploadedFileName: body.uploadedFileName ?? "",
        imageUrl: uploadedUrl,
        uploadedImageUrl: uploadedUrl,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          priceInCents: i.priceInCents,
          imageUrl: i.imageUrl ?? i.uploadedImageUrl ?? "",
          uploadedImageUrl: i.uploadedImageUrl ?? i.imageUrl ?? "",
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
        shipping_address_collection: { allowed_countries: ["CA", "US"] },
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
  } catch (e: any) {
    console.error("POST /api/checkout error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
