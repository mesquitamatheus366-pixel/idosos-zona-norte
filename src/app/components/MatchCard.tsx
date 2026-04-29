import { useState } from "react";
import { ChevronDown, ChevronUp, Trophy, User, Shield, Calendar } from "lucide-react";
import type { Match, PlayerMatchStat } from "../data/matches";
import {
  getMatchResult,
  getSadockScore,
  getAdversarioScore,
  getAdversario,
  getLocalType,
  isFutureMatch,
} from "../data/matches";
import { getEffectiveSumula } from "../data/sumulaParser";
import imgLogo from "figma:asset/10ca126f7dcca96eb94b5eebb8aab702dae2e834.png";

interface PlayerInfo {
  id: string;
  nome: string;
  numero: number;
  posicao: string;
  foto: string | null;
}

interface MatchCardProps {
  match: Match;
  players?: PlayerInfo[];
}

const resultStyles = {
  V: { text: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "Vitória" },
  E: { text: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", label: "Empate" },
  D: { text: "text-red-400", bg: "bg-red-400/10 border-red-400/20", label: "Derrota" },
};

const woResultStyles = {
  V: { text: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "W.O. ✓" },
  D: { text: "text-red-400", bg: "bg-red-400/10 border-red-400/20", label: "W.O." },
};

export function MatchCard({ match, players }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const future = isFutureMatch(match);
  const result = getMatchResult(match);
  const style = future
    ? { text: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20", label: "Agendada" }
    : match.wo
      ? woResultStyles[result as 'V' | 'D'] || resultStyles[result]
      : resultStyles[result];
  const sadockScore = getSadockScore(match);
  const advScore = getAdversarioScore(match);
  const adversario = getAdversario(match);
  const localType = getLocalType(match);

  const hasTextDetails = match.golsSadock || match.assistenciasSadock;
  const effectiveSumula = getEffectiveSumula(match);
  const hasSumula = effectiveSumula.length > 0 && effectiveSumula.some((s: PlayerMatchStat) => s.presente);
  const hasDetails = hasTextDetails || hasSumula;

  // Resolve player info from sumula
  const getPlayer = (playerId: string): PlayerInfo | undefined =>
    players?.find((p) => p.id === playerId);

  // Build sorted present players for sumula display
  const presentPlayers = hasSumula
    ? effectiveSumula
        .filter((s: PlayerMatchStat) => s.presente)
        .map((s: PlayerMatchStat) => ({ stat: s, player: getPlayer(s.playerId) }))
        .filter((x) => x.player)
        .sort((a, b) => {
          // MVP first, then by gols, then assists
          if (a.stat.mvp && !b.stat.mvp) return -1;
          if (!a.stat.mvp && b.stat.mvp) return 1;
          if (b.stat.gols !== a.stat.gols) return b.stat.gols - a.stat.gols;
          return b.stat.assistencias - a.stat.assistencias;
        })
    : [];

  const mvpEntry = presentPlayers.find((x) => x.stat.mvp);
  const totalDefesas = hasSumula
    ? effectiveSumula.reduce((a: number, s: PlayerMatchStat) => a + (s.defesas || 0), 0)
    : 0;

  return (
    <div className={`bg-gradient-to-r from-[#161616] to-[#131313] rounded-2xl border border-[#222] hover:border-[#d3b379]/20 transition-all`}>
      <div className="p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider font-['Roboto',sans-serif] border ${style.bg} ${style.text}`}>
              {style.label}
            </span>
            <span className="bg-[#1e1e1e] text-[#d3b379] px-2.5 py-1 rounded-full text-[10px] font-['Roboto',sans-serif] tracking-wider">
              {match.competicao}
            </span>
            <span className="text-white/30 text-[10px] font-['Roboto',sans-serif] tracking-wider">
              {match.data}{match.horario ? ` · ${match.horario}` : ''} · {localType} · {match.local}
            </span>
          </div>
        </div>

        {/* Score area */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-11 shrink-0 flex items-center justify-center">
              <img src={imgLogo} alt="SDK" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-['Roboto',sans-serif] text-sm truncate">
              Sadock FC
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-[#111] rounded-xl px-4 py-2">
            {future ? (
              <span className="text-sky-400/70 font-['Roboto',sans-serif] text-sm tracking-wider uppercase">vs</span>
            ) : match.wo ? (
              <div className="flex flex-col items-center">
                <span className={`font-['Anton',sans-serif] text-lg ${result === "V" ? "text-emerald-400" : "text-red-400"}`}>
                  W.O.
                </span>
              </div>
            ) : (
              <>
                <span className={`font-['Anton',sans-serif] text-2xl sm:text-3xl ${result === "V" ? "text-emerald-400" : result === "D" ? "text-red-400" : "text-white"}`}>
                  {sadockScore}
                </span>
                <span className="text-white/20 text-xs">x</span>
                <span className="text-white/60 font-['Anton',sans-serif] text-2xl sm:text-3xl">
                  {advScore}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <span className="text-white/70 font-['Roboto',sans-serif] text-sm truncate text-right">
              {adversario}
            </span>
            <div className="w-9 h-11 shrink-0 flex items-center justify-center">
              {match.adversarioLogo ? (
                <img src={match.adversarioLogo} alt={adversario} className="w-full h-full object-contain" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#1e1e1e] flex items-center justify-center">
                  <span className="text-white/20 text-[10px] font-['Roboto',sans-serif]">ADV</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick sumula badges below score */}
        {hasSumula && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-white/20 text-[10px] font-['Roboto',sans-serif]">
              {presentPlayers.length} jogadores
            </span>
            {mvpEntry && (
              <span className="flex items-center gap-1 text-amber-400/70 text-[10px] font-['Roboto',sans-serif]">
                <Trophy size={10} />
                {mvpEntry.player!.nome}
              </span>
            )}
            {totalDefesas > 0 && (
              <span className="flex items-center gap-1 text-emerald-400/50 text-[10px] font-['Roboto',sans-serif]">
                <Shield size={10} />
                {totalDefesas} def
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expandable details */}
      {hasDetails && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 py-2 border-t border-[#1e1e1e] text-white/30 hover:text-[#d3b379] transition-colors text-xs font-['Roboto',sans-serif]"
          >
            {expanded ? "Fechar detalhes" : "Ver detalhes"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expanded && (
            <div className="px-5 pb-4 space-y-4 border-t border-[#1a1a1a]">
              {/* Legacy text-based gols/assists */}
              {hasTextDetails && !hasSumula && (
                <div className="space-y-2">
                  {match.golsSadock && (
                    <div className="pt-3">
                      <p className="text-[#d3b379] text-[10px] tracking-[0.2em] uppercase font-['Roboto',sans-serif] mb-1">Gols</p>
                      <p className="text-white/60 text-xs font-['Roboto',sans-serif]">{match.golsSadock}</p>
                    </div>
                  )}
                  {match.assistenciasSadock && (
                    <div>
                      <p className="text-[#d3b379] text-[10px] tracking-[0.2em] uppercase font-['Roboto',sans-serif] mb-1">Assistências</p>
                      <p className="text-white/60 text-xs font-['Roboto',sans-serif]">{match.assistenciasSadock}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Súmula visual */}
              {hasSumula && players && (
                <div className="pt-3">
                  <p className="text-[#d3b379] text-[10px] tracking-[0.2em] uppercase font-['Roboto',sans-serif] mb-3">
                    Súmula da Partida
                  </p>

                  {/* MVP highlight */}
                  {mvpEntry && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-400/[0.04] border border-amber-400/10 mb-3">
                      {mvpEntry.player!.foto ? (
                        <img src={mvpEntry.player!.foto} alt={mvpEntry.player!.nome} className="w-8 h-8 rounded-full object-cover border border-amber-400/20" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1e1e1e] flex items-center justify-center border border-amber-400/20">
                          <User size={14} className="text-amber-400/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Trophy size={12} className="text-amber-400" />
                          <span className="text-amber-400 font-['Roboto',sans-serif] text-[10px] tracking-wider uppercase font-bold">MVP</span>
                        </div>
                        <p className="text-white font-['Roboto',sans-serif] text-sm truncate">{mvpEntry.player!.nome}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {mvpEntry.stat.gols > 0 && (
                          <div className="text-center">
                            <span className="text-[#d3b379] font-['Anton',sans-serif] text-lg">{mvpEntry.stat.gols}</span>
                            <p className="text-white/20 text-[8px] font-['Roboto',sans-serif]">gols</p>
                          </div>
                        )}
                        {mvpEntry.stat.assistencias > 0 && (
                          <div className="text-center">
                            <span className="text-white/60 font-['Anton',sans-serif] text-lg">{mvpEntry.stat.assistencias}</span>
                            <p className="text-white/20 text-[8px] font-['Roboto',sans-serif]">asst</p>
                          </div>
                        )}
                        {mvpEntry.stat.defesas > 0 && (
                          <div className="text-center">
                            <span className="text-emerald-400/70 font-['Anton',sans-serif] text-lg">{mvpEntry.stat.defesas}</span>
                            <p className="text-white/20 text-[8px] font-['Roboto',sans-serif]">def</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Player grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {presentPlayers
                      .filter((x) => !x.stat.mvp) // MVP already shown above
                      .map(({ stat, player: p }) => {
                        if (!p) return null;
                        const hasContribution = stat.gols > 0 || stat.assistencias > 0 || stat.defesas > 0;
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center gap-2.5 rounded-lg p-2 transition-all ${
                              hasContribution
                                ? 'bg-white/[0.03] border border-white/[0.04]'
                                : 'border border-transparent'
                            }`}
                          >
                            {p.foto ? (
                              <img src={p.foto} alt={p.nome} className="w-6 h-6 rounded-full object-cover border border-[#2a2a2a]" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#1e1e1e] flex items-center justify-center border border-[#2a2a2a]">
                                <span className="text-white/15 text-[8px] font-['Anton',sans-serif]">{p.numero}</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white/70 font-['Roboto',sans-serif] text-[11px] truncate">{p.nome}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {stat.gols > 0 && (
                                <span className="text-[#d3b379] font-['Anton',sans-serif] text-sm">{stat.gols}<span className="text-[8px] text-white/20 ml-0.5 font-['Roboto',sans-serif]">G</span></span>
                              )}
                              {stat.assistencias > 0 && (
                                <span className="text-white/50 font-['Anton',sans-serif] text-sm">{stat.assistencias}<span className="text-[8px] text-white/20 ml-0.5 font-['Roboto',sans-serif]">A</span></span>
                              )}
                              {stat.defesas > 0 && (
                                <span className="text-emerald-400/60 font-['Anton',sans-serif] text-sm">{stat.defesas}<span className="text-[8px] text-white/20 ml-0.5 font-['Roboto',sans-serif]">D</span></span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Also show legacy text if present alongside manually-entered sumula */}
                  {hasTextDetails && match.sumula && Array.isArray(match.sumula) && match.sumula.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#1a1a1a]/60 space-y-2">
                      {match.golsSadock && (
                        <div>
                          <p className="text-white/15 text-[9px] tracking-[0.15em] uppercase font-['Roboto',sans-serif] mb-0.5">Gols (texto)</p>
                          <p className="text-white/30 text-[11px] font-['Roboto',sans-serif]">{match.golsSadock}</p>
                        </div>
                      )}
                      {match.assistenciasSadock && (
                        <div>
                          <p className="text-white/15 text-[9px] tracking-[0.15em] uppercase font-['Roboto',sans-serif] mb-0.5">Assistências (texto)</p>
                          <p className="text-white/30 text-[11px] font-['Roboto',sans-serif]">{match.assistenciasSadock}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}