import type { PopularPayload } from "@/lib/popular-types";

export function PopularDashboard({ data }: { data: PopularPayload }) {
  const rows = data.rows || [];

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

      <section className="book">
        <h2>
          Ranking <span className="count">{rows.length} tickers</span>
        </h2>
        {!rows.length ? (
          <p className="empty">sem hits na janela — rebuild no bot</p>
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
                  <tr key={r.ticker}>
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

      <footer>
        #1 = mais vezes nos cards Spam/Rumors (últimos {data.days || 7} dias).
      </footer>
    </main>
  );
}
