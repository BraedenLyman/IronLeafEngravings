import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getPlacesApiKey() {
  return String(process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "").trim();
}

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

function findComponent(components: AddressComponent[], type: string) {
  return components.find((c) => Array.isArray(c.types) && c.types.includes(type));
}

export async function GET(req: Request) {
  try {
    const apiKey = getPlacesApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const placeId = String(searchParams.get("placeId") ?? "").trim();
    if (!placeId) {
      return NextResponse.json({ error: "Missing placeId." }, { status: 400 });
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "addressComponents,formattedAddress",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        { error: `Place details failed (${response.status}): ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { addressComponents?: AddressComponent[] };
    const components = Array.isArray(data.addressComponents) ? data.addressComponents : [];

    const streetNumber = findComponent(components, "street_number")?.longText ?? "";
    const route = findComponent(components, "route")?.longText ?? "";
    const city =
      findComponent(components, "locality")?.longText ??
      findComponent(components, "sublocality")?.longText ??
      "";
    const province = findComponent(components, "administrative_area_level_1")?.shortText ?? "";
    const postalCode = findComponent(components, "postal_code")?.longText ?? "";
    const country = findComponent(components, "country")?.shortText ?? "";

    return NextResponse.json({
      normalizedShipping: {
        address1: [streetNumber, route].filter(Boolean).join(" ").trim(),
        city,
        province,
        postalCode,
        country,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch address details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
