import type { DatasPayload, DatasRow } from "@/lib/datas-types";

function fmtPx(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function OpenTable({ rows }: { rows: DatasRow[] }) {
  return (
    <section className="book">
      <h2>Open</h2>
      {!rows.length ? (
        <p className="empty">—</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Evento</th>
                <th>Activo</th>
                <th>SL</th>
                <th>TP1</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`open-${r.rank}-${r.event_date}-${r.ticker_open || r.ticker_up}`}
                >
                  <td>{r.rank}</td>
                  <td>{r.date_label || r.event_date || "—"}</td>
                  <td className="cell-title">{r.title}</td>
                  <td className="ticker">
                    {r.ticker_open || r.tickers || r.ticker_up || "—"}
                  </td>
                  <td>{fmtPx(r.sl)}</td>
                  <td className="pos">{fmtPx(r.tp1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AgendaTable({ rows }: { rows: DatasRow[] }) {
  return (
    <section className="book">
      <h2>Agenda</h2>
      {!rows.length ? (
        <p className="empty">—</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Evento</th>
                <th>Activo</th>
                <th>Range</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`agenda-${r.rank}-${r.event_date}-${r.title.slice(0, 20)}`}
                >
                  <td>{r.rank}</td>
                  <td>{r.date_label || r.event_date || "—"}</td>
                  <td className="cell-title">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.title}
                      </a>
                    ) : (
                      r.title
                    )}
                  </td>
                  <td className="ticker">{r.tickers || r.ticker_up || "—"}</td>
                  <td>{r.range?.trim() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function DatasDashboard({ data }: { data: DatasPayload }) {
  const opens = data.opens_rows?.length ? data.opens_rows : [];
  const calendar = data.calendar_rows?.length
    ? data.calendar_rows
    : data.rows || [];

  return (
    <main className="page">
      <header>
        <h1>Datas</h1>
        <p className="meta">open + agenda</p>
      </header>

      <OpenTable rows={opens} />
      <AgendaTable rows={calendar} />
    </main>
  );
}
