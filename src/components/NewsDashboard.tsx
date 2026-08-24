"use client";

import type { NewsItem } from "@/lib/news-types";
import { impactBand } from "@/lib/news";

function bandClass(impact: number): string {
  if (impact >= 70) return "impact-high";
  if (impact >= 50) return "impact-mid";
  return "impact-low";
}

function NewsRow({ item }: { item: NewsItem }) {
  const href = item.read_url || item.url;
  return (
    <article className="news-row">
      <div className="news-top">
        <span className="news-horse">{item.horse || "—"}</span>
        <span className="news-when">{item.when_label || "—"}</span>
        <span className={`news-impact ${bandClass(item.impact)}`}>
          {item.impact}/99 · {impactBand(item.impact)}
        </span>
      </div>
      <h3 className="news-title">
        <a href={href} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </h3>
      <a className="news-read" href={href} target="_blank" rel="noopener noreferrer">
        ler →
      </a>
    </article>
  );
}

export function NewsDashboard({
  updatedAt,
  items,
}: {
  updatedAt: string;
  items: NewsItem[];
}) {
  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>Notícias</h1>
        <p className="meta">
          {items.length} recentes
          {updatedAt ? ` · ${updatedAt}` : ""}
        </p>
      </header>
      <section className="news-list">
        {items.length === 0 ? (
          <p className="empty">sem notícias ainda — espera o próximo Spam</p>
        ) : (
          items.map((it) => <NewsRow key={it.uid} item={it} />)
        )}
      </section>
      <footer>Clica no título ou «ler» — link directo ou pesquisa Google.</footer>
    </main>
  );
}
