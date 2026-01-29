import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function isEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ContactPayload>;

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 });
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? "0");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!host || !port || !user || !pass || !toEmail || !fromEmail) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      message,
    ].join("\n");

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      to: toEmail,
      from: fromEmail,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/contact error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to send message" },
      { status: 500 }
    );
  }
}
