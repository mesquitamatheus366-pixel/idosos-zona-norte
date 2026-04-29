import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { matches as staticMatches, getMatchResult, getLocalType, isFutureMatch, sortMatchesByDate } from "../data/matches";
import { MatchCard } from "../components/MatchCard";
import { Filter, Trophy, Equal, TrendingDown, X, ChevronDown } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { mergePlayerPhotos } from "../data/playerPhotos";
import { players as staticPlayers } from "../data/players";
import { MatchesLoadingSkeleton } from "../components/LoadingSkeleton";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-039eccc6`;

export function Partidas() {
  const [matches, setMatches] = useState<typeof staticMatches>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [temporadasList, setTemporadasList] = useState<string[]>(["2024", "2025", "2026"]);
  const [temporada, setTemporada] = useState("Todas");
  const [competicao, setCompeticao] = useState("Todas");
  const [local, setLocal] = useState("Todos");
  const [adversario, setAdversario] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        console.log('[Partidas] Fetching data from API...');
        const headers = { 'Authorization': `Bearer ${publicAnonKey}` };
        const [resMatches, resPlayers, resTemporadas] = await Promise.all([
          fetch(`${API_BASE}/matches`, { headers }),
          fetch(`${API_BASE}/players`, { headers }),
          fetch(`${API_BASE}/temporadas`, { headers }),
        ]);
        if (resMatches.ok) {
          const data = await resMatches.json();
          console.log('[Partidas] API response:', { count: data.matches?.length, error: data.error });
          if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
            setMatches(data.matches);
            console.log('[Partidas] Using API data:', data.matches.length, 'matches');
          } else {
            console.log('[Partidas] Using static data:', staticMatches.length, 'matches');
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
            setTemporadasList(dataTemp.temporadas);
          }
        }
      } catch (err) {
        console.error("[Partidas] Error fetching data, falling back to static:", err);
        setMatches(staticMatches);
        setPlayers(staticPlayers);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  // Get unique competitions
  const competicoes = useMemo(() => {
    const set = new Set(matches.map((m) => m.competicao));
    return ["Todas", ...Array.from(set)];
  }, [matches]);

  // Get unique adversários
  const adversarios = useMemo(() => {
    const set = new Set(
      matches.map((m) => m.equipeCasa === "Sadock FC" ? m.equipeFora : m.equipeCasa).filter(Boolean)
    );
    return ["Todos", ...Array.from(set).sort()];
  }, [matches]);

  const locais = ["Todos", "Casa", "Fora"];

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (temporada !== "Todas" && m.temporada !== temporada) return false;
      if (competicao !== "Todas" && m.competicao !== competicao) return false;
      if (local !== "Todos" && getLocalType(m) !== local) return false;
      if (adversario !== "Todos") {
        const adv = m.equipeCasa === "Sadock FC" ? m.equipeFora : m.equipeCasa;
        if (adv !== adversario) return false;
      }
      return true;
    });
  }, [matches, temporada, competicao, local, adversario]);

  const stats = useMemo(() => {
    let v = 0, e = 0, d = 0;
    filtered.forEach((m) => {
      if (isFutureMatch(m)) return; // skip future matches
      const r = getMatchResult(m);
      if (r === "V") v++;
      else if (r === "E") e++;
      else d++;
    });
    const played = v + e + d;
    return { v, e, d, played };
  }, [filtered]);

  const hasActiveFilters = temporada !== "Todas" || competicao !== "Todas" || local !== "Todos" || adversario !== "Todos";

  const clearFilters = () => {
    setTemporada("Todas");
    setCompeticao("Todas");
    setLocal("Todos");
    setAdversario("Todos");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0b0b0b] pt-24 pb-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">HISTÓRICO COMPLETO</p>
          <h1 className="font-['Anton',sans-serif] text-white text-5xl sm:text-7xl">PARTIDAS</h1>
        </div>
        <MatchesLoadingSkeleton />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0b] pt-24 pb-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">HISTÓRICO</p>
            <h1 className="font-['Anton',sans-serif] text-white text-5xl sm:text-7xl">PARTIDAS</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 bg-[#151515] text-white/60 px-4 py-2.5 rounded-xl border border-[#222] mt-4"
          >
            <Filter size={14} />
            <span className="text-[11px] tracking-wider">Filtros</span>
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-[#151515] rounded-xl p-3 text-center border border-[#1e1e1e]">
            <p className="text-white font-['Anton',sans-serif] text-2xl">{stats.played}</p>
            <p className="text-white/30 text-[9px] tracking-[0.2em] font-['Roboto',sans-serif] uppercase">Jogos</p>
          </div>
          <div className="bg-[#151515] rounded-xl p-3 text-center border border-[#1e1e1e]">
            <p className="text-emerald-400 font-['Anton',sans-serif] text-2xl flex items-center justify-center gap-1"><Trophy size={14} /> {stats.v}</p>
            <p className="text-white/30 text-[9px] tracking-[0.2em] font-['Roboto',sans-serif] uppercase">Vitórias</p>
          </div>
          <div className="bg-[#151515] rounded-xl p-3 text-center border border-[#1e1e1e]">
            <p className="text-amber-400 font-['Anton',sans-serif] text-2xl flex items-center justify-center gap-1"><Equal size={14} /> {stats.e}</p>
            <p className="text-white/30 text-[9px] tracking-[0.2em] font-['Roboto',sans-serif] uppercase">Empates</p>
          </div>
          <div className="bg-[#151515] rounded-xl p-3 text-center border border-[#1e1e1e]">
            <p className="text-red-400 font-['Anton',sans-serif] text-2xl flex items-center justify-center gap-1"><TrendingDown size={14} /> {stats.d}</p>
            <p className="text-white/30 text-[9px] tracking-[0.2em] font-['Roboto',sans-serif] uppercase">Derrotas</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${showFilters ? "block" : "hidden"} md:block mb-8`}>
          <div className="bg-gradient-to-b from-[#141414] to-[#101010] p-5 rounded-2xl border border-[#1e1e1e]/80">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#d3b379]/60 font-['Roboto',sans-serif] text-[10px] tracking-[0.25em] uppercase">FILTROS</p>
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-[#d3b379]/70 hover:text-[#d3b379] text-[10px] font-['Roboto',sans-serif] transition-colors cursor-pointer"
                >
                  <X size={11} /> Limpar filtros
                </motion.button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Temporada pills - inline */}
              <div className="flex items-center gap-1.5">
                {["Todas", ...temporadasList].map((opt) => {
                  const isActive = temporada === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setTemporada(opt)}
                      className="relative px-3 py-1.5 rounded-full text-[10px] tracking-wider font-['Roboto',sans-serif] transition-colors duration-200 cursor-pointer overflow-hidden"
                      style={{
                        color: isActive ? "#0b0b0b" : "rgba(255,255,255,0.35)",
                        border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="filter-bg-temporada"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d3b379] to-[#c4a265]"
                          style={{ zIndex: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-white/[0.06]" />

              {/* Competição dropdown */}
              <div className="relative">
                <select
                  value={competicao}
                  onChange={(e) => setCompeticao(e.target.value)}
                  className="appearance-none bg-[#1a1a1a] text-[10px] tracking-wider font-['Roboto',sans-serif] pl-3 pr-7 py-1.5 rounded-full border border-white/[0.06] cursor-pointer focus:outline-none focus:border-[#d3b379]/40 transition-colors"
                  style={{ color: competicao !== "Todas" ? "#d3b379" : "rgba(255,255,255,0.35)" }}
                >
                  {competicoes.map((c) => (
                    <option key={c} value={c}>{c === "Todas" ? "Competição" : c}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              </div>

              <div className="w-px h-5 bg-white/[0.06]" />

              {/* Local pills - inline */}
              <div className="flex items-center gap-1.5">
                {locais.map((opt) => {
                  const isActive = local === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setLocal(opt)}
                      className="relative px-3 py-1.5 rounded-full text-[10px] tracking-wider font-['Roboto',sans-serif] transition-colors duration-200 cursor-pointer overflow-hidden"
                      style={{
                        color: isActive ? "#0b0b0b" : "rgba(255,255,255,0.35)",
                        border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="filter-bg-local"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d3b379] to-[#c4a265]"
                          style={{ zIndex: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-white/[0.06]" />

              {/* Adversário dropdown */}
              <div className="relative">
                <select
                  value={adversario}
                  onChange={(e) => setAdversario(e.target.value)}
                  className="appearance-none bg-[#1a1a1a] text-[10px] tracking-wider font-['Roboto',sans-serif] pl-3 pr-7 py-1.5 rounded-full border border-white/[0.06] cursor-pointer focus:outline-none focus:border-[#d3b379]/40 transition-colors"
                  style={{ color: adversario !== "Todos" ? "#d3b379" : "rgba(255,255,255,0.35)" }}
                >
                  {adversarios.map((adv) => (
                    <option key={adv} value={adv}>{adv === "Todos" ? "Adversário" : adv}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Match List */}
        <div className="flex flex-col gap-3">
          {sortMatchesByDate(filtered, 'desc').map((match) => (
            <MatchCard key={match.id} match={match} players={players} />
          ))}
          {filtered.length === 0 && (
            <p className="text-white/30 text-center py-20 font-['Roboto',sans-serif] text-sm">
              Nenhuma partida encontrada com os filtros selecionados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}