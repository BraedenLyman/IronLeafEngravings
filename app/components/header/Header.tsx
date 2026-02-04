"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import CartIcon from "../cart/CartIcon";

type NavItem = {
  href: string;
  label: string;
  match?: "exact" | "startsWith";
};

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Home", match: "exact" },
      { href: "/how-it-works", label: "How it works", match: "startsWith" },
      { href: "/shop", label: "Shop", match: "startsWith" },
      /*{ href: "/about", label: "About", match: "startsWith"}, */
      { href: "/contact", label: "Contact", match: "startsWith" },
    ],
    []
  );

  const isActive = (item: NavItem) => {
    if (item.match === "exact") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const closeMenu = () => setOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Go to homepage" onClick={closeMenu}>
          <Image
            src="/logo/IronLeafLogo.png"
            alt="IronLeaf Engraving Logo"
            width={280}
            height={90}
            priority
            className={styles.logo}
          />
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.burgerBar} />
          <span className={styles.burgerBar} />
          <span className={styles.burgerBar} />
        </button>

        <nav
          id="primary-nav"
          className={`${styles.nav} ${open ? styles.navOpen : ""}`}
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${isActive(item) ? styles.active : ""}`}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/cart"
            className={`${styles.cartLink} ${pathname.startsWith("/cart") ? styles.activeCart : ""}`}
            aria-label="Open cart"
            onClick={closeMenu}
          >
            <CartIcon />
          </Link>
        </nav>
      </div>
    </header>
  );
}
