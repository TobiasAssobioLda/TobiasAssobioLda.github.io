import type { PossiblePayload, PossibleRow } from "@/lib/types";

function fmtWhen(iso: string): string {
  if (!iso || iso.length < 16) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(11, 16);
  }
}

function shortReason(r: string): string {
  const s = (r || "").trim();
  if (!s) return "corr a aquecer";
  if (s.length <= 48) return s;
  return s.slice(0, 45) + "…";
}

export function PossibleDashboard({
  data,
  updatedAt,
}: {
  data: PossiblePayload;
  updatedAt?: string;
}) {
  const rows = data.rows || [];
  const day = data.day || "hoje";
  const retry = data.retry_min ?? 15;
  const maxT = data.max_tries ?? 6;

  return (
    <main className="page">
      <header>
        <h1>Possible</h1>
        <p className="meta">
          pending do dia · retry {retry} min · máx {maxT} tentativas
          {updatedAt ? ` · ${updatedAt.slice(11, 16)}` : ""}
        </p>
      </header>

      <section className="book">
        <h2>
          Em espera <span className="count">{rows.length}</span>
          <span className="count"> · {day}</span>
        </h2>
        {!rows.length ? (
          <p className="empty">sem pending hoje</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Activo</th>
                  <th>Book</th>
                  <th>i</th>
                  <th>Try</th>
                  <th>Prox</th>
                  <th>Porquê</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: PossibleRow) => (
                  <tr key={`${r.book}-${r.ticker}-${r.first_seen}`}>
                    <td className="ticker">{r.ticker}</td>
                    <td>{r.book}</td>
                    <td>{r.impact}</td>
                    <td>
                      {r.tries}/{r.max_tries || maxT}
                    </td>
                    <td>{fmtWhen(r.next_check)}</td>
                    <td className="cell-title">{shortReason(r.reason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>
        Quase entrou (corr flat/soft). Re-tenta a cada {retry} min. Limpa à
        meia-noite. Morre se corr reject ou esgotar tentativas.
      </footer>
    </main>
  );
}
