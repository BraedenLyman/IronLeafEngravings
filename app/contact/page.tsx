"use client";

import { useState } from "react";
import Header from "../components/Header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./contact.module.css";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sent");
  };

  return (
    <main className={shared.page}>
      <Header />

      <section className={shared.container}>
        <div className={shared.hero}>
          <h1 className={shared.title}>Contact</h1>
          <p className={shared.subtitle}>
            Questions about an order or custom engraving? Send a message and we’ll get back to you.
          </p>
        </div>

        <div className={styles.cardWrap}>
          <div className={styles.card}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="name">Name</label>
                  <input id="name" name="name" type="text" placeholder="Your name" required />
                </div>

                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" placeholder="you@email.com" required />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="subject">Subject</label>
                <input id="subject" name="subject" type="text" placeholder="What’s this about?" required />
              </div>

              <div className={styles.field}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us what you need…"
                  rows={6}
                  required
                />
              </div>

              <div className={styles.actions}>
                <button className={styles.primaryBtn} type="submit">
                  Send Message
                </button>

                {status === "sent" && (
                  <p className={styles.success}>
                    ✅ Message queued! (Hook up sending next)
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
