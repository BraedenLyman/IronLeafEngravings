import { buildPackedParcelTotals } from "@/app/lib/shippingProfiles";

type ShippingAddress = {
  fullName: string;
  email?: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

type CartItem = {
  name: string;
  slug?: string;
  shippingProfileKey?: string;
  quantity: number;
  coasterSetSize?: number;
  unitPriceCents: number;
};

type StallionRate = {
  postage_type?: string;
  package_type?: string;
  total?: number;
  currency?: string;
  delivery_days?: string | number | null;
};

type StallionRatesResponse = {
  success?: boolean;
  rates?: StallionRate[];
  message?: string;
};

export type StallionQuote = {
  shippingCents: number;
  source: "stallion";
};

function getEnv(name: string) {
  return String(process.env[name] ?? "").trim();
}

function getApiBaseUrl() {
  const explicit = getEnv("STALLION_API_BASE_URL");
  if (explicit) return explicit.replace(/\/+$/, "");
  const useSandbox = /^true$/i.test(getEnv("STALLION_USE_SANDBOX"));
  return useSandbox ? "https://sandbox.stallionexpress.ca/api/v4" : "https://ship.stallionexpress.ca/api/v4";
}

function getProvinceCode(country: string, value: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  if (country.toUpperCase() === "CA") {
    const map: Record<string, string> = {
      ALBERTA: "AB",
      BC: "BC",
      MANITOBA: "MB",
      MB: "MB",
      NB: "NB",
      NL: "NL",
      NT: "NT",
      NS: "NS",
      NUNAVUT: "NU",
      NU: "NU",
      ONTARIO: "ON",
      ON: "ON",
      PE: "PE",
      QUEBEC: "QC",
      QC: "QC",
      SASKATCHEWAN: "SK",
      SK: "SK",
      YUKON: "YT",
      YT: "YT",
    };
    const normalized = raw.replace(/\./g, "").toUpperCase();
    if (map[normalized]) return map[normalized];
  }
  return raw.slice(0, 2).toUpperCase();
}

function toCents(total: number) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.round(total * 100);
}

function normalizeRecipientName(input: string) {
  const name = String(input ?? "").trim();
  if (name.length >= 2) return name;
  return "Customer";
}

function getEffectiveUnits(item: CartItem) {
  const qty = Math.max(1, Number(item.quantity || 0));
  const unitsPerPackage = Math.max(1, Number(item.coasterSetSize || 0) || 1);
  return qty * unitsPerPackage;
}

function buildParcel(items: CartItem[]) {
  const totals = buildPackedParcelTotals(
    items.map((item) => ({
      slug: item.slug,
      shippingProfileKey: item.shippingProfileKey,
      quantity: item.quantity,
      coasterSetSize: item.coasterSetSize,
    }))
  );

  return {
    parcel: {
      weight_unit: "g",
      weight: totals.weightG,
      length: totals.lengthCm,
      width: totals.widthCm,
      height: totals.heightCm,
      size_unit: "cm",
      package_type: getEnv("STALLION_PACKAGE_TYPE") || "Parcel",
      postage_types: [],
      signature_confirmation: false,
      insured: false,
      region: getEnv("STALLION_REGION") || null,
    },
    bagCount: totals.bagCount,
    itemCount: totals.itemCount,
  };
}

function toEnvSlugKey(slug: string) {
  return slug.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

function getItemHsCode(slug?: string) {
  const bySlug = slug ? getEnv(`STALLION_HS_CODE_${toEnvSlugKey(slug)}`) : "";
  return bySlug || getEnv("STALLION_HS_CODE_DEFAULT") || "";
}

function getItemOrigin(slug?: string) {
  const bySlug = slug ? getEnv(`STALLION_ORIGIN_${toEnvSlugKey(slug)}`) : "";
  return (bySlug || getEnv("STALLION_ORIGIN_DEFAULT") || "CA").toUpperCase();
}

function getItemSku(item: CartItem) {
  if (item.slug) return String(item.slug).trim().toUpperCase();
  const base = String(item.name || "ITEM").replace(/[^a-zA-Z0-9]+/g, "-");
  return base.slice(0, 32).toUpperCase() || "ITEM";
}

function buildCustomsItems(items: CartItem[], currency: string) {
  return items.map((item, index) => {
    const unitsPerPackage = Math.max(1, Number(item.coasterSetSize || 0) || 1);
    const lineQuantity = getEffectiveUnits(item);
    const unitValue = Number((Math.max(0, item.unitPriceCents) / unitsPerPackage / 100).toFixed(2));
    const value = unitValue > 0 ? unitValue : 1;
    const hsCode = getItemHsCode(item.slug);
    return {
      sku: getItemSku(item),
      description: String(item.name || "Product").slice(0, 120),
      quantity: lineQuantity,
      value,
      currency,
      customs: String(item.name || "Product").slice(0, 120),
      hs_code: hsCode || undefined,
      origin: getItemOrigin(item.slug),
      line_no: index + 1,
    };
  });
}

export async function getLowestStallionRate(input: {
  shipping: ShippingAddress;
  items: CartItem[];
  declaredValueCents: number;
}): Promise<StallionQuote> {
  const token = getEnv("STALLION_API_TOKEN");
  if (!token) {
    throw new Error("Missing STALLION_API_TOKEN.");
  }

  const countryCode = String(input.shipping.country ?? "").trim().toUpperCase();
  const declaredCurrency = (getEnv("STALLION_DECLARED_VALUE_CURRENCY") || "CAD").toUpperCase();
  const declaredValue = Number((Math.max(0, input.declaredValueCents) / 100).toFixed(2));
  const customsItems = buildCustomsItems(input.items, declaredCurrency);
  const { parcel, bagCount, itemCount } = buildParcel(input.items);

  console.info("[Stallion] Parcel totals", {
    lengthCm: parcel.length,
    widthCm: parcel.width,
    heightCm: parcel.height,
    totalDimensionCm: Number((parcel.length + parcel.width + parcel.height).toFixed(2)),
    weightG: parcel.weight,
    bagCount,
    itemCount,
  });

  const payload = {
    to_address: {
      name: normalizeRecipientName(input.shipping.fullName),
      address1: input.shipping.address1,
      address2: input.shipping.address2 || "",
      city: input.shipping.city,
      province_code: getProvinceCode(countryCode, input.shipping.province),
      postal_code: input.shipping.postalCode,
      country_code: countryCode,
      phone: input.shipping.phone || "",
      email: input.shipping.email || "",
      is_residential: true,
    },
    package_contents: getEnv("STALLION_PACKAGE_CONTENTS") || "Merchandise",
    value: declaredValue > 0 ? declaredValue : 1,
    currency: declaredCurrency,
    items: customsItems,
    ...parcel,
  };

  const response = await fetch(`${getApiBaseUrl()}/rates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Stallion rates request failed (${response.status}): ${body.slice(0, 240)}`);
  }

  const data = (await response.json()) as StallionRatesResponse;
  const rates = Array.isArray(data.rates) ? data.rates : [];
  if (!rates.length) {
    throw new Error(data.message || "Stallion returned no rates.");
  }

  const sortable = rates
    .map((rate) => ({
      total: Number(rate.total ?? 0),
    }))
    .filter((rate) => Number.isFinite(rate.total) && rate.total > 0);

  if (!sortable.length) {
    throw new Error("Stallion returned invalid rates.");
  }

  sortable.sort((a, b) => a.total - b.total);
  const best = sortable[0];
  const shippingCents = toCents(best.total);
  if (!shippingCents) {
    throw new Error("Stallion returned invalid total.");
  }

  return {
    shippingCents,
    source: "stallion",
  };
}
