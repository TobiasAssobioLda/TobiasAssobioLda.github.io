"use client";

import { useEffect, useState } from "react";
import type { OpensPayload } from "@/lib/types";
import { OpensDashboard } from "./OpensDashboard";
import { SiteGate } from "./SiteGate";

const empty: OpensPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  when_label: "offline",
  pipoca: { rows: [], total_pnl_pct: 0, total_pnl_eur: 0 },
  chill: { rows: [], total_pnl_pct: 0, total_pnl_eur: 0 },
};

function opensTarget(): string {
  const remote = (process.env.NEXT_PUBLIC_OPENS_URL || "").trim();
  if (remote) return remote;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}/opens.sample.json`;
}

export function OpensApp() {
  const [data, setData] = useState<OpensPayload>(empty);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(opensTarget(), { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as OpensPayload;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(empty);
      }
    }

    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <SiteGate>
      <OpensDashboard
        whenLabel={data.when_label}
        updatedAt={data.updated_at}
        pipoca={data.pipoca}
        chill={data.chill}
      />
    </SiteGate>
  );
}
