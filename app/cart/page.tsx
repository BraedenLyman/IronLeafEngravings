"use client";

import Header from "../components/Header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./cart.module.css";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "../components/cart/CartContext";

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const { items, removeItem, subtotalCents, clear } = useCart();

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity ?? 0), 0),
    [items]
  );

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

            <Link className={styles.primaryBtn} href="/shop">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Cart items</h2>
                <button className={styles.linkBtn} onClick={clear}>
                  Clear cart
                </button>
              </div>

              <div className={styles.items}>
                {items.map((i) => {
                  const lineTotal = i.unitPriceCents * i.quantity;

                  return (
                    <div className={styles.item} key={i.id}>
                      <div className={styles.thumbWrap}>
                        {i.imagePreviewUrl ? (
                          <img
                            className={styles.thumb}
                            src={i.imagePreviewUrl}
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
                            <div className={styles.itemTitle}>{i.title}</div>
                            <span className={styles.qtyBadge}>Qty {i.quantity}</span>
                          </div>

                          <div className={styles.itemPrice}>{formatMoney(lineTotal)}</div>
                        </div>

                        <div className={styles.meta}>
                          <span className={styles.metaDot}>•</span>
                          <span>{i.included}</span>

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
                    <span className={styles.muted}>Calculated at checkout</span>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.summaryRow}>
                    <span className={styles.strong}>Total</span>
                    <span className={styles.total}>{formatMoney(subtotalCents)}</span>
                  </div>
                </div>

                <Link className={styles.primaryBtn} href="/checkout-confirm">
                  Checkout
                </Link>

                <Link className={styles.secondaryBtn} href="/shop">
                  Add more items
                </Link>

                <p className={styles.note}>
                  You’ll confirm your upload and details before payment.
                </p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
