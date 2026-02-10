import { FaArrowRight } from "react-icons/fa";
import Header from "../components/header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./about.module.css";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className={shared.page}>
      <Header />
      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>About</h1>
          <p className={shared.subtitle}>
            IronLeaf turns meaningful photos and designs into engraved keepsakes.
          </p>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            <div className={styles.layout}>
              {/* Image */}
              <div className={styles.imagePlaceholder}>
                <Image
                  src="/about/workshop.jpg"
                  alt="IronLeaf laser engraving a coaster in our workshop"
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 520px"
                  style={{ objectFit: "cover" }}
                />
              </div>

              {/* Content */}
              <div className={styles.content}>
                <h2 className={styles.sectionTitle}>What we make</h2>
                <p className={styles.text}>
                  We create custom laser-engraved keep sakes that capture the moments that matter. Family photos,
                  pets, wedding memories, logos, and more. Upload your image, choose your piece, and we’ll
                  engrave it with crisp, high-contrast detail.
                </p>

                <h2 className={styles.sectionTitle}>Why IronLeaf</h2>
                <ul className={styles.list}>
                  <li className={styles.listItem}><FaArrowRight/>Sharp engraving that keeps the details</li>
                  <li className={styles.listItem}><FaArrowRight/>Made with care in Canada</li>
                  <li className={styles.listItem}><FaArrowRight/>Built for gifts, weddings, and everyday use</li>
                </ul>
                
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
