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
      {/* Makes the dropdown options readable in most browsers */}
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

            return (
              <section key={statusKey} style={{ marginBottom: 18 }}>
                <div style={sectionTitleStyle}>
                  {STATUS_LABEL[statusKey]}
                  <span style={badgeStyle}>{list.length}</span>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {list.map((o) => {
                    const created =
                      o.createdAt?.toDate?.()?.toLocaleString?.() ??
                      (o.createdAt ? String(o.createdAt) : "—");

                    const shipping = o.shipping
                      ? `${o.shipping.line1}${o.shipping.line2 ? `, ${o.shipping.line2}` : ""}, ${o.shipping.city}, ${o.shipping.province} ${o.shipping.postal}, ${o.shipping.country}`
                      : "—";

                    const items: Array<any> = Array.isArray(o.items) ? o.items : [];

                    const thumbUrl =
                      o.uploadedImageUrl ||
                      items.find((it) => it?.uploadedImageUrl)?.uploadedImageUrl ||
                      "";

                    const downloadHref = `/api/admin/orders/${o.id}/download`;

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

                          {thumbUrl ? (
                            <a
                              href={downloadHref}
                              style={{
                                textAlign: "center",
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: "1px solid #444",
                                background: "#1a1a1a",
                                color: "white",
                                textDecoration: "none",
                                fontSize: 13,
                              }}
                            >
                              Download upload
                            </a>
                          ) : null}
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>
                                {o.customer?.name ?? "Customer"} — {o.customer?.email ?? "—"}
                              </div>
                              <div style={{ opacity: 0.8, fontSize: 13 }}>Order date: {created}</div>
                              <div style={{ opacity: 0.8, fontSize: 13 }}>Ship to: {shipping}</div>
                              <div style={{ opacity: 0.7, fontSize: 12 }}>Order ID: {o.id}</div>
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
                                    }}
                                  >
                                    <div>
                                      {it.title ?? "Item"} × {it.quantity ?? 1}
                                    </div>
                                    <div style={{ opacity: 0.85 }}>{money(it.priceCents ?? 0)}</div>
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
