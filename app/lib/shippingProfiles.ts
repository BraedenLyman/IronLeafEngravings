export type ParcelSpec = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightG: number;
  bags: number;
};

type ShippingLineItem = {
  slug?: string;
  shippingProfileKey?: string;
  quantity: number;
  coasterSetSize?: number;
};

type ShippingProfile = {
  defaultSpec: ParcelSpec;
  bySetSize?: Record<number, ParcelSpec>;
};

type PackedParcelTotals = {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightG: number;
  bagCount: number;
  itemCount: number;
};

function getEnv(name: string) {
  return String(process.env[name] ?? "").trim();
}

const DEFAULT_SPEC: ParcelSpec = {
  lengthCm: Number(getEnv("STALLION_PARCEL_LENGTH_CM") || "20.32"),
  widthCm: Number(getEnv("STALLION_PARCEL_WIDTH_CM") || "20.32"),
  heightCm: Number(getEnv("STALLION_PARCEL_HEIGHT_CM") || "5.08"),
  weightG: Number(getEnv("STALLION_ITEM_WEIGHT_G") || "170.1"),
  bags: 1,
};

const WOODEN_COASTER_PROFILE: ShippingProfile = {
  defaultSpec: { lengthCm: 10, widthCm: 10, heightCm: 0.9, weightG: 75, bags: 1 },
  bySetSize: {
    1: { lengthCm: 10, widthCm: 10, heightCm: 0.9, weightG: 75, bags: 1 },
    2: { lengthCm: 20, widthCm: 10, heightCm: 1.8, weightG: 130, bags: 1 },
    4: { lengthCm: 20, widthCm: 20, heightCm: 1.8, weightG: 240, bags: 1 },
    6: { lengthCm: 30, widthCm: 20, heightCm: 5.4, weightG: 350, bags: 1 },
    8: { lengthCm: 30, widthCm: 30, heightCm: 7.2, weightG: 460, bags: 1 },
    12: { lengthCm: 40, widthCm: 30, heightCm: 10.8, weightG: 680, bags: 1 },
    24: { lengthCm: 80, widthCm: 60, heightCm: 21.6, weightG: 1380, bags: 2 },
    50: { lengthCm: 180, widthCm: 130, heightCm: 45, weightG: 2850, bags: 5 },
    100: { lengthCm: 340, widthCm: 260, heightCm: 90, weightG: 5680, bags: 9 },
  },
};

const SHIPPING_PROFILES_BY_SLUG: Record<string, ShippingProfile> = {
  "wooden-coasters": WOODEN_COASTER_PROFILE,
  "ceramic-coasters": {
    defaultSpec: DEFAULT_SPEC,
  },
};
// Add new products here by slug/profile key:
// "new-product-slug": { defaultSpec: { lengthCm, widthCm, heightCm, weightG, bags }, bySetSize?: { ... } }

function resolveLineSpec(item: ShippingLineItem): ParcelSpec {
  const profileKey = String(item.shippingProfileKey ?? item.slug ?? "").trim().toLowerCase();
  const profile = SHIPPING_PROFILES_BY_SLUG[profileKey];
  if (!profile) return DEFAULT_SPEC;

  const setSize = Math.max(1, Number(item.coasterSetSize || 0) || 1);
  if (profile.bySetSize?.[setSize]) return profile.bySetSize[setSize];
  return profile.defaultSpec;
}

function getEffectiveUnits(item: ShippingLineItem) {
  const qty = Math.max(1, Number(item.quantity || 0));
  const unitsPerPackage = Math.max(1, Number(item.coasterSetSize || 0) || 1);
  return qty * unitsPerPackage;
}

export function buildPackedParcelTotals(items: ShippingLineItem[]): PackedParcelTotals {
  if (!items.length) {
    return {
      lengthCm: DEFAULT_SPEC.lengthCm,
      widthCm: DEFAULT_SPEC.widthCm,
      heightCm: DEFAULT_SPEC.heightCm,
      weightG: DEFAULT_SPEC.weightG,
      bagCount: 1,
      itemCount: 1,
    };
  }

  let maxLengthCm = 0;
  let maxWidthCm = 0;
  let totalHeightCm = 0;
  let totalWeightG = 0;
  let totalBags = 0;
  let totalItemCount = 0;

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity || 0));
    const spec = resolveLineSpec(item);
    maxLengthCm = Math.max(maxLengthCm, Math.max(0.1, spec.lengthCm));
    maxWidthCm = Math.max(maxWidthCm, Math.max(0.1, spec.widthCm));
    totalHeightCm += Math.max(0.1, spec.heightCm) * qty;
    totalWeightG += Math.max(0.1, spec.weightG) * qty;
    totalBags += Math.max(1, Number(spec.bags || 1)) * qty;
    totalItemCount += getEffectiveUnits(item);
  }

  return {
    lengthCm: Number(maxLengthCm.toFixed(2)),
    widthCm: Number(maxWidthCm.toFixed(2)),
    heightCm: Number(totalHeightCm.toFixed(2)),
    weightG: Number(totalWeightG.toFixed(2)),
    bagCount: Math.max(1, totalBags),
    itemCount: Math.max(1, totalItemCount),
  };
}
