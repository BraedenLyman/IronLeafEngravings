import Image from "next/image";
import Link from "next/link";
import styles from "./product-card.module.css";
import { FaArrowRight } from "react-icons/fa";

interface ProductCardProps {
  title: string;
  description: string;
  price: string;
  image: string;
  href?: string;
  comingSoon?: boolean;
}

export default function ProductCard({
  title,
  description,
  price,
  image,
  href,
  comingSoon = false,
}: ProductCardProps) {
  const body = (
    <>
      <div className={styles.imageWrapper}>
        <Image
          src={image}
          alt={title}
          fill
          className={styles.image}
        />
        {comingSoon && (
          <span className={styles.badge}>Coming soon</span>
        )}
      </div>

      <div className={styles.content}>
        <h2>{title}</h2>
        <p>{description}</p>

        <div className={styles.footer}>
          <span className={styles.price}>{price}</span>
          {comingSoon ? (
            <span className={styles.ctaDisabled}>Coming soon</span>
          ) : (
            <span className={styles.cta}>Customize<FaArrowRight/></span>
          )}
        </div>
      </div>
    </>
  );

  if (comingSoon || !href) {
    return (
      <div className={`${styles.card} ${styles.cardDisabled}`} aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link href={href} className={styles.card}>
      {body}
    </Link>
  );
}
