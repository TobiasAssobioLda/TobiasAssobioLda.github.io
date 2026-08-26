"use client";

import { useMemo, useState } from "react";
import type {
  PopularPayload,
  PopularRow,
  PopularWindow,
  PopularWindowKey,
} from "@/lib/popular-types";

const TABS: { id: PopularWindowKey; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "pre", label: "Pre" },
  { id: "day", label: "Day" },
];

function PopularTable({ title, rows }: { title: string; rows: PopularRow[] }) {
  return (
    <section className="book">
      <h2>{title}</h2>
      {!rows.length ? (
        <p className="empty">—</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ticker</th>
                <th>Total</th>
                <th>UP</th>
                <th>DOWN</th>
                <th>Cavalo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${title}-${r.ticker}`}>
                  <td>{r.rank}</td>
                  <td className="ticker">{r.ticker}</td>
                  <td>{r.total}</td>
                  <td className="pos">{r.as_up}</td>
                  <td className="neg">{r.as_down}</td>
                  <td>{r.last_horse || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function pickWindow(
  data: PopularPayload,
  key: PopularWindowKey,
): PopularWindow | null {
  const w = data.windows?.[key];
  if (w?.top5 || w?.top6_20) return w;
  return null;
}

function legacyAsWindow(data: PopularPayload): PopularWindow {
  return {
    key: "day",
    label: "Day",
    from: "",
    to: "",
    n_events: data.n_events || 0,
    top5_count: data.top5_count || data.top5?.length || 0,
    top6_20_count: data.top6_20_count || data.top6_20?.length || 0,
    top5: data.top5 || [],
    top6_20: data.top6_20 || [],
  };
}

export function PopularDashboard({ data }: { data: PopularPayload }) {
  const initial = (data.default_window as PopularWindowKey) || "day";
  const [tab, setTab] = useState<PopularWindowKey>(
    initial === "week" || initial === "pre" || initial === "day" ? initial : "day",
  );

  const win = useMemo(() => {
    return pickWindow(data, tab) || legacyAsWindow(data);
  }, [data, tab]);

  const top5 = win.top5 || [];
  const rest = win.top6_20 || [];
  const range =
    win.from_label && win.to_label
      ? `${win.from_label} → ${win.to_label}`
      : "";

  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>Popular</h1>
        <p className="meta">
          tickers nas notícias
          {data.updated_at ? ` · act. ${data.updated_at.slice(11, 16)}` : ""}
        </p>
      </header>

      <nav className="tabs subtabs" aria-label="Janela Popular">
        {TABS.map(({ id, label }) => (
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

      <p className="meta popular-range">
        {win.label || tab}
        {range ? ` · ${range}` : ""}
        {win.n_events != null ? ` · ${win.n_events} eventos` : ""}
      </p>

      <PopularTable title="Top 5" rows={top5} />
      <PopularTable title="6–20" rows={rest} />
    </main>
  );
}
