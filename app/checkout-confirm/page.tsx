"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import Header from "../components/header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./checkout-confirm.module.css";
import { useCart } from "../components/cart/CartContext";
import { Button } from "antd";
import { SHIPPING_CENTS_BY_COUNTRY } from "@/app/lib/checkoutPricing";
import { trackMetaEvent } from "@/app/lib/metaPixel";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
const stripeElementsAppearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#D48C3A",
    colorBackground: "#141414",
    colorText: "#BFC3C7",
    colorTextSecondary: "#6F747A",
    colorDanger: "#ff7878",
    borderRadius: "12px",
    spacingUnit: "4px",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  rules: {
    ".Input": {
      backgroundColor: "#141414",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #D48C3A",
      boxShadow: "0 0 0 2px rgba(212, 140, 58, 0.25)",
    },
    ".Block": {
      backgroundColor: "#141414",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "none",
    },
    ".Tab, .PickerItem": {
      backgroundColor: "#141414",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    ".Tab--selected, .PickerItem--selected": {
      border: "1px solid #D48C3A",
      boxShadow: "none",
    },
  },
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

type ShippingDetails = {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

const initialShipping: ShippingDetails = {
  fullName: "",
  email: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "CA",
};

export default function CheckoutConfirmPage() {
  const { items } = useCart();
  const [shipping, setShipping] = useState<ShippingDetails>(initialShipping);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [serverError, setServerError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [lastIntentKey, setLastIntentKey] = useState("");
  const requestSeq = useRef(0);

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
  const shippingCents = SHIPPING_CENTS_BY_COUNTRY[shipping.country] ?? 0;
  const totalCents = subtotalCents + shippingCents;

  const getValidationErrors = useCallback(() => {
    const next: Record<string, string> = {};
    const req = (key: keyof ShippingDetails, label: string) => {
      if (!shipping[key]?.trim()) next[key] = `${label} is required`;
    };

    req("fullName", "Full name");
    req("email", "Email");
    req("phone", "Phone");
    req("address1", "Address");
    req("city", "City");
    req("province", shipping.country === "CA" ? "Province" : "State/Region");
    req("postalCode", shipping.country === "CA" ? "Postal code" : "ZIP/Postal code");
    req("country", "Country");

    if (shipping.email && !/^\S+@\S+\.\S+$/.test(shipping.email)) {
      next.email = "Enter a valid email";
    }
    if (shipping.country === "CA" && shipping.postalCode) {
      const cleaned = shipping.postalCode.replace(/\s+/g, "").toUpperCase();
      if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
        next.postalCode = "Enter a valid Canadian postal code (ex: L1L 1L1)";
      }
    }
    if (shipping.country === "US" && shipping.postalCode) {
      if (!/^\d{5}(-\d{4})?$/.test(shipping.postalCode.trim())) {
        next.postalCode = "Enter a valid ZIP code (ex: 90210)";
      }
    }

    return next;
  }, [shipping]);

  const buildPayload = useCallback(
    () => ({
      items: items.map((i) => ({
        slug: i.slug,
        name: i.title,
        quantity: i.quantity,
        priceInCents: i.unitPriceCents,
        coasterSetSize: i.coasterSetSize,
        uploadedImageUrl: i.uploadedImageUrl,
        uploadedFileName: i.uploadedFileName,
      })),
      shipping,
      productSlug: "cart",
      uploadedFileName: items
        .map((i) => i.uploadedFileName)
        .filter(Boolean)
        .join(", "),
    }),
    [items, shipping]
  );

  const setField = (key: keyof ShippingDetails, value: string) => {
    setShipping((prev) => ({ ...prev, [key]: value }));
    setClientSecret("");
    setServerError("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (items.length === 0) return;
    const validationErrors = getValidationErrors();
    const hasStartedShipping = Boolean(
      shipping.fullName.trim() ||
        shipping.email.trim() ||
        shipping.phone.trim() ||
        shipping.address1.trim() ||
        shipping.city.trim() ||
        shipping.province.trim() ||
        shipping.postalCode.trim()
    );
    if (hasStartedShipping) {
      setErrors(validationErrors);
    }
    if (Object.keys(validationErrors).length > 0) {
      setLoadingIntent(false);
      return;
    }

    const payload = buildPayload();
    const intentKey = JSON.stringify(payload);
    if (clientSecret && lastIntentKey === intentKey) {
      return;
    }

    const seq = ++requestSeq.current;
    const timer = window.setTimeout(async () => {
      setLoadingIntent(true);
      setServerError("");
      try {
        const res = await fetch("/api/checkout/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to initialize payment");
        if (!data?.clientSecret) throw new Error("Missing payment client secret");
        if (requestSeq.current !== seq) return;
        setClientSecret(String(data.clientSecret));
        setLastIntentKey(intentKey);
      } catch (e: unknown) {
        if (requestSeq.current !== seq) return;
        setServerError(e instanceof Error ? e.message : "Failed to initialize payment");
      } finally {
        if (requestSeq.current === seq) {
          setLoadingIntent(false);
        }
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [items, shipping, clientSecret, lastIntentKey, buildPayload, getValidationErrors]);

  return (
    <main className={shared.page}>
      <Header />
      <section className={shared.container}>
        <div className={shared.hero}>
          <div>
            <h1 className={shared.title}>Checkout</h1>
            <p className={shared.subtitle}>Confirm shipping + payment details.</p>
          </div>
          {items.length > 0 && (
            <div className={styles.pills}>
              <div className={styles.pill}>
                <span className={styles.pillLabel}>Items</span>
                <span className={styles.pillValue}>{itemCount}</span>
              </div>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyCard}>
            <h2 className={styles.emptyTitle}>Nothing to checkout</h2>
            <p className={styles.emptyText}>Add items to your cart first.</p>
            <Link className={styles.primaryBtn} href="/shop">
              Go to shop
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Shipping details</h2>
              <div className={styles.formGrid}>
                <Field label="Full name" value={shipping.fullName} onChange={(v) => setField("fullName", v)} error={errors.fullName} />
                <Field label="Email" value={shipping.email} onChange={(v) => setField("email", v)} error={errors.email} />
                <Field label="Phone" value={shipping.phone} onChange={(v) => setField("phone", v)} error={errors.phone} />
                <Select
                  label="Country"
                  value={shipping.country}
                  onChange={(v) => setField("country", v)}
                  error={errors.country}
                  options={[
                    { label: "Canada", value: "CA" },
                    { label: "United Kingdom", value: "GB" },
                    { label: "United States", value: "US" },
                    { label: "New Zealand", value: "NZ" },
                  ]}
                />
                <Field label="Address" value={shipping.address1} onChange={(v) => setField("address1", v)} error={errors.address1} wide />
                <Field label="Apt / Unit (optional)" value={shipping.address2} onChange={(v) => setField("address2", v)} wide />
                <Field label="City" value={shipping.city} onChange={(v) => setField("city", v)} error={errors.city} />
                <Field label={shipping.country === "CA" ? "Province" : "State/Region"} value={shipping.province} onChange={(v) => setField("province", v)} error={errors.province} />
                <Field label={shipping.country === "CA" ? "Postal code" : "ZIP/Postal code"} value={shipping.postalCode} onChange={(v) => setField("postalCode", v)} error={errors.postalCode} />
              </div>

              {!clientSecret && loadingIntent ? <p className={styles.note}>Loading payment form...</p> : null}

              {clientSecret ? (
                stripePromise ? (
                  <div style={{ marginTop: 16 }}>
                    <h2 className={styles.cardTitle}>Payment details</h2>
                    <div className={styles.stripeShell}>
                      <Elements options={{ clientSecret, appearance: stripeElementsAppearance }} stripe={stripePromise}>
                      <StripePaymentForm shipping={shipping} setServerError={setServerError} />
                      </Elements>
                    </div>
                  </div>
                ) : (
                  <p className={styles.serverError}>Missing `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.</p>
                )
              ) : null}

              {serverError ? <p className={styles.serverError}>{serverError}</p> : null}
            </div>

            <aside className={styles.summary}>
              <div className={styles.summaryCard}>
                <h2 className={styles.summaryTitle}>Order summary</h2>
                <div className={styles.summaryList}>
                  {items.map((i) => {
                    const thumb = i.productImageUrl ?? i.imagePreviewUrl ?? i.uploadedImageUrl ?? "";
                    const unitPrice = i.unitPriceCents;
                    return (
                      <div key={i.id} className={styles.summaryItem}>
                        <div className={styles.summaryThumbWrap}>
                          {thumb ? <img className={styles.summaryThumb} src={thumb} alt={`${i.title} product`} loading="lazy" /> : <div className={styles.summaryThumbPlaceholder} aria-hidden />}
                        </div>
                        <div className={styles.summaryLeft}>
                          <div className={styles.summaryName}>{i.title}</div>
                          <div className={styles.summaryMeta}>Qty {i.quantity}</div>
                          {i.uploadedFileName ? <div className={styles.summaryMeta}>File: {i.uploadedFileName}</div> : null}
                        </div>
                        <div className={styles.summaryRight}>{formatMoney(unitPrice * i.quantity)}</div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.divider} />
                <div className={styles.summaryRow}>
                  <span className={styles.muted}>Subtotal</span>
                  <span className={styles.strong}>{formatMoney(subtotalCents)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.muted}>Shipping</span>
                  <span className={styles.muted}>{formatMoney(shippingCents)}</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.summaryRow}>
                  <span className={styles.strong}>Total</span>
                  <span className={styles.total}>{formatMoney(totalCents)}</span>
                </div>

                <Button className={shared.sBtn} href="/cart">
                  Back to cart
                </Button>
                <p className={styles.note}>Payment is processed securely by Stripe.</p>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function StripePaymentForm({
  shipping,
  setServerError,
}: {
  shipping: ShippingDetails;
  setServerError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleBuyNow = async () => {
    setServerError("");
    if (!stripe || !elements) {
      setServerError("Payment form is still loading.");
      return;
    }

    trackMetaEvent("AddPaymentInfo");

    setSubmitting(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          payment_method_data: {
            billing_details: {
              name: shipping.fullName,
              email: shipping.email,
              phone: shipping.phone,
              address: {
                line1: shipping.address1,
                line2: shipping.address2 || undefined,
                city: shipping.city,
                state: shipping.province,
                postal_code: shipping.postalCode,
                country: shipping.country,
              },
            },
          },
        },
      });
      if (error) {
        setServerError(error.message ?? "Payment failed");
      }
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PaymentElement />
      <button className={shared.pBtn} onClick={handleBuyNow} disabled={submitting} type="button" style={{ marginTop: 16 }}>
        {submitting ? "Processing payment..." : "Buy Now"}
      </button>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  wide?: boolean;
}) {
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ""}`}>
      <label className={styles.label}>{label}</label>
      <input className={`${styles.input} ${error ? styles.inputError : ""}`} value={value} onChange={(e) => onChange(e.target.value)} />
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  error,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options: { label: string; value: string }[];
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select className={`${styles.input} ${error ? styles.inputError : ""}`} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
}
