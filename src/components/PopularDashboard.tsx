import type { PopularPayload, PopularRow } from "@/lib/popular-types";

function PopularTable({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: PopularRow[];
  empty: string;
}) {
  return (
    <section className="book">
      <h2>
        {title} <span className="count">{rows.length}</span>
      </h2>
      {!rows.length ? (
        <p className="empty">{empty}</p>
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
                  <td>
                    <strong>{r.total}</strong>
                  </td>
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
  const top5 = data.top5?.length ? data.top5 : (data.rows || []).slice(0, 5);
  const top6_20 = data.top6_20?.length
    ? data.top6_20
    : (data.rows || []).slice(5, 20);

  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>Popular</h1>
        <p className="meta">
          Tickers nas notícias · janela {data.days || 7}d
          {data.updated_at ? ` · ${data.updated_at}` : ""}
        </p>
      </header>

      <PopularTable title="Top 5" rows={top5} empty="sem hits esta semana" />

      <PopularTable
        title="Top 6–20"
        rows={top6_20}
        empty="menos de 6 tickers com hits"
      />

      <footer>#1 = mais citado nos cards Spam/Rumors (últimos {data.days || 7} dias).</footer>
    </main>
  );
}
