import type { Metadata } from "next";
import { OpensDashboard } from "@/components/OpensDashboard";
import { fetchOpens } from "@/lib/opens";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade1 · Opens",
  description: "Pipoca / Chill open positions",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let data;
  try {
    data = await fetchOpens();
  } catch {
    data = {
      updated_at: "",
      timezone: "Europe/Lisbon",
      when_label: "offline",
      pipoca: { rows: [], total_pnl_pct: 0, total_pnl_eur: 0 },
      chill: { rows: [], total_pnl_pct: 0, total_pnl_eur: 0 },
    };
  }

  return (
    <OpensDashboard
      whenLabel={data.when_label}
      updatedAt={data.updated_at}
      pipoca={data.pipoca}
      chill={data.chill}
    />
  );
}
