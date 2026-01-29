import Image from "next/image";
import { adminDb } from "@/app/lib/firebaseAdmin";
import { requireAdmin } from "@/app/lib/adminGate";
import { redirect } from "next/navigation";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function updateOrderStatus(formData: FormData) {
  "use server";

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!orderId) return;

  const allowed = new Set(["new", "in_progress", "shipped", "cancelled"]);
  if (!allowed.has(status)) return;

  await adminDb.collection("orders").doc(orderId).update({
    status,
    statusUpdatedAt: new Date(),
  });
}

type OrderStatus = "new" | "in_progress" | "shipped" | "cancelled";

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  in_progress: "In progress",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

const STATUS_ACCENT: Record<OrderStatus, { border: string; background: string; badge: string }> = {
  new: { border: "#2b6de6", background: "#0d1526", badge: "#1a2b4d" },
  in_progress: { border: "#f0b429", background: "#1f1706", badge: "#3a2b0a" },
  shipped: { border: "#34c759", background: "#0d1c12", badge: "#14311d" },
  cancelled: { border: "#ef4444", background: "#220c0c", badge: "#3a1414" },
};

export default async function AdminOrdersPage() {
  const gate = await requireAdmin();
  if (!gate.ok) redirect("/admin/login");

  const snap = await adminDb
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const orders = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  // Group into sections
  const groups: Record<OrderStatus, any[]> = {
    new: [],
    in_progress: [],
    shipped: [],
    cancelled: [],
  };

  for (const o of orders) {
    const s = (o.status ?? "new") as OrderStatus;
    (groups[s] ?? groups.new).push(o);
  }

  const selectStyle: React.CSSProperties = {
    padding: 8,
    borderRadius: 10,
    border: "1px solid #444",
    background: "#1a1a1a",
    color: "white",
    outline: "none",
  };

  const sectionTitleStyle: React.CSSProperties = {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 0.2,
  };

  const badgeStyle: React.CSSProperties = {
    marginLeft: 10,
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #333",
    background: "#121212",
    opacity: 0.95,
  };

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        select, option {
          background-color: #1a1a1a;
          color: #ffffff;
        }
      `}</style>

      <h1 style={{ marginBottom: 12 }}>Orders</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>Signed in as {gate.email}</p>

      {orders.length === 0 ? (
        <div style={{ padding: 16, border: "1px solid #333", borderRadius: 12, marginTop: 16 }}>
          No orders yet.
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {(Object.keys(groups) as OrderStatus[]).map((statusKey) => {
            const list = groups[statusKey];
            if (!list.length) return null;

            const accent = STATUS_ACCENT[statusKey];

            return (
              <section
                key={statusKey}
                style={{
                  marginBottom: 18,
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid ${accent.border}`,
                  background: accent.background,
                }}
              >
                <div
                  style={{
                    ...sectionTitleStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 10px",
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.25)",
                    border: `1px solid ${accent.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: accent.border,
                      boxShadow: `0 0 12px ${accent.border}`,
                    }}
                  />
                  <span>{STATUS_LABEL[statusKey]}</span>
                  <span style={{ ...badgeStyle, background: accent.badge, borderColor: accent.border }}>
                    {list.length}
                  </span>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {list.map((o) => {
                    const created =
                      o.createdAt?.toDate?.()?.toLocaleString?.() ??
                      (o.createdAt ? String(o.createdAt) : "—");

                    const shippingAddr = o?.shipping?.address || o?.shipping || null;
                    const shippingLines = (() => {
                      if (!shippingAddr) return [];

                      const line1 = shippingAddr.line1 ?? "";
                      const line2 = shippingAddr.line2 ?? "";
                      const city = shippingAddr.city ?? "";
                      const province = shippingAddr.state ?? shippingAddr.province ?? "";
                      const postal = shippingAddr.postal_code ?? shippingAddr.postal ?? "";
                      const country = shippingAddr.country ?? "";

                      const cityLine = [city, [province, postal].filter(Boolean).join(" ").trim()]
                        .filter(Boolean)
                        .join(", ");

                      return [line1, line2, cityLine, country].filter(
                        (line) => line && String(line).trim()
                      );
                    })();
                    const shippingInline = shippingLines.join(", ") || "N/A";
                    const shippingName = o?.shipping?.name || o?.customer?.name || "N/A";
                    const shippingEmail = o?.customer?.email || "N/A";
                    const shippingPhone = o?.customer?.phone || "N/A";

                    const items: Array<any> = Array.isArray(o.items) ? o.items : [];

                    const thumbUrl =  o.imageUrl || o.uploadedImageUrl || items.find((it) => it?.imageUrl)?.imageUrl || items.find((it) => it?.uploadedImageUrl)?.uploadedImageUrl || "";

                    const downloadHref = `/admin/orders/${o.id}/download`;

                    return (
                      <div
                        key={o.id}
                        style={{
                          border: "1px solid #333",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gridTemplateColumns: "140px 1fr",
                          gap: 14,
                          alignItems: "start",
                        }}
                      >
                        <div style={{ display: "grid", gap: 10 }}>
                          <div
                            style={{
                              borderRadius: 12,
                              overflow: "hidden",
                              border: "1px solid #2a2a2a",
                              background: "#111",
                              width: 140,
                              height: 140,
                              position: "relative",
                            }}
                          >
                            {thumbUrl ? (
                              <Image
                                src={thumbUrl}
                                alt="Uploaded image"
                                fill
                                sizes="140px"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "grid",
                                  placeItems: "center",
                                  opacity: 0.7,
                                  fontSize: 12,
                                }}
                              >
                                No image
                              </div>
                            )}
                          </div>

                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>
                                {o.customer?.name ?? "Customer"} — {o.customer?.email ?? "—"}
                              </div>
                              <div style={{ opacity: 0.8, fontSize: 13 }}>Order date: {created}</div>
                              <div style={{ opacity: 0.8, fontSize: 13 }}>Ship to: {shippingInline}</div>
                              <div style={{ opacity: 0.8, fontSize: 13 }}>Recipient: {shippingName}</div>
                              <div style={{ opacity: 0.8, fontSize: 13 }}>
                                Contact: {shippingEmail}{shippingPhone !== "N/A" ? ` | ${shippingPhone}` : ""}
                              </div>
                              <div style={{ opacity: 0.7, fontSize: 12 }}>
                                Order ID: {o.orderId ?? o.id}
                              </div>
                            </div>

                            <form action={updateOrderStatus} style={{ display: "flex", gap: 8, alignItems: "start" }}>
                              <input type="hidden" name="orderId" value={o.id} />
                              <select name="status" defaultValue={o.status ?? "new"} style={selectStyle}>
                                <option value="new">New</option>
                                <option value="in_progress">In progress</option>
                                <option value="shipped">Shipped</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              <button
                                type="submit"
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: 10,
                                  border: "1px solid #444",
                                  background: "#1a1a1a",
                                  color: "white",
                                  cursor: "pointer",
                                }}
                              >
                                Save
                              </button>
                            </form>
                          </div>

                          <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: 10 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Items</div>
                            <div style={{ display: "grid", gap: 6 }}>
                              {items.length === 0 ? (
                                <div style={{ opacity: 0.75 }}>—</div>
                              ) : (
                                items.map((it, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      gap: 10,
                                      fontSize: 14,
                                      opacity: 0.95,
                                      alignItems: "center",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      {(it.uploadedImageUrl || it.imageUrl) ? (
                                        <img
                                          src={it.uploadedImageUrl || it.imageUrl}
                                          alt="Item upload"
                                          style={{
                                            width: 44,
                                            height: 44,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                            border: "1px solid #2a2a2a",
                                          }}
                                        />
                                      ) : (
                                        <div
                                          style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 8,
                                            border: "1px solid #2a2a2a",
                                            background: "#111",
                                          }}
                                        />
                                      )}
                                      <div>
                                        {it.title ?? "Item"} × {it.quantity ?? 1}
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ opacity: 0.85 }}>{money(it.priceCents ?? 0)}</div>
                                      {(it.uploadedImageUrl || it.imageUrl) ? (
                                        <a
                                          href={`/admin/orders/${o.id}/download?item=${idx}`}
                                          style={{
                                            padding: "4px 8px",
                                            borderRadius: 8,
                                            border: "1px solid #444",
                                            background: "#1a1a1a",
                                            color: "white",
                                            textDecoration: "none",
                                            fontSize: 12,
                                          }}
                                        >
                                          Download
                                        </a>
                                      ) : null}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
