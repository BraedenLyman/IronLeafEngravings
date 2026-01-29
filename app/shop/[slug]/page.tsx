import Header from "../../components/header/Header";
import shared from "../../shared-page/shared-page.module.css";
import { PRODUCT_SLUGS } from "../../lib/products";
import ProductClient from "./product-client";

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className={shared.page}>
      <Header />
      <ProductClient slug={slug} />
    </main>
  );
}
