import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import admin from "firebase-admin";

if (!admin.apps.length) admin.initializeApp();

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

type Body = {
  slug: string;
  quantity?: number;
  uploadedImageUrl?: string;
  uploadedFileName?: string;
};


export const createCheckoutSession = onRequest(
   {secrets: [STRIPE_SECRET_KEY], cors: ["http://localhost:3000", "https://iron-leaf.web.app"]},
  async (req, res): Promise<void> => {
    try {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Use POST" });
        return;
      }

      const body = (req.body ?? {}) as Body;
      const slug = body.slug?.trim();
      const quantity = Math.max(1, Math.min(99, Number(body.quantity ?? 1)));

      if (!slug) {
        res.status(400).json({ error: "Missing slug" });
        return;
      }

      const snap = await admin.firestore().collection("products").doc(slug).get();
      if (!snap.exists) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const product = snap.data() as {
        stripePriceId?: string;
        active: boolean;
      };

      if (!product.active) {
        res.status(400).json({ error: "Product is not active" });
        return;
      }

      if (!product.stripePriceId) {
        res.status(400).json({ error: "Missing stripePriceId on product" });
        return;
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: "2024-06-20" as any,
      });

      const baseUrl = process.env.APP_BASE_URL || "https://iron-leaf.web.app";
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

      res.json({ url: session.url });
      return;
    } catch (e: any) {
      res.status(500).json({ error: e?.message ?? "Unknown error" });
      return;
    }
  }
);
