import Header from "../components/Header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <main className={shared.page}>
      <Header />

      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>About</h1>
          <p className={shared.subtitle}>
            IronLeaf turns your most meaningful moments into lasting engraved pieces.
          </p>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            <div className={styles.layout}>
              {/* ✅ Image placeholder */}
              <div className={styles.imagePlaceholder}>
                <div className={styles.imageInner}>
                  <p>Image Placeholder</p>
                  <span>Workshop / product photo goes here</span>
                </div>
              </div>

              <div className={styles.content}>
                <h2 className={styles.sectionTitle}>What we do</h2>
                <p className={styles.text}>
                  We create custom engraved products (starting with coasters) using
                  precision laser engraving. Upload your photo or design, and we’ll
                  engrave it with crisp detail onto a premium coaster you’ll actually
                  want to display.
                </p>

                <h2 className={styles.sectionTitle}>Why IronLeaf</h2>
                <ul className={styles.list}>
                  <li>High-contrast engraving that captures detail</li>
                  <li>Premium materials: hardwood & sleek ceramic</li>
                  <li>Made with care in Canada</li>
                  <li>Perfect for gifts, weddings, and keepsakes</li>
                </ul>

                <div className={styles.highlight}>
                  <p>
                    Every piece is designed to feel personal — because the best gifts
                    aren’t generic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
