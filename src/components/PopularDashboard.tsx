import type { PopularPayload, PopularRow } from "@/lib/popular-types";

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

export function PopularDashboard({ data }: { data: PopularPayload }) {
  const all =
    data.top5?.length || data.top6_20?.length
      ? [...(data.top5 || []), ...(data.top6_20 || [])]
      : (data.rows || []).slice(0, 20);

  const top5 = all.slice(0, 5);
  const rest = all.slice(5, 20);

  return (
    <main className="page">
      <header>
        <h1>Popular</h1>
        <p className="meta">tickers nas notícias</p>
      </header>

      <PopularTable title="Top 5" rows={top5} />
      <PopularTable title="6–20" rows={rest} />
    </main>
  );
}
