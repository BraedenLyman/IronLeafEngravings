"use client";

import styles from "./hero2.module.css";
import shared from "../../shared-page/shared-page.module.css";
import Image from "next/image";
import Link from "next/link";
import { Button, Card, Typography } from "antd";
import { AimOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { GiTreeBranch } from "react-icons/gi";
import { FaArrowRight } from "react-icons/fa";

const { Text } = Typography;

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="IronLeaf hero">
      {/* Background Image */}
      <Image
        src="/hero/IronLeafHero.png"
        alt="IronLeaf Hero Image - Home Page"
        fill
        priority
        sizes="100vw"
        className={styles.heroImg}
      />

      {/* Overlays */}
      <div className={styles.scrim} />
      <div className={styles.fadeBottom} />

      {/* LEFT-ALIGNED CONTENT */}
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <span className={styles.kicker}>Custom photo engraving</span>

          <h1 className={styles.title}>
            Your Memories,<br />Permanently Engraved
          </h1>

          {/*
          <p className={styles.subtitle}>
            Upload a photo and we’ll engrave it onto real hardwood — perfect for gifts,
            weddings, and home décor.
          </p>
          */}
          
          <div className={styles.ctas}>
            <Link href="/shop" className={styles.linkReset}>
              <Button
                size="large"
                className={shared.pBtn}
                icon={<FaArrowRight />}
              >
                Shop Products
              </Button>
            </Link>

            <Link href="/how-it-works" className={styles.linkReset}>
              <Button
                size="large"
                className={shared.sBtn}
                icon={<FaArrowRight />}
              >
                How It Works
              </Button>
            </Link>
          </div>

          {/* 
          <Card className={styles.badgeCard} variant="borderless">
            <div className={styles.badgeRow}>
              <div className={styles.badgePill}>
                <AimOutlined className={styles.badgeIcon} />
                <Text className={styles.badgeText}>Precision laser engraved</Text>
              </div>

              <div className={styles.badgePill}>
                <GiTreeBranch className={styles.badgeIcon} />
                <Text className={styles.badgeText}>Made from real hardwood</Text>
              </div>

              <div className={styles.badgePill}>
                <SafetyCertificateOutlined className={styles.badgeIcon} />
                <Text className={styles.badgeText}>Crafted with care in Canada</Text>
              </div>
            </div>
          </Card>
          */}
        </div>
      </div>
    </section>
  );
}
