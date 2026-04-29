/**
 * Auto-generates PlayerMatchStat[] from the text fields golsSadock / assistenciasSadock.
 * Works as fallback when sumula is not manually filled via Admin.
 */
import type { PlayerMatchStat, Match } from './matches';

// Comprehensive name → player ID mapping (including former players)
const NAME_TO_ID: Record<string, string> = {
  // Current roster
  'erik mello': '1',
  'jhon marques': '3',
  'yuri de paula': '4',
  'matheus rego': '5',
  'matheus mesquita': '6',
  'lucas aurnheimer': '7',
  'leandro oscar': '8',
  'hugo dortas': '9',
  'dayvid coelho': '10',
  'henrique lima': '13',
  'edgar marins': '14',
  'jonathan lima': '15',
  'fabricio vieira': '16',
  'andrey gomes': '17',
  'joao pedro': '18',
  'arthur petrone': '19',
  'ramon tertuliano': '20',
  'coutinho': '21',

  // Former players (mentioned in match data)
  'rodrigo diguin': '2',
  'yuri cursino': '11',
  'jorge ribeiro': '12',
  'luiz davi': '22',
};

/**
 * Parse a text field like "Dayvid Coelho (2), Yuri de Paula (1)" into
 * an array of { playerId, count } entries.
 */
function parseStatText(text: string): { playerId: string; count: number }[] {
  if (!text || !text.trim()) return [];

  const results: { playerId: string; count: number }[] = [];
  // Match patterns like "Player Name (N)" — handles accented names too
  const regex = /([^,()]+?)\s*\((\d+)\)/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    const name = m[1].trim().toLowerCase();
    const count = parseInt(m[2], 10);
    const playerId = NAME_TO_ID[name];
    if (playerId) {
      results.push({ playerId, count });
    }
  }

  return results;
}

/**
 * Generate PlayerMatchStat[] from golsSadock + assistenciasSadock text fields.
 * Only generates entries for players mentioned (presente = true).
 * Cannot determine MVP or goalkeeper saves from text data.
 */
export function generateSumulaFromText(match: Match): PlayerMatchStat[] {
  const golsText = match.golsSadock || '';
  const assistText = match.assistenciasSadock || '';

  // If both are empty, we can't generate any meaningful sumula
  if (!golsText.trim() && !assistText.trim()) return [];

  const golsParsed = parseStatText(golsText);
  const assistParsed = parseStatText(assistText);

  // Collect all unique player IDs
  const playerMap = new Map<string, PlayerMatchStat>();

  for (const { playerId, count } of golsParsed) {
    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, {
        playerId,
        presente: true,
        gols: 0,
        assistencias: 0,
        defesas: 0,
        mvp: false,
      });
    }
    playerMap.get(playerId)!.gols += count;
  }

  for (const { playerId, count } of assistParsed) {
    if (!playerMap.has(playerId)) {
      playerMap.set(playerId, {
        playerId,
        presente: true,
        gols: 0,
        assistencias: 0,
        defesas: 0,
        mvp: false,
      });
    }
    playerMap.get(playerId)!.assistencias += count;
  }

  return Array.from(playerMap.values());
}

/**
 * Get effective sumula for a match: use manual sumula if available,
 * otherwise auto-generate from text fields.
 */
export function getEffectiveSumula(match: Match): PlayerMatchStat[] {
  if (match.sumula && Array.isArray(match.sumula) && match.sumula.length > 0) {
    return match.sumula;
  }
  return generateSumulaFromText(match);
}

/**
 * Enrich an array of matches with auto-generated sumula where missing.
 * Does NOT overwrite manually entered sumula.
 */
export function enrichMatchesWithSumula(matches: Match[]): Match[] {
  return matches.map((m) => {
    if (m.sumula && Array.isArray(m.sumula) && m.sumula.length > 0) {
      return m; // Already has sumula
    }
    const generated = generateSumulaFromText(m);
    if (generated.length === 0) return m;
    return { ...m, sumula: generated };
  });
}
