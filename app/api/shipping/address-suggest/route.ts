import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getPlacesApiKey() {
  return String(process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "").trim();
}

type Suggestion = {
  placeId: string;
  text: string;
};

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
    const q = String(searchParams.get("q") ?? "").trim();
    const country = String(searchParams.get("country") ?? "").trim().toLowerCase();
    if (q.length < 3) {
      return NextResponse.json({ suggestions: [] as Suggestion[] });
    }

    const payload: Record<string, unknown> = {
      input: q,
      languageCode: "en",
      includedPrimaryTypes: ["street_address"],
    };
    if (country) payload.includedRegionCodes = [country];

    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        { error: `Autocomplete failed (${response.status}): ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      suggestions?: Array<{ placePrediction?: { placeId?: string; text?: { text?: string } } }>;
    };

    const suggestions: Suggestion[] = (data.suggestions ?? [])
      .map((s) => ({
        placeId: String(s.placePrediction?.placeId ?? "").trim(),
        text: String(s.placePrediction?.text?.text ?? "").trim(),
      }))
      .filter((s) => s.placeId && s.text);

    return NextResponse.json({ suggestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch suggestions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
