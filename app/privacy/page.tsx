import Header from "../components/header/Header";
import Footer from "../components/footer/footer";
import shared from "../shared-page/shared-page.module.css";
import styles from "../policies/policy.module.css";

export default function PrivacyPolicyPage() {
  return (
    <main className={shared.page}>
      <Header />
      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>Privacy Policy</h1>
          <p className={shared.subtitle}>
            This Privacy Policy explains how Iron Leaf (iron-leaf.ca) collects, uses, and protects your information.
          </p>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            <div className={styles.content}>
              <div className={styles.muted}>Effective date: January 29, 2026</div>

              <div>
                <h2 className={styles.sectionTitle}>Information we collect</h2>
                <ul className={styles.list}>
                  <li>Contact details such as name, email, phone, and shipping address.</li>
                  <li>Order details, uploaded images, and customization notes.</li>
                  <li>Payment status and transaction metadata from Stripe (we do not store full card numbers).</li>
                  <li>Basic usage data like device type, browser, and IP address for security and analytics.</li>
                </ul>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>How we use your information</h2>
                <ul className={styles.list}>
                  <li>To process orders, fulfill engraving requests, and provide customer support.</li>
                  <li>To send order updates, shipping notices, and service messages.</li>
                  <li>To improve our products, site performance, and customer experience.</li>
                  <li>To prevent fraud, abuse, or unauthorized access.</li>
                </ul>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>How we share information</h2>
                <ul className={styles.list}>
                  <li>With service providers needed to run the business (payment processing, hosting, email).</li>
                  <li>When required to comply with legal obligations or protect our rights.</li>
                </ul>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Data retention</h2>
                <p>
                  We retain order and contact information as long as needed to provide services, comply with legal
                  obligations, and resolve disputes.
                </p>
              </div>

              <div>
                <h2 className={styles.sectionTitle}>Your choices</h2>
                <ul className={styles.list}>
                  <li>You may request access, correction, or deletion of your data where applicable.</li>
                  <li>You can opt out of non-essential marketing emails at any time.</li>
                </ul>
              </div>

              <div className={styles.divider} />

              <div>
                <h2 className={styles.sectionTitle}>Contact</h2>
                <p>
                  Questions about this policy? Contact us at{" "}
                  <strong>iron-leaf.ca</strong> through the Contact page.
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
