export type Product = {
  slug: string;
  title: string;
  description: string;
  image: string;
  priceCents: number;
  badges: string[];
  keyPoints: string[];
  included: string;
  active: boolean;
  stripePriceId?: string; 
};

export const PRODUCT_SLUGS = ["wooden-coasters", "ceramic-coasters"] as const;
