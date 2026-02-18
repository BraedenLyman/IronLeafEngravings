"use client";

import Header from "../components/header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./cart.module.css";
import { useMemo } from "react";
import { useCart } from "../components/cart/CartContext";
import { Button } from "antd";
import { FaArrowDown } from "react-icons/fa";
import { trackMetaEvent } from "@/app/lib/metaPixel";

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const { items, removeItem, clear } = useCart();

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity ?? 0), 0),
    [items]
  );
  const subtotalCents = useMemo(
    () =>
      items.reduce((sum, i) => {
        const unitPrice = i.unitPriceCents;
        return sum + unitPrice * (i.quantity ?? 0);
      }, 0),
    [items]
  );

  const handleCheckoutClick = () => {
    trackMetaEvent("InitiateCheckout", {
      content_type: "product",
      currency: "CAD",
      value: subtotalCents / 100,
      num_items: itemCount,
    });
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
                  const unitPrice = i.unitPriceCents;
                  const lineTotal = unitPrice * qty;
                  const productThumb = i.productImageUrl ?? i.imagePreviewUrl ?? i.uploadedImageUrl;
                  const uploadedPreview = i.uploadedImageUrl ?? i.imagePreviewUrl;

                  return (
                    <div className={styles.item} key={i.id}>
                      <div className={styles.thumbWrap}>
                        {productThumb ? (
                          <img
                            className={styles.thumb}
                            src={productThumb}
                            alt={`${i.title} product`}
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

                        {uploadedPreview ? (
                          <details className={styles.uploadDetails}>
                            <summary className={styles.uploadSummary}>
                              
                              Uploaded Image
                              <span className={styles.uploadSummaryIcon} aria-hidden="true">
                                <FaArrowDown />
                              </span>
                            </summary>
                            <div className={styles.uploadContent}>
                              <div className={styles.uploadThumbWrap}>
                                <img
                                  className={styles.uploadThumb}
                                  src={uploadedPreview}
                                  alt={`${i.title} uploaded preview`}
                                  loading="lazy"
                                />
                              </div>
                              {i.uploadedFileName ? (
                                <div className={styles.uploadFileName} title={i.uploadedFileName}>
                                  File: {i.uploadedFileName}
                                </div>
                              ) : null}
                            </div>
                          </details>
                        ) : null}

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
                    <span className={styles.muted}>Calculated on next page</span>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.summaryRow}>
                    <span className={styles.strong}>Total</span>
                    <span className={styles.total}>{formatMoney(subtotalCents)}</span>
                  </div>
                </div>

    
                <Button className={shared.pBtn} href="/checkout-confirm" onClick={handleCheckoutClick}>
                  Checkout
                </Button>

                <Button className={shared.sBtn} href="/shop">
                  Add more items
                </Button>

              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
