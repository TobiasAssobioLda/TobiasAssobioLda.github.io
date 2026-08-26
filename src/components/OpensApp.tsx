"use client";

import { useCallback, useEffect, useState } from "react";
import type { OpensPayload } from "@/lib/types";
import type { PaperPayload } from "@/lib/paper-types";
import type { DatasPayload } from "@/lib/datas-types";
import type { PopularPayload } from "@/lib/popular-types";
import { OpensDashboard } from "./OpensDashboard";
import { NopDashboard } from "./NopDashboard";
import { NerdDashboard } from "./NerdDashboard";
import { ContasDashboard } from "./ContasDashboard";
import { TobiasDashboard } from "./TobiasDashboard";
import { PaperDashboard } from "./PaperDashboard";
import { DatasDashboard } from "./DatasDashboard";
import { PopularDashboard } from "./PopularDashboard";
import { PossibleDashboard } from "./PossibleDashboard";
import { fetchPaper } from "@/lib/paper";
import { fetchDatas } from "@/lib/datas";
import { fetchPopular } from "@/lib/popular";
import { fetchOpens } from "@/lib/opens";
import { fetchContas } from "@/lib/contas";
import { fetchTobias } from "@/lib/tobias";
import type { ContasPayload } from "@/lib/contas-types";
import type { TobiasPayload } from "@/lib/tobias-types";

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
  max: { ...emptyBook },
  rumors: { ...emptyBook, bank_eur: 50000, equity_eur: 50000 },
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

const emptyContasBook = {
  book: "",
  label: "",
  bank_eur: 0,
  equity_eur: 0,
  open_count: 0,
  open_notional: 0,
  open_pnl_eur: 0,
  closed_count: 0,
  realized_eur: 0,
  realized_r: 0,
  wins: 0,
  losses: 0,
  win_rate: 0,
  closed: [] as ContasPayload["pipoca"]["closed"],
};

const emptyContas: ContasPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  when_label: "",
  pipoca: { ...emptyContasBook, book: "pipoca", label: "Pipoca", bank_eur: 2000, equity_eur: 2000 },
  chill: { ...emptyContasBook, book: "chill", label: "Chill" },
  pipoca_all: {
    ...emptyContasBook,
    book: "pipoca_all",
    label: "Pipoca All",
    bank_eur: 10000,
    equity_eur: 10000,
  },
  max: { ...emptyContasBook, book: "max", label: "MAX" },
  rumors: {
    ...emptyContasBook,
    book: "rumors",
    label: "Rumors",
    bank_eur: 50000,
    equity_eur: 50000,
  },
};

const emptyTobias: TobiasPayload = {
  updated_at: "",
  timezone: "Europe/Lisbon",
  when_label: "",
  title: "Full Report · Tobias",
  note: "",
  stats: {
    n: 0,
    tp: 0,
    sl: 0,
    out: 0,
    correto: 0,
    erro: 0,
    trainable: 0,
    realized_eur: 0,
    realized_r: 0,
  },
  rows: [],
  page_sizes: [10, 20, 30],
};

/** Poll leve — não martela free tier / servidor. */
const OPENS_POLL_MS = 2 * 60_000;
const PAPER_POLL_MS = 3 * 60_000;

type Tab =
  | "opens"
  | "possible"
  | "datas"
  | "popular"
  | "nop"
  | "nerd"
  | "contas"
  | "tobias"
  | "paper";
type OpenBook = "pipoca" | "chill" | "pipoca_all" | "max" | "rumors";
type NopBook = "chill" | "pipoca" | "pipoca_all" | "max" | "rumors";

export function OpensApp() {
  const [tab, setTab] = useState<Tab>("opens");
  const [openBook, setOpenBook] = useState<OpenBook>("pipoca");
  const [nopBook, setNopBook] = useState<NopBook>("chill");
  const [nerdBook, setNerdBook] = useState<NopBook>("chill");
  const [contasBook, setContasBook] = useState<NopBook>("chill");
  const [opens, setOpens] = useState<OpensPayload>(emptyOpens);
  const [contas, setContas] = useState<ContasPayload>(emptyContas);
  const [tobias, setTobias] = useState<TobiasPayload>(emptyTobias);
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

  const loadContas = useCallback(async () => {
    try {
      setContas(await fetchContas());
    } catch {
      /* keep */
    }
  }, []);

  const loadTobias = useCallback(async () => {
    try {
      setTobias(await fetchTobias());
    } catch {
      /* keep */
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
    loadContas();
    loadTobias();
    const id = window.setInterval(() => {
      loadOpens();
      loadDatas();
      loadPopular();
      loadContas();
      loadTobias();
    }, OPENS_POLL_MS);
    const paperId = window.setInterval(() => {
      loadPaper();
    }, PAPER_POLL_MS);
    return () => {
      window.clearInterval(id);
      window.clearInterval(paperId);
    };
  }, [loadOpens, loadPaper, loadDatas, loadPopular, loadContas, loadTobias]);

  useEffect(() => {
    if (tab === "paper") loadPaper();
  }, [tab, loadPaper]);

  useEffect(() => {
    if (tab === "tobias") loadTobias();
  }, [tab, loadTobias]);

  const openSnap =
    openBook === "chill"
      ? opens.chill
      : openBook === "pipoca_all"
        ? opens.pipoca_all || emptyBook
        : openBook === "max"
          ? opens.max || emptyBook
          : openBook === "rumors"
            ? opens.rumors || emptyBook
            : opens.pipoca;

  const nopSnap =
    nopBook === "chill"
      ? opens.chill
      : nopBook === "pipoca_all"
        ? opens.pipoca_all || emptyBook
        : nopBook === "max"
          ? opens.max || emptyBook
          : nopBook === "rumors"
            ? opens.rumors || emptyBook
            : opens.pipoca;

  const nopLabel =
    nopBook === "chill"
      ? "Chill"
      : nopBook === "pipoca_all"
        ? "Pipoca All"
        : nopBook === "max"
          ? "MAX"
          : nopBook === "rumors"
            ? "Rumors"
            : "Pipoca";

  const nerdSnap =
    nerdBook === "chill"
      ? opens.chill
      : nerdBook === "pipoca_all"
        ? opens.pipoca_all || emptyBook
        : nerdBook === "max"
          ? opens.max || emptyBook
          : nerdBook === "rumors"
            ? opens.rumors || emptyBook
            : opens.pipoca;
  const nerdLabel =
    nerdBook === "chill"
      ? "Chill"
      : nerdBook === "pipoca_all"
        ? "Pipoca All"
        : nerdBook === "max"
          ? "MAX"
          : nerdBook === "rumors"
            ? "Rumors"
            : "Pipoca";

  const contasSnap =
    contasBook === "chill"
      ? contas.chill
      : contasBook === "pipoca_all"
        ? contas.pipoca_all
        : contasBook === "max"
          ? contas.max || emptyContasBook
          : contasBook === "rumors"
            ? contas.rumors || emptyContasBook
            : contas.pipoca;
  const contasLabel =
    contasBook === "chill"
      ? "Chill"
      : contasBook === "pipoca_all"
        ? "Pipoca All"
        : contasBook === "max"
          ? "MAX"
          : contasBook === "rumors"
            ? "Rumors"
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
            ["nerd", "Nerd"],
            ["contas", "Contas"],
            ["tobias", "Full Report"],
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
                ["max", "MAX"],
                ["rumors", "Rumors"],
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
                  : openBook === "max"
                    ? "MAX"
                    : openBook === "rumors"
                      ? "Rumors"
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
                ["max", "MAX"],
                ["rumors", "Rumors"],
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
            bookKey={nopBook}
            updatedAt={opens.updated_at}
          />
        </>
      ) : null}

      {tab === "nerd" ? (
        <>
          <nav className="tabs subtabs">
            {(
              [
                ["chill", "Chill"],
                ["pipoca", "Pipoca"],
                ["pipoca_all", "Pipoca All"],
                ["max", "MAX"],
                ["rumors", "Rumors"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={nerdBook === id ? "tab active" : "tab"}
                onClick={() => setNerdBook(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <NerdDashboard
            book={nerdSnap}
            label={nerdLabel}
            updatedAt={opens.updated_at}
          />
        </>
      ) : null}

      {tab === "contas" ? (
        <>
          <nav className="tabs subtabs">
            {(
              [
                ["chill", "Chill"],
                ["pipoca", "Pipoca"],
                ["pipoca_all", "Pipoca All"],
                ["max", "MAX"],
                ["rumors", "Rumors"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={contasBook === id ? "tab active" : "tab"}
                onClick={() => setContasBook(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          <ContasDashboard
            book={contasSnap}
            label={contasLabel}
            updatedAt={contas.updated_at}
          />
        </>
      ) : null}

      {tab === "tobias" ? <TobiasDashboard data={tobias} /> : null}

      {tab === "paper" ? (
        <PaperDashboard paper={paper} onPickDay={(d) => loadPaper(d)} />
      ) : null}
    </>
  );
}
