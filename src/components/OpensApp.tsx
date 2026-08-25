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
import { PossibleDashboard } from "./PossibleDashboard";
import { fetchPaper } from "@/lib/paper";
import { fetchDatas } from "@/lib/datas";
import { fetchPopular } from "@/lib/popular";
import { fetchOpens } from "@/lib/opens";

const emptyBook = {
  rows: [] as OpensPayload["pipoca"]["rows"],
  total_pnl_pct: 0,
  total_pnl_eur: 0,
};

const emptyOpens: OpensPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  when_label: "offline",
  pipoca: { ...emptyBook, bank_eur: 2000, equity_eur: 2000 },
  chill: { ...emptyBook },
  pipoca_all: { ...emptyBook, bank_eur: 10000, equity_eur: 10000 },
  possible: {
    rows: [],
    quase: [],
    out_market: [],
    day: "",
    retry_min: 15,
    max_tries: 6,
  },
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
  opens_count: 0,
  calendar_count: 0,
  opens_rows: [],
  calendar_rows: [],
};

const emptyPopular: PopularPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  days: 7,
  n_events: 0,
  top5_count: 0,
  top6_20_count: 0,
  top5: [],
  top6_20: [],
};

/** Poll leve — não martela free tier / servidor. */
const OPENS_POLL_MS = 2 * 60_000;
const PAPER_POLL_MS = 3 * 60_000;

type Tab = "opens" | "possible" | "datas" | "popular" | "nop" | "paper";
type OpenBook = "pipoca" | "chill" | "pipoca_all";
type NopBook = "chill" | "pipoca" | "pipoca_all";

export function OpensApp() {
  const [tab, setTab] = useState<Tab>("opens");
  const [openBook, setOpenBook] = useState<OpenBook>("pipoca");
  const [nopBook, setNopBook] = useState<NopBook>("chill");
  const [opens, setOpens] = useState<OpensPayload>(emptyOpens);
  const [paper, setPaper] = useState<PaperPayload>(emptyPaper);
  const [datas, setDatas] = useState<DatasPayload>(emptyDatas);
  const [popular, setPopular] = useState<PopularPayload>(emptyPopular);

  const loadOpens = useCallback(async () => {
    try {
      setOpens(await fetchOpens());
    } catch {
      // mantém último load — não limpa para vazio
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
    const paperId = window.setInterval(() => {
      loadPaper();
    }, PAPER_POLL_MS);
    return () => {
      window.clearInterval(id);
      window.clearInterval(paperId);
    };
  }, [loadOpens, loadPaper, loadDatas, loadPopular]);

  useEffect(() => {
    if (tab === "paper") loadPaper();
  }, [tab, loadPaper]);

  const openSnap =
    openBook === "chill"
      ? opens.chill
      : openBook === "pipoca_all"
        ? opens.pipoca_all || emptyBook
        : opens.pipoca;

  const nopSnap =
    nopBook === "chill"
      ? opens.chill
      : nopBook === "pipoca_all"
        ? opens.pipoca_all || emptyBook
        : opens.pipoca;

  const nopLabel =
    nopBook === "chill"
      ? "Chill"
      : nopBook === "pipoca_all"
        ? "Pipoca All"
        : "Pipoca";

  return (
    <>
      <nav className="tabs">
        {(
          [
            ["opens", "Opens"],
            ["possible", "Possible"],
            ["datas", "Datas"],
            ["popular", "Popular"],
            ["nop", "NOP"],
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
        <>
          <nav className="tabs subtabs">
            {(
              [
                ["pipoca", "Pipoca"],
                ["chill", "Chill"],
                ["pipoca_all", "Pipoca All"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={openBook === id ? "tab active" : "tab"}
                onClick={() => setOpenBook(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <OpensDashboard
            whenLabel={opens.when_label}
            updatedAt={opens.updated_at}
            book={openSnap}
            bookKey={openBook}
            title={
              openBook === "chill"
                ? "Chill"
                : openBook === "pipoca_all"
                  ? "Pipoca All"
                  : "Pipoca"
            }
          />
        </>
      ) : null}

      {tab === "possible" ? (
        <PossibleDashboard
          data={
            opens.possible || {
              rows: [],
              quase: [],
              out_market: [],
              day: "",
              retry_min: 15,
              max_tries: 6,
            }
          }
          updatedAt={opens.updated_at}
        />
      ) : null}
      {tab === "datas" ? <DatasDashboard data={datas} /> : null}
      {tab === "popular" ? <PopularDashboard data={popular} /> : null}

      {tab === "nop" ? (
        <>
          <nav className="tabs subtabs">
            {(
              [
                ["chill", "Chill"],
                ["pipoca", "Pipoca"],
                ["pipoca_all", "Pipoca All"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={nopBook === id ? "tab active" : "tab"}
                onClick={() => setNopBook(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <NopDashboard
            book={nopSnap}
            label={nopLabel}
            updatedAt={opens.updated_at}
          />
        </>
      ) : null}

      {tab === "paper" ? (
        <PaperDashboard paper={paper} onPickDay={(d) => loadPaper(d)} />
      ) : null}
    </>
  );
}
