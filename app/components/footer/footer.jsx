"use client";

import styles from "./footer.module.css";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Go to homepage">
          <Image
            src="/logo/IronLeafLogo.png"
            alt="IronLeaf Engraving Logo"
            width={280}
            height={90}
            className={styles.logo}
          />
        </Link>

        <div className={styles.grid}>
          <div className={styles.col}>
            <h3 className={styles.title}>Website</h3>
            <Link href="/" className={styles.link}>Home</Link>
            <Link href="/how-it-works" className={styles.link}>How it works</Link>
            <Link href="/shop" className={styles.link}>Shop</Link>
          </div>

          <div className={styles.col}>
            <h3 className={styles.title}>Policies</h3>
            <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
            <Link href="/terms" className={styles.link}>Terms of Service</Link>
            <Link href="/returns" className={styles.link}>Return Policy</Link>
          </div>

          <div className={styles.col}>
            <h3 className={styles.title}>Company</h3>
            {/*<Link href="/about" className={styles.link}>About Us</Link>*/}
            <Link href="/contact" className={styles.link}>Contact Us</Link>
          </div>
        </div>
      </div>

      <div className={styles.credit}>
        © 2026 IronLeaf Engravings. All rights reserved.
      </div>
    </footer>
  );
}
