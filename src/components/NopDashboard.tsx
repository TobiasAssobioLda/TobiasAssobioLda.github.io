"use client";

import type { BookSnapshot, OpenRow } from "@/lib/types";

const HORSE_EMOJI: Record<string, string> = {
  Trump: "🦅",
  Musk: "🚀",
  Fed: "🏦",
  Buffett: "🎩",
  China: "🐉",
  Índia: "🪷",
  UE: "🇪🇺",
  Venezuela: "🛢️",
  Irão: "☢️",
  Gaza: "🕊️",
  Rússia: "🐻",
  Ucrânia: "🌻",
  Drones: "🛸",
  Inflação: "📈",
  Cripto: "₿",
  Chips: "💾",
  AI: "🤖",
  Nuclear: "💥",
  Ouro: "🥇",
  Prata: "🪙",
  Petróleo: "🛢️",
  Saúde: "💊",
};

function impactBand(n: number): string {
  if (n >= 90) return "extremo";
  if (n >= 70) return "alto";
  if (n >= 50) return "médio";
  if (n >= 20) return "baixo";
  return "ruído";
}

/** Texto do card gravado; sem card → título/blurb da notícia. */
function newsLines(row: OpenRow): { hook: string; what: string } {
  let hook = (row.news_hook || "").replace(/^🎤\s*/, "").trim();
  const what = (row.news_what || "").trim();
  const blurb = (row.news_blurb || "").trim();
  if (!hook && blurb.startsWith("🎤")) {
    hook = blurb.replace(/^🎤\s*/, "").trim();
  }
  if (!hook && blurb) {
    hook = blurb.split(/\s·\s/)[0].trim();
  }
  return { hook, what };
}

/** Chapado = Telegram / Jornal (🎰 ticker 🟢). Só opens — some ao fechar. */
function NopCard({ row }: { row: OpenRow }) {
  const horse = (row.horse || "").trim();
  const horseEm = horse ? HORSE_EMOJI[horse] || "📌" : "📌";
  const { hook, what } = newsLines(row);
  const impact = row.news_impact || 0;
  const ticker = (row.ticker || "").toUpperCase();

  return (
    <article className="nop-card paper-story">
      <p className="tg-line">
        🟠 <strong>RUMOR</strong>
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
      ) : null}
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
            />
          ))}
        </div>
      )}
      <footer>Igual Telegram / Jornal — 🎰 activo. Só enquanto open.</footer>
    </main>
  );
}
