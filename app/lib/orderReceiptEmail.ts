import nodemailer from "nodemailer";

type ReceiptLineItem = {
  name: string;
  quantity: number;
  unitAmount: number | null;
  totalAmount: number | null;
};

type ReceiptShipping = {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
};

type SendReceiptInput = {
  to: string;
  orderId: string;
  createdAt: Date;
  currency: string;
  amountTotal: number | null;
  shippingAmount?: number | null;
  items: ReceiptLineItem[];
  shipping?: ReceiptShipping | null;
};

type SendOrderNotificationInput = {
  orderId: string;
  createdAt: Date;
  currency: string;
  amountTotal: number | null;
  items: ReceiptLineItem[];
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shipping?: ReceiptShipping | null;
};

function formatMoney(amount: number | null, currency: string) {
  if (amount == null) return "—";
  const safeCurrency = (currency || "USD").toUpperCase();
  const value = amount / 100;
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: safeCurrency,
    }).format(value);
  } catch {
    return `${safeCurrency} ${value.toFixed(2)}`;
  }
}

function formatAddress(address?: ReceiptShipping["address"] | null) {
  if (!address) return "";
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .map((p) => String(p).trim())
    .filter(Boolean);
  return parts.join(", ");
}

function renderReceiptText(input: SendReceiptInput) {
  const lines = input.items
    .map((item) => {
      const total = item.totalAmount ?? (item.unitAmount ?? 0) * item.quantity;
      return `${item.quantity} x ${item.name} — ${formatMoney(total, input.currency)}`;
    })
    .join("\n");

  const shippingName = input.shipping?.name ? String(input.shipping.name) : "";
  const shippingAddress = formatAddress(input.shipping?.address ?? null);
  const shippingBlock = shippingName || shippingAddress
    ? `\nShipping:\n${[shippingName, shippingAddress].filter(Boolean).join("\n")}\n`
    : "";

  return [
    `Thanks for your order!`,
    `Order ID: ${input.orderId}`,
    `Date: ${input.createdAt.toLocaleString("en-CA")}`,
    "",
    "Items:",
    lines || "—",
    "",
    ...(input.shippingAmount != null ? [`Shipping: ${formatMoney(input.shippingAmount, input.currency)}`] : []),
    `Total: ${formatMoney(input.amountTotal, input.currency)}`,
    shippingBlock.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function renderReceiptHtml(input: SendReceiptInput) {
  const itemsHtml = input.items
    .map((item) => {
      const total = item.totalAmount ?? (item.unitAmount ?? 0) * item.quantity;
      return `
        <tr>
          <td style="padding:8px 0;">${item.quantity} × ${escapeHtml(item.name)}</td>
          <td style="padding:8px 0; text-align:right;">${formatMoney(total, input.currency)}</td>
        </tr>
      `;
    })
    .join("");

  const shippingName = input.shipping?.name ? String(input.shipping.name) : "";
  const shippingAddress = formatAddress(input.shipping?.address ?? null);

  return `
  <div style="font-family: Arial, sans-serif; color:#1f2937; max-width:640px; margin:0 auto;">
    <h2 style="margin:0 0 8px;">Thanks for your order!</h2>
    <p style="margin:0 0 16px;">Order ID: <strong>${escapeHtml(input.orderId)}</strong></p>
    <p style="margin:0 0 24px; color:#6b7280;">${escapeHtml(input.createdAt.toLocaleString("en-CA"))}</p>

    <table style="width:100%; border-collapse:collapse;">
      <tbody>
        ${itemsHtml || `<tr><td style="padding:8px 0;">—</td><td></td></tr>`}
        ${
          input.shippingAmount != null
            ? `
        <tr>
          <td style="padding:8px 0;">Shipping</td>
          <td style="padding:8px 0; text-align:right;">${formatMoney(input.shippingAmount, input.currency)}</td>
        </tr>
      `
            : ""
        }
        <tr>
          <td style="padding:12px 0; border-top:1px solid #e5e7eb;"><strong>Total</strong></td>
          <td style="padding:12px 0; border-top:1px solid #e5e7eb; text-align:right;"><strong>${formatMoney(input.amountTotal, input.currency)}</strong></td>
        </tr>
      </tbody>
    </table>

    ${
      shippingName || shippingAddress
        ? `
      <div style="margin-top:24px;">
        <h4 style="margin:0 0 6px;">Shipping</h4>
        <div style="color:#374151; line-height:1.4;">
          ${[shippingName, shippingAddress]
            .filter(Boolean)
            .map((line) => escapeHtml(String(line)))
            .join("<br/>")}
        </div>
      </div>
    `
        : ""
    }

    <p style="margin-top:28px; color:#6b7280; font-size:12px;">
      If you have any questions, reply to this email.
    </p>
  </div>
  `;
}

function renderOrderNotificationText(input: SendOrderNotificationInput) {
  const lines = input.items
    .map((item) => {
      const total = item.totalAmount ?? (item.unitAmount ?? 0) * item.quantity;
      return `${item.quantity} x ${item.name} — ${formatMoney(total, input.currency)}`;
    })
    .join("\n");

  const shippingName = input.shipping?.name ? String(input.shipping.name) : "";
  const shippingAddress = formatAddress(input.shipping?.address ?? null);
  const shippingBlock = shippingName || shippingAddress
    ? `\nShipping:\n${[shippingName, shippingAddress].filter(Boolean).join("\n")}\n`
    : "";

  return [
    "New order received",
    `Order ID: ${input.orderId}`,
    `Date: ${input.createdAt.toLocaleString("en-CA")}`,
    "",
    "Customer:",
    `Name: ${input.customerName ?? "—"}`,
    `Email: ${input.customerEmail ?? "—"}`,
    `Phone: ${input.customerPhone ?? "—"}`,
    "",
    "Items:",
    lines || "—",
    "",
    `Total: ${formatMoney(input.amountTotal, input.currency)}`,
    shippingBlock.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function renderOrderNotificationHtml(input: SendOrderNotificationInput) {
  const itemsHtml = input.items
    .map((item) => {
      const total = item.totalAmount ?? (item.unitAmount ?? 0) * item.quantity;
      return `
        <tr>
          <td style="padding:8px 0;">${item.quantity} × ${escapeHtml(item.name)}</td>
          <td style="padding:8px 0; text-align:right;">${formatMoney(total, input.currency)}</td>
        </tr>
      `;
    })
    .join("");

  const shippingName = input.shipping?.name ? String(input.shipping.name) : "";
  const shippingAddress = formatAddress(input.shipping?.address ?? null);

  return `
  <div style="font-family: Arial, sans-serif; color:#111827; max-width:640px; margin:0 auto;">
    <h2 style="margin:0 0 8px;">New order received</h2>
    <p style="margin:0 0 6px;">Order ID: <strong>${escapeHtml(input.orderId)}</strong></p>
    <p style="margin:0 0 18px; color:#6b7280;">${escapeHtml(input.createdAt.toLocaleString("en-CA"))}</p>

    <h3 style="margin:18px 0 8px;">Customer</h3>
    <div style="color:#374151; line-height:1.5;">
      ${escapeHtml(input.customerName ?? "—")}<br/>
      ${escapeHtml(input.customerEmail ?? "—")}<br/>
      ${escapeHtml(input.customerPhone ?? "—")}
    </div>

    <h3 style="margin:20px 0 8px;">Items</h3>
    <table style="width:100%; border-collapse:collapse;">
      <tbody>
        ${itemsHtml || `<tr><td style="padding:8px 0;">—</td><td></td></tr>`}
        <tr>
          <td style="padding:12px 0; border-top:1px solid #e5e7eb;"><strong>Total</strong></td>
          <td style="padding:12px 0; border-top:1px solid #e5e7eb; text-align:right;"><strong>${formatMoney(input.amountTotal, input.currency)}</strong></td>
        </tr>
      </tbody>
    </table>

    ${
      shippingName || shippingAddress
        ? `
      <div style="margin-top:24px;">
        <h4 style="margin:0 0 6px;">Shipping</h4>
        <div style="color:#374151; line-height:1.4;">
          ${[shippingName, shippingAddress]
            .filter(Boolean)
            .map((line) => escapeHtml(String(line)))
            .join("<br/>")}
        </div>
      </div>
    `
        : ""
    }
  </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getEmailConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "0");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.CONTACT_FROM_EMAIL || user || "";

  if (!host || !port || !user || !pass || !from) return null;
  return { host, port, user, pass, from };
}

export async function sendOrderReceiptEmail(input: SendReceiptInput) {
  const config = getEmailConfig();
  if (!config) return { ok: false, reason: "email_not_configured" as const };

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    to: input.to,
    from: config.from,
    replyTo: config.from,
    subject: `Your Iron Leaf Engravings receipt • ${input.orderId}`,
    text: renderReceiptText(input),
    html: renderReceiptHtml(input),
  });

  return { ok: true as const };
}

export async function sendOrderNotificationEmail(input: SendOrderNotificationInput) {
  const config = getEmailConfig();
  if (!config) return { ok: false, reason: "email_not_configured" as const };

  const to = process.env.CONTACT_TO_EMAIL;
  if (!to) return { ok: false, reason: "missing_recipient" as const };

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    to,
    from: config.from,
    replyTo: config.from,
    subject: `New order • ${input.orderId}`,
    text: renderOrderNotificationText(input),
    html: renderOrderNotificationHtml(input),
  });

  return { ok: true as const };
}
