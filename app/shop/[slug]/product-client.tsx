"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { db } from "@/app/lib/firebaseClient";
import type { Product } from "../../lib/products";
import shared from "../../shared-page/shared-page.module.css";
import styles from "./product-page.module.css";
import ProductBadges from "../../components/product-badges/product-badges";
import ProductCustomizer from "./product-customizer";
import { Carousel } from "antd";
import { FaArrowRight } from "react-icons/fa";

export default function ProductClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mockupUrl, setMockupUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coasterSetSize, setCoasterSetSize] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (mockupUrl.startsWith("blob:")) {
        URL.revokeObjectURL(mockupUrl);
      }
    };
  }, [mockupUrl]);

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

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    if (!file) {
      setMockupUrl("");
      return;
    }
    if (mockupUrl.startsWith("blob:")) {
      URL.revokeObjectURL(mockupUrl);
    }
    const url = URL.createObjectURL(file);
    setMockupUrl(url);
  };

  const openFilePicker = () => fileInputRef.current?.click();

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
  const displayPriceCents = product.slug === "wooden-coasters" ? 999 * coasterSetSize : product.priceCents;
  const woodenSetLabel = coasterSetSize === 1 ? "1 Coaster" : `Set of ${coasterSetSize}`;
  const includedValue =
    product.slug === "wooden-coasters"
      ? `${coasterSetSize} ${coasterSetSize === 1 ? "coaster" : "coasters"} with the same image`
      : product.included;

  return (
    <section className={shared.container}>
      <div className={shared.hero}>
        <h1 className={shared.title}>{product.title}</h1>
        <p className={shared.subtitle}>{product.description}</p>
      </div>

      <div className={styles.cardWrap}>
        <div className={styles.card}>
          <div className={styles.layout}>
            <div className={styles.imageStack}>
              <div className={`${styles.previewWrap} ${styles.previewWrapNoBorder}`}>
                <div className={styles.previewMockup}>
                  {product.slug === "wooden-coasters" ? (
                    <Carousel dots draggable autoplay autoplaySpeed={3500} pauseOnHover className={styles.carousel}>
                      {[product.image, "/products/wooden-coaster-2.jpg", "/products/wooden-coaster-3.jpg"].map(
                        (src) => (
                          <div key={src} className={styles.carouselSlide}>
                            <img src={src} alt={product.title} className={styles.previewBase} />
                          </div>
                        )
                      )}
                    </Carousel>
                  ) : (
                    <img
                      src={product.image}
                      alt={product.title}
                    />
                  )}
                </div>
              </div>

              {product.slug === "wooden-coasters" ? (
                <>
                  <div className={styles.previewWrap}>
                    <input
                      ref={fileInputRef}
                      className={styles.hiddenFileInput}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />

                    {!mockupUrl ? (
                      <button
                        className={styles.previewButton}
                        type="button"
                        onClick={openFilePicker}
                      >
                        <span className={styles.uploadIcon} aria-hidden="true">
                          +
                        </span>
                        <span className={styles.uploadTitle}>Upload your image</span>
                        <span className={styles.uploadSub}>Click to choose a photo for the engraving preview</span>
                      </button>
                    ) : (
                      <div className={styles.previewMockup}>
                        <img
                          src="/products/wooden-coaster-preview.jpg"
                          alt={`${product.title} mockup`}
                          className={styles.previewBase}
                        />
                        <div
                          className={styles.previewOverlay}
                          style={{ backgroundImage: `url(${mockupUrl})` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className={styles.btnContainer}>
                    {mockupUrl && (
                      <button
                        className={shared.sBtn}
                        type="button"
                        onClick={openFilePicker}
                      >
                        Use another image
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className={styles.details}>
              <ProductBadges badges={product.badges} />
              <div className={styles.priceRow}>
                <span className={styles.priceText}>
                  ${((displayPriceCents ?? 0) / 100).toFixed(2)}{" "}
                  <span className={styles.muted}>
                    / {product.slug === "wooden-coasters" ? woodenSetLabel : "set"}
                  </span>
                </span>
                {product.slug !== "wooden-coasters" && (
                  <span className={styles.muted}>({product.included})</span>
                )}
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Key Points</h2>
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
                <span className={styles.includedValue}>{includedValue}</span>
              </div>

              <ProductCustomizer
                product={product}
                file={selectedFile}
                previewUrl={mockupUrl}
                onFileChange={handleFileChange}
                coasterSetSize={coasterSetSize}
                onCoasterSetSizeChange={setCoasterSetSize}              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
