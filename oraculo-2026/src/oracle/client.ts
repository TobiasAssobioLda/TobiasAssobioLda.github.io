import { findTeams } from './teams';
import type {
  MemberSession,
  OracleAuth,
  OracleClient,
  OracleDecision,
  OracleResponse,
  SimMode,
  TeamRef,
} from './types';

/**
 * Motor de DEMONSTRAÇÃO do Oráculo.
 *
 * Claramente separado da futura API real: para ligar ao motor
 * produtivo basta implementar `OracleClient` sobre HTTP e trocar
 * o singleton exportado no fim deste ficheiro. A UI nunca importa
 * nada diretamente desta implementação — usa `oracle` / `oracleAuth`.
 *
 * AVISO: tudo o que este motor devolve é fictício. Nunca apresentar
 * como previsão real.
 */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Hash determinístico (FNV-1a) para TIPs estáveis por equipa. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const MARKETS: Array<{ market: string; selections: string[] }> = [
  { market: 'Resultado Final', selections: ['Vitória', 'Empate', 'Derrota'] },
  { market: 'Ambas Marcam', selections: ['Sim', 'Não'] },
  { market: 'Total de Golos', selections: ['Mais de 2.5', 'Menos de 2.5'] },
  { market: 'Resultado ao Intervalo', selections: ['A ganhar ao intervalo', 'Empate ao intervalo'] },
  { market: 'Cantos', selections: ['Mais de 9.5 cantos', 'Menos de 9.5 cantos'] },
];

const FACTORS: string[] = [
  'Sequência invicta de 6 jogos em casa',
  'Avançado titular regressa de lesão',
  'Adversário roda o plantel a meio da semana',
  'Historial favorável nos últimos 5 confrontos',
  'Pressão alta tem gerado recuperações no último terço',
  'Defesa sofre golos cedo: 4 nos primeiros 20 minutos',
  'Árbitro com média alta de faltas por jogo',
  'Relvado pesado favorece jogo direto',
  'Melhor marcador em sequência de 4 jogos a marcar',
];

function demoDecision(team: TeamRef, mode: SimMode): OracleDecision {
  const h = hash(`${team.id}:${mode}:demo`);
  const pick = <T>(arr: T[], offset = 0) => arr[(h + offset * 7) % arr.length];
  const m = pick(MARKETS);
  const factorCount = 1 + (h % 3); // 1 a 3 fatores
  const factors = Array.from(
    { length: factorCount },
    (_, i) => FACTORS[(h + i * 11) % FACTORS.length],
  );
  return {
    team,
    market: m.market,
    selection: pick(m.selections, 1),
    odd: 1.35 + ((h % 165) / 100), // 1.35 – 2.99, plausível e estável
    factors,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Implementação local. Aceita um `SimMode` injetável para a UI poder
 * demonstrar KO−10 / KO−9 / KO−8 — na versão real, o timing é
 * decidido pelo Oráculo, não por regras do cliente.
 */
export class MockOracleClient implements OracleClient {
  constructor(private readonly mode: () => SimMode) {}

  async searchTeams(query: string, limit = 5): Promise<TeamRef[]> {
    await sleep(120);
    return findTeams(query, limit);
  }

  async consult(team: TeamRef): Promise<OracleResponse> {
    const mode = this.mode();
    // Latência simulada: a "leitura dos sinais" demora sempre um pouco.
    await sleep(mode === 'ko8' ? 1400 : 900);
    switch (mode) {
      case 'ko10':
        return {
          kind: 'too-early',
          minutesToKickoff: 10,
          headline: 'Ó Zé Manel, calma lá!',
          message:
            'Ainda faltam 10 minutos para o apito. Eu não trabalho assim! 😂 Volta quando estiver quase.',
        };
      case 'ko9':
        return {
          kind: 'maintenance',
          headline: 'Erro de manutenção!',
          message:
            'Ainda não tenho a informação toda. Deixa-me trabalhar em paz! 🛠️',
        };
      case 'ko8':
        return { kind: 'decision', decision: demoDecision(team, mode) };
    }
  }
}

/** Auth stub — nunca expõe tokens nem endpoints internos. */
export class MockOracleAuth implements OracleAuth {
  async getSession(): Promise<MemberSession | null> {
    return null;
  }
  async signIn(): Promise<MemberSession> {
    throw new Error('Autenticação de sócios ainda não está ativa nesta fase.');
  }
  async signOut(): Promise<void> {}
}

// ---------------------------------------------------------------------------
// Ponto único de injeção. Na fase real, substituir por um HttpOracleClient.
// ---------------------------------------------------------------------------

let simMode: SimMode = 'ko8';
export function setSimMode(mode: SimMode) {
  simMode = mode;
}

export const oracle: OracleClient = new MockOracleClient(() => simMode);
export const oracleAuth: OracleAuth = new MockOracleAuth();
