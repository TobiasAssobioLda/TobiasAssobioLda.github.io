import type { BookSnapshot, OpenRow } from "@/lib/types";

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtEur(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}

function OpenTable({
  title,
  book,
}: {
  title: string;
  book: BookSnapshot;
}) {
  const rows = book.rows || [];
  if (!rows.length) {
    return (
      <section className="book">
        <h2>{title}</h2>
        <p className="empty">sem posições abertas</p>
      </section>
    );
  }

  return (
    <section className="book">
      <h2>
        {title} <span className="count">{rows.length} open</span>
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Activo</th>
              <th>Px/INI</th>
              <th>Px AC</th>
              <th>P/L%</th>
              <th>P/L€</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: OpenRow) => (
              <tr key={`${r.ticker}-${r.entry}`}>
                <td className="ticker">{r.ticker}</td>
                <td>{r.entry.toFixed(2)}</td>
                <td>{r.price.toFixed(2)}</td>
                <td className={r.pnl_pct >= 0 ? "pos" : "neg"}>
                  {fmtPct(r.pnl_pct)}
                </td>
                <td className={r.pnl_eur >= 0 ? "pos" : "neg"}>
                  {fmtEur(r.pnl_eur)}
                </td>
              </tr>
            ))}
            <tr className="total">
              <td>TOTAL</td>
              <td />
              <td />
              <td className={book.total_pnl_pct >= 0 ? "pos" : "neg"}>
                {fmtPct(book.total_pnl_pct)}
              </td>
              <td className={book.total_pnl_eur >= 0 ? "pos" : "neg"}>
                {fmtEur(book.total_pnl_eur)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OpensDashboard({
  whenLabel,
  updatedAt,
  pipoca,
  chill,
}: {
  whenLabel: string;
  updatedAt: string;
  pipoca: BookSnapshot;
  chill: BookSnapshot;
}) {
  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>Opens</h1>
        <p className="meta">
          {whenLabel || "—"}
          {updatedAt ? ` · ${updatedAt}` : ""}
        </p>
      </header>
      <OpenTable title="Pipoca" book={pipoca} />
      <OpenTable title="Chill" book={chill} />
      <footer>
        Telegram continua para entradas/alertas. Isto é só o quadro.
      </footer>
    </main>
  );
}
