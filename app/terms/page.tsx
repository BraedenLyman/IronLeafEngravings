import Header from "../components/header/Header";
import Footer from "../components/footer/footer";
import shared from "../shared-page/shared-page.module.css";
import styles from "../policies/policy.module.css";

export default function TermsPage() {
  return (
    <main className={shared.page}>
      <Header />

      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>Terms of Service</h1>
          <p className={shared.subtitle}>
            These Terms govern your use of Iron Leaf (iron-leaf.ca) and any purchases you make.
          </p>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            <div className={styles.content}>
              <div className={styles.muted}>Effective date: January 29, 2026</div>

              <div>
                <h2 className={styles.sectionTitle}>Overview</h2>
                <p>
                  By accessing or purchasing from Iron Leaf, you agree to these Terms. If you do not agree, do not use
                  the site or place an order.
                </p>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Products and customization</h2>
                <ul className={styles.list}>
                  <li>Custom engravings are made to order based on the images and details you provide.</li>
                  <li>You are responsible for ensuring you have rights to any uploaded images or content.</li>
                  <li>Preview images may differ slightly from the final engraved product due to material variation.</li>
                </ul>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Orders and payment</h2>
                <ul className={styles.list}>
                  <li>Prices are listed in the checkout currency and include applicable taxes unless noted.</li>
                  <li>Payment is processed securely via Stripe.</li>
                  <li>We may refuse or cancel orders in cases of suspected fraud or policy violations.</li>
                </ul>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Shipping</h2>
                <ul className={styles.list}>
                  <li>Shipping times are estimates and may vary by destination.</li>
                  <li>We are not responsible for delays caused by carriers or customs.</li>
                  <li>Please ensure your shipping address is accurate at checkout.</li>
                </ul>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Intellectual property</h2>
                <p>
                  All site content, branding, and designs are owned by Iron Leaf or its licensors and may not be copied
                  or redistributed without permission.
                </p>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Limitation of liability</h2>
                <p>
                  To the maximum extent permitted by law, Iron Leaf is not liable for indirect or consequential damages
                  arising from your use of the site or products.
                </p>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Changes</h2>
                <p>
                  We may update these Terms from time to time. Continued use of the site means you accept the updated
                  Terms.
                </p>
              </div>

              <div className={styles.divider} />

              <div>
                <h2 className={styles.sectionTitle}>Contact</h2>
                <p>
                  Questions about these Terms? Contact us at <strong>iron-leaf.ca</strong> through the Contact page.
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
