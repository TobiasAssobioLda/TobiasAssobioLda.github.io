"use client";

import type { BookSnapshot, OpenRow } from "@/lib/types";

function fmt(n: number | undefined | null, d = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(d);
}

/** Canal Report Telegram — oráculo / números. Some ao fechar. */
function NerdCard({ row, bookLabel }: { row: OpenRow; bookLabel: string }) {
  const ticker = (row.ticker || "").toUpperCase();
  const hook = (row.news_hook || row.news_blurb || row.horse || "—")
    .replace(/^🎤\s*/, "")
    .trim();
  const what = (row.news_what || "").trim();
  const diag = (row.diag || "").trim();
  const corr = row.corr_score;
  const sinal = row.sinal_score;
  const tip = (row.tp_tip || "").trim();
  const gap = row.tp_gap;
  const mid = row.tp_sugerido_mid;

  return (
    <article className="nop-card nerd-card">
      <p className="tg-line">
        <strong>ORÁCULO</strong> · {bookLabel} · <strong>{ticker}</strong>
      </p>
      <p className="tg-line tg-hook">🎤 {hook}</p>
      {what ? <p className="tg-line">📋 {what}</p> : null}
      <p className="tg-line nerd-mono">
        Entry {fmt(row.entry)} · SL {fmt(row.sl)} · TP {fmt(row.tp1)}/
        {fmt(row.tp2)}
      </p>
      <p className="tg-line">
        Cavalo {(row.horse || "—").trim() || "—"}
        {row.news_impact ? ` · Impacto ${row.news_impact}/99` : ""}
      </p>
      {corr != null && corr !== 0 ? (
        <p className="tg-line">
          Corr {corr >= 0 ? "+" : ""}
          {fmt(corr)}
        </p>
      ) : null}
      {sinal != null && sinal !== 0 ? (
        <p className="tg-line">Score sinal {fmt(sinal, 1)}</p>
      ) : null}
      {tip ? <p className="tg-line">{tip}</p> : null}
      {!tip && gap != null ? (
        <p className="tg-line">
          TP sugerido · fecho gap @{fmt(gap)}
          {mid != null ? ` · médio @{fmt(mid)}` : ""}
        </p>
      ) : null}
      {row.event_date ? (
        <p className="tg-line">Event {row.event_date} (sair antes)</p>
      ) : row.horizon_days ? (
        <p className="tg-line">Time stop {row.horizon_days}d</p>
      ) : null}
      <p className="tg-line nerd-mono">
        Agora {fmt(row.price)} · P/L {row.pnl_pct >= 0 ? "+" : ""}
        {fmt(row.pnl_pct, 1)}% · {row.pnl_r >= 0 ? "+" : ""}
        {fmt(row.pnl_r)}R
      </p>
      {diag ? <p className="tg-line nerd-diag">{diag}</p> : null}
    </article>
  );
}

export function NerdDashboard({
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
        <h1>Nerd · {label}</h1>
        <p className="meta">
          report Telegram · oráculo · some ao fechar
          {updatedAt ? ` · act. ${updatedAt.slice(11, 16)}` : ""}
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="empty">sem open positions neste livro</p>
      ) : (
        <div className="nop-list">
          {rows.map((r) => (
            <NerdCard
              key={`${r.ticker}-${r.entry}-${r.opened_at || ""}`}
              row={r}
              bookLabel={label.toUpperCase()}
            />
          ))}
        </div>
      )}
      <footer>Mesmo conteúdo do canal Report · só enquanto open.</footer>
    </main>
  );
}
