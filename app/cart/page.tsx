"use client";

import Header from "../components/Header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./cart.module.css";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "../components/cart/CartContext";
import { Button } from "antd";

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const { items, removeItem, subtotalCents, clear } = useCart();

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity ?? 0), 0),
    [items]
  );

  const handleCheckout = async () => {
    setServerError("");

    if (items.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            name: i.title,
            quantity: i.quantity,
            priceInCents: i.unitPriceCents,
            uploadedImageUrl: i.uploadedImageUrl,
          })),
          productSlug: "cart",
          uploadedFileName: items
            .map((i) => i.uploadedFileName)
            .filter(Boolean)
            .join(", "),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Checkout failed");
      if (!data?.url) throw new Error("No checkout URL returned");

      window.location.href = data.url;
    } catch (e: any) {
      setServerError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={shared.page}>
      <Header />

      <section className={shared.container}>
        <div className={shared.hero}>
          <div>
            <h1 className={shared.title}>Cart</h1>
            <p className={shared.subtitle}>Review your items before checkout.</p>
          </div>

          <div className={styles.heroRow}>
            {items.length > 0 && (
              <div className={styles.cartPill}>
                <span className={styles.cartPillLabel}>Items</span>
                <span className={styles.cartPillValue}>{itemCount}</span>
              </div>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon} aria-hidden />
            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
            <p className={styles.emptyText}>
              Pick a product, upload an image, and we’ll engrave it onto your item.
            </p>

            {serverError ? (
              <p className={styles.note}>
                {serverError}
              </p>
            ) : null}

            <Button className={shared.pBtn} href="/shop">
              Continue shopping
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
          
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Cart items</h2>
                <button className={styles.linkBtn} onClick={clear} type="button">
                  Clear cart
                </button>
              </div>

              <div className={styles.items}>
                {items.map((i) => {
                  const qty = i.quantity ?? 0;
                  const lineTotal = i.unitPriceCents * qty;
                  const previewUrl = i.imagePreviewUrl ?? i.uploadedImageUrl;

                  return (
                    <div className={styles.item} key={i.id}>
                      <div className={styles.thumbWrap}>
                        {previewUrl ? (
                          <img
                            className={styles.thumb}
                            src={previewUrl}
                            alt={`${i.title} preview`}
                            loading="lazy"
                          />
                        ) : (
                          <div className={styles.thumbPlaceholder} aria-hidden />
                        )}
                      </div>

                      <div className={styles.itemMain}>
                        <div className={styles.itemTop}>
                          <div className={styles.itemTitleRow}>
                            <div className={styles.itemTitle} title={i.title}>
                              {i.title}
                            </div>
                            <span className={styles.qtyBadge}>Qty {qty}</span>
                          </div>

                          <div className={styles.itemPrice}>{formatMoney(lineTotal)}</div>
                        </div>

                        <div className={styles.meta}>
                          {i.included ? (
                            <>
                              <span className={styles.metaDot}>•</span>
                              <span>{i.included}</span>
                            </>
                          ) : null}

                          {i.uploadedFileName ? (
                            <>
                              <span className={styles.metaDot}>•</span>
                              <span className={styles.fileChip} title={i.uploadedFileName}>
                                File: {i.uploadedFileName}
                              </span>
                            </>
                          ) : null}
                        </div>

                        <div className={styles.itemActions}>
                          <button
                            className={styles.dangerBtn}
                            onClick={() => removeItem(i.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className={styles.summary}>
              <div className={styles.summaryCard}>
                <h2 className={styles.summaryTitle}>Order summary</h2>

                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span className={styles.muted}>Subtotal</span>
                    <span className={styles.strong}>{formatMoney(subtotalCents)}</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={styles.muted}>Shipping</span>
                    <span className={styles.muted}>Calculated in Stripe</span>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.summaryRow}>
                    <span className={styles.strong}>Total</span>
                    <span className={styles.total}>{formatMoney(subtotalCents)}</span>
                  </div>
                </div>

    
                {serverError ? (
                  <p className={styles.note} >
                    {serverError}
                  </p>
                ) : null}

                <button
                  className={shared.pBtn}
                  onClick={handleCheckout}
                  disabled={loading}
                  type="button"
                >
                  {loading ? "Starting checkout..." : "Checkout"}
                </button>

                <Button className={shared.sBtn} href="/shop">
                  Add more items
                </Button>

                <p className={styles.note}>
                  You’ll be redirected to Stripe to complete payment securely.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
