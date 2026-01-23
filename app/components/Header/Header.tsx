import { Button } from "antd";
import styles from "./Header.module.css";
import { HiShoppingCart } from "react-icons/hi";
import Cart from "../Cart/Cart";
import Image from "next/image";


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
        <a href="#" className={styles.links}><h1>HOME</h1></a>
        <a href="#" className={styles.links}><h1>HOW IT WORKS</h1></a>
        <a href="#" className={styles.links}><h1>SHOP</h1></a>
        <a href="#" className={styles.links}><h1>ABOUT US</h1></a>
        <a href="#" className={styles.links}><h1>CONTACT</h1></a>
        <a href="#" className={styles.links}><Cart count={3}/></a>

      </div>
    </div>
  )
}
