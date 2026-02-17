"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/app/lib/firebaseClient";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    getFirebaseAnalytics().then((analytics) => {
      if (!analytics) return;
      logEvent(analytics, "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
    });
  }, [pathname, searchParams]);

  return null;
}
