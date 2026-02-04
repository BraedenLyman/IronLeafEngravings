"use client";

import { useState } from "react";
import Header from "../components/header/Header";
import shared from "../shared-page/shared-page.module.css";
import styles from "./contact.module.css";
import Footer from "../components/footer/footer";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setStatus("sending");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed to send message");

      form.reset();
      setStatus("sent");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message ?? "Failed to send message");
    }
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
                <button className={shared.pBtn} type="submit" disabled={status === "sending"}>
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>

                {status === "sent" && (
                  <p className={styles.success}>
                    Message sent! We'll get back to you soon.
                  </p>
                )}
                {status === "error" && (
                  <p className={styles.success} style={{ color: "#ef4444" }}>
                    {errorMessage || "Failed to send message."}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
