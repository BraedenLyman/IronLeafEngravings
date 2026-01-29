"use client";

import Link from "next/link";
import { Card, Button } from "antd";
import Header from "../components/header/Header";
import styles from "./how-it-works.module.css";
import shared from "../shared-page/shared-page.module.css";
import Footer from "../components/footer/footer";

const steps = [
  {
    title: "Pick your piece",
    content: "Choose the product you want engraved",
  },
  {
    title: "Upload your image",
    content: "Upold a family photo, pet portrait, logo, or artwork you love.",
  },
  {
    title: "We refine & approve",
    content: "We review the file and email a quick confirmation if needed.",
  },
  {
    title: "Engraved with care",
    content: "Your design is etched precisely on premium materials in our studio.",
  },
  {
    title: "Packaged & delivered",
    content: "We pack it safely and ship it to your door with tracking.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>How It Works</h1>
          <p className={styles.subtitle}>
            Custom engraving in 5 simple steps — from upload to delivery.
          </p>
        </div>

        <div className={styles.cardWrap}>
          <Card className={styles.card}>
            <div className={styles.flowGrid}>
              {steps.map((step, index) => (
                <article className={styles.flowCard} key={step.title}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepBadge}>{index + 1}</div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                  </div>
                  <p className={styles.stepBody}>{step.content}</p>
                </article>
              ))}
            </div>

            <div className={styles.ctaRow}>
              <Link href="/shop">
                <Button type="primary" className={shared.pBtn}>
                  Start Shopping
                </Button>
              </Link>

              <Link href="/contact">
                <Button className={shared.sBtn}>More Questions?</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
      < Footer />
    </main>
  );
}
