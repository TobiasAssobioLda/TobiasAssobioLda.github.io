"use client";

import { useMemo, useState } from "react";
import type { PaperItem, PaperPayload } from "@/lib/paper-types";

function alike(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/[^a-z0-9à-ú\s]/gi, " ").replace(/\s+/g, " ").trim();
  const nb = b.toLowerCase().replace(/[^a-z0-9à-ú\s]/gi, " ").replace(/\s+/g, " ").trim();
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wa = new Set(na.split(" ").filter((w) => w.length > 3));
  const wb = nb.split(" ").filter((w) => w.length > 3);
  if (wb.length < 3) return false;
  const hits = wb.filter((w) => wa.has(w)).length;
  return hits >= Math.ceil(wb.length * 0.6);
}

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
  return `Vol. ${y - 2025} · Nº ${n} · Lisboa`;
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

  const lead = ordered[0] || null;
  const rest = lead ? ordered.slice(1) : [];

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
      {/* Masthead = só marca. Zero texto da notícia (sem Gemini). */}
      <header className="paper-masthead">
        <p className="paper-eyebrow">{editionVol(paper.day)}</p>
        <div className="paper-rule double" />
        <p className="paper-brand">{paper.masthead || "O Rumors"}</p>
        <p className="paper-tag">
          {paper.tagline || "geopolítica & mercados · sem o ruído"}
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

      {!lead ? (
        <p className="paper-empty">
          Ainda sem edição — o bot grava o jornal às 14:00 com os Rumors do dia.
        </p>
      ) : (
        <>
          <Story item={lead} lead />
          {rest.length > 0 ? (
            <>
              <div className="paper-rule thick" />
              <p className="paper-section">também hoje</p>
              <div className="paper-grid">
                {rest.map((it) => (
                  <Story key={it.uid} item={it} />
                ))}
              </div>
            </>
          ) : null}
        </>
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
    </main>
  );
}
