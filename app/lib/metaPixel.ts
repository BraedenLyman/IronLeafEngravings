"use client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type MetaTrackParams = Record<string, unknown>;

export function trackMetaEvent(
  eventName: string,
  params?: MetaTrackParams,
  eventId?: string
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventId) {
    window.fbq("track", eventName, params ?? {}, { eventID: eventId });
    return;
  }
  window.fbq("track", eventName, params ?? {});
}
