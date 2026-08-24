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

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function impactBand(n: number): string {
  if (n >= 90) return "extremo";
  if (n >= 70) return "alto";
  if (n >= 50) return "médio";
  if (n >= 20) return "baixo";
  return "ruído";
}

/** Só texto Gemini/Groq já gravado — sem inventar headline. */
function geminiLines(row: OpenRow): { hook: string; what: string } {
  let hook = (row.news_hook || "").replace(/^🎤\s*/, "").trim();
  let what = (row.news_what || "").trim();
  const blurb = (row.news_blurb || "").trim();
  if (!hook && blurb.startsWith("🎤")) {
    hook = blurb.replace(/^🎤\s*/, "").trim();
  }
  return { hook, what };
}

function NopCard({ row }: { row: OpenRow }) {
  const horse = (row.horse || "").trim();
  const horseEm = horse ? HORSE_EMOJI[horse] || "📌" : "📌";
  const { hook, what } = geminiLines(row);
  const impact = row.news_impact || 0;

  return (
    <article className="nop-card">
      <header className="nop-head">
        <span className="nop-ticker">{row.ticker}</span>
        {horse ? (
          <span className="nop-horse">
            {horseEm} {horse}
          </span>
        ) : null}
        {impact > 0 ? (
          <span className="nop-impact">{impact}/99</span>
        ) : null}
      </header>

      <div className="nop-news">
        {horse ? (
          <p className="tg-line">
            🟠 <strong>RUMOR</strong> · {horseEm} {horse}
          </p>
        ) : null}
        {hook ? (
          <p className="tg-line tg-hook">
            🎤 <strong>{hook}</strong>
          </p>
        ) : (
          <p className="tg-line nop-news-empty">sem card Gemini/Groq nesta entrada</p>
        )}
        {what ? <p className="tg-line">📋 {what}</p> : null}
        {impact > 0 ? (
          <p className="tg-line">
            📊 impacto <strong>{impact}</strong>/99 · {impactBand(impact)}
          </p>
        ) : null}
      </div>

      <dl className="nop-nums">
        <div>
          <dt>entrada</dt>
          <dd>{row.entry.toFixed(2)}</dd>
        </div>
        <div>
          <dt>agora</dt>
          <dd className={row.pnl_pct >= 0 ? "pos" : "neg"}>
            {row.price.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt>P/L</dt>
          <dd className={row.pnl_pct >= 0 ? "pos" : "neg"}>
            {fmtPct(row.pnl_pct)}
          </dd>
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
          card Gemini/Groq da entrada
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
      <footer>Opens = Alpaca. Aqui = 🎤/📋 gravados na entrada.</footer>
    </main>
  );
}
