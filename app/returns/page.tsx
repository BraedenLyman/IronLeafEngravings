import Header from "../components/header/Header";
import Footer from "../components/footer/footer";
import shared from "../shared-page/shared-page.module.css";
import styles from "../policies/policy.module.css";

export default function ReturnsPage() {
  return (
    <main className={shared.page}>
      <Header />

      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>Return Policy</h1>
          <p className={shared.subtitle}>
            This policy explains refunds and replacements for purchases from Iron Leaf (iron-leaf.ca).
          </p>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            <div className={styles.content}>
              <div className={styles.muted}>Effective date: January 29, 2026</div>

              <div>
                <h2 className={styles.sectionTitle}>Custom products</h2>
                <p>
                  Because each item is custom engraved to your specifications, all sales are final once production
                  begins. We do not accept returns or refunds for change of mind, incorrect uploads, or design errors
                  provided by the customer.
                </p>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Damaged or defective items</h2>
                <ul className={styles.list}>
                  <li>Contact us within 7 days of delivery with photos of the issue.</li>
                  <li>We will repair, replace, or refund at our discretion after review.</li>
                  <li>We may request the item be returned before issuing a replacement or refund.</li>
                </ul>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Shipping issues</h2>
                <ul className={styles.list}>
                  <li>Ensure your shipping address is correct at checkout.</li>
                  <li>We are not responsible for delays caused by carriers or customs.</li>
                  <li>If a package is lost in transit, we will work with the carrier to resolve the claim.</li>
                </ul>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Cancellations</h2>
                <p>
                  If you need to cancel an order, contact us immediately. Once production begins, cancellation may not
                  be possible.
                </p>
              </div>

              <div className={styles.divider} />

              <div>
                <h2 className={styles.sectionTitle}>Contact</h2>
                <p>
                  For refund or replacement requests, contact us at <strong>iron-leaf.ca</strong> through the Contact
                  page with your order details and photos if applicable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
