import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Deprecated checkout route. Use /api/checkout/intent to keep shipping amount locked to the quoted price.",
    },
    { status: 410 }
  );
}

