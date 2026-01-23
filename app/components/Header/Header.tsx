"use client";

import styles from "./Header.module.css";
import Cart from "../Cart/Cart";
import Image from "next/image";
import Link from "next/link";


export default function Header() {
  return (
    <div className={styles.container}>
      <div className={styles.mainHeader}>
          <Image 
            className={styles.logo}
            src="/logo/IronLeafLogo.png"
            alt="IronLeaf Engraving Logo"
            width={560}
            height={180}
          />
      </div>

      {/* Nav links */}
      <div className={styles.nav}>
        <Link href="/" className={styles.links}><h1>HOME</h1></Link>
        <Link href="/how-it-works" className={styles.links}><h1>HOW IT WORKS</h1></Link>
        <Link href="/shop" className={styles.links}><h1>SHOP</h1></Link>
        <Link href="/about" className={styles.links}><h1>ABOUT</h1></Link>
        <Link href="/contact" className={styles.links}>CONTACT</Link>
        <Link href="/cart" className={styles.links}><Cart count={3} /></Link>
      </div>
    </div>
  )
}
