import { demoDecision } from './client';
import type { OracleDecision, TeamRef } from './types';

/**
 * Jogos de DEMONSTRAÇÃO — V6.4.
 *
 * Três encontros fictícios que cobrem os três estados internos:
 *   `ready`   profecia final já disponível        → ✨ VOILÀ!   (revelação imediata)
 *   `locked`  ainda não chegou o desbloqueio KO−9 → 🔒 HH:MM:SS (contador + abanão)
 *   `invoke`  dentro da janela, profecia por ver  → 😈 INVOCO!  (sequência cinematográfica)
 *
 * Os horários são relativos à abertura da página (DEMO_EPOCH) para que os três
 * estados sejam testáveis a qualquer hora. O estado sai sempre de
 * `matchState(jogo, Date.now())` — nunca do texto do botão.
 *
 * Nada aqui é real: nem jogos, nem desbloqueios, nem profecias.
 */

export type MatchState = 'ready' | 'locked' | 'invoke';

export interface DemoMatch {
  id: string;
  /** "Benfica — FC Porto" — nome do jogo tal como aparece. */
  label: string;
  home: string;
  away: string;
  /** Termos de pesquisa (nomes e alcunhas das duas equipas). */
  terms: string[];
  /** Epoch ms do pontapé; null quando o timing é indiferente. */
  kickoffAt: number | null;
  /** Profecia pronta a revelar; null quando ainda não existe. */
  prophecy: OracleDecision | null;
  /** Ref usado na consulta cinematográfica (INVOCO!). */
  consultTeam: TeamRef;
}

const MIN = 60_000;
/** O Oráculo só atende a partir de KO−9 — regra do desbloqueio. */
const UNLOCK_BEFORE_KICKOFF_MS = 9 * MIN;

/** Relógio da demo: a hora a que a página abriu. */
const DEMO_EPOCH = Date.now();

const consultRef = (m: Pick<DemoMatch, 'id' | 'label'>): TeamRef => ({
  id: m.id,
  name: m.label,
  country: 'DEMO',
  aliases: [],
});

const fixture = (
  m: Omit<DemoMatch, 'consultTeam' | 'prophecy'> & { prophecy?: OracleDecision | null },
): DemoMatch => ({ prophecy: null, ...m, consultTeam: consultRef(m) });

const benficaPorto = fixture({
  id: 'benfica-fc-porto',
  home: 'Benfica',
  away: 'FC Porto',
  label: 'Benfica — FC Porto',
  terms: ['benfica', 'fc porto', 'porto', 'slb', 'fcp', 'águias', 'dragões'],
  kickoffAt: null,
});
// ✨ VOILÀ! — a profecia já existe; revela-se sem novo cálculo nem espera.
benficaPorto.prophecy = demoDecision(benficaPorto.consultTeam, 'ko8');

export const DEMO_MATCHES: DemoMatch[] = [
  benficaPorto,
  fixture({
    id: 'academico-viseu-fc-porto',
    home: 'Académico de Viseu',
    away: 'FC Porto',
    label: 'Académico de Viseu — FC Porto',
    terms: ['académico de viseu', 'academico', 'viseu', 'vfc', 'fc porto', 'porto', 'fcp', 'dragões'],
    // KO daqui a ~70 min → desbloqueia a KO−9 (~61 min) → 🔒 01:01:00 ao abrir.
    kickoffAt: DEMO_EPOCH + 70 * MIN,
  }),
  fixture({
    id: 'tondela-sporting',
    home: 'Tondela',
    away: 'Sporting',
    label: 'Tondela — Sporting',
    terms: ['tondela', 'sporting', 'sporting cp', 'scp', 'leões'],
    // Já dentro da janela de consulta (KO−5) → 😈 INVOCO! desde o primeiro instante.
    kickoffAt: DEMO_EPOCH + 5 * MIN,
  }),
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');


/** Epoch ms em que o jogo desbloqueia (KO−9); null se não houver relógio. */
export function unlockAt(match: DemoMatch): number | null {
  return match.kickoffAt === null ? null : match.kickoffAt - UNLOCK_BEFORE_KICKOFF_MS;
}

/** Estado interno do jogo — dados + hora atual, nunca o texto do botão. */
export function matchState(match: DemoMatch, now: number): MatchState {
  if (match.prophecy) return 'ready';
  const gate = unlockAt(match);
  if (gate !== null && now < gate) return 'locked';
  return 'invoke';
}

/** Ms que faltam para desbloquear (0 quando já passou ou não há relógio). */
export function lockRemaining(match: DemoMatch, now: number): number {
  const gate = unlockAt(match);
  return gate === null ? 0 : Math.max(0, gate - now);
}

/** Pesquisa de jogos por nome/alcunha de qualquer uma das equipas. */
export function findMatches(query: string, limit = 5): DemoMatch[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const starts: DemoMatch[] = [];
  const contains: DemoMatch[] = [];
  for (const m of DEMO_MATCHES) {
    const names = [m.label, m.home, m.away, ...m.terms].map(normalize);
    if (names.some((n) => n.startsWith(q))) starts.push(m);
    else if (names.some((n) => n.includes(q))) contains.push(m);
  }
  return [...starts, ...contains].slice(0, limit);
}
