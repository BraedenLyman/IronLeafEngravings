"use client";

import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebaseClient";
import type { Product } from "../lib/products";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "products"), where("active", "==", true));
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => d.data() as Product));
    }
    load();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {products.map((p) => (
        <Link key={p.slug} href={`/shop/${p.slug}`}>
          {p.title}
        </Link>
      ))}
    </div>
  );
}
