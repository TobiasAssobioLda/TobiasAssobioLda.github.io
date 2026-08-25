"use client";

import type { BookSnapshot, OpenRow } from "@/lib/types";
import {
  HORSE_EMOJI,
  impactBand,
  newsLines,
  rumorBadge,
} from "@/lib/tg-card";

/** Card chapado = Telegram Rumors / Chill News (só opens). */
function NopCard({
  row,
  bookKey,
}: {
  row: OpenRow;
  bookKey: string;
}) {
  const horse = (row.horse || "").trim();
  const horseEm = horse ? HORSE_EMOJI[horse] || "📌" : "📌";
  const { hook, what } = newsLines(row);
  const impact = row.news_impact || 0;
  const ticker = (row.ticker || "").toUpperCase();
  const { badge, kind } = rumorBadge(bookKey);

  return (
    <article className="nop-card">
      <div className="nop-news">
        <p className="tg-line">
          {badge} <strong>{kind}</strong>
          {horse ? (
            <>
              {" "}
              · {horseEm} {horse}
            </>
          ) : null}
        </p>
        {hook ? (
          <p className="tg-line tg-hook">
            🎤 <strong>{hook}</strong>
          </p>
        ) : (
          <p className="tg-line tg-hook nop-news-empty">
            🎤 <em>card interno / pending — ver aba Nerd</em>
          </p>
        )}
        {what ? <p className="tg-line">📋 {what}</p> : null}
        {ticker ? (
          <p className="tg-line">
            🎰 <strong>{ticker}</strong> 🟢
          </p>
        ) : null}
        {impact > 0 ? (
          <p className="tg-line">
            📊 impacto <strong>{impact}</strong>/99 · {impactBand(impact)}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function NopDashboard({
  book,
  label,
  bookKey,
  updatedAt,
}: {
  book: BookSnapshot;
  label: string;
  bookKey: string;
  updatedAt: string;
}) {
  const rows = book.rows || [];
  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>NOP · {label}</h1>
        <p className="meta">
          card da entrada · some ao fechar
          {updatedAt ? ` · act. ${updatedAt.slice(11, 16)}` : ""}
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="empty">sem open positions neste livro</p>
      ) : (
        <div className="nop-list">
          {rows.map((r) => (
            <NopCard
              key={`${r.ticker}-${r.entry}-${r.opened_at || ""}`}
              row={r}
              bookKey={bookKey}
            />
          ))}
        </div>
      )}
      <footer>Igual Telegram / Jornal — 🎰 activo. Só enquanto open.</footer>
    </main>
  );
}
