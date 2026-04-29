import type { Match, PlayerMatchStat } from './matches';
import { getEffectiveSumula } from './sumulaParser';

export interface ComputedPlayerStats {
  jogos: number;
  gols: number;
  assistencias: number;
  defesas: number;
  mvp: number;
}

const EMPTY_STATS: ComputedPlayerStats = { jogos: 0, gols: 0, assistencias: 0, defesas: 0, mvp: 0 };

/**
 * Compute a player's stats from sumula data across matches.
 * Uses manual sumula when available, falls back to auto-parsed from text fields.
 */
export function computePlayerStatsFromSumula(
  matches: Match[],
  playerId: string,
  season: string = 'all'
): ComputedPlayerStats {
  const stats = { ...EMPTY_STATS };

  for (const match of matches) {
    if (season !== 'all' && match.temporada !== season) continue;

    const sumula = getEffectiveSumula(match);
    if (!sumula || sumula.length === 0) continue;

    const entry = sumula.find((s: PlayerMatchStat) => s.playerId === playerId);
    if (!entry || !entry.presente) continue;

    stats.jogos += 1;
    stats.gols += entry.gols || 0;
    stats.assistencias += entry.assistencias || 0;
    stats.defesas += entry.defesas || 0;
    stats.mvp += entry.mvp ? 1 : 0;
  }

  return stats;
}

/**
 * Check how many matches have sumula data (manual or auto-generated) for a given season.
 */
export function countMatchesWithSumula(matches: Match[], season: string = 'all'): number {
  return matches.filter((m) => {
    if (season !== 'all' && m.temporada !== season) return false;
    const sumula = getEffectiveSumula(m);
    return sumula && sumula.length > 0;
  }).length;
}

/**
 * Build a full ranking from sumula data.
 * Returns players sorted by the given stat field (descending).
 */
export function buildRankingFromSumula(
  matches: Match[],
  allPlayers: { id: string; nome: string; foto: string | null; numero: number; posicao: string }[],
  season: string,
  sortBy: keyof ComputedPlayerStats
): (typeof allPlayers[0] & ComputedPlayerStats)[] {
  return allPlayers
    .map((p) => {
      const stats = computePlayerStatsFromSumula(matches, p.id, season);
      return { ...p, ...stats };
    })
    .filter((p) => p[sortBy] > 0)
    .sort((a, b) => b[sortBy] - a[sortBy] || a.jogos - b.jogos);
}