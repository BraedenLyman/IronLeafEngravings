import { stripe } from "@/app/lib/stripe";

export const runtime = "nodejs";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams; // ✅ unwrap promise

  if (!session_id) {
    return <main style={{ padding: 24 }}>Missing session_id</main>;
  }

  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["line_items"],
  });

  const items = session.line_items?.data ?? [];
  const total = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Payment successful ✅</h1>
      <p><b>Session:</b> {session.id}</p>
      <p><b>Status:</b> {session.payment_status}</p>
      <p>
        <b>Total:</b> ${total} {session.currency?.toUpperCase()}
      </p>

      <h2>Items</h2>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            {i.description} × {i.quantity}
          </li>
        ))}
      </ul>

      <h2>Uploaded image</h2>
      <p><b>Filename:</b> {session.metadata?.uploadedFileName || "—"}</p>
      {session.metadata?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.metadata.imageUrl}
          alt="Uploaded"
          style={{ maxWidth: "100%", borderRadius: 12 }}
        />
      ) : (
        <p>No image found.</p>
      )}
    </main>
  );
}
