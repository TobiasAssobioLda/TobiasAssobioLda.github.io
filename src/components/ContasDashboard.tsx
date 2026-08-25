"use client";

import type { ContasBook, ContasTrade } from "@/lib/contas-types";

function fmtEur(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)} €`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function fmtWhen(iso: string): string {
  if (!iso || iso.length < 16) return "—";
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function Summary({ book }: { book: ContasBook }) {
  return (
    <dl className="contas-summary">
      <div>
        <dt>Banca</dt>
        <dd>{book.bank_eur.toFixed(0)} €</dd>
      </div>
      <div>
        <dt>Equity</dt>
        <dd className={book.equity_eur >= book.bank_eur ? "pos" : "neg"}>
          {book.equity_eur.toFixed(2)} €
        </dd>
      </div>
      <div>
        <dt>Open</dt>
        <dd>
          {book.open_count} · {fmtEur(book.open_pnl_eur)}
        </dd>
      </div>
      <div>
        <dt>Realizado</dt>
        <dd className={book.realized_eur >= 0 ? "pos" : "neg"}>
          {fmtEur(book.realized_eur)}
        </dd>
      </div>
      <div>
        <dt>Fechos</dt>
        <dd>
          {book.closed_count} · W{book.wins}/L{book.losses} · {book.win_rate.toFixed(0)}%
        </dd>
      </div>
      <div>
        <dt>Σ R</dt>
        <dd className={book.realized_r >= 0 ? "pos" : "neg"}>
          {book.realized_r >= 0 ? "+" : ""}
          {book.realized_r.toFixed(2)}R
        </dd>
      </div>
    </dl>
  );
}

function ClosedTable({ rows }: { rows: ContasTrade[] }) {
  if (!rows.length) {
    return <p className="empty">ainda sem operações fechadas</p>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Activo</th>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Motivo</th>
            <th>Aberto</th>
            <th>Fechado</th>
            <th>P/L €</th>
            <th>%</th>
            <th>R</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.id}-${r.ticker}-${r.closed_at}`}>
              <td className="ticker">{r.ticker}</td>
              <td>{r.entry.toFixed(2)}</td>
              <td>{r.exit.toFixed(2)}</td>
              <td className="cell-title">{r.exit_reason || "—"}</td>
              <td>{fmtWhen(r.opened_at || "")}</td>
              <td>{fmtWhen(r.closed_at || "")}</td>
              <td className={r.pnl_eur >= 0 ? "pos" : "neg"}>
                {fmtEur(r.pnl_eur)}
              </td>
              <td className={r.pnl_pct >= 0 ? "pos" : "neg"}>
                {fmtPct(r.pnl_pct)}
              </td>
              <td className={r.pnl_r >= 0 ? "pos" : "neg"}>
                {r.pnl_r >= 0 ? "+" : ""}
                {r.pnl_r.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContasDashboard({
  book,
  label,
  updatedAt,
}: {
  book: ContasBook;
  label: string;
  updatedAt: string;
}) {
  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>Contas · {label}</h1>
        <p className="meta">
          relatório · estado · fechos
          {updatedAt ? ` · act. ${updatedAt.slice(11, 16)}` : ""}
        </p>
      </header>
      <Summary book={book} />
      <section className="book">
        <h2>
          Operações fechadas <span className="count">{book.closed?.length || 0}</span>
        </h2>
        <ClosedTable rows={book.closed || []} />
      </section>
      <footer>Histórico do livro · opens vivos no tab Opens.</footer>
    </main>
  );
}
