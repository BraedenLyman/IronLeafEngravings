import styles from "./feature-product.module.css";
import shared from "../../shared-page/shared-page.module.css";
import Link from "next/link";
import Image from "next/image";
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
              Your photo engraved into real wood — crisp detail, timeless look,
              and made in Canada.
            </p>

            <div className={styles.ctas}>
              <Link href="/shop/wooden-coasters" className={styles.linkReset}>
                <Button
                  size="large"
                  className={shared.pBtn}
                  icon={<FaArrowRight />}
                >
                  View Coasters
                </Button>
              </Link>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className={styles.media} aria-hidden="true">
            <div className={styles.imageWrapper}>
              <Image
                src="/products/wooden-coaster.jpg"
                alt="Laser engraved wooden coaster"
                fill
                className={styles.coasterImage}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
