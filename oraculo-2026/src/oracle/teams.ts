import type { TeamRef } from './types';

/**
 * Catálogo demonstrativo de equipas para pesquisa/sugestões.
 * Apenas dados públicos de nomes — não é calendário real.
 */
export const TEAM_CATALOG: TeamRef[] = [
  { id: 'benfica', name: 'Benfica', country: 'Portugal', aliases: ['slb', 'águias', 'benfas'] },
  { id: 'fc-porto', name: 'FC Porto', country: 'Portugal', aliases: ['fcp', 'porto', 'dragões'] },
  { id: 'sporting', name: 'Sporting CP', country: 'Portugal', aliases: ['scp', 'sporting', 'leões'] },
  { id: 'braga', name: 'SC Braga', country: 'Portugal', aliases: ['braga', 'arsenalistas'] },
  { id: 'vitoria-sc', name: 'Vitória SC', country: 'Portugal', aliases: ['vitória guimarães', 'guimarães'] },
  { id: 'boavista', name: 'Boavista', country: 'Portugal', aliases: ['axadrezados'] },
  { id: 'casa-pia', name: 'Casa Pia', country: 'Portugal', aliases: ['gansos'] },
  { id: 'famalicao', name: 'Famalicão', country: 'Portugal', aliases: ['fama'] },
  { id: 'gil-vicente', name: 'Gil Vicente', country: 'Portugal', aliases: ['gilistas'] },
  { id: 'estoril', name: 'Estoril Praia', country: 'Portugal', aliases: ['canarinhos'] },
  { id: 'real-madrid', name: 'Real Madrid', country: 'Espanha', aliases: ['merengues', 'madrid'] },
  { id: 'barcelona', name: 'FC Barcelona', country: 'Espanha', aliases: ['barça', 'barca', 'blaugrana'] },
  { id: 'atletico', name: 'Atlético Madrid', country: 'Espanha', aliases: ['atlético', 'colchoneros'] },
  { id: 'sevilla', name: 'Sevilla', country: 'Espanha', aliases: ['sevilha'] },
  { id: 'man-city', name: 'Manchester City', country: 'Inglaterra', aliases: ['city', 'citizens'] },
  { id: 'man-utd', name: 'Manchester United', country: 'Inglaterra', aliases: ['united', 'red devils'] },
  { id: 'liverpool', name: 'Liverpool', country: 'Inglaterra', aliases: ['reds', 'liv'] },
  { id: 'arsenal', name: 'Arsenal', country: 'Inglaterra', aliases: ['gunners'] },
  { id: 'chelsea', name: 'Chelsea', country: 'Inglaterra', aliases: ['blues'] },
  { id: 'tottenham', name: 'Tottenham', country: 'Inglaterra', aliases: ['spurs', 'tottenham hotspur'] },
  { id: 'newcastle', name: 'Newcastle', country: 'Inglaterra', aliases: ['magpies'] },
  { id: 'bayern', name: 'Bayern Munique', country: 'Alemanha', aliases: ['bayern munich', 'bávaros'] },
  { id: 'dortmund', name: 'Borussia Dortmund', country: 'Alemanha', aliases: ['bvb', 'dortmund'] },
  { id: 'leverkusen', name: 'Bayer Leverkusen', country: 'Alemanha', aliases: ['leverkusen'] },
  { id: 'psg', name: 'Paris Saint-Germain', country: 'França', aliases: ['paris', 'psg', 'paris sg'] },
  { id: 'marseille', name: 'Marselha', country: 'França', aliases: ['om', 'marseille', 'olympique'] },
  { id: 'monaco', name: 'AS Mónaco', country: 'França', aliases: ['monaco', 'monegascos'] },
  { id: 'inter', name: 'Inter Milão', country: 'Itália', aliases: ['inter', 'inter milan', 'nerazzurri'] },
  { id: 'milan', name: 'AC Milan', country: 'Itália', aliases: ['milan', 'rossoneri'] },
  { id: 'juventus', name: 'Juventus', country: 'Itália', aliases: ['juve', 'vecchia signora'] },
  { id: 'napoli', name: 'Nápoles', country: 'Itália', aliases: ['napoli', 'azzurri'] },
  { id: 'roma', name: 'AS Roma', country: 'Itália', aliases: ['roma', 'giallorossi'] },
  { id: 'ajax', name: 'Ajax', country: 'Países Baixos', aliases: ['ajacieden'] },
  { id: 'feyenoord', name: 'Feyenoord', country: 'Países Baixos', aliases: ['fey'] },
  { id: 'celtic', name: 'Celtic', country: 'Escócia', aliases: ['bhoys'] },
  { id: 'galatasaray', name: 'Galatasaray', country: 'Turquia', aliases: ['gala', 'cimbom'] },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Filtra o catálogo por nome ou alias (diacríticos ignorados). */
export function findTeams(query: string, limit = 5): TeamRef[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const starts: TeamRef[] = [];
  const contains: TeamRef[] = [];
  for (const team of TEAM_CATALOG) {
    const names = [team.name, ...team.aliases].map(normalize);
    if (names.some((n) => n.startsWith(q))) starts.push(team);
    else if (names.some((n) => n.includes(q))) contains.push(team);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Resolve um texto livre numa equipa do catálogo (ou sintetiza uma). */
export function resolveTeam(query: string): TeamRef {
  const exact = findTeams(query, 1)[0];
  if (exact) return exact;
  const clean = query.trim().replace(/\s+/g, ' ');
  return {
    id: normalize(clean).replace(/[^a-z0-9]+/g, '-'),
    name: clean,
    country: '—',
    aliases: [],
  };
}
