import { useState, useEffect, useMemo } from "react";
import { X, Trophy, Equal, TrendingDown, ClipboardList, Target, Shield, Cake } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "motion/react";
import imgLucasRocha from "figma:asset/3b19718a9a7ccee0c7b8c5f0b7625f3a2d5e828c.png";
import type { Match } from "../data/matches";
import { getMatchResult, getSadockScore, getAdversarioScore, isFutureMatch } from "../data/matches";

interface CoachModalProps {
  onClose: () => void;
  matches?: Match[];
  coachData?: { id?: string; nome?: string; foto?: string; atual?: boolean; aniversario?: string | null; periodoInicio?: string; periodoFim?: string | null; cargo?: string };
}

interface SeasonStats {
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsFeitos: number;
  golsSofridos: number;
}

function isCoachPresent(m: Match, coachId?: string): boolean {
  // Only count matches where the coach is explicitly listed in coachesPresentes[]
  // We do NOT fall back to the generic coachPresente boolean because it doesn't
  // identify which coach was present — using it would credit every coach for every
  // match that has coachPresente:true, which is the bug we're fixing.
  if (!coachId) return false;
  if (Array.isArray((m as any).coachesPresentes) && (m as any).coachesPresentes.length > 0) {
    return (m as any).coachesPresentes.includes(coachId);
  }
  // No explicit coachesPresentes list → coach was not marked in this sumula
  return false;
}

function computeCoachStats(matches: Match[], season: string, coachId?: string): SeasonStats {
  const filtered = matches.filter((m) => {
    if (isFutureMatch(m)) return false;
    if (!isCoachPresent(m, coachId)) return false;
    if (season !== "all" && m.temporada !== season) return false;
    return true;
  });
  let v = 0, e = 0, d = 0, gf = 0, gs = 0;
  filtered.forEach((m) => {
    const result = getMatchResult(m);
    if (result === "V") v++;
    else if (result === "E") e++;
    else d++;
    gf += getSadockScore(m);
    gs += getAdversarioScore(m);
  });
  return { jogos: v + e + d, vitorias: v, empates: e, derrotas: d, golsFeitos: gf, golsSofridos: gs };
}

const seasons = [
  { label: "Total", value: "all" },
  { label: "2024", value: "2024" },
  { label: "2025", value: "2025" },
  { label: "2026", value: "2026" },
];

/* ──────────── Floating Particles ──────────── */

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 4,
        opacity: Math.random() * 0.15 + 0.05,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#d3b379]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ──────────── Shimmer Line ──────────── */

function ShimmerLine() {
  return (
    <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-3xl z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ width: "30%" }}
        animate={{ x: ["-100%", "400%"] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ──────────── Animated Counter ──────────── */

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value === 0) {
        setDisplay(0);
        return;
      }
      const duration = 800;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <>{display}</>;
}

/* ──────────── Stagger helpers ──────────── */

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

/* ──────────── Component ──────────── */

export function CoachModal({ onClose, matches = [], coachData }: CoachModalProps) {
  const [season, setSeason] = useState("all");
  const coachId = coachData?.id;
  const cs = useMemo(() => computeCoachStats(matches, season, coachId), [matches, season, coachId]);
  const winRate = cs.jogos > 0 ? Math.round((cs.vitorias / cs.jogos) * 100) : 0;
  const saldo = cs.golsFeitos - cs.golsSofridos;

  const coachName = coachData?.nome || "Lucas Rocha";
  const coachPhoto = coachData?.foto || imgLucasRocha;

  // Coach presence count from match data
  const coachPresenceCount = useMemo(() => {
    return matches.filter((m: Match) => {
      if (isFutureMatch(m)) return false;
      if (season !== "all" && m.temporada !== season) return false;
      return isCoachPresent(m, coachId);
    }).length;
  }, [matches, season, coachId]);

  const statItems = [
    { value: cs.jogos, label: "Jogos", color: "text-white", icon: null },
    { value: coachPresenceCount, label: "Presença", color: "text-[#d3b379]", icon: <ClipboardList size={14} className="opacity-60" /> },
    { value: cs.vitorias, label: "Vitórias", color: "text-emerald-400", icon: <Trophy size={14} className="opacity-60" /> },
    { value: cs.empates, label: "Empates", color: "text-amber-400", icon: <Equal size={14} className="opacity-60" /> },
    { value: cs.derrotas, label: "Derrotas", color: "text-red-400", icon: <TrendingDown size={14} className="opacity-60" /> },
    { value: cs.golsFeitos, label: "Gols Feitos", color: "text-[#d3b379]", icon: <Target size={14} className="opacity-60" /> },
    { value: cs.golsSofridos, label: "Gols Sofridos", color: "text-white/50", icon: <Shield size={14} className="opacity-60" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Background radial pulse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d3b379]/5 rounded-full blur-[150px]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 40, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(6px)" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-b from-[#181818] to-[#0e0e0e] rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto relative border border-[#2a2a2a] shadow-[0_0_80px_rgba(0,0,0,0.8),0_0_40px_rgba(211,179,121,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shimmer accent line */}
        <ShimmerLine />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Close button */}
        <motion.button
          initial={{ opacity: 0, rotate: -90, scale: 0 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }}
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white/50 hover:text-white bg-black/60 hover:bg-black/80 rounded-full p-2.5 transition-all backdrop-blur-sm cursor-pointer"
        >
          <X size={18} />
        </motion.button>

        {/* ═══ HORIZONTAL LAYOUT ═══ */}
        <div className="flex flex-col md:flex-row relative z-[1]">

          {/* ── LEFT COLUMN (Photo) ── */}
          <motion.div
            className="md:w-[280px] lg:w-[320px] shrink-0 p-5 sm:p-6 flex flex-col items-center md:border-r border-white/[0.06]"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {/* Photo */}
            <motion.div
              variants={staggerItem}
              className="relative mb-4 w-full"
            >
              <motion.div
                initial={{ opacity: 0, x: -40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                className="w-full aspect-[3/4] max-w-[240px] mx-auto rounded-2xl overflow-hidden border border-[#2a2a2a] bg-gradient-to-b from-[#252525] to-[#181818] relative group"
              >
                <img
                  src={coachPhoto}
                  alt={coachName}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gold shimmer sweep on photo */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(211,179,121,0.15)] to-transparent"
                  style={{ width: "50%" }}
                  initial={{ x: "-100%" }}
                  animate={{ x: "300%" }}
                  transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent" />

                {/* Clipboard badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute bottom-3 right-3 bg-gradient-to-br from-[#d3b379] to-[#9a7b3f] w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(211,179,121,0.4)]"
                >
                  <ClipboardList size={22} className="text-[#0b0b0b]" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Role badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 20 }}
              className={`inline-block rounded-full px-3 py-1 mb-2 ${
                coachData?.cargo === 'Comissão Técnica'
                  ? 'bg-white/[0.06] border border-white/10'
                  : 'bg-[rgba(211,179,121,0.15)] border border-[rgba(211,179,121,0.25)]'
              }`}
            >
              <p className={`font-['Roboto',sans-serif] text-[9px] tracking-[0.2em] uppercase ${
                coachData?.cargo === 'Comissão Técnica' ? 'text-white/40' : 'text-[#d3b379]'
              }`}>
                {coachData?.cargo || 'Treinador'}
              </p>
            </motion.div>

            {/* Name */}
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-['Anton',sans-serif] text-2xl sm:text-3xl leading-tight text-center"
            >
              {coachName}
            </motion.h2>

            {/* Birthday & Period info */}
            {(coachData?.aniversario || coachData?.periodoInicio) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="flex items-center gap-3 mt-1.5"
              >
                {coachData?.aniversario && (
                  <span className="flex items-center gap-1 text-white/25 font-['Roboto',sans-serif] text-[10px]">
                    <Cake size={11} className="text-[#d3b379]/50" />
                    {new Date(coachData.aniversario + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </span>
                )}
                {coachData?.periodoInicio && (
                  <span className="text-white/15 font-['Roboto',sans-serif] text-[10px]">
                    {coachData.periodoInicio}{coachData.periodoFim ? ` – ${coachData.periodoFim}` : ' – presente'}
                  </span>
                )}
              </motion.div>
            )}

            {/* Big Win Rate Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 w-full"
            >
              <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-4 text-center relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(211,179,121,0.05)] to-transparent"
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                />
                <p className="text-white/25 font-['Roboto',sans-serif] text-[8px] tracking-[0.25em] uppercase mb-2 relative z-10">Aproveitamento</p>
                <motion.p
                  key={`rate-${season}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-[#d3b379] font-['Anton',sans-serif] text-5xl leading-none relative z-10"
                >
                  <AnimatedNumber value={winRate} delay={0.3} />%
                </motion.p>
                <div className="mt-3 h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex relative z-10">
                  <motion.div
                    className="bg-emerald-400 h-full"
                    key={`w-${season}`}
                    initial={{ width: 0 }}
                    animate={{ width: cs.jogos > 0 ? `${(cs.vitorias / cs.jogos) * 100}%` : "0%" }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.div
                    className="bg-amber-400 h-full"
                    key={`d-${season}`}
                    initial={{ width: 0 }}
                    animate={{ width: cs.jogos > 0 ? `${(cs.empates / cs.jogos) * 100}%` : "0%" }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.div
                    className="bg-red-400 h-full"
                    key={`l-${season}`}
                    initial={{ width: 0 }}
                    animate={{ width: cs.jogos > 0 ? `${(cs.derrotas / cs.jogos) * 100}%` : "0%" }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="flex justify-between mt-2 relative z-10">
                  <span className="text-emerald-400/60 font-['Roboto',sans-serif] text-[8px]">V</span>
                  <span className="text-amber-400/60 font-['Roboto',sans-serif] text-[8px]">E</span>
                  <span className="text-red-400/60 font-['Roboto',sans-serif] text-[8px]">D</span>
                </div>
              </div>
            </motion.div>

            {/* Goal Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-3 w-full"
            >
              <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-3 text-center">
                <p className="text-white/25 font-['Roboto',sans-serif] text-[8px] tracking-[0.25em] uppercase mb-1.5">Saldo de Gols</p>
                <motion.p
                  key={`saldo-${season}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`font-['Anton',sans-serif] text-3xl leading-none ${saldo > 0 ? "text-emerald-400" : saldo < 0 ? "text-red-400" : "text-white/40"}`}
                >
                  {saldo > 0 ? "+" : ""}{saldo}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT COLUMN (Stats) ── */}
          <div className="flex-1 p-5 sm:p-6 relative z-[1]">
            {/* Season selector */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mb-6"
            >
              <p className="text-white/20 font-['Roboto',sans-serif] text-[8px] tracking-[0.25em] uppercase mb-3">
                Temporada
              </p>
              <div className="flex gap-2">
                {seasons.map((s) => {
                  const isActive = season === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setSeason(s.value)}
                      className="relative px-4 py-2 rounded-full text-[10px] tracking-wider font-['Roboto',sans-serif] transition-colors duration-200 cursor-pointer overflow-hidden"
                      style={{
                        color: isActive ? "#0b0b0b" : "rgba(255,255,255,0.4)",
                        border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="coach-modal-season-bg"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d3b379] to-[#c4a265]"
                          style={{ zIndex: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {statItems.map((item, i) => (
                <motion.div
                  key={`${item.label}-${season}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.3 + i * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{
                    scale: 1.05,
                    borderColor: "rgba(211,179,121,0.3)",
                    transition: { duration: 0.2 },
                  }}
                  className="bg-[#141414] rounded-xl p-5 text-center border border-[#1e1e1e] relative overflow-hidden group cursor-default"
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d3b379]/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none" />

                  <div className="relative z-10">
                    {item.icon && (
                      <motion.div
                        className={`${item.color} mb-2 flex justify-center`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.07, type: "spring", stiffness: 400, damping: 15 }}
                      >
                        {item.icon}
                      </motion.div>
                    )}
                    <p className={`${item.color} font-['Anton',sans-serif] text-4xl leading-none`}>
                      <AnimatedNumber value={item.value} delay={0.3 + i * 0.07} />
                    </p>
                    <p className="text-white/30 text-[9px] tracking-[0.2em] font-['Roboto',sans-serif] uppercase mt-2">
                      {item.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* No data notice */}
            {cs.jogos === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mb-6 bg-[#111] border border-dashed border-white/[0.08] rounded-xl p-4 flex items-center gap-3"
              >
                <ClipboardList size={16} className="text-white/20 shrink-0" />
                <p className="text-white/30 font-['Roboto',sans-serif] text-xs">
                  Sem dados disponíveis para {season === 'all' ? 'nenhuma temporada' : `a temporada ${season}`}. As estatísticas são calculadas apenas a partir de súmulas onde o treinador foi explicitamente selecionado.
                </p>
              </motion.div>
            )}

            {/* Goals Comparison Visual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="bg-[#111] rounded-xl border border-[#1a1a1a] p-5"
            >
              <p className="text-white/20 font-['Roboto',sans-serif] text-[8px] tracking-[0.25em] uppercase mb-4 text-center">
                Gols Feitos vs Sofridos
              </p>
              <div className="space-y-3">
                {/* Goals scored bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[#d3b379]/70 font-['Roboto',sans-serif] text-[10px] tracking-wider flex items-center gap-1.5">
                      <Target size={12} /> Feitos
                    </span>
                    <motion.span
                      key={`gf-${season}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[#d3b379] font-['Anton',sans-serif] text-lg"
                    >
                      <AnimatedNumber value={cs.golsFeitos} delay={0.5} />
                    </motion.span>
                  </div>
                  <div className="h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <motion.div
                      key={`gf-bar-${season}`}
                      className="h-full rounded-full bg-gradient-to-r from-[rgba(211,179,121,0.6)] to-[#d3b379] relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (cs.golsFeitos / Math.max(cs.golsFeitos, cs.golsSofridos, 1)) * 100)}%` }}
                      transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <motion.div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#d3b379]"
                        animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Goals conceded bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/30 font-['Roboto',sans-serif] text-[10px] tracking-wider flex items-center gap-1.5">
                      <Shield size={12} /> Sofridos
                    </span>
                    <motion.span
                      key={`gs-${season}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-white/50 font-['Anton',sans-serif] text-lg"
                    >
                      <AnimatedNumber value={cs.golsSofridos} delay={0.6} />
                    </motion.span>
                  </div>
                  <div className="h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <motion.div
                      key={`gs-bar-${season}`}
                      className="h-full rounded-full bg-gradient-to-r from-white/10 to-white/25 relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (cs.golsSofridos / Math.max(cs.golsFeitos, cs.golsSofridos, 1)) * 100)}%` }}
                      transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <motion.div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/30"
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Average per game */}
            {cs.jogos > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.4 }}
                className="mt-4 grid grid-cols-3 gap-3"
              >
                <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-3 text-center">
                  <p className="text-white/20 font-['Roboto',sans-serif] text-[7px] tracking-[0.2em] uppercase mb-1">Gols/Jogo</p>
                  <p className="text-[#d3b379] font-['Anton',sans-serif] text-xl">{(cs.golsFeitos / cs.jogos).toFixed(1)}</p>
                </div>
                <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-3 text-center">
                  <p className="text-white/20 font-['Roboto',sans-serif] text-[7px] tracking-[0.2em] uppercase mb-1">Sofridos/Jogo</p>
                  <p className="text-white/50 font-['Anton',sans-serif] text-xl">{(cs.golsSofridos / cs.jogos).toFixed(1)}</p>
                </div>
                <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-3 text-center">
                  <p className="text-white/20 font-['Roboto',sans-serif] text-[7px] tracking-[0.2em] uppercase mb-1">Pontos</p>
                  <p className="text-white font-['Anton',sans-serif] text-xl">{cs.vitorias * 3 + cs.empates}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}