"use client";

import type { BookSnapshot, OpenRow } from "@/lib/types";

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function NopCard({ row }: { row: OpenRow }) {
  const hook = (row.news_hook || row.news_blurb || "").replace(/^🎤\s*/, "");
  const what = row.news_what || "";
  return (
    <article className="nop-card">
      <header className="nop-head">
        <span className="nop-ticker">{row.ticker}</span>
        {row.horse ? <span className="nop-horse">{row.horse}</span> : null}
        {row.news_impact ? (
          <span className="nop-impact">{row.news_impact}/99</span>
        ) : null}
      </header>
      {hook ? <h3 className="nop-hook">{hook}</h3> : null}
      {what ? <p className="nop-what">{what}</p> : null}
      <dl className="nop-nums">
        <div>
          <dt>entrada</dt>
          <dd>{row.entry.toFixed(2)}</dd>
        </div>
        <div>
          <dt>agora</dt>
          <dd className={row.pnl_pct >= 0 ? "pos" : "neg"}>{row.price.toFixed(2)}</dd>
        </div>
        <div>
          <dt>P/L</dt>
          <dd className={row.pnl_pct >= 0 ? "pos" : "neg"}>{fmtPct(row.pnl_pct)}</dd>
        </div>
        <div>
          <dt>SL</dt>
          <dd>{(row.sl ?? 0).toFixed(2)}</dd>
        </div>
        <div>
          <dt>TP1</dt>
          <dd>{(row.tp1 ?? 0).toFixed(2)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function NopDashboard({
  book,
  label,
  updatedAt,
}: {
  book: BookSnapshot;
  label: string;
  updatedAt: string;
}) {
  const rows = book.rows || [];
  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>NOP · {label}</h1>
        <p className="meta">
          notícia da entrada
          {updatedAt ? ` · act. ${updatedAt.slice(11, 16)}` : ""}
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="empty">sem open positions neste livro</p>
      ) : (
        <div className="nop-list">
          {rows.map((r) => (
            <NopCard key={`${r.ticker}-${r.entry}-${r.opened_at || ""}`} row={r} />
          ))}
        </div>
      )}
      <footer>
        Preços actualizam ~30 min (bot). Entrada / SL / TP continuam no Telegram.
      </footer>
    </main>
  );
}
