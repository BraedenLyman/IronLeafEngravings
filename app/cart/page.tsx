"use client";

import Header from "../components/Header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./cart.module.css";
import { useCart } from "../components/cart/CartContext";

export default function CartPage() {
  const { items, removeItem, subtotalCents, clear } = useCart();

  return (
    <main className={shared.page}>
      <Header />

      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>Cart</h1>
          <p className={shared.subtitle}>Review your items before checkout.</p>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            {items.length === 0 ? (
              <div className={styles.empty}>Your cart is empty.</div>
            ) : (
              <>
                <div className={styles.list}>
                  {items.map((i) => (
                    <div className={styles.item} key={i.id}>
                      <div className={styles.left}>
                        {i.imagePreviewUrl ? (
                          <img className={styles.thumb} src={i.imagePreviewUrl} alt="" />
                        ) : (
                          <div className={styles.thumbPlaceholder} />
                        )}
                        <div>
                          <div className={styles.title}>{i.title}</div>
                          <div className={styles.meta}>
                            Qty: {i.quantity} • {i.included}
                            {i.uploadedFileName ? ` • File: ${i.uploadedFileName}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className={styles.right}>
                        <div className={styles.price}>
                          ${(i.unitPriceCents * i.quantity / 100).toFixed(2)}
                        </div>
                        <button className={styles.remove} onClick={() => removeItem(i.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.footer}>
                  <div className={styles.subtotal}>
                    Subtotal: ${(subtotalCents / 100).toFixed(2)}
                  </div>
                  <button className={styles.secondaryBtn} onClick={clear}>
                    Clear cart
                  </button>
                  <button className={styles.primaryBtn} disabled>
                    Checkout (next)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
