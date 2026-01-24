"use client";

import { useMemo, useState } from "react";
import styles from "./product-page.module.css";
import QuantityPicker from "../../components/quantity-picker/quantity-picker";
import { useCart } from "../../components/cart/CartContext";

type Product = {
  slug: string;
  title: string;
  image: string;
  priceCents: number;
  included: string;
};

export default function ProductCustomizer({ product }: { product: Product }) {
  const { addItem } = useCart();

  const [qty, setQty] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const price = useMemo(() => (product.priceCents / 100).toFixed(2), [product]);

  const onFileChange = (f: File | null) => {
    setFile(f);
    if (!f) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const canSubmit = qty > 0 && !!file;

  const handleAddToCart = () => {
    if (!file) return;

    addItem({
      id: `${product.slug}-${crypto.randomUUID()}`,
      slug: product.slug,
      title: product.title,
      unitPriceCents: product.priceCents,
      quantity: qty,
      included: product.included,
      // NOTE: For a real checkout, you’ll upload file to storage (S3/Firebase) and store the URL.
      // This is a local preview only (good for UI/testing).
      imagePreviewUrl: previewUrl,
      uploadedFileName: file.name,
    });
  };

  const handleBuyNow = async () => {
  console.log("Buy Now clicked");
  if (!file) {
    alert("Please upload an image first.");
    return;
  }

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            name: product.title,
            priceInCents: product.priceCents,
            quantity: qty,
          },
        ],
      }),
    });

    const text = await res.text();
    console.log("Checkout status:", res.status);
    console.log("Checkout raw response:", text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      alert("Checkout failed: API did not return JSON. Check console.");
      return;
    }

    if (!res.ok) {
      alert(data?.error ?? "Checkout failed");
      return;
    }

    if (!data?.url) {
      alert("Checkout failed: No URL returned.");
      return;
    }

    window.location.href = data.url;
  } catch (e: any) {
    console.error(e);
    alert(e?.message ?? "Checkout error");
  }
};



  return (
    <div className={styles.customizer}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Customize your order</h2>

        <div className={styles.controls}>
          <div className={styles.controlBlock}>
            <label className={styles.label}>Quantity</label>
            <QuantityPicker value={qty} onChange={setQty} />
          </div>

          <div className={styles.controlBlock}>
            <label className={styles.label}>Upload your image</label>

            <input
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />

            <p className={styles.helperText}>
              Required. JPG/PNG recommended. High contrast works best.
            </p>

            {previewUrl && (
              <div className={styles.previewWrap}>
                <img src={previewUrl} alt="Upload preview" className={styles.previewImg} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.priceRow}>
        <span className={styles.priceText}>
          ${price} <span className={styles.muted}>/ set</span>
        </span>
        <span className={styles.muted}>({product.included})</span>
      </div>

      <div className={styles.actionRow}>
        <button
          className={styles.secondaryBtn}
          disabled={!canSubmit}
          onClick={handleAddToCart}
          type="button"
        >
          Add to Cart
        </button>

        <button
          className={styles.primaryBtn}
          disabled={!canSubmit}
          onClick={handleBuyNow}
          type="button"
        >
          Buy Now
        </button>

        {!canSubmit && (
          <p className={styles.warningText}>Upload an image to continue.</p>
        )}
      </div>
    </div>
  );
}
