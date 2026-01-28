"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./success.module.css";

function shortId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");

  if (!session_id) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.card}>
            <div className={styles.headerRow}>
              <div className={styles.badgeWarn}>!</div>
              <div>
                <h1 className={styles.title}>We couldn’t find your confirmation</h1>
                <p className={styles.subtitle}>
                  The checkout session id is missing. If you think you were charged, contact us and we’ll help right away.
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              <Link className={styles.primaryBtn} href="/shop">
                Return to Shop
              </Link>
              <Link className={styles.secondaryBtn} href="/cart">
                View Cart
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.card}>
          <div className={styles.headerRow}>
            <div className={styles.badgeSuccess} aria-hidden="true">
              ✓
            </div>

            <div>
              <h1 className={styles.title}>Order confirmed</h1>
              <p className={styles.subtitle}>
                Thanks for your order — we’ve received it and will begin preparing your engraving.
              </p>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Order details</h2>

              <div className={styles.rows}>
                <div className={styles.row}>
                  <span className={styles.label}>Confirmation ID</span>
                  <span className={styles.value} title={session_id}>
                    {shortId(session_id)}
                  </span>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>Status</span>
                  <span className={styles.value}>
                    <span className={styles.pill}>Created</span>
                  </span>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>What’s next</span>
                  <span className={styles.value}>
                    You’ll receive an email receipt and updates once your order is in production.
                  </span>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>Need changes?</span>
                  <span className={styles.value}>
                    Reply to your confirmation email as soon as possible and include your Confirmation ID.
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Next steps</h2>

              <ul className={styles.list}>
                <li>Check your inbox for the receipt (and your spam folder just in case).</li>
                <li>
                  If you uploaded an image, we’ll review it and contact you if anything needs adjusting.
                </li>
                <li>We’ll send tracking once your order ships.</li>
              </ul>

              <div className={styles.actions}>
                <Link className={styles.primaryBtn} href="/shop">
                  Continue shopping
                </Link>
                <Link className={styles.secondaryBtn} href="/cart">
                  View cart
                </Link>
              </div>

              <p className={styles.helpText}>
                Questions?{" "}
                <Link className={styles.inlineLink} href="/contact">
                  Contact us
                </Link>{" "}
                and include your Confirmation ID.
              </p>
            </div>
          </div>

          <div className={styles.footerNote}>
            <span className={styles.muted}>
              Tip: save this page or screenshot it for your records.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
