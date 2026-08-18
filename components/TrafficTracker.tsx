"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || navigator.doNotTrack === "1") {
      return;
    }

    void fetch("/api/traffic", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true
    }).catch(() => {
      // Traffic measurement must never interrupt the visitor experience.
    });
  }, [pathname]);

  return null;
}
