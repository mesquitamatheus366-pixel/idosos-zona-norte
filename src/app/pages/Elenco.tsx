import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { players as staticPlayers } from "../data/players";
import { PlayerCard } from "../components/PlayerCard";
import { PlayerModal } from "../components/PlayerModal";
import { CoachModal } from "../components/CoachModal";
import type { Player } from "../data/players";
import { AnimatePresence, motion } from "motion/react";
import { ClipboardList, User, Trophy, Crosshair, Swords, Shield, Gamepad2 } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import imgLucasRocha from "figma:asset/3b19718a9a7ccee0c7b8c5f0b7625f3a2d5e828c.png";
import { mergePlayerPhotos } from "../data/playerPhotos";
import { matches as staticMatches } from "../data/matches";
import type { Match } from "../data/matches";
import { computePlayerStatsFromSumula } from "../data/statsFromSumula";
import { PageLoadingSkeleton } from "../components/LoadingSkeleton";

const posicoes = ["Todos", "Goleiro", "Fixo", "Ala", "Meio", "Pivô"];

/* ─── CoachCard sub-component ─── */
function CoachCard({
  coach,
  onSelect,
  fallbackPhoto,
  isStaff = false,
}: {
  coach: CoachInfo;
  onSelect: (c: CoachInfo) => void;
  fallbackPhoto: string;
  isStaff?: boolean;
}) {
  const roleLabel = coach.cargo || 'Treinador';
  const accentColor = isStaff ? 'text-white/40' : 'text-[#d3b379] opacity-80';
  return (
    <div className="[perspective:1000px]">
      <button
        onClick={() => onSelect(coach)}
        className="group relative bg-gradient-to-b from-[#1c1c1c] to-[#111] rounded-2xl overflow-hidden w-full text-left border transition-[border-color,box-shadow] duration-700 ease-out cursor-pointer border-[#222] hover:border-[#d3b379]/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_70px_rgba(211,179,121,0.18),0_8px_30px_rgba(0,0,0,0.5)]"
      >
        {/* Watermark icon */}
        <div className="absolute top-3 right-3 text-white/[0.04] group-hover:text-white/[0.07] transition-all duration-700 pointer-events-none select-none z-[1]">
          <ClipboardList size={64} />
        </div>

        {/* Photo area */}
        <div className="aspect-[3/4] overflow-hidden bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] relative">
          <div className="absolute inset-0 z-[2] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[90%] h-[80%] rounded-full bg-[#d3b379]/[0.12] blur-[50px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[35%] w-[60%] h-[50%] rounded-full bg-[#d3b379]/[0.09] blur-[30px]" />
          </div>

          {coach.foto ? (
            <img
              src={coach.foto}
              alt={coach.nome}
              className="relative z-[2] w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-110"
            />
          ) : (
            <img
              src={fallbackPhoto}
              alt={coach.nome}
              className="relative z-[2] w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-110"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-90 z-[3]" />
        </div>

        {/* Info bar */}
        <div className="p-4 relative -mt-14 z-10">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-['Roboto',sans-serif] text-[10px] tracking-[0.2em] uppercase ${accentColor}`}>
                  {roleLabel}
                </p>
                {coach.periodoInicio && (
                  <span className="text-white/15 font-['Roboto',sans-serif] text-[8px]">
                    {coach.periodoInicio}{coach.periodoFim ? `–${coach.periodoFim}` : ''}
                  </span>
                )}
              </div>
              <p className="text-white font-['Roboto',sans-serif] text-sm sm:text-base truncate">
                {coach.nome}
              </p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 ml-2 ${
              isStaff
                ? 'bg-[#1e1e1e] border border-white/[0.06] text-white/30'
                : 'bg-gradient-to-br from-[#d3b379] to-[#b8964a] text-[#0b0b0b] shadow-[0_4px_12px_rgba(211,179,121,0.3)]'
            }`}>
              <ClipboardList size={20} />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-t from-[#d3b379]/10 via-[#d3b379]/3 to-transparent" />
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none shadow-[inset_0_1px_0_rgba(211,179,121,0.12),inset_0_0_20px_rgba(211,179,121,0.04)]" />
      </button>
    </div>
  );
}

/* ─── ExCoachRow sub-component ─── */
function ExCoachRow({
  coach,
  onSelect,
  label,
}: {
  coach: CoachInfo;
  onSelect: (c: CoachInfo) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onSelect(coach)}
      className="group flex items-center gap-3.5 bg-gradient-to-r from-[#141414] to-[#111] rounded-xl overflow-hidden text-left border border-white/[0.04] hover:border-white/[0.08] transition-all duration-500 cursor-pointer pr-4"
    >
      <div className="w-16 h-16 shrink-0 overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#111] relative">
        {coach.foto ? (
          <img src={coach.foto} alt={coach.nome} className="w-full h-full object-cover object-top grayscale opacity-50 group-hover:opacity-70 group-hover:grayscale-[50%] transition-all duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={22} className="text-white/[0.08]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-3">
        <p className="font-['Roboto',sans-serif] text-[8px] tracking-[0.2em] uppercase text-white/20 mb-0.5">
          {label}
          {coach.periodoInicio && (
            <span className="text-white/10 ml-1.5">
              {coach.periodoInicio}{coach.periodoFim ? `–${coach.periodoFim}` : ''}
            </span>
          )}
        </p>
        <p className="text-white/40 group-hover:text-white/55 font-['Roboto',sans-serif] text-sm truncate transition-colors duration-500">
          {coach.nome}
        </p>
      </div>
      <ClipboardList size={14} className="text-white/[0.07] shrink-0" />
    </button>
  );
}

interface CoachInfo {
  id: string;
  nome: string;
  foto: string | null;
  atual: boolean;
  periodoInicio?: string;
  periodoFim?: string | null;
  aniversario?: string | null;
  cargo?: string; // 'Treinador' | 'Comissão Técnica'
}

/* ─── Comparison Modal ─── */
function ComparisonModal({ player1, player2, matches, onClose }: { player1: Player; player2: Player; matches: Match[]; onClose: () => void }) {
  const stats1 = computePlayerStatsFromSumula(matches, player1.id, 'all');
  const stats2 = computePlayerStatsFromSumula(matches, player2.id, 'all');

  const StatBar = ({ label, value1, value2, max, icon }: { label: string; value1: number; value2: number; max: number; icon?: React.ReactNode }) => {
    const percentage1 = max > 0 ? (value1 / max) * 100 : 0;
    const percentage2 = max > 0 ? (value2 / max) * 100 : 0;
    const winner = value1 > value2 ? 1 : value1 < value2 ? 2 : 0;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          {icon}
          <span className="font-['Roboto',sans-serif] text-[10px] tracking-[0.2em] uppercase text-white/40">{label}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* Player 1 bar */}
          <div className="flex items-center gap-3">
            <span className={`font-['Anton',sans-serif] text-2xl ${winner === 1 ? 'text-[#d3b379]' : 'text-white/60'} min-w-[3ch] text-right`}>
              {value1}
            </span>
            <div className="flex-1 h-3 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage1}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className={`h-full rounded-full ${winner === 1 ? 'bg-gradient-to-r from-[#d3b379] to-[#c4a265]' : 'bg-white/20'}`}
              />
            </div>
          </div>

          {/* VS divider */}
          <div className="w-px h-12 bg-white/[0.08]" />

          {/* Player 2 bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage2}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className={`h-full rounded-full ${winner === 2 ? 'bg-gradient-to-l from-[#d3b379] to-[#c4a265]' : 'bg-white/20'}`}
              />
            </div>
            <span className={`font-['Anton',sans-serif] text-2xl ${winner === 2 ? 'text-[#d3b379]' : 'text-white/60'} min-w-[3ch] text-left`}>
              {value2}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const maxJogos = Math.max(stats1.jogos, stats2.jogos) || 1;
  const maxGols = Math.max(stats1.gols, stats2.gols) || 1;
  const maxAsst = Math.max(stats1.assistencias, stats2.assistencias) || 1;
  const maxMvp = Math.max(stats1.mvp, stats2.mvp) || 1;
  const maxDef = Math.max(stats1.defesas, stats2.defesas) || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-[#1a1a1a] to-[#0e0e0e] rounded-3xl border border-[rgba(211,179,121,0.2)] max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(211,179,121,0.15) transparent' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-[#1a1a1a] to-transparent backdrop-blur-md border-b border-white/[0.08] p-6 sm:p-8 z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Anton',sans-serif] text-white text-2xl sm:text-3xl tracking-wider">COMPARAÇÃO</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-red-500/20 border border-white/[0.12] hover:border-red-500/40 text-white/60 hover:text-red-400 transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Players Header */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
            {/* Player 1 */}
            <div className="flex items-center gap-4 justify-end">
              <div className="text-right">
                <p className="font-['Anton',sans-serif] text-white text-xl sm:text-2xl truncate">{player1.nome}</p>
                <p className="font-['Roboto',sans-serif] text-[#d3b379]/70 text-xs tracking-wider">
                  #{player1.numero} · {player1.posicao}
                </p>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#111] border-2 border-white/[0.12] shrink-0">
                {player1.foto ? (
                  <img src={player1.foto} alt={player1.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white/10" />
                  </div>
                )}
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d3b379] to-[#c4a265] flex items-center justify-center shadow-[0_4px_20px_rgba(211,179,121,0.3)]">
                <span className="font-['Anton',sans-serif] text-[#0b0b0b] text-sm">VS</span>
              </div>
            </div>

            {/* Player 2 */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#111] border-2 border-white/[0.12] shrink-0">
                {player2.foto ? (
                  <img src={player2.foto} alt={player2.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white/10" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-['Anton',sans-serif] text-white text-xl sm:text-2xl truncate">{player2.nome}</p>
                <p className="font-['Roboto',sans-serif] text-[#d3b379]/70 text-xs tracking-wider">
                  #{player2.numero} · {player2.posicao}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Comparison */}
        <div className="p-6 sm:p-8 space-y-8">
          <StatBar
            label="Jogos"
            value1={stats1.jogos}
            value2={stats2.jogos}
            max={maxJogos}
            icon={<Gamepad2 className="w-4 h-4 text-white/30" />}
          />
          <StatBar
            label="Gols"
            value1={stats1.gols}
            value2={stats2.gols}
            max={maxGols}
            icon={<Crosshair className="w-4 h-4 text-white/30" />}
          />
          <StatBar
            label="Assistências"
            value1={stats1.assistencias}
            value2={stats2.assistencias}
            max={maxAsst}
            icon={<Swords className="w-4 h-4 text-white/30" />}
          />
          {(player1.posicao === 'Goleiro' || player2.posicao === 'Goleiro') && (
            <StatBar
              label="Defesas"
              value1={stats1.defesas}
              value2={stats2.defesas}
              max={maxDef}
              icon={<Shield className="w-4 h-4 text-white/30" />}
            />
          )}
          <StatBar
            label="MVP"
            value1={stats1.mvp}
            value2={stats2.mvp}
            max={maxMvp}
            icon={<Trophy className="w-4 h-4 text-white/30" />}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Elenco() {
  const location = useLocation();
  const playerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filterPos, setFilterPos] = useState("Todos");
  const [selectedCoach, setSelectedCoach] = useState<CoachInfo | null>(null);
  const [coachesList, setCoachesList] = useState<CoachInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightPlayerId, setHighlightPlayerId] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonModeActive, setComparisonModeActive] = useState(false);

  // Handle navigation from Sobre page with player highlight
  useEffect(() => {
    const state = location.state as { highlightPlayerId?: string } | null;
    if (state?.highlightPlayerId) {
      setHighlightPlayerId(state.highlightPlayerId);
      // Clear the state to avoid re-highlighting on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Scroll to highlighted player when data is loaded
  useEffect(() => {
    if (highlightPlayerId && players.length > 0 && playerRefs.current[highlightPlayerId]) {
      setTimeout(() => {
        playerRefs.current[highlightPlayerId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        // Remove highlight after animation
        setTimeout(() => setHighlightPlayerId(null), 3000);
      }, 500);
    }
  }, [highlightPlayerId, players]);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('[Elenco] Fetching data from API...');
        const headers = { 'Authorization': `Bearer ${publicAnonKey}` };
        const [resPlayers, resMatches, resCoaches] = await Promise.all([
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/players`, { headers }),
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/matches`, { headers }),
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/coaches`, { headers }),
        ]);
        if (resPlayers.ok) {
          const data = await resPlayers.json();
          if (data.players && Array.isArray(data.players) && data.players.length > 0) {
            setPlayers(mergePlayerPhotos(data.players));
          }
        }
        if (resMatches.ok) {
          const data = await resMatches.json();
          if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
            setMatches(data.matches);
          }
        }
        if (resCoaches.ok) {
          const data = await resCoaches.json();
          if (data.coaches && Array.isArray(data.coaches)) {
            setCoachesList(data.coaches);
          }
        }
      } catch (err) {
        console.error("[Elenco] Error fetching data, falling back to static:", err);
        setPlayers(mergePlayerPhotos(staticPlayers));
        setMatches(staticMatches);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activePlayers = players.filter((p) => p.ativo !== false && p.posicao !== 'Técnico');
  const inactivePlayers = players.filter((p) => p.ativo === false && p.exJogador === true && p.posicao !== 'Técnico');
  const filtered = (filterPos === "Todos" ? activePlayers : activePlayers.filter((p) => p.posicao === filterPos))
    .slice()
    .sort((a, b) => a.numero - b.numero);

  // Split active members by cargo
  const activeCoachMembers = [...coachesList]
    .filter((c) => c.atual)
    .sort((a, b) => (b.periodoInicio || '').localeCompare(a.periodoInicio || ''));

  const sortedCoaches = activeCoachMembers.filter((c) => !c.cargo || c.cargo === 'Treinador');
  const activeStaff = activeCoachMembers.filter((c) => c.cargo === 'Comissão Técnica');

  const exCoaches = coachesList.filter((c) => !c.atual);
  const exTreinadores = exCoaches.filter((c) => !c.cargo || c.cargo === 'Treinador');
  const exStaff = exCoaches.filter((c) => c.cargo === 'Comissão Técnica');

  const currentCoach = coachesList.find((c) => c.atual) || coachesList[0];

  const hasAlumni = inactivePlayers.length > 0 || exCoaches.length > 0;
  const hasActiveCommission = sortedCoaches.length > 0 || activeStaff.length > 0;

  if (loading) return <PageLoadingSkeleton title="ELENCO" subtitle="TEMPORADA 2024 - 2026" />;

  return (
    <div className="min-h-screen bg-[#0b0b0b] pt-24 pb-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">
            TEMPORADA 2024 - 2026
          </p>
          <h1 className="font-['Anton',sans-serif] text-white text-5xl sm:text-7xl">
            ELENCO
          </h1>
          <p className="text-white/30 font-['Roboto',sans-serif] text-sm mt-2">
            {activePlayers.length} jogadores ativos
          </p>
        </div>

        {/* Comissão Técnica */}
        {hasActiveCommission && (
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <ClipboardList size={16} className="text-[#d3b379]" />
              <h2 className="font-['Anton',sans-serif] text-white text-xl tracking-wider">COMISSÃO TÉCNICA</h2>
            </div>

            {/* Treinadores */}
            {sortedCoaches.length > 0 && (
              <div className={activeStaff.length > 0 ? 'mb-8' : ''}>
                {activeStaff.length > 0 && (
                  <p className="font-['Roboto',sans-serif] text-[9px] tracking-[0.25em] uppercase text-[#d3b379]/50 mb-3">
                    Treinador{sortedCoaches.length > 1 ? 'es' : ''}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {sortedCoaches.map((coach) => (
                    <CoachCard key={coach.id} coach={coach} onSelect={setSelectedCoach} fallbackPhoto={imgLucasRocha} />
                  ))}
                </div>
              </div>
            )}

            {/* Staff da Comissão Técnica */}
            {activeStaff.length > 0 && (
              <div>
                <p className="font-['Roboto',sans-serif] text-[9px] tracking-[0.25em] uppercase text-white/25 mb-3">
                  Comissão Técnica
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {activeStaff.map((coach) => (
                    <CoachCard key={coach.id} coach={coach} onSelect={setSelectedCoach} fallbackPhoto={imgLucasRocha} isStaff />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Position filter + Compare button */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {posicoes.map((pos) => {
              const isActive = filterPos === pos;
              return (
                <button
                  key={pos}
                  onClick={() => setFilterPos(pos)}
                  className="relative px-4 py-2 rounded-full text-[11px] tracking-wider font-['Roboto',sans-serif] transition-colors duration-200 cursor-pointer overflow-hidden"
                  style={{
                    color: isActive ? "#0b0b0b" : "rgba(255,255,255,0.4)",
                    border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="elenco-filter-bg"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d3b379] to-[#c4a265]"
                      style={{ zIndex: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{pos}</span>
                </button>
              );
            })}
          </div>

          {/* Compare mode controls */}
          {!comparisonModeActive ? (
            <button
              onClick={() => setComparisonModeActive(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] tracking-wider font-['Roboto',sans-serif] transition-all duration-200 border border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.15]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparar Jogadores
            </button>
          ) : (
            <button
              onClick={() => {
                setComparisonModeActive(false);
                setSelectedForComparison([]);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] tracking-wider font-['Roboto',sans-serif] transition-all duration-200 bg-[#d3b379] text-[#0b0b0b] border border-[#d3b379] hover:bg-[#c4a265]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar {selectedForComparison.length > 0 && `(${selectedForComparison.length} selecionados)`}
            </button>
          )}
        </div>

        {comparisonModeActive && selectedForComparison.length < 2 && (
          <div className="mb-4 p-4 rounded-xl bg-[#d3b379]/[0.08] border border-[#d3b379]/20">
            <p className="text-center font-['Roboto',sans-serif] text-sm text-[#d3b379]">
              {selectedForComparison.length === 0
                ? '✨ Clique em 2 jogadores para comparar suas estatísticas'
                : `👆 Selecione mais 1 jogador para comparar`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              ref={(el) => { playerRefs.current[p.id] = el; }}
              className={`transition-all duration-500 ${
                highlightPlayerId === p.id ? 'ring-2 ring-[#d3b379] ring-offset-2 ring-offset-[#0b0b0b] rounded-2xl' : ''
              }`}
            >
              <PlayerCard
                player={p}
                onClick={(player) => {
                  // Only open modal if not in comparison mode
                  if (!comparisonModeActive) {
                    setSelectedPlayer(player);
                  }
                }}
                selectionMode={comparisonModeActive}
                isSelected={selectedForComparison.includes(p.id)}
                onToggleSelect={(playerId) => {
                  if (selectedForComparison.includes(playerId)) {
                    setSelectedForComparison(selectedForComparison.filter(id => id !== playerId));
                  } else if (selectedForComparison.length < 2) {
                    setSelectedForComparison([...selectedForComparison, playerId]);
                  }
                }}
              />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-white/30 text-center py-20 font-['Roboto',sans-serif]">
            Nenhum jogador encontrado.
          </p>
        )}

        {/* ═══ Passaram pelo Clube ═══ */}
        {hasAlumni && (
          <div className="mt-24">
            {/* Divider */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <h2 className="font-['Anton',sans-serif] text-white/25 text-2xl sm:text-3xl tracking-wider">
                  PASSARAM PELO CLUBE
                </h2>
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            <p className="text-white/15 font-['Roboto',sans-serif] text-xs text-center mb-8 -mt-6">
              Jogadores e membros da comissão técnica que fizeram parte da história do Sadock FC
            </p>

            {/* All Alumni Combined */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {/* Ex-Coaches */}
              {exCoaches.map((coach) => (
                <div key={coach.id} className="[perspective:1000px]">
                  <button
                    onClick={() => setSelectedCoach(coach)}
                    className="group relative bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden w-full text-left border border-[#1e1e1e] hover:border-[#d3b379]/30 transition-all duration-700 ease-out cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_50px_rgba(211,179,121,0.08),0_8px_30px_rgba(0,0,0,0.5)]"
                  >
                    {/* Watermark icon */}
                    <div className="absolute top-3 right-3 text-white/[0.03] group-hover:text-white/[0.05] transition-all duration-700 pointer-events-none select-none z-[1]">
                      <ClipboardList size={48} />
                    </div>

                    {/* Photo area */}
                    <div className="aspect-[3/4] overflow-hidden bg-gradient-to-b from-[#252525] to-[#1a1a1a] relative">
                      <div className="absolute inset-0 z-[2] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[90%] h-[80%] rounded-full bg-[#d3b379]/[0.08] blur-[50px]" />
                      </div>

                      {coach.foto ? (
                        <img
                          src={coach.foto}
                          alt={coach.nome}
                          className="relative z-[2] w-full h-full object-cover object-top grayscale-[80%] opacity-60 group-hover:opacity-80 group-hover:grayscale-[60%] transition-all duration-700 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="relative z-[2] w-full h-full flex items-center justify-center">
                          <User size={48} className="text-white/[0.08]" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent opacity-95 z-[3]" />
                    </div>

                    {/* Info bar */}
                    <div className="p-3 relative -mt-12 z-10">
                      <div className="mb-0.5">
                        <p className="font-['Roboto',sans-serif] text-[8px] tracking-[0.15em] uppercase text-white/20 mb-0.5">
                          Ex-{coach.cargo || 'Treinador'}
                        </p>
                        {coach.periodoInicio && (
                          <p className="font-['Roboto',sans-serif] text-[9px] text-white/15 mb-1">
                            {coach.periodoInicio}{coach.periodoFim ? `–${coach.periodoFim}` : ''}
                          </p>
                        )}
                        <p className="text-white/50 group-hover:text-white/70 font-['Roboto',sans-serif] text-sm truncate transition-colors duration-700">
                          {coach.nome}
                        </p>
                      </div>
                    </div>

                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-t from-[#d3b379]/[0.06] via-transparent to-transparent" />
                  </button>
                </div>
              ))}

              {/* Ex-Players */}
              {inactivePlayers.sort((a, b) => a.nome.localeCompare(b.nome)).map((p) => {
                const ss = computePlayerStatsFromSumula(matches, p.id, 'all');
                const gols = ss.gols > 0 ? ss.gols : ((p.stats?.['2024']?.gols || 0) + (p.stats?.['2025']?.gols || 0) + (p.stats?.['2026']?.gols || 0));
                const jogos = ss.jogos > 0 ? ss.jogos : ((p.stats?.['2024']?.jogos || 0) + (p.stats?.['2025']?.jogos || 0) + (p.stats?.['2026']?.jogos || 0));
                const assistencias = ss.assistencias > 0 ? ss.assistencias : ((p.stats?.['2024']?.assistencias || 0) + (p.stats?.['2025']?.assistencias || 0) + (p.stats?.['2026']?.assistencias || 0));
                const mvps = ss.mvps || 0;

                return (
                <div key={p.id} className="[perspective:1000px]">
                  <button
                    ref={(el) => { playerRefs.current[p.id] = el; }}
                    onClick={() => setSelectedPlayer(p)}
                    className={`group relative bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl overflow-hidden w-full text-left border transition-all duration-700 ease-out cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_50px_rgba(211,179,121,0.08),0_8px_30px_rgba(0,0,0,0.5)] ${
                      highlightPlayerId === p.id ? 'border-[#d3b379] ring-2 ring-[#d3b379]/30' : 'border-[#1e1e1e] hover:border-[#d3b379]/30'
                    }`}
                  >
                    {/* Watermark number */}
                    <div className="absolute top-3 right-3 text-white/[0.03] group-hover:text-white/[0.05] transition-all duration-700 pointer-events-none select-none font-['Anton',sans-serif] text-5xl z-[1]">
                      {p.numero}
                    </div>

                    {/* Photo area */}
                    <div className="aspect-[3/4] overflow-hidden bg-gradient-to-b from-[#252525] to-[#1a1a1a] relative">
                      <div className="absolute inset-0 z-[2] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[90%] h-[80%] rounded-full bg-[#d3b379]/[0.08] blur-[50px]" />
                      </div>

                      {p.foto ? (
                        <img
                          src={p.foto}
                          alt={p.nome}
                          className="relative z-[2] w-full h-full object-cover object-top grayscale-[80%] opacity-60 group-hover:opacity-80 group-hover:grayscale-[60%] transition-all duration-700 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="relative z-[2] w-full h-full flex items-center justify-center">
                          <User size={48} className="text-white/[0.08]" />
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent opacity-95 z-[3]" />

                      {/* Position badge */}
                      <div className="absolute top-3 left-3 z-[4]">
                        <div className="px-2.5 py-1 rounded-md bg-[rgba(20,20,20,0.8)] backdrop-blur-sm border border-white/[0.08]">
                          <p className="font-['Roboto',sans-serif] text-[9px] tracking-wider uppercase text-white/40">
                            {p.posicao}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Info bar */}
                    <div className="p-3 relative -mt-12 z-10">
                      <div className="mb-1.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#2a2a2a] to-[#1e1e1e] border border-white/[0.06] flex items-center justify-center font-['Anton',sans-serif] text-white/30 text-[11px]">
                            {p.numero}
                          </span>
                          <p className="font-['Roboto',sans-serif] text-[8px] tracking-[0.15em] uppercase text-white/20">
                            Ex-Jogador
                          </p>
                        </div>
                        <p className="text-white/50 group-hover:text-white/70 font-['Roboto',sans-serif] text-sm sm:text-base truncate transition-colors duration-700 leading-tight">
                          {p.nome}
                        </p>
                      </div>

                      {/* Stats summary */}
                      {(jogos > 0 || gols > 0 || assistencias > 0 || mvps > 0) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                          {jogos > 0 && (
                            <div className="flex items-center gap-1">
                              <Gamepad2 size={10} className="text-white/20" />
                              <span className="font-['Roboto',sans-serif] text-[10px] text-white/30">{jogos}</span>
                            </div>
                          )}
                          {gols > 0 && (
                            <div className="flex items-center gap-1">
                              <Trophy size={10} className="text-white/20" />
                              <span className="font-['Roboto',sans-serif] text-[10px] text-white/30">{gols}</span>
                            </div>
                          )}
                          {assistencias > 0 && (
                            <div className="flex items-center gap-1">
                              <Crosshair size={10} className="text-white/20" />
                              <span className="font-['Roboto',sans-serif] text-[10px] text-white/30">{assistencias}</span>
                            </div>
                          )}
                          {mvps > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-2.5 h-2.5 text-white/20" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="font-['Roboto',sans-serif] text-[10px] text-white/30">{mvps}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-t from-[#d3b379]/[0.06] via-transparent to-transparent" />
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPlayer && (
          <PlayerModal
            player={selectedPlayer}
            matches={matches}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCoach && (
          <CoachModal
            onClose={() => setSelectedCoach(null)}
            matches={matches}
            coachData={selectedCoach}
          />
        )}
      </AnimatePresence>

      {/* Floating Compare Button */}
      <AnimatePresence>
        {comparisonModeActive && selectedForComparison.length === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#d3b379] to-[#c4a265] text-[#0b0b0b] font-['Roboto',sans-serif] font-semibold text-sm tracking-wide shadow-[0_8px_32px_rgba(211,179,121,0.4)] hover:shadow-[0_12px_48px_rgba(211,179,121,0.6)] hover:scale-105 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparar Jogadores
            </button>
            <button
              onClick={() => {
                setSelectedForComparison([]);
                setComparisonModeActive(false);
              }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {comparisonModeActive && showComparison && selectedForComparison.length === 2 && (() => {
          const player1 = players.find(p => p.id === selectedForComparison[0]);
          const player2 = players.find(p => p.id === selectedForComparison[1]);
          if (!player1 || !player2) return null;

          return (
            <ComparisonModal
              player1={player1}
              player2={player2}
              matches={matches}
              onClose={() => {
                setShowComparison(false);
                setSelectedForComparison([]);
                setComparisonModeActive(false);
              }}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}