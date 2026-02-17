export const SHIPPING_RATE_ID_BY_COUNTRY: Record<string, string> = {
  CA: "shr_1T1puYCmXH90Tjj8v7qFXgHP",
  GB: "shr_1T1puqCmXH90Tjj8MdgQ8TBX",
  US: "shr_1T1pwUCmXH90Tjj8mShBxhaH",
  NZ: "shr_1T1pwiCmXH90Tjj83i88BoSp",
};

export const SHIPPING_CENTS_BY_COUNTRY: Record<string, number> = {
  CA: 499,
  GB: 499,
  US: 1299,
  NZ: 1299,
};

export const WOODEN_COASTER_SET_SIZES = [1, 2, 4, 6, 8, 12, 24, 50, 100] as const;

export function normalizeCountry(code: string | null | undefined) {
  return String(code ?? "").trim().toUpperCase();
}

export function normalizeItemPriceCents(input: {
  hasPriceOverride: boolean;
  priceOverrideCents: number;
  slug?: string;
  name: string;
  priceInCents: number;
  coasterSetSize?: number;
}) {
  if (input.hasPriceOverride) return input.priceOverrideCents;
  if (input.slug === "wooden-coasters" || /wooden\s+coaster/i.test(input.name)) {
    const rawSetSize = Number(input.coasterSetSize ?? 1);
    const setSize = WOODEN_COASTER_SET_SIZES.includes(rawSetSize as (typeof WOODEN_COASTER_SET_SIZES)[number])
      ? rawSetSize
      : 1;
    return 999 * setSize;
  }
  return input.priceInCents;
}
