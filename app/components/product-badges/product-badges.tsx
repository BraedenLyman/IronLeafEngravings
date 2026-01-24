import styles from "./product-badges.module.css";

export default function ProductBadges({ badges }: { badges: string[] }) {
  return (
    <div className={styles.badges}>
      {badges.map((b) => (
        <span className={styles.badge} key={b}>
          {b}
        </span>
      ))}
    </div>
  );
}
