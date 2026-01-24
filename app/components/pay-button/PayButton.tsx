"use client";

export default function PayButton() {
  const checkout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            name: "Custom Engraved Coaster",
            priceInCents: 2499,
            quantity: 1,
          },
        ],
      }),
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return <button onClick={checkout}>Pay with Stripe</button>;
}
