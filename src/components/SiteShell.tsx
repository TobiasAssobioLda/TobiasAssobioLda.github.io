"use client";

import { useEffect, useState } from "react";
import { isSiteLive } from "@/lib/site-live";
import { ComingSoon } from "./ComingSoon";
import { OpensApp } from "./OpensApp";
import { SiteGate } from "./SiteGate";

/** Antes de LIVE_AT → landing. Depois → app completa. */
export function SiteShell() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    const tick = () => setLive(isSiteLive());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <SiteGate>
      {live ? <OpensApp /> : <ComingSoon />}
    </SiteGate>
  );
}
