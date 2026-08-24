import type { DatasPayload } from "@/lib/datas-types";

function fmtPx(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

export function DatasDashboard({ data }: { data: DatasPayload }) {
  const rows = data.rows || [];

  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>Datas</h1>
        <p className="meta">
          Eventos com data · activos · SL/TP
          {data.updated_at ? ` · ${data.updated_at}` : ""}
        </p>
      </header>

      <section className="book">
        <h2>
          Agenda <span className="count">{rows.length} datas</span>
        </h2>
        {!rows.length ? (
          <p className="empty">sem datas sonantes — calendário vazio</p>
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
                  <tr key={`${r.rank}-${r.event_date}-${r.title.slice(0, 24)}`}>
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
                      {r.horse ? (
                        <span className="cell-sub">
                          {r.horse}
                          {r.status ? ` · ${r.status}` : ""}
                        </span>
                      ) : null}
                    </td>
                    <td className="ticker">{r.tickers || r.ticker_up || "—"}</td>
                    <td>{fmtPx(r.sl)}</td>
                    <td className="pos">{fmtPx(r.tp1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>
        Calendário + spam datável · SL/TP do plano Python (preço actual).
      </footer>
    </main>
  );
}
