import { useMemo, useState, useEffect } from "react";
import { matches as staticMatches, getMatchResult, getSadockScore, getAdversarioScore, isFutureMatch } from "../data/matches";
import type { Match } from "../data/matches";
import { players as staticPlayers, getPlayerStats } from "../data/players";
import type { Player } from "../data/players";
import { Trophy, Target, Equal, TrendingDown, Crosshair, Shield, User, Star, Handshake, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { mergePlayerPhotos } from "../data/playerPhotos";
import { computePlayerStatsFromSumula, countMatchesWithSumula } from "../data/statsFromSumula";
import { PageLoadingSkeleton } from "../components/LoadingSkeleton";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-039eccc6`;

const DEFAULT_SEASON_OPTIONS = [
  { label: "Todas", value: "all" },
  { label: "2024", value: "2024" },
  { label: "2025", value: "2025" },
  { label: "2026", value: "2026" },
];

function SeasonFilter({ value, onChange, layoutId, options = DEFAULT_SEASON_OPTIONS }: { value: string; onChange: (v: string) => void; layoutId: string; options?: { label: string; value: string }[] }) {
  return (
    <div className="bg-[#111] rounded-lg p-0.5 flex gap-0.5">
      {options.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`relative px-3 py-1.5 rounded-md text-[10px] font-['Roboto',sans-serif] tracking-wider transition-all cursor-pointer ${
            value === s.value ? "text-[#0b0b0b]" : "text-white/40 hover:text-white/70"
          }`}
        >
          {value === s.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-gradient-to-r from-[#d3b379] to-[#b8964a] rounded-md"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function PlayerRow({
  player,
  index,
  statValue,
  statLabel,
  subInfo,
}: {
  player: { id: string; nome: string; foto: string | null; numero: number };
  index: number;
  statValue: number;
  statLabel: string;
  subInfo: string;
}) {
  return (
    <motion.div
      key={`${player.id}-${statValue}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
        index < 3
          ? "bg-[rgba(211,179,121,0.04)] border border-[rgba(211,179,121,0.1)]"
          : "bg-[#111] border border-transparent"
      }`}
    >
      <span
        className={`font-['Anton',sans-serif] text-lg w-7 text-center ${
          index === 0 ? "text-[#d3b379]" : index < 3 ? "text-[#d3b379]/60" : "text-white/20"
        }`}
      >
        {index + 1}
      </span>
      {player.foto ? (
        <img
          src={player.foto}
          alt={player.nome}
          className="w-8 h-8 rounded-full object-cover border border-[#2a2a2a]"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center border border-[#2a2a2a]">
          <User size={14} className="text-[#333]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-['Roboto',sans-serif] text-sm truncate">{player.nome}</p>
        <p className="text-white/25 text-[10px] font-['Roboto',sans-serif]">{subInfo}</p>
      </div>
      <div className="text-right">
        <span className="text-[#d3b379] font-['Anton',sans-serif] text-xl">{statValue}</span>
        <p className="text-white/20 text-[9px] font-['Roboto',sans-serif]">{statLabel}</p>
      </div>
    </motion.div>
  );
}

/**
 * Hybrid stats: prefer sumula-computed stats if matches have sumula data,
 * otherwise fall back to player.stats (manually maintained).
 */
function getHybridStats(
  player: Player,
  matches: Match[],
  season: string
): { jogos: number; gols: number; assistencias: number; defesas: number; mvp: number; fromSumula: boolean } {
  const sumulaCount = countMatchesWithSumula(matches, season);

  if (sumulaCount > 0) {
    const sumulaStats = computePlayerStatsFromSumula(matches, player.id, season);
    // Also get legacy stats for matches without sumula
    const legacyStats = getPlayerStats(player, season);

    // If most matches have sumula, prefer sumula.
    // Otherwise blend: use sumula data + legacy data (which covers all matches including non-sumula)
    // For now: if the player has sumula participation, use sumula data.
    // If player has NO sumula data at all, fall back entirely to legacy.
    if (sumulaStats.jogos > 0) {
      return { ...sumulaStats, fromSumula: true };
    }
    // Player not in any sumula — use legacy stats
    return {
      jogos: legacyStats.jogos,
      gols: legacyStats.gols,
      assistencias: legacyStats.assistencias,
      defesas: legacyStats.defesas || 0,
      mvp: legacyStats.mvp,
      fromSumula: false,
    };
  }

  // No sumula data at all — use legacy stats entirely
  const s = getPlayerStats(player, season);
  return {
    jogos: s.jogos,
    gols: s.gols,
    assistencias: s.assistencias,
    defesas: s.defesas || 0,
    mvp: s.mvp,
    fromSumula: false,
  };
}

export function Estatisticas() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [seasonOptions, setSeasonOptions] = useState(DEFAULT_SEASON_OPTIONS);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('[Estatisticas] Fetching data from API...');
        const headers = { 'Authorization': `Bearer ${publicAnonKey}` };
        const [resMatches, resPlayers, resTemporadas] = await Promise.all([
          fetch(`${API_BASE}/matches`, { headers }),
          fetch(`${API_BASE}/players`, { headers }),
          fetch(`${API_BASE}/temporadas`, { headers }),
        ]);
        
        if (resMatches.ok) {
          const dataMatches = await resMatches.json();
          if (dataMatches.matches && Array.isArray(dataMatches.matches) && dataMatches.matches.length > 0) {
            setMatches(dataMatches.matches);
          }
        }
        if (resPlayers.ok) {
          const dataPlayers = await resPlayers.json();
          if (dataPlayers.players && Array.isArray(dataPlayers.players) && dataPlayers.players.length > 0) {
            setPlayers(mergePlayerPhotos(dataPlayers.players));
          }
        }
        if (resTemporadas.ok) {
          const dataTemp = await resTemporadas.json();
          if (dataTemp.temporadas && Array.isArray(dataTemp.temporadas)) {
            setSeasonOptions([
              { label: "Todas", value: "all" },
              ...dataTemp.temporadas.map((t: string) => ({ label: t, value: t })),
            ]);
          }
        }
        console.log('[Estatisticas] Data loaded');
      } catch (err) {
        console.error("[Estatisticas] Error fetching data, falling back to static:", err);
        setMatches(staticMatches);
        setPlayers(staticPlayers);
      } finally {
        setDataLoaded(true);
      }
    }
    loadData();
  }, []);

  const [seasonArt, setSeasonArt] = useState("all");
  const [seasonAssist, setSeasonAssist] = useState("all");
  const [seasonGK, setSeasonGK] = useState("all");
  const [seasonMVP, setSeasonMVP] = useState("all");

  // Detect if we have sumula data
  const hasSumulaData = useMemo(() => countMatchesWithSumula(matches) > 0, [matches]);
  const activePlayers = useMemo(() => players.filter((p) => p.ativo !== false), [players]);

  const teamStats = useMemo(() => {
    let vitorias = 0,
      empates = 0,
      derrotas = 0,
      golsMarcados = 0,
      golsSofridos = 0;
    matches.forEach((m) => {
      if (isFutureMatch(m)) return; // skip future matches
      const r = getMatchResult(m);
      if (r === "V") vitorias++;
      else if (r === "E") empates++;
      else derrotas++;
      golsMarcados += getSadockScore(m);
      golsSofridos += getAdversarioScore(m);
    });
    const played = vitorias + empates + derrotas;
    return { total: played, vitorias, empates, derrotas, golsMarcados, golsSofridos };
  }, [matches]);

  const artilheiros = useMemo(() => {
    return activePlayers
      .map((p) => {
        const s = getHybridStats(p, matches, seasonArt);
        return { ...p, totalGols: s.gols, totalJogos: s.jogos, fromSumula: s.fromSumula };
      })
      .filter((p) => p.totalGols > 0)
      .sort((a, b) => b.totalGols - a.totalGols || a.totalJogos - b.totalJogos);
  }, [activePlayers, matches, seasonArt]);

  const assistencias = useMemo(() => {
    return activePlayers
      .map((p) => {
        const s = getHybridStats(p, matches, seasonAssist);
        return { ...p, totalAssist: s.assistencias, totalJogos: s.jogos, fromSumula: s.fromSumula };
      })
      .filter((p) => p.totalAssist > 0)
      .sort((a, b) => b.totalAssist - a.totalAssist || a.totalJogos - b.totalJogos);
  }, [activePlayers, matches, seasonAssist]);

  const goleiros = useMemo(() => {
    return activePlayers
      .filter((p) => p.posicao === "Goleiro")
      .map((p) => {
        const s = getHybridStats(p, matches, seasonGK);
        return { ...p, totalDefesas: s.defesas, totalJogos: s.jogos, fromSumula: s.fromSumula };
      })
      .sort((a, b) => b.totalDefesas - a.totalDefesas);
  }, [activePlayers, matches, seasonGK]);

  const mvpRanking = useMemo(() => {
    return activePlayers
      .map((p) => {
        const s = getHybridStats(p, matches, seasonMVP);
        return { ...p, totalMVP: s.mvp, totalJogos: s.jogos, fromSumula: s.fromSumula };
      })
      .filter((p) => p.totalMVP > 0)
      .sort((a, b) => b.totalMVP - a.totalMVP || a.totalJogos - b.totalJogos);
  }, [activePlayers, matches, seasonMVP]);

  const statCards = [
    { label: "Total de Jogos", value: teamStats.total, icon: <Trophy size={18} />, color: "text-[#d3b379]" },
    { label: "Vitórias", value: teamStats.vitorias, icon: <Trophy size={18} />, color: "text-emerald-400" },
    { label: "Empates", value: teamStats.empates, icon: <Equal size={18} />, color: "text-amber-400" },
    { label: "Derrotas", value: teamStats.derrotas, icon: <TrendingDown size={18} />, color: "text-red-400" },
    { label: "Gols Marcados", value: teamStats.golsMarcados, icon: <Target size={18} />, color: "text-[#d3b379]" },
    { label: "Gols Sofridos", value: teamStats.golsSofridos, icon: <Shield size={18} />, color: "text-white/60" },
  ];

  const winRate = teamStats.total > 0 ? Math.round((teamStats.vitorias / teamStats.total) * 100) : 0;

  const sumulaMatchCount = useMemo(() => countMatchesWithSumula(matches), [matches]);

  if (!dataLoaded) return <PageLoadingSkeleton title="ESTATÍSTICAS" subtitle="NÚMEROS DO SADOCK" />;

  return (
    <div className="min-h-screen bg-[#0b0b0b] pt-24 pb-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">DASHBOARD</p>
          <h1 className="font-['Anton',sans-serif] text-white text-5xl sm:text-7xl">ESTATÍSTICAS</h1>
        </div>

        {/* Sumula data indicator */}
        {hasSumulaData && (
          <div className="mb-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d3b379]/[0.04] border border-[rgba(211,179,121,0.1)] w-fit">
            <Zap size={12} className="text-[#d3b379]" />
            <span className="text-[#d3b379]/70 font-['Roboto',sans-serif] text-[10px] tracking-wider">
              Stats calculadas automaticamente de <span className="font-bold text-[#d3b379]">{sumulaMatchCount}</span> {sumulaMatchCount === 1 ? 'partida com súmula' : 'partidas com súmula'}
            </span>
          </div>
        )}

        {/* Win rate bar */}
        <div className="bg-[#131313] rounded-2xl p-6 border border-[#1e1e1e] mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/40 font-['Roboto',sans-serif] text-[10px] tracking-[0.2em] uppercase">Aproveitamento</span>
            <span className="text-[#d3b379] font-['Anton',sans-serif] text-2xl">{winRate}%</span>
          </div>
          <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex">
            <div className="bg-emerald-400 h-full transition-all" style={{ width: `${teamStats.total > 0 ? (teamStats.vitorias / teamStats.total) * 100 : 0}%` }} />
            <div className="bg-amber-400 h-full transition-all" style={{ width: `${teamStats.total > 0 ? (teamStats.empates / teamStats.total) * 100 : 0}%` }} />
            <div className="bg-red-400 h-full transition-all" style={{ width: `${teamStats.total > 0 ? (teamStats.derrotas / teamStats.total) * 100 : 0}%` }} />
          </div>
          <div className="flex gap-4 mt-3">
            <span className="text-[10px] text-emerald-400/60 font-['Roboto',sans-serif]">{teamStats.vitorias}V</span>
            <span className="text-[10px] text-amber-400/60 font-['Roboto',sans-serif]">{teamStats.empates}E</span>
            <span className="text-[10px] text-red-400/60 font-['Roboto',sans-serif]">{teamStats.derrotas}D</span>
          </div>
        </div>

        {/* Team Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-16">
          {statCards.map((s) => (
            <div key={s.label} className="bg-gradient-to-b from-[#161616] to-[#111] rounded-2xl p-5 text-center border border-[#1e1e1e] hover:border-[rgba(211,179,121,0.2)] transition-colors">
              <div className={`flex justify-center mb-2 ${s.color} opacity-40`}>{s.icon}</div>
              <p className={`${s.color} font-['Anton',sans-serif] text-3xl sm:text-4xl`}>{s.value}</p>
              <p className="text-white/30 font-['Roboto',sans-serif] text-[9px] tracking-[0.15em] uppercase mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rankings - 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Artilheiros ── */}
          <div className="bg-gradient-to-b from-[#151515] to-[#0e0e0e] rounded-2xl border border-[#1e1e1e] overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Crosshair size={16} className="text-[#d3b379]" />
                <h2 className="font-['Anton',sans-serif] text-white text-xl tracking-wider">ARTILHEIROS</h2>
              </div>
              <SeasonFilter value={seasonArt} onChange={setSeasonArt} layoutId="art-pill" options={seasonOptions} />
            </div>
            <div className="px-4 pb-4 space-y-1.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={seasonArt}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  {artilheiros.length === 0 && (
                    <p className="text-white/20 font-['Roboto',sans-serif] text-xs text-center py-8">Nenhum gol nesta temporada</p>
                  )}
                  {artilheiros.slice(0, 10).map((p, i) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      index={i}
                      statValue={p.totalGols}
                      statLabel="gols"
                      subInfo={`${p.totalJogos} jogos · #${p.numero}`}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Assistências ── */}
          <div className="bg-gradient-to-b from-[#151515] to-[#0e0e0e] rounded-2xl border border-[#1e1e1e] overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Handshake size={16} className="text-[#d3b379]" />
                <h2 className="font-['Anton',sans-serif] text-white text-xl tracking-wider">ASSISTÊNCIAS</h2>
              </div>
              <SeasonFilter value={seasonAssist} onChange={setSeasonAssist} layoutId="assist-pill" options={seasonOptions} />
            </div>
            <div className="px-4 pb-4 space-y-1.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={seasonAssist}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  {assistencias.length === 0 && (
                    <p className="text-white/20 font-['Roboto',sans-serif] text-xs text-center py-8">Nenhuma assistência nesta temporada</p>
                  )}
                  {assistencias.slice(0, 10).map((p, i) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      index={i}
                      statValue={p.totalAssist}
                      statLabel="assist."
                      subInfo={`${p.totalJogos} jogos · #${p.numero}`}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Goleiros ── */}
          <div className="bg-gradient-to-b from-[#151515] to-[#0e0e0e] rounded-2xl border border-[#1e1e1e] overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[#d3b379]" />
                <h2 className="font-['Anton',sans-serif] text-white text-xl tracking-wider">GOLEIROS</h2>
              </div>
              <SeasonFilter value={seasonGK} onChange={setSeasonGK} layoutId="gk-pill" options={seasonOptions} />
            </div>
            <div className="px-4 pb-4 space-y-1.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={seasonGK}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  {goleiros.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                      className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                        i === 0
                          ? "bg-[rgba(211,179,121,0.04)] border border-[rgba(211,179,121,0.1)]"
                          : "bg-[#111] border border-transparent"
                      }`}
                    >
                      <span className={`font-['Anton',sans-serif] text-lg w-7 text-center ${i === 0 ? "text-[#d3b379]" : "text-white/20"}`}>
                        {i + 1}
                      </span>
                      {p.foto ? (
                        <img src={p.foto} alt={p.nome} className="w-8 h-8 rounded-full object-cover border border-[#2a2a2a]" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center border border-[#2a2a2a]">
                          <User size={14} className="text-[#333]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-['Roboto',sans-serif] text-sm truncate">{p.nome}</p>
                        <p className="text-white/25 text-[10px] font-['Roboto',sans-serif]">{p.totalJogos} jogos · #{p.numero}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <span className="text-[#d3b379] font-['Anton',sans-serif] text-xl">{p.totalDefesas}</span>
                          <p className="text-white/20 text-[9px] font-['Roboto',sans-serif]">defesas</p>
                        </div>
                        {p.totalJogos > 0 && (
                          <div>
                            <span className="text-white/50 font-['Anton',sans-serif] text-lg">{(p.totalDefesas / p.totalJogos).toFixed(1)}</span>
                            <p className="text-white/15 text-[9px] font-['Roboto',sans-serif]">p/ jogo</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── MVP ── */}
          <div className="bg-gradient-to-b from-[#151515] to-[#0e0e0e] rounded-2xl border border-[#1e1e1e] overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-[#d3b379]" />
                <h2 className="font-['Anton',sans-serif] text-white text-xl tracking-wider">MVP</h2>
              </div>
              <SeasonFilter value={seasonMVP} onChange={setSeasonMVP} layoutId="mvp-pill" options={seasonOptions} />
            </div>
            <div className="px-4 pb-4 space-y-1.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={seasonMVP}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5"
                >
                  {mvpRanking.length === 0 && (
                    <p className="text-white/20 font-['Roboto',sans-serif] text-xs text-center py-8">Nenhum MVP nesta temporada</p>
                  )}
                  {mvpRanking.slice(0, 10).map((p, i) => (
                    <PlayerRow
                      key={p.id}
                      player={p}
                      index={i}
                      statValue={p.totalMVP}
                      statLabel="MVP"
                      subInfo={`${p.totalJogos} jogos · #${p.numero}`}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}