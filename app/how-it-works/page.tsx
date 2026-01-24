"use client";

import Link from "next/link";
import { Steps, Card, Button } from "antd";
import Header from "../components/header/header";
import styles from "./how-it-works.module.css";

const steps = [
  { title: "Choose product", content: "Pick the item you want engraved (coasters, etc.)." },
  { title: "Upload image", content: "Upload a family photo, pet pic, logo, or any image you love." },
  { title: "Checkout", content: "Enter shipping details and place your order securely." },
  { title: "Confirmation", content: "We review your image and email you when it’s approved." },
  { title: "Wait for delivery", content: "We engrave it, package it carefully, and ship it to you." },
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
          <Card className={styles.card} >
            <div className={styles.desktopOnly}>
              <Steps current={0} items={steps} className={styles.steps} />
            </div>

            <div className={styles.mobileOnly}>
              <Steps orientation="vertical" current={0} items={steps} className={styles.stepsVertical} />
            </div>

            <div className={styles.ctaRow}>
              <Link href="/shop">
                <Button type="primary" className={styles.primaryBtn}>
                  Start Shopping
                </Button>
              </Link>

              <Link href="/contact">
                <Button className={styles.secondaryBtn}>Questions?</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
