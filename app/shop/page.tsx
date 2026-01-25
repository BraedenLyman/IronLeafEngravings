import Header from "../components/header/header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./shop.module.css";
import ProductCard from "../components/product-card/product-card";

export default function ShopPage() {
  return (
    <main className={shared.page}>
      <Header />

      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>Shop</h1>
          <p className={shared.subtitle}>
            Choose your coaster style, upload your image, and we’ll engrave it with precision.
          </p>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            <div className={styles.grid}>
              <ProductCard
                title="Wooden Coasters"
                description="Real hardwood with a warm finish — perfect for family photos."
                price="$29.99"
                image="/products/wooden-coaster.png"
                href="/shop/wooden-coasters"
              />

              <ProductCard
                title="Black Ceramic Coasters"
                description="Sleek black ceramic with high-contrast engraving."
                price="$34.99"
                image="/products/ceramic-coaster.jpg"
                href="/shop/ceramic-coasters"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
