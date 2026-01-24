import styles from "./feature-product.module.css";
import Link from "next/link";
import { Button } from "antd";
import { FaArrowRight } from "react-icons/fa";

export default function FeatureProduct() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.copy}>
            <span className={styles.kicker}>Featured</span>
            <h2 className={styles.title}>Wooden Coasters</h2>
            <p className={styles.desc}>
              Your photo engraved into real wood — crisp detail, timeless look, and made in Canada.
            </p>

            <div className={styles.ctas}>
              <Link href="/shop" className={styles.linkReset}>
                <Button size="large" className={styles.primary} icon={<FaArrowRight />}>
                  View Coasters
                </Button>
              </Link>
            </div>
          </div>

          <div className={styles.media} aria-hidden="true">
            <div className={styles.mediaInner}>
              <div className={styles.mediaGlow} />
              <div className={styles.mediaMock} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
