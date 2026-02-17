"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  unitPriceCents: number;
  coasterSetSize?: number;
  quantity: number;
  included: string;
  productImageUrl?: string;
  imagePreviewUrl?: string;
  uploadedImageUrl?: string;
  uploadedFileName?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem("ironleaf_cart");
    if (raw) {
      const parsed = JSON.parse(raw) as CartItem[];
      const cleaned = parsed.map((item) => {
        const preview = item.imagePreviewUrl;
        const keepPreview =
          preview && !(preview.startsWith("blob:") || preview.startsWith("data:"));
        return {
          ...item,
          imagePreviewUrl: keepPreview ? preview : undefined,
        };
      });
      setItems(cleaned);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ironleaf_cart", JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotalCents = items.reduce(
      (sum, i) => sum + i.unitPriceCents * i.quantity,
      0
    );

    return {
      items,
      addItem: (item) => setItems((prev) => [...prev, item]),
      removeItem: (id) => setItems((prev) => prev.filter((x) => x.id !== id)),
      clear: () => setItems([]),
      subtotalCents,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
