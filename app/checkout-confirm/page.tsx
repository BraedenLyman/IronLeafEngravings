"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "../components/header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./checkout-confirm.module.css";
import { useCart } from "../components/cart/CartContext";
import { Button } from "antd";

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
  const { items, subtotalCents } = useCart();

  const [shipping, setShipping] = useState<ShippingDetails>(initialShipping);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + (i.quantity ?? 0), 0),
    [items]
  );

  const validate = () => {
    const next: Record<string, string> = {};

    const req = (key: keyof ShippingDetails, label: string) => {
      if (!shipping[key]?.trim()) next[key] = `${label} is required`;
    };

    req("fullName", "Full name");
    req("email", "Email");
    req("phone", "Phone");
    req("address1", "Address");
    req("city", "City");
    req("province", shipping.country === "CA" ? "Province" : "State");
    req("postalCode", shipping.country === "CA" ? "Postal code" : "ZIP code");
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

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const setField = (key: keyof ShippingDetails, value: string) => {
    setShipping((s) => ({ ...s, [key]: value }));
    setErrors((e) => {
      const copy = { ...e };
      delete copy[key];
      return copy;
    });
  };

  const handleBuyNow = async () => {
    setServerError("");

    if (items.length === 0) {
      setServerError("Your cart is empty.");
      return;
    }

    if (!validate()) return;

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
          shipping,
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
            <h1 className={shared.title}>Checkout</h1>
            <p className={shared.subtitle}>
              Confirm shipping + order details before payment.
            </p>
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
                <Field
                  label="Full name"
                  value={shipping.fullName}
                  onChange={(v) => setField("fullName", v)}
                  error={errors.fullName}
                />
                <Field
                  label="Email"
                  value={shipping.email}
                  onChange={(v) => setField("email", v)}
                  error={errors.email}
                />
                <Field
                  label="Phone"
                  value={shipping.phone}
                  onChange={(v) => setField("phone", v)}
                  error={errors.phone}
                />
                <Select
                  label="Country"
                  value={shipping.country}
                  onChange={(v) => setField("country", v)}
                  error={errors.country}
                  options={[
                    { label: "Canada", value: "CA" },
                    { label: "United States", value: "US" },
                  ]}
                />
                <Field
                  label="Address"
                  value={shipping.address1}
                  onChange={(v) => setField("address1", v)}
                  error={errors.address1}
                  wide
                />
                <Field
                  label="Apt / Unit (optional)"
                  value={shipping.address2}
                  onChange={(v) => setField("address2", v)}
                  error={errors.address2}
                  wide
                />
                <Field
                  label="City"
                  value={shipping.city}
                  onChange={(v) => setField("city", v)}
                  error={errors.city}
                />
                <Field
                  label={shipping.country === "CA" ? "Province" : "State"}
                  value={shipping.province}
                  onChange={(v) => setField("province", v)}
                  error={errors.province}
                />
                <Field
                  label={shipping.country === "CA" ? "Postal code" : "ZIP code"}
                  value={shipping.postalCode}
                  onChange={(v) => setField("postalCode", v)}
                  error={errors.postalCode}
                />
              </div>

              {serverError ? (
                <p className={styles.serverError}>{serverError}</p>
              ) : null}
            </div>

            <aside className={styles.summary}>
              <div className={styles.summaryCard}>
                <h2 className={styles.summaryTitle}>Order summary</h2>

                <div className={styles.summaryList}>
                  {items.map((i) => {
                    const thumb =
                      i.productImageUrl ??
                      i.imagePreviewUrl ??
                      i.uploadedImageUrl ??
                      "";

                    return (
                      <div key={i.id} className={styles.summaryItem}>
                        <div className={styles.summaryThumbWrap}>
                          {thumb ? (
                            <img
                              className={styles.summaryThumb}
                              src={thumb}
                              alt={`${i.title} product`}
                              loading="lazy"
                            />
                          ) : (
                            <div className={styles.summaryThumbPlaceholder} aria-hidden />
                          )}
                        </div>
                        <div className={styles.summaryLeft}>
                          <div className={styles.summaryName}>{i.title}</div>
                          <div className={styles.summaryMeta}>Qty {i.quantity}</div>
                          {i.uploadedFileName ? (
                            <div className={styles.summaryMeta}>
                              File: {i.uploadedFileName}
                            </div>
                          ) : null}
                        </div>
                        <div className={styles.summaryRight}>
                          {formatMoney(i.unitPriceCents * i.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.divider} />

                <div className={styles.summaryRow}>
                  <span className={styles.muted}>Subtotal</span>
                  <span className={styles.strong}>
                    {formatMoney(subtotalCents)}
                  </span>
                </div>

                <div className={styles.summaryRow}>
                  <span className={styles.muted}>Shipping</span>
                  <span className={styles.muted}>Calculated in Stripe</span>
                </div>

                <div className={styles.divider} />

                <div className={styles.summaryRow}>
                  <span className={styles.strong}>Total</span>
                  <span className={styles.total}>
                    {formatMoney(subtotalCents)}
                  </span>
                </div>


                <button
                  className={shared.pBtn}
                  onClick={handleBuyNow}
                  disabled={loading}
                  type="button"
                >
                  {loading ? "Starting checkout..." : "Buy Now"}
                </button>

                <Button className={shared.sBtn} href="/cart">
                  Back to cart
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
      <input
        className={`${styles.input} ${error ? styles.inputError : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
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
      <select
        className={`${styles.input} ${error ? styles.inputError : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
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
