export interface EngineTip { selection: string; odd?: number }
export interface EngineReading {
  engines: [EngineTip, EngineTip, EngineTip, EngineTip | null];
  confidence: number;
}

// Authored examples only. No live markets, probabilities or model outputs.
export const demoReadings: Partial<Record<string, EngineReading & {
  market: string; winner: 0 | 1 | 2;
}>> = {
  'tondela-sporting': {
    engines: [{ selection: 'Mais de 2.5', odd: 2.10 }, { selection: 'Menos de 2.5', odd: 2.97 },
      { selection: 'Sporting vence', odd: 1.88 }, null],
    winner: 1, market: 'Total de golos', confidence: 73,
  },
  'benfica-fc-porto': {
    engines: [{ selection: 'Ambas marcam', odd: 1.84 }, { selection: 'Empate', odd: 3.15 },
      { selection: 'Benfica vence', odd: 2.12 }, { selection: 'Mais de 2.5', odd: 2.03 }],
    winner: 0, market: 'Golos das equipas', confidence: 68,
  },
  'academico-viseu-fc-porto': {
    engines: [{ selection: 'Menos de 3.5', odd: 1.62 }, { selection: 'Ao intervalo: X', odd: 2.20 },
      { selection: 'Porto vence', odd: 1.76 }, { selection: 'Mais de 1.5' }],
    winner: 2, market: 'Resultado final', confidence: 79,
  },
};
