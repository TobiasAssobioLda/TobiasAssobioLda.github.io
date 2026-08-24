"use client";

import { useMemo, useState } from "react";
import type { PaperItem, PaperPayload } from "@/lib/paper-types";

function alike(a: string, b: string): boolean {
  const na = a
    .toLowerCase()
    .replace(/[^a-z0-9à-ú\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const nb = b
    .toLowerCase()
    .replace(/[^a-z0-9à-ú\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wa = new Set(na.split(" ").filter((w) => w.length > 3));
  const wb = nb.split(" ").filter((w) => w.length > 3);
  if (wb.length < 3) return false;
  const hits = wb.filter((w) => wa.has(w)).length;
  return hits >= Math.ceil(wb.length * 0.6);
}

/** Bloco = chapado do card Telegram (hook + what), sem moldura TG. */
function Story({ item, lead }: { item: PaperItem; lead?: boolean }) {
  const href = item.read_url || item.url;
  const headline = (item.hook || item.title || "").trim();
  const rawDek = (item.what || "").trim();
  const dek =
    rawDek && !alike(headline, rawDek) && !alike(item.title || "", rawDek)
      ? rawDek
      : "";

  return (
    <article className={lead ? "paper-lead" : "paper-story"}>
      <p className="paper-kicker">
        {item.horse || "Mundo"}
        {lead ? " · capa" : ""}
      </p>
      <h2 className="paper-headline">
        <a href={href} target="_blank" rel="noopener noreferrer">
          {headline}
        </a>
      </h2>
      {dek ? <p className="paper-dek">{dek}</p> : null}
      <p className="paper-meta-line">
        {item.when_label || "—"}
        {item.source ? ` · ${item.source}` : ""}
        {item.impact ? ` · impacto ${item.impact}` : ""}
      </p>
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
        <p className="paper-sub">
          {paper.count
            ? `${paper.count} peças até ${paper.cutoff || "13:55"}`
            : `corte ${paper.cutoff || "13:55"}`}
          {paper.published_at ? ` · saiu ${paper.published_at.slice(11, 16)}` : ""}
        </p>
      </header>

      <div className="paper-body">
        <div className="paper-rule thick" aria-hidden />
        {ordered.length === 0 ? (
          <p className="paper-empty">
            Ainda sem edição — o bot grava o jornal às 14:00 com os Rumors do dia.
          </p>
        ) : (
          <div className="paper-stack">
            {ordered.map((it, i) => (
              <div key={it.uid} className="paper-block">
                {i > 0 ? <div className="paper-rule thick" aria-hidden /> : null}
                <Story item={it} lead={i === 0} />
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
