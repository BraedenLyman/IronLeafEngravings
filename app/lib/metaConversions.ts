import { createHash } from "node:crypto";

type MetaUserDataInput = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

type MetaEventInput = {
  eventName: string;
  eventId?: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: "website";
  customData?: Record<string, unknown>;
  userData?: MetaUserDataInput;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCountry(value: string) {
  return value.trim().toLowerCase();
}

function hashIfPresent(value: string | null | undefined, normalizer: (v: string) => string) {
  if (!value) return undefined;
  const normalized = normalizer(value);
  if (!normalized) return undefined;
  return sha256(normalized);
}

function toMetaUserData(input: MetaUserDataInput = {}) {
  const em = hashIfPresent(input.email, normalizeEmail);
  const ph = hashIfPresent(input.phone, normalizePhone);
  const fn = hashIfPresent(input.firstName, normalizeText);
  const ln = hashIfPresent(input.lastName, normalizeText);
  const ct = hashIfPresent(input.city, normalizeText);
  const st = hashIfPresent(input.state, normalizeText);
  const zp = hashIfPresent(input.zip, normalizeText);
  const country = hashIfPresent(input.country, normalizeCountry);

  return {
    ...(em ? { em: [em] } : {}),
    ...(ph ? { ph: [ph] } : {}),
    ...(fn ? { fn: [fn] } : {}),
    ...(ln ? { ln: [ln] } : {}),
    ...(ct ? { ct: [ct] } : {}),
    ...(st ? { st: [st] } : {}),
    ...(zp ? { zp: [zp] } : {}),
    ...(country ? { country: [country] } : {}),
    ...(input.clientIpAddress ? { client_ip_address: input.clientIpAddress } : {}),
    ...(input.clientUserAgent ? { client_user_agent: input.clientUserAgent } : {}),
    ...(input.fbp ? { fbp: input.fbp } : {}),
    ...(input.fbc ? { fbc: input.fbc } : {}),
  };
}

function getMetaConfig() {
  const pixelId = process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
  const accessToken = process.env.META_ACCESS_TOKEN ?? "";
  const apiVersion = process.env.META_API_VERSION ?? "v23.0";
  const testEventCode = process.env.META_TEST_EVENT_CODE ?? "";
  return { pixelId, accessToken, apiVersion, testEventCode };
}

export async function sendMetaConversionEvent(input: MetaEventInput) {
  const { pixelId, accessToken, apiVersion, testEventCode } = getMetaConfig();
  if (!pixelId || !accessToken) return { sent: false as const, reason: "missing_config" as const };

  const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
  const body = {
    data: [
      {
        event_name: input.eventName,
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: input.actionSource ?? "website",
        event_source_url: input.eventSourceUrl,
        user_data: toMetaUserData(input.userData),
        custom_data: input.customData ?? {},
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Meta CAPI request failed:", res.status, text);
      return { sent: false as const, reason: "api_error" as const };
    }
    return { sent: true as const };
  } catch (error) {
    console.error("Meta CAPI request error:", error);
    return { sent: false as const, reason: "network_error" as const };
  }
}
