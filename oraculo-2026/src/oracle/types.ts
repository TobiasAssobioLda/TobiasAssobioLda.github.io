import type { EngineReading } from './demoReadings';

/**
 * Federação Oráculo — contratos de domínio.
 *
 * Estas interfaces isolam a UI da futura API real do Oráculo.
 * Nesta fase tudo é servido por um motor de demonstração local
 * (ver ./client.ts). Nada aqui representa previsões reais.
 */

/** Fase visual da bola de cristal / da experiência. */
export type OraclePhase =
  | 'idle'        // bola em repouso, respiração suave
  | 'consulting'  // o Oráculo está a "ler os sinais"
  | 'charging'    // revelação cinematográfica em curso (energia, relâmpagos)
  | 'revealed';   // TIP apresentada, brilho assentado

/** Nível de qualidade gráfica adaptado ao dispositivo. */
export type QualityTier = 'low' | 'balanced' | 'high';

/** Props do componente 3D (dono: src/scene/). */
export interface CrystalBallProps {
  phase: OraclePhase;
  quality: QualityTier;
  reducedMotion: boolean;
}

/** Equipa/jogo pesquisável. */
export interface TeamRef {
  id: string;
  name: string;
  country: string;
  aliases: string[];
}

/** Estados simuláveis nesta fase de demonstração. */
export type SimMode =
  | 'ko10'        // ainda faltam 10 minutos
  | 'ko9'         // erro de manutenção
  | 'ko8';        // revelação cinematográfica + TIP

/** Uma única TIP demonstrativa (nunca uma previsão real). */
export interface OracleDecision {
  reading?: EngineReading;
  team: TeamRef;
  market: string;
  selection: string;
  odd: number;
  /** Até 3 fatores decisivos; pode ser vazio. */
  factors: string[];
  generatedAt: string;
}

/** Resposta do Oráculo a uma consulta. */
export type OracleResponse =
  | { kind: 'too-early'; minutesToKickoff: number; headline: string; message: string }
  | { kind: 'maintenance'; headline: string; message: string }
  | { kind: 'decision'; decision: OracleDecision };

/** Cliente do Oráculo — ponto único de integração com a API futura. */
export interface OracleClient {
  /** Pesquisa de equipas/jogos para sugestões automáticas. */
  searchTeams(query: string, limit?: number): Promise<TeamRef[]>;
  /** Consulta o estado de disponibilidade + decisão única. */
  consult(team: TeamRef): Promise<OracleResponse>;
}

/** Sessão de sócio — preparada para autenticação futura. */
export interface MemberSession {
  memberId: string;
  displayName: string;
  expiresAt: string;
}

/** Provider de autenticação — stub nesta fase (nunca expõe tokens). */
export interface OracleAuth {
  getSession(): Promise<MemberSession | null>;
  signIn(): Promise<MemberSession>;
  signOut(): Promise<void>;
}
