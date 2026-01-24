import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  });
}
