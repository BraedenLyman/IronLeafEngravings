"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebaseClient";
import type { Product } from "../../lib/products";
import shared from "../../shared-page/shared-page.module.css";
import styles from "./product-page.module.css";
import ProductBadges from "../../components/product-badges/product-badges";
import ProductCustomizer from "./product-customizer";
import { FaArrowRight } from "react-icons/fa";

export default function ProductClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "products", slug));
        if (snap.exists()) setProduct(snap.data() as Product);
        else setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>Loading...</h1>
          <p className={shared.subtitle}>Fetching product details.</p>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>Product not found</h1>
          <p className={shared.subtitle}>That product doesn’t exist yet.</p>
        </div>
      </section>
    );
  }

  const keyPoints =
    product.slug === "wooden-coasters"
      ? [
          "Turn your favorite photo into a meaningful keepsake you can use every day.",
          "Custom laser engraving captures fine details for a clean, timeless look.",
          "Made from real wood with a warm finish that feels natural and premium.",
          "Sealed for daily use — easy to wipe clean and built to last.",
          "Perfect gift size with smooth, comfortable edges."
        ]

      : product.keyPoints;

  return (
    <section className={shared.container}>
      <div className={shared.hero}>
        <h1 className={shared.title}>{product.title}</h1>
        <p className={shared.subtitle}>{product.description}</p>
      </div>

      <div className={styles.cardWrap}>
        <div className={styles.card}>
          <div className={styles.layout}>
            <div className={styles.imagePanel}>
              <img
                src={product.image}
                alt={product.title}
                className={styles.productImg}
              />
            </div>

            <div className={styles.details}>
              <ProductBadges badges={product.badges} />

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Key points</h2>
                <ul className={styles.list}>
                  {keyPoints.map((p) => (
                    <li key={p} className={styles.listItem}>
                      <FaArrowRight className={styles.listIcon} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.included}>
                <span className={styles.includedLabel}>Included:</span>
                <span className={styles.includedValue}>{product.included}</span>
              </div>

              <ProductCustomizer product={product} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
