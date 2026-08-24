"use client";

import { useCallback, useEffect, useState } from "react";
import type { OpensPayload } from "@/lib/types";
import type { PaperPayload } from "@/lib/paper-types";
import type { DatasPayload } from "@/lib/datas-types";
import type { PopularPayload } from "@/lib/popular-types";
import { OpensDashboard } from "./OpensDashboard";
import { NopDashboard } from "./NopDashboard";
import { PaperDashboard } from "./PaperDashboard";
import { DatasDashboard } from "./DatasDashboard";
import { PopularDashboard } from "./PopularDashboard";
import { fetchPaper } from "@/lib/paper";
import { fetchDatas } from "@/lib/datas";
import { fetchPopular } from "@/lib/popular";

const emptyOpens: OpensPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  when_label: "offline",
  pipoca: {
    rows: [],
    total_pnl_pct: 0,
    total_pnl_eur: 0,
    bank_eur: 2000,
    equity_eur: 2000,
  },
  chill: { rows: [], total_pnl_pct: 0, total_pnl_eur: 0 },
};

const emptyPaper: PaperPayload = {
  day: "",
  published_at: "",
  timezone: "Europe/Lisbon",
  cutoff: "13:55",
  count: 0,
  masthead: "O Rumors",
  tagline: "geopolítica & mercados",
  lead_uid: "",
  items: [],
  archive_days: [],
};

const emptyDatas: DatasPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  count: 0,
  rows: [],
};

const emptyPopular: PopularPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  days: 7,
  n_events: 0,
  count: 0,
  rows: [],
};

function opensTarget(): string {
  const remote = (process.env.NEXT_PUBLIC_OPENS_URL || "").trim();
  const base = remote || "/opens.sample.json";
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${encodeURIComponent(build)}&t=${Date.now()}`;
}

/** Poll leve — não martela free tier / servidor. */
const OPENS_POLL_MS = 5 * 60_000;

type Tab = "opens" | "datas" | "popular" | "nop-chill" | "nop-pipoca" | "paper";

export function OpensApp() {
  const [tab, setTab] = useState<Tab>("opens");
  const [opens, setOpens] = useState<OpensPayload>(emptyOpens);
  const [paper, setPaper] = useState<PaperPayload>(emptyPaper);
  const [datas, setDatas] = useState<DatasPayload>(emptyDatas);
  const [popular, setPopular] = useState<PopularPayload>(emptyPopular);

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

  const loadPopular = useCallback(async () => {
    try {
      setPopular(await fetchPopular());
    } catch {
      setPopular(emptyPopular);
    }
  }, []);

  const loadDatas = useCallback(async () => {
    try {
      setDatas(await fetchDatas());
    } catch {
      setDatas(emptyDatas);
    }
  }, []);

  useEffect(() => {
    loadOpens();
    loadPaper();
    loadDatas();
    loadPopular();
    const id = window.setInterval(() => {
      loadOpens();
      loadDatas();
      loadPopular();
    }, OPENS_POLL_MS);
    return () => window.clearInterval(id);
  }, [loadOpens, loadPaper, loadDatas, loadPopular]);

  useEffect(() => {
    if (tab === "paper") loadPaper();
  }, [tab, loadPaper]);

  return (
    <>
      <nav className="tabs">
        {(
          [
            ["opens", "Opens"],
            ["datas", "Datas"],
            ["popular", "Popular"],
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
      {tab === "datas" ? <DatasDashboard data={datas} /> : null}
      {tab === "popular" ? <PopularDashboard data={popular} /> : null}
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
    </>
  );
}
