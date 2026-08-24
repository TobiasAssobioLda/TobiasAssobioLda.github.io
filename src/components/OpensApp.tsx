"use client";

import { useCallback, useEffect, useState } from "react";
import type { OpensPayload } from "@/lib/types";
import type { PaperPayload } from "@/lib/paper-types";
import { OpensDashboard } from "./OpensDashboard";
import { NopDashboard } from "./NopDashboard";
import { PaperDashboard } from "./PaperDashboard";
import { SiteGate } from "./SiteGate";
import { fetchPaper } from "@/lib/paper";

const emptyOpens: OpensPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  when_label: "offline",
  pipoca: { rows: [], total_pnl_pct: 0, total_pnl_eur: 0 },
  chill: { rows: [], total_pnl_pct: 0, total_pnl_eur: 0 },
};

const emptyPaper: PaperPayload = {
  day: "",
  published_at: "",
  timezone: "Europe/Lisbon",
  cutoff: "13:55",
  count: 0,
  masthead: "O Rumors",
  tagline: "edição da tarde · geopolítica & mercados",
  lead_uid: "",
  items: [],
  archive_days: [],
};

function opensTarget(): string {
  const remote = (process.env.NEXT_PUBLIC_OPENS_URL || "").trim();
  if (remote) return remote;
  return "/opens.sample.json";
}

/** Poll leve — não martela free tier / servidor. */
const OPENS_POLL_MS = 5 * 60_000;

type Tab = "opens" | "nop-chill" | "nop-pipoca" | "paper";

export function OpensApp() {
  const [tab, setTab] = useState<Tab>("opens");
  const [opens, setOpens] = useState<OpensPayload>(emptyOpens);
  const [paper, setPaper] = useState<PaperPayload>(emptyPaper);

  const loadOpens = useCallback(async () => {
    try {
      const res = await fetch(opensTarget(), { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setOpens((await res.json()) as OpensPayload);
    } catch {
      setOpens(emptyOpens);
    }
  }, []);

  const loadPaper = useCallback(async (day?: string) => {
    try {
      const json = await fetchPaper(day);
      setPaper(json);
    } catch {
      if (!day) setPaper(emptyPaper);
    }
  }, []);

  useEffect(() => {
    loadOpens();
    loadPaper();
    const id = window.setInterval(loadOpens, OPENS_POLL_MS);
    return () => window.clearInterval(id);
  }, [loadOpens, loadPaper]);

  useEffect(() => {
    if (tab === "paper") loadPaper();
  }, [tab, loadPaper]);

  return (
    <SiteGate>
      <nav className="tabs">
        {(
          [
            ["opens", "Opens"],
            ["nop-chill", "NOP Chill"],
            ["nop-pipoca", "NOP Pipoca"],
            ["paper", "Jornal"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "tab active" : "tab"}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "opens" ? (
        <OpensDashboard
          whenLabel={opens.when_label}
          updatedAt={opens.updated_at}
          pipoca={opens.pipoca}
          chill={opens.chill}
        />
      ) : null}
      {tab === "nop-chill" ? (
        <NopDashboard
          book={opens.chill}
          label="Chill"
          updatedAt={opens.updated_at}
        />
      ) : null}
      {tab === "nop-pipoca" ? (
        <NopDashboard
          book={opens.pipoca}
          label="Pipoca"
          updatedAt={opens.updated_at}
        />
      ) : null}
      {tab === "paper" ? (
        <PaperDashboard paper={paper} onPickDay={(d) => loadPaper(d)} />
      ) : null}
    </SiteGate>
  );
}
