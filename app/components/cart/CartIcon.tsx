"use client";

import { HiShoppingCart } from "react-icons/hi";
import styles from "./cart-icon.module.css";
import { useCart } from "./CartContext";

export default function CartIcon() {
  const { items } = useCart();

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={styles.wrap} aria-label={`Cart items: ${count}`}>
      <HiShoppingCart className={styles.icon} />
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </div>
  );
}
