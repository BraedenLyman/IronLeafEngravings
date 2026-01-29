"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./success.module.css";
import { FaCheck, FaRegCopy } from "react-icons/fa";

function shortId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState(false);

  if (!session_id) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.card}>
            <div className={styles.headerRow}>
              <div className={styles.badgeWarn}>!</div>
              <div>
                <h1 className={styles.title}>We couldn't find your confirmation</h1>
                <p className={styles.subtitle}>
                  The checkout session id is missing. If you think you were charged, contact us and we'll help right away.
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

  const handleCopy = async () => {
    const value = orderId || session_id;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!session_id) return;
    let cancelled = false;

    const load = async () => {
      setLoadingOrderId(true);
      try {
        const res = await fetch(`/api/orders/by-session?session_id=${encodeURIComponent(session_id)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { orderId?: string | null };
        if (!cancelled && data.orderId) {
          setOrderId(String(data.orderId));
        }
      } catch {
        // ignore lookup errors for now
      } finally {
        if (!cancelled) setLoadingOrderId(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [session_id]);

  const displayId = orderId || session_id || "";
  const showOrderId = Boolean(orderId);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.headerRow}>
            <div className={styles.badgeSuccess} aria-hidden="true">
              <FaCheck />
            </div>
            <div>
              <h1 className={styles.title}>Order confirmed</h1>
              <p className={styles.subtitle}>
                Thanks for your order! We have received it and will begin preparing your engraving.
              </p>
            </div>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Order details</h2>

              <div className={styles.rows}>
                <div className={styles.row}>
                  <span className={styles.label}>{showOrderId ? "Order ID" : "Confirmation ID"}</span>
                  <span className={styles.value} title={displayId}>
                    {loadingOrderId ? "Looking up your Order ID..." : shortId(displayId)}
                    <button
                      type="button"
                      className={`${styles.copyBtn} ${copied ? styles.copyBtnActive : ""}`}
                      onClick={handleCopy}
                      aria-label={`Copy ${showOrderId ? "order" : "confirmation"} ID`}
                    >
                      <FaRegCopy />
                    </button>
                  </span>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>Status</span>
                  <span className={styles.value}>
                    <span className={styles.pill}>Created</span>
                  </span>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>Receipt</span>
                  <span className={styles.value}>
                    A copy is sent to the email used at checkout.
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>What happens next</h2>
              <ul className={styles.list}>
                <li>We review your image and prepare the engraving.</li>
                <li>Production begins shortly after confirmation.</li>
                <li>You will receive updates when your order ships.</li>
              </ul>

              <div className={styles.footerNote}>
                <p className={styles.muted}>
                  Need changes? <br/> Reply to your confirmation email as soon as possible and include your {showOrderId ? "Order" : "Confirmation"} ID.
                </p>
                <p className={styles.helpText}>
                  Questions?{" "} <br/>
                  <Link className={styles.inlineLink} href="/contact">
                    Contact us
                  </Link>{" "}
                  and include your {showOrderId ? "Order" : "Confirmation"} ID.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link className={styles.primaryBtn} href="/shop">
              Continue shopping
            </Link>
            <Link className={styles.secondaryBtn} href="/contact">
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
