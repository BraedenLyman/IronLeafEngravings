import Image from "next/image";
import Link from "next/link";
import styles from "./product-card.module.css";

interface ProductCardProps {
  title: string;
  description: string;
  price: string;
  image: string;
  href: string;
}

export default function ProductCard({
  title,
  description,
  price,
  image,
  href,
}: ProductCardProps) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={image}
          alt={title}
          fill
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <h2>{title}</h2>
        <p>{description}</p>

        <div className={styles.footer}>
          <span className={styles.price}>{price}</span>
          <span className={styles.cta}>Customize →</span>
        </div>
      </div>
    </Link>
  );
}
