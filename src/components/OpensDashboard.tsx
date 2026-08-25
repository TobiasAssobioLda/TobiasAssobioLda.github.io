import type { BookSnapshot, OpenRow } from "@/lib/types";

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/** P/L Alpaca em USD — mesmas casas que a app (ex. $0.1953). */
function fmtUsd(n: number): string {
  const abs = Math.abs(n).toFixed(4);
  return n >= 0 ? `$${abs}` : `-$${abs}`;
}

function fmtBank(n: number): string {
  return n.toLocaleString("pt-PT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function BankLine({ book }: { book: BookSnapshot }) {
  const bank = book.bank_eur && book.bank_eur > 0 ? book.bank_eur : 0;
  if (!bank) return null;
  const equity =
    book.equity_eur != null ? book.equity_eur : bank + (book.total_pnl_eur || 0);
  return (
    <p className="bank-line">
      Banca {fmtBank(bank)} €
      <span className="bank-sep">·</span>
      agora {fmtBank(equity)} €
      <span className={book.total_pnl_eur >= 0 ? "pos" : "neg"}>
        {" "}
        {fmtUsd(book.total_pnl_eur || 0)}
      </span>
    </p>
  );
}

function TotalLine({ book }: { book: BookSnapshot }) {
  const rows = book.rows || [];
  if (!rows.length) return null;
  return (
    <p className="bank-line">
      Total opens
      <span className="bank-sep">·</span>
      <span className={book.total_pnl_pct >= 0 ? "pos" : "neg"}>
        {fmtPct(book.total_pnl_pct)}
      </span>
      <span className="bank-sep">·</span>
      <span className={book.total_pnl_eur >= 0 ? "pos" : "neg"}>
        {fmtUsd(book.total_pnl_eur || 0)}
      </span>
    </p>
  );
}

function openDays(r: OpenRow): number {
  if (r.open_days != null && !Number.isNaN(r.open_days)) {
    return Math.max(0, Math.floor(r.open_days));
  }
  const raw = (r.opened_at || "").trim();
  if (!raw) return 0;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return 0;
  const ms = Date.now() - t;
  return Math.max(0, Math.floor(ms / 86400000));
}

function timeStopDays(r: OpenRow): number {
  if (r.time_stop_days != null && r.time_stop_days > 0) {
    return r.time_stop_days;
  }
  return 30;
}

export function OpensDashboard({
  whenLabel,
  updatedAt,
  book,
  bookKey,
  title,
}: {
  whenLabel: string;
  updatedAt: string;
  book: BookSnapshot;
  bookKey: "pipoca" | "chill" | "pipoca_all";
  title: string;
}) {
  const rows = book.rows || [];
  const withBank = bookKey === "pipoca" || bookKey === "pipoca_all";
  const Summary = withBank ? <BankLine book={book} /> : <TotalLine book={book} />;
  const source = "Alpaca · posição real";

  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>Opens</h1>
        <p className="meta">
          {source} · {whenLabel || "—"}
          {updatedAt ? ` · ${updatedAt}` : ""}
        </p>
      </header>
      <section className="book">
        <h2>
          {title}{" "}
          {rows.length ? (
            <span className="count">{rows.length} open</span>
          ) : null}
        </h2>
        {Summary}
        {!rows.length ? (
          <p className="empty">sem posições abertas</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Activo</th>
                  <th>ODays</th>
                  <th>Px/INI</th>
                  <th>Px AC</th>
                  <th>P/L%</th>
                  <th>P/L$</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: OpenRow) => (
                  <tr key={`${r.ticker}-${r.entry}-${r.opened_at || ""}`}>
                    <td className="ticker">{r.ticker}</td>
                    <td className="odays" title={`time stop ${timeStopDays(r)}d`}>
                      {openDays(r)}
                      <span className="odays-max">/{timeStopDays(r)}</span>
                    </td>
                    <td>{r.entry.toFixed(2)}</td>
                    <td>{r.price.toFixed(2)}</td>
                    <td className={r.pnl_pct >= 0 ? "pos" : "neg"}>
                      {fmtPct(r.pnl_pct)}
                    </td>
                    <td className={r.pnl_eur >= 0 ? "pos" : "neg"}>
                      {fmtUsd(r.pnl_eur)}
                    </td>
                  </tr>
                ))}
                <tr className="total">
                  <td>TOTAL</td>
                  <td />
                  <td />
                  <td />
                  <td className={book.total_pnl_pct >= 0 ? "pos" : "neg"}>
                    {fmtPct(book.total_pnl_pct)}
                  </td>
                  <td className={book.total_pnl_eur >= 0 ? "pos" : "neg"}>
                    {fmtUsd(book.total_pnl_eur)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
      <footer>
        Notícia da entrada → aba NOP · {title}.
      </footer>
    </main>
  );
}
