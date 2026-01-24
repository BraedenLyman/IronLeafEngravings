import Header from "../../components/header/header";
import shared from "../../shared-page/shared-page.module.css";
import styles from "./product-page.module.css";

import ProductBadges from "../../components/product-badges/product-badges";
import ProductCustomizer from "./product-customizer";

type Product = {
  slug: string;
  title: string;
  description: string;
  image: string;
  priceCents: number;
  badges: string[];
  keyPoints: string[];
  included: string;
};

const PRODUCTS: Record<string, Product> = {
  "wooden-coasters": {
    slug: "wooden-coasters",
    title: "Wooden Coasters",
    description:
      "Real hardwood coasters engraved with your uploaded image. Warm, natural, and perfect for meaningful keepsakes.",
    image: "/products/wooden-coaster.jpg",
    priceCents: 2999,
    badges: ["Real hardwood", "Precision laser engraved", "Made in Canada"],
    keyPoints: [
      "Warm natural finish that looks premium in any home",
      "Great detail for family photos and logos",
      "Ideal for gifts, weddings, and special occasions",
    ],
    included: "Set of 4 coasters",
  },
  "ceramic-coasters": {
    slug: "ceramic-coasters",
    title: "Black Ceramic Coasters",
    description:
      "Sleek black ceramic coasters with crisp, high-contrast engraving. Modern, clean, and premium.",
    image: "/products/ceramic-coaster.jpg",
    priceCents: 3499,
    badges: ["High contrast", "Modern ceramic", "Made in Canada"],
    keyPoints: [
      "High-contrast engraving that really pops on black ceramic",
      "Modern look for minimalist spaces",
      "Great for logos and sharp images",
    ],
    included: "Set of 4 coasters",
  },
};

// ✅ Next.js 15/16: params can be async
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ unwrap params
  const product = PRODUCTS[slug];

  if (!product) {
    return (
      <main className={shared.page}>
        <Header />
        <section className={shared.container}>
          <div className={shared.hero}>
            <h1 className={shared.title}>Product not found</h1>
            <p className={shared.subtitle}>That product doesn’t exist yet.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={shared.page}>
      <Header />

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
                    {product.keyPoints.map((p) => (
                      <li key={p}>{p}</li>
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
    </main>
  );
}
