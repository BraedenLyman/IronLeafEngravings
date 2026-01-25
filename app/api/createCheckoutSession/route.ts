import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { db } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

type Body = {
  slug: string;
  quantity?: number;
  uploadedImageUrl?: string;
  uploadedFileName?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const slug = body.slug?.trim();
    const quantity = Math.max(1, Math.min(99, Number(body.quantity ?? 1)));

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const snap = await db.collection("products").doc(slug).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = snap.data() as { stripePriceId?: string; active: boolean };
    if (!product.active) {
      return NextResponse.json({ error: "Product is not active" }, { status: 400 });
    }

    if (!product.stripePriceId) {
      return NextResponse.json(
        { error: "Missing stripePriceId on product" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      "https://iron-leaf.web.app";
    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/shop/${encodeURIComponent(slug)}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: product.stripePriceId, quantity }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        slug,
        uploadedImageUrl: body.uploadedImageUrl ?? "",
        uploadedFileName: body.uploadedFileName ?? "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
