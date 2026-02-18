"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackMetaEvent } from "@/app/lib/metaPixel";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function AnalyticsTracker({
  measurementId,
  metaPixelId,
}: {
  measurementId: string;
  metaPixelId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    if (measurementId && typeof window.gtag === "function") {
      window.gtag("config", measurementId, {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
    }

    if (metaPixelId) {
      trackMetaEvent("PageView");
    }
  }, [measurementId, metaPixelId, pathname, searchParams]);

  return null;
}
