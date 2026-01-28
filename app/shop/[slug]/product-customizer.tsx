"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./product-page.module.css";
import QuantityPicker from "../../components/quantity-picker/quantity-picker";
import { useCart } from "../../components/cart/CartContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/lib/firebaseClient";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [added, setAdded] = useState(false);

  const price = useMemo(() => (product.priceCents / 100).toFixed(2), [product.priceCents]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(t);
  }, [added]);

  const onFileChange = (f: File | null) => {
    setError("");
    setAdded(false);
    setFile(f);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (!f) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const canSubmit = qty >= 1 && !!file && !loading;

  const handleAddToCart = () => {
    if (!file) return;

    addItem({
      id: `${product.slug}-${crypto.randomUUID()}`,
      slug: product.slug,
      title: product.title,
      unitPriceCents: product.priceCents,
      quantity: qty,
      included: product.included,
      imagePreviewUrl: previewUrl,
      uploadedFileName: file.name,
    });

    setAdded(true);
    setError("");
  };

  const handleBuyNow = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
     setAdded(false);

    try {
      // 1) Upload image to Firebase Storage
      const uploadPath = `uploads/${product.slug}/${crypto.randomUUID()}-${file.name}`;
      const fileRef = ref(storage, uploadPath);

      await uploadBytes(fileRef, file);
      const imageUrl = await getDownloadURL(fileRef);

      // 2) Call Firebase Function (Stripe Checkout Session)
      // Use same-origin endpoint to avoid CORS
      const res = await fetch("/api/createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          quantity: qty,
          uploadedImageUrl: imageUrl,
          uploadedFileName: file.name,
        }),
      });


      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Checkout failed");
      }

      if (!data?.url) {
        throw new Error("No checkout URL returned");
      }

      // 3) Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
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
              disabled={loading}
            />

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
        {product.slug !== "wooden-coasters" && (
          <span className={styles.muted}>({product.included})</span>
        )}
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
          {loading ? "Starting checkout..." : "Buy Now"}
        </button>

        {added && <p className={styles.addedText}>Item added to cart!</p>}
        {!file && <p className={styles.warningText}>Upload an image to continue.</p>}
        {error && <p className={styles.warningText}>{error}</p>}
      </div>
    </div>
  );
}
