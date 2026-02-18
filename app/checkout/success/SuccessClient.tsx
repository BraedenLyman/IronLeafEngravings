"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./success.module.css";
import { FaCheck, FaRegCopy } from "react-icons/fa";
import { useCart } from "@/app/components/cart/CartContext";
import { trackMetaEvent } from "@/app/lib/metaPixel";

function shortId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function sanitizeLookupId(raw: string | null) {
  return String(raw ?? "").trim().replace(/[|]+$/g, "");
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const session_id = sanitizeLookupId(searchParams.get("session_id"));
  const payment_intent = sanitizeLookupId(searchParams.get("payment_intent"));
  const confirmationId = session_id || payment_intent;
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState(false);
  const { clear } = useCart();
  const hasClearedCart = useRef(false);
  const hasTrackedPurchase = useRef(false);

  const handleCopy = async () => {
    const value = orderId;
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
    if (!confirmationId) return;
    let cancelled = false;

    if (!hasClearedCart.current) {
      clear();
      hasClearedCart.current = true;
    }

    const load = async () => {
      setLoadingOrderId(true);
      const q = session_id
        ? `session_id=${encodeURIComponent(session_id)}`
        : `payment_intent=${encodeURIComponent(payment_intent ?? "")}`;

      const startedAt = Date.now();
      const maxWaitMs = 30000;
      const retryDelayMs = 1500;

      try {
        while (!cancelled && Date.now() - startedAt < maxWaitMs) {
          const res = await fetch(`/api/orders/by-session?${q}`);
          if (res.ok) {
            const data = (await res.json()) as { orderId?: string | null };
            if (data.orderId) {
              if (!cancelled) setOrderId(String(data.orderId));
              break;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      } catch {
      
      } finally {
        if (!cancelled) setLoadingOrderId(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [confirmationId, payment_intent, session_id]);

  useEffect(() => {
    if (!confirmationId || hasTrackedPurchase.current) return;
    const eventId = session_id ? `purchase_${session_id}` : `purchase_${payment_intent}`;
    trackMetaEvent("Purchase", undefined, eventId);
    hasTrackedPurchase.current = true;
  }, [confirmationId, payment_intent, session_id]);

  if (!confirmationId) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.card}>
            <div className={styles.headerRow}>
              <div className={styles.badgeWarn}>!</div>
              <div>
                <h1 className={styles.title}>We couldn&apos;t find your confirmation</h1>
                <p className={styles.subtitle}>
                  The checkout session id is missing. If you think you were charged, contact us and we&apos;ll help right away.
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

  const displayId = orderId || confirmationId || "";
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
                <div className={`${styles.row} ${styles.idRow}`}>
                  <span className={`${styles.label} ${styles.idLabel}`}>{showOrderId ? "Order ID" : "Confirmation ID"}</span>
                  <span className={`${styles.value} ${styles.idValue}`} title={displayId}>
                    {loadingOrderId ? "Looking up your Order ID..." : shortId(displayId)}
                    <button
                      type="button"
                      className={`${styles.copyBtn} ${copied ? styles.copyBtnActive : ""}`}
                      onClick={handleCopy}
                      aria-label={`Copy ${showOrderId ? "order" : "confirmation"} ID`}
                      disabled={!orderId}
                      title={orderId ? "Copy Order ID" : "Order ID is still loading"}
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
