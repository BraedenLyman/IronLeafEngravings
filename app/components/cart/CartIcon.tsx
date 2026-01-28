"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HiShoppingCart } from "react-icons/hi";
import { useCart } from "./CartContext";
import styles from "./cart-icon.module.css";

export default function CartIcon() {
  const { items } = useCart();
  const count = items?.reduce((sum, i) => sum + (i.quantity ?? 1), 0) ?? 0;

  const prevCount = useRef(count);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 260);
      return () => window.clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    prevCount.current = count;
  }, [count]);

  return (
    <span className={styles.wrap} aria-label={`Cart with ${count} items`}>
      <HiShoppingCart className={styles.icon} />
      {count > 0 && (
        <span className={`${styles.badge} ${bump ? styles.bump : ""}`}>
          {count}
        </span>
      )}
    </span>
  );
}
