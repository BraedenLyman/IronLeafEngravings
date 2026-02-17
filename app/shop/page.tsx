import Header from "../components/header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./shop.module.css";
import ProductCard from "../components/product-card/product-card";
import Footer from "../components/footer/footer";

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
                description="Natural wood with a warm finish — perfect for family photos."
                price="$9.99"
                image="/products/wooden-coaster.jpg"
                href="/shop/wooden-coasters"
              />
              <ProductCard
                title="Ceramic Coasters"
                description="Sleek ceramic with crisp engraving — launching soon."
                price="TBD"
                image="/products/ceramic-coaster.jpg"
                comingSoon
              />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}


