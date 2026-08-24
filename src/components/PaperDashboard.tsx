"use client";

import { useMemo, useState } from "react";
import type { PaperItem, PaperPayload } from "@/lib/paper-types";

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

/** Chapado = card Telegram (emojis + linhas), sem moldura. */
function Story({ item, capa }: { item: PaperItem; capa?: boolean }) {
  const href = item.read_url || item.url;
  const horse = item.horse || "Mundo";
  const horseEm = item.horse_emoji || HORSE_EMOJI[horse] || "📌";
  const badge = item.badge || (item.kind?.toUpperCase().startsWith("OFIC") ? "✅" : "🟠");
  const kind = (item.kind || "RUMOR").toUpperCase().startsWith("OFIC")
    ? "OFICIAL"
    : "RUMOR";
  const hook = (item.hook || item.title || "").trim();
  const what = (item.what || "").trim();
  const up = (item.up || "").trim();
  const down = (item.down || "").trim();
  const vibe = (item.vibe || "").trim();
  const impact = item.impact || 0;
  const band = item.impact_band || impactBand(impact);

  return (
    <article className={capa ? "paper-story paper-story--capa" : "paper-story"}>
      {capa && hook ? (
        <div className="paper-capa">
          <p className="paper-capa-label">💥 capa do dia</p>
          <p className="paper-capa-title">{hook}</p>
        </div>
      ) : null}
      <p className="tg-line">
        {badge} <strong>{kind}</strong> · {horseEm} {horse}
      </p>
      {item.when_label ? (
        <p className="tg-line">📅 {item.when_label}</p>
      ) : null}
      {href ? (
        <p className="tg-line">
          <a href={href} target="_blank" rel="noopener noreferrer">
            🔗 ler
          </a>
        </p>
      ) : null}
      {!capa && hook ? (
        <p className="tg-line tg-hook">
          🎤 <strong>{hook}</strong>
        </p>
      ) : null}
      {what ? <p className="tg-line">📋 {what}</p> : null}
      {up ? <p className="tg-line">🟢 UP — {up}</p> : null}
      {down ? <p className="tg-line">🔴 DOWN — {down}</p> : null}
      {vibe ? (
        <p className="tg-line tg-vibe">
          🍺 <em>{vibe}</em>
        </p>
      ) : null}
      {impact > 0 ? (
        <p className="tg-line">
          📊 impacto <strong>{impact}</strong>/99 · {band}
        </p>
      ) : null}
    </article>
  );
}

function editionVol(day: string): string {
  if (!day || day.length < 10) return "edição da tarde";
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return "edição da tarde";
  const n = m * 31 + d;
  return `Vol. ${y - 2025} · Nº ${n} · Viseu`;
}

export function PaperDashboard({
  paper,
  onPickDay,
}: {
  paper: PaperPayload;
  onPickDay?: (day: string) => void;
}) {
  const [showArchive, setShowArchive] = useState(false);

  const ordered = useMemo(() => {
    const items = [...(paper.items || [])];
    items.sort((a, b) => (b.impact || 0) - (a.impact || 0));
    return items;
  }, [paper.items]);

  const dayLabel = paper.day
    ? new Date(`${paper.day}T12:00:00`).toLocaleDateString("pt-PT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <main className="paper-page">
      <header className="paper-masthead paper-masthead--fixed">
        <p className="paper-eyebrow">{editionVol(paper.day)}</p>
        <div className="paper-rule double" />
        <p className="paper-brand">{paper.masthead || "O Rumors"}</p>
        <p className="paper-tag">
          {paper.tagline || "geopolítica & mercados"}
        </p>
        <div className="paper-rule double" />
        <p className="paper-date">{dayLabel}</p>
      </header>

      <div className="paper-body">
        {ordered.length === 0 ? (
          <p className="paper-empty">Ainda sem edição de hoje.</p>
        ) : (
          <div className="paper-stack">
            {ordered.map((it, i) => (
              <div
                key={it.uid}
                className={
                  i === 0
                    ? "paper-block paper-block--capa"
                    : i % 2 === 1
                      ? "paper-block paper-block--b"
                      : "paper-block paper-block--a"
                }
              >
                <Story item={it} capa={i === 0} />
              </div>
            ))}
          </div>
        )}

        <div className="paper-archive-wrap">
          <button
            type="button"
            className="paper-archive-toggle"
            onClick={() => setShowArchive((v) => !v)}
          >
            {showArchive ? "esconder arquivo" : "arquivo…"}
          </button>
          {showArchive && (paper.archive_days || []).length > 0 ? (
            <ul className="paper-archive">
              {(paper.archive_days || []).map((d) => (
                <li key={d}>
                  <button
                    type="button"
                    className={d === paper.day ? "active" : ""}
                    onClick={() => onPickDay?.(d)}
                  >
                    {d}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </main>
  );
}
