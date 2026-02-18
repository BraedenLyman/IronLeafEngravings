"use client";

import { useEffect, useState } from "react";
import styles from "./product-page.module.css";
import shared from "../../shared-page/shared-page.module.css";
import QuantityPicker from "../../components/quantity-picker/quantity-picker";
import { useCart } from "../../components/cart/CartContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/lib/firebaseClient";
import { trackMetaEvent } from "@/app/lib/metaPixel";
import { Button } from "antd";

const COASTER_SET_OPTIONS = [
  { label: "1 Coaster", value: 1 },
  { label: "Set of 2 Coasters", value: 2 },
  { label: "Set of 4 Coasters", value: 4 },
  { label: "Set of 6 Coasters", value: 6 },
  { label: "Set of 8 Coasters", value: 8 },
  { label: "Set of 12 Coasters", value: 12 },
  { label: "Set of 24 Coasters", value: 24 },
  { label: "Set of 50 Coasters", value: 50 },
  { label: "Set of 100 Coasters", value: 100 },
] as const;

type Product = {
  slug: string;
  title: string;
  image: string;
  priceCents: number;
  included: string;
};

export default function ProductCustomizer({
  product,
  file,
  previewUrl,
  onFileChange,
  coasterSetSize,
  onCoasterSetSizeChange,
}: {
  product: Product;
  file: File | null;
  previewUrl: string;
  onFileChange: (file: File | null) => void;
  coasterSetSize: number;
  onCoasterSetSizeChange: (value: number) => void;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string>("");

  const [added, setAdded] = useState(false);
  const selectedSet =
    COASTER_SET_OPTIONS.find((option) => option.value === coasterSetSize) ?? COASTER_SET_OPTIONS[0];
  const unitPriceCents = product.slug === "wooden-coasters" ? 999 * selectedSet.value : product.priceCents;
  const includedText = product.slug === "wooden-coasters" ? selectedSet.label : product.included;


  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(t);
  }, [added]);

  useEffect(() => {
    setError("");
    setAdded(false);
  }, [previewUrl]);

  const isBusy = adding;
  const canSubmit = qty >= 1 && !!file && !isBusy;

  const handleAddToCart = async () => {
    if (!file) return;

    setAdding(true);
    setError("");
    setAdded(false);

    try {
      const uploadPath = `uploads/${product.slug}/${crypto.randomUUID()}-${file.name}`;
      const fileRef = ref(storage, uploadPath);

      await uploadBytes(fileRef, file);
      const imageUrl = await getDownloadURL(fileRef);

      addItem({
        id: `${product.slug}-${crypto.randomUUID()}`,
        slug: product.slug,
        title: product.title,
        unitPriceCents,
        coasterSetSize: product.slug === "wooden-coasters" ? selectedSet.value : undefined,
        quantity: qty,
        included: includedText,
        productImageUrl: product.image,
        imagePreviewUrl: previewUrl,
        uploadedImageUrl: imageUrl,
        uploadedFileName: file.name,
      });

      trackMetaEvent("AddToCart", {
        content_type: "product",
        content_name: product.title,
        content_ids: [product.slug],
        currency: "CAD",
        value: (unitPriceCents * qty) / 100,
        num_items: qty,
      });

      setAdded(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to upload image");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={styles.customizer}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Customize your order</h2>

        <div className={styles.controls}>
          <div className={styles.controlBlock}>
            {product.slug === "wooden-coasters" ? (
              <div className={styles.setSize}>
                <label className={styles.label}>Set size</label>
                <select
                  className={styles.selectInput}
                  value={coasterSetSize}
                  onChange={(e) => onCoasterSetSizeChange(Number(e.target.value))}
                  disabled={isBusy}
                >
                  {COASTER_SET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={styles.qtyRow}>
              <label className={styles.label}>Quantity</label>
              <QuantityPicker value={qty} onChange={setQty} />
            </div>
          </div>
          
          <div className={styles.btnDiv}>
            <Button className={shared.pBtn} disabled={!canSubmit} onClick={handleAddToCart} >
            {adding ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
          
        

          {product.slug !== "wooden-coasters" && (
            <div className={styles.controlBlock}>
              <label className={styles.label}>Upload your image</label>
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                disabled={isBusy}
              />

              {previewUrl && (
                <div className={styles.previewWrap}>
                  <img src={previewUrl} alt="Upload preview" className={styles.previewImg} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionRow}>
        {added && <p className={styles.addedText}>Item added to cart!</p>}
        {!file && <p className={styles.warningText}>Upload an image to continue.</p>}
        {error && <p className={styles.warningText}>{error}</p>}
      </div>
    </div>
  );
}
