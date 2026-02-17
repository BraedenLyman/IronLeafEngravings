"use client";

import { useEffect, useState } from "react";
import styles from "./product-page.module.css";
import shared from "../../shared-page/shared-page.module.css";
import QuantityPicker from "../../components/quantity-picker/quantity-picker";
import { useCart } from "../../components/cart/CartContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/lib/firebaseClient";
import { Button } from "antd";

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
}: {
  product: Product;
  file: File | null;
  previewUrl: string;
  onFileChange: (file: File | null) => void;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string>("");

  const [added, setAdded] = useState(false);
  const unitPriceCents = product.slug === "wooden-coasters" ? 999 : product.priceCents;


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
        quantity: qty,
        included: product.included,
        productImageUrl: product.image,
        imagePreviewUrl: previewUrl,
        uploadedImageUrl: imageUrl,
        uploadedFileName: file.name,
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
            <label className={styles.label}>Quantity</label>
            <div className={styles.qtyRow}>
              
              <QuantityPicker value={qty} onChange={setQty} />
              
              <div className={styles.btnContainerMain}>
                <Button
                  className={shared.pBtn}
                  disabled={!canSubmit}
                  onClick={handleAddToCart}
                >
                  {adding ? "Adding..." : "Add to Cart"}
                </Button>
              </div>
            </div>
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
