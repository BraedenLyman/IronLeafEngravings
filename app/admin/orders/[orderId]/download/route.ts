import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { requireAdmin } from "@/app/lib/adminGate";

function pickUploadedImage(o: any): { url: string; name?: string } | null {
  const items: any[] = Array.isArray(o?.items) ? o.items : [];

  const url =
    o?.uploadedImageUrl ||
    items.find((it) => it?.uploadedImageUrl)?.uploadedImageUrl ||
    "";

  const name =
    o?.uploadedFileName ||
    items.find((it) => it?.uploadedFileName)?.uploadedFileName ||
    undefined;

  if (!url) return null;
  return { url, name };
}

export async function GET(
  _req: Request,
  { params }: { params: { orderId: string } }
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const orderId = String(params.orderId || "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const doc = await adminDb.collection("orders").doc(orderId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = doc.data() as any;
  const img = pickUploadedImage(order);
  if (!img) {
    return NextResponse.json({ error: "No uploaded image for this order" }, { status: 404 });
  }

  const r = await fetch(img.url);
  if (!r.ok) {
    return NextResponse.json(
      { error: "Failed to fetch uploaded image" },
      { status: 502 }
    );
  }

  const contentType = r.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await r.arrayBuffer();

  const safeBase =
    (img.name || `order-${orderId}-upload`)
      .replace(/[^\w.\-()+ ]+/g, "_")
      .trim() || `order-${orderId}-upload`;
      
  let filename = safeBase;
  if (!/\.[a-z0-9]{2,6}$/i.test(filename)) {
    const ext =
      contentType.includes("png") ? "png" :
      contentType.includes("jpeg") ? "jpg" :
      contentType.includes("webp") ? "webp" :
      contentType.includes("gif") ? "gif" :
      "";
    if (ext) filename = `${filename}.${ext}`;
  }

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
