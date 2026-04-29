import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { X, User, Trophy, Target, Handshake, Shield, Star, Instagram, ThumbsUp, Check, Zap } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "motion/react";
import type { Player } from "../data/players";
import { getPlayerStats } from "../data/players";
import type { Match } from "../data/matches";
import { computePlayerStatsFromSumula, countMatchesWithSumula } from "../data/statsFromSumula";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { SkillsRadar, generateSkills } from "./SkillsRadar";
import { AchievementCardGenerator } from "./AchievementCardGenerator";

interface PlayerModalProps {
  player: Player;
  matches?: Match[];
  onClose: () => void;
}

const seasons = [
  { label: "Todas", value: "all" },
  { label: "2024", value: "2024" },
  { label: "2025", value: "2025" },
  { label: "2026", value: "2026" },
];

const reactions = [
  { emoji: "\u{1F44D}", label: "Craque" },
  { emoji: "\u{1F525}", label: "Em grande fase" },
  { emoji: "\u{1F4AA}", label: "Guerreiro" },
  { emoji: "\u26BD", label: "Artilheiro" },
];

const ZERO_COUNTS: Record<string, number> = { "\u{1F44D}": 0, "\u{1F525}": 0, "\u{1F4AA}": 0, "\u26BD": 0 };
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-039eccc6`;

function loadMyVote(playerId: string): string | null {
  return localStorage.getItem(`rv3_${playerId}`) || null;
}

function saveMyVote(playerId: string, emoji: string | null) {
  if (emoji) {
    localStorage.setItem(`rv3_${playerId}`, emoji);
  } else {
    localStorage.removeItem(`rv3_${playerId}`);
  }
}

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
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStarted(true);
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

  return <>{started ? display : 0}</>;
}

/* ──────────── Medals System ──────────── */

interface Medal {
  id: string;
  icon: string;
  label: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
}

const TIER_STYLES: Record<Medal["tier"], { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: "bg-[rgba(139,94,60,0.15)]", border: "border-[rgba(139,94,60,0.4)]", text: "text-[#cd7f32]", glow: "shadow-[0_0_8px_rgba(205,127,50,0.15)]" },
  silver: { bg: "bg-[rgba(156,163,175,0.15)]", border: "border-[rgba(156,163,175,0.4)]", text: "text-[#c0c0c0]", glow: "shadow-[0_0_8px_rgba(192,192,192,0.15)]" },
  gold: { bg: "bg-[rgba(211,179,121,0.15)]", border: "border-[rgba(211,179,121,0.4)]", text: "text-[#d3b379]", glow: "shadow-[0_0_8px_rgba(211,179,121,0.2)]" },
  diamond: { bg: "bg-[rgba(96,165,250,0.15)]", border: "border-[rgba(96,165,250,0.4)]", text: "text-[#60a5fa]", glow: "shadow-[0_0_12px_rgba(96,165,250,0.25)]" },
};

function getHybridStatsForModal(
  player: Player,
  matches: Match[] | undefined,
  season: string
): { jogos: number; gols: number; assistencias: number; defesas: number; mvp: number; fromSumula: boolean } {
  if (matches && matches.length > 0) {
    const sumulaCount = countMatchesWithSumula(matches, season);
    if (sumulaCount > 0) {
      const sumulaStats = computePlayerStatsFromSumula(matches, player.id, season);
      if (sumulaStats.jogos > 0) {
        return { ...sumulaStats, fromSumula: true };
      }
    }
  }
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

function getMedals(player: Player, matches?: Match[]): Medal[] {
  const allStats = getHybridStatsForModal(player, matches, "all");
  const medals: Medal[] = [];

  const jogosThresholds: { n: number; tier: Medal["tier"]; icon: string }[] = [
    { n: 50, tier: "bronze", icon: "🏟️" },
    { n: 100, tier: "silver", icon: "🏟️" },
    { n: 200, tier: "gold", icon: "🏟️" },
    { n: 300, tier: "diamond", icon: "🏟️" },
  ];
  for (const t of jogosThresholds) {
    if (allStats.jogos >= t.n) {
      medals.push({ id: `jogos-${t.n}`, icon: t.icon, label: `${t.n} Jogos`, description: `Disputou ${t.n} partidas pelo Sadock`, tier: t.tier });
    }
  }

  if (player.posicao !== "Goleiro") {
    const golsThresholds: { n: number; tier: Medal["tier"]; icon: string }[] = [
      { n: 50, tier: "bronze", icon: "⚽" },
      { n: 100, tier: "silver", icon: "⚽" },
      { n: 200, tier: "gold", icon: "⚽" },
      { n: 300, tier: "diamond", icon: "⚽" },
    ];
    for (const t of golsThresholds) {
      if (allStats.gols >= t.n) {
        medals.push({ id: `gols-${t.n}`, icon: t.icon, label: `${t.n} Gols`, description: `Marcou ${t.n} gols pelo Sadock`, tier: t.tier });
      }
    }

    const assistThresholds: { n: number; tier: Medal["tier"]; icon: string }[] = [
      { n: 50, tier: "bronze", icon: "🎯" },
      { n: 100, tier: "silver", icon: "🎯" },
      { n: 200, tier: "gold", icon: "🎯" },
      { n: 300, tier: "diamond", icon: "🎯" },
    ];
    for (const t of assistThresholds) {
      if (allStats.assistencias >= t.n) {
        medals.push({ id: `assists-${t.n}`, icon: t.icon, label: `${t.n} Assist.`, description: `Deu ${t.n} assistências pelo Sadock`, tier: t.tier });
      }
    }
  }

  if (allStats.mvp >= 5) {
    medals.push({ id: "mvp-streak", icon: "👑", label: "5 MVPs", description: "Conquistou 5 prêmios de MVP", tier: "gold" });
  }

  return medals;
}

function getNextMilestones(player: Player, matches?: Match[]): { label: string; current: number; target: number; icon: string }[] {
  const allStats = getHybridStatsForModal(player, matches, "all");
  const milestones: { label: string; current: number; target: number; icon: string }[] = [];

  const jogosTargets = [50, 100, 200, 300];
  const nextJogos = jogosTargets.find((t) => allStats.jogos < t);
  if (nextJogos) milestones.push({ label: "Jogos", current: allStats.jogos, target: nextJogos, icon: "🏟️" });

  if (player.posicao !== "Goleiro") {
    const golsTargets = [50, 100, 200, 300];
    const nextGols = golsTargets.find((t) => allStats.gols < t);
    if (nextGols) milestones.push({ label: "Gols", current: allStats.gols, target: nextGols, icon: "⚽" });

    const assistTargets = [50, 100, 200, 300];
    const nextAssist = assistTargets.find((t) => allStats.assistencias < t);
    if (nextAssist) milestones.push({ label: "Assist.", current: allStats.assistencias, target: nextAssist, icon: "🎯" });
  }

  return milestones;
}

/* ──────────── Stagger children helper ──────────── */

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

export function PlayerModal({ player, matches, onClose }: PlayerModalProps) {
  const [season, setSeason] = useState("all");
  const [showReactions, setShowReactions] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({ ...ZERO_COUNTS });
  const [myVote, setMyVote] = useState<string | null>(() => loadMyVote(player.id));
  const [loadingReactions, setLoadingReactions] = useState(true);
  const [savingReaction, setSavingReaction] = useState(false);

  // Hybrid stats: prefer sumula when available
  const hybridStats = useMemo(
    () => getHybridStatsForModal(player, matches, season),
    [player, matches, season]
  );
  const stats = {
    jogos: hybridStats.jogos,
    gols: hybridStats.gols,
    assistencias: hybridStats.assistencias,
    defesas: hybridStats.defesas,
    mvp: hybridStats.mvp,
  };
  const usingLiveStats = hybridStats.fromSumula;

  const skills = useMemo(() => {
    const allStats = getHybridStatsForModal(player, matches, "all");
    return generateSkills(player.posicao, allStats);
  }, [player, matches]);

  const medals = useMemo(() => getMedals(player, matches), [player, matches]);
  const nextMilestones = useMemo(() => getNextMilestones(player, matches), [player, matches]);

  const fetchReactions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/reactions/${player.id}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReactionCounts(data.counts || { ...ZERO_COUNTS });
    } catch (err) {
      console.error("Failed to fetch reactions:", err);
    } finally {
      setLoadingReactions(false);
    }
  }, [player.id]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const handleReaction = async (emoji: string) => {
    if (savingReaction) return;
    const clickedSame = myVote === emoji;
    const previousEmoji = myVote;
    const newVote = clickedSame ? null : emoji;

    setReactionCounts((prev) => {
      const next = { ...prev };
      if (previousEmoji) next[previousEmoji] = Math.max((next[previousEmoji] || 0) - 1, 0);
      if (!clickedSame) next[emoji] = (next[emoji] || 0) + 1;
      return next;
    });
    setMyVote(newVote);
    saveMyVote(player.id, newVote);

    setSavingReaction(true);
    try {
      const res = await fetch(`${API_BASE}/reactions/${player.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ emoji: newVote, previousEmoji }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReactionCounts(data.counts);
    } catch (err) {
      console.error("Failed to save reaction:", err);
      setMyVote(previousEmoji);
      saveMyVote(player.id, previousEmoji);
      fetchReactions();
    } finally {
      setSavingReaction(false);
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

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

          {/* ── LEFT COLUMN ── */}
          <motion.div
            className="md:w-[280px] lg:w-[320px] shrink-0 p-5 sm:p-6 flex flex-col items-center md:border-r border-[rgba(255,255,255,0.06)]"
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
                {player.foto ? (
                  <>
                    <img
                      src={player.foto}
                      alt={player.nome}
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
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={60} className="text-[#333]" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent" />

                {/* Number badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute bottom-3 right-3 bg-gradient-to-br from-[#d3b379] to-[#9a7b3f] w-12 h-12 rounded-xl flex items-center justify-center font-['Anton',sans-serif] text-2xl text-[#0b0b0b] shadow-[0_4px_20px_rgba(211,179,121,0.4)]"
                >
                  {player.numero}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Position badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 20 }}
              className="inline-block bg-[rgba(211,179,121,0.15)] border border-[rgba(211,179,121,0.25)] rounded-full px-3 py-1 mb-2"
            >
              <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[9px] tracking-[0.2em] uppercase">
                {player.posicao}
              </p>
            </motion.div>

            {/* Name with character reveal */}
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-['Anton',sans-serif] text-2xl sm:text-3xl leading-tight text-center"
            >
              {player.nome}
            </motion.h2>

            {/* ── Medals ── */}
            {medals.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 w-full"
              >
                <div className="flex flex-wrap justify-center gap-2">
                  {medals.map((m, i) => {
                    const style = TIER_STYLES[m.tier];
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.55 + i * 0.1, type: "spring", stiffness: 400, damping: 15 }}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        title={m.description}
                        className={`${style.bg} ${style.border} ${style.glow} border rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 cursor-default`}
                      >
                        <span className="text-sm">{m.icon}</span>
                        <span className={`${style.text} font-['Roboto',sans-serif] text-[9px] tracking-wider font-medium`}>
                          {m.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Next Milestones ── */}
            {nextMilestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-4 w-full space-y-2"
              >
                <p className="text-white/15 font-['Roboto',sans-serif] text-[8px] tracking-[0.25em] uppercase text-center">
                  Próximas Conquistas
                </p>
                {nextMilestones.map((ms, idx) => {
                  const pct = Math.min(100, Math.round((ms.current / ms.target) * 100));
                  return (
                    <motion.div
                      key={ms.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1, duration: 0.4, ease: "easeOut" }}
                      className="bg-[#111] rounded-lg p-2.5 border border-[#1a1a1a] group hover:border-[rgba(211,179,121,0.15)] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <motion.span
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="text-xs"
                          >
                            {ms.icon}
                          </motion.span>
                          <span className="text-white/40 font-['Roboto',sans-serif] text-[9px] tracking-wider">{ms.label}</span>
                        </div>
                        <span className="text-white/30 font-['Roboto',sans-serif] text-[9px]">
                          {ms.current}<span className="text-white/15">/{ms.target}</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.2, delay: 0.8 + idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full bg-gradient-to-r from-[rgba(211,179,121,0.6)] to-[#d3b379] relative"
                        >
                          {/* Pulse glow at the end of bar */}
                          <motion.div
                            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#d3b379]"
                            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.3, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="mt-4 w-full space-y-2"
            >
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowReactions(!showReactions)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-300 font-['Roboto',sans-serif] text-[10px] tracking-[0.15em] cursor-pointer ${
                    showReactions
                      ? "bg-[rgba(211,179,121,0.15)] border-[rgba(211,179,121,0.3)] text-[#d3b379] shadow-[0_0_20px_rgba(211,179,121,0.1)]"
                      : "bg-[#111] border-[#1e1e1e] text-white/50 hover:border-[rgba(211,179,121,0.2)] hover:text-white/80 hover:shadow-[0_0_15px_rgba(211,179,121,0.05)]"
                  }`}
                >
                  <ThumbsUp size={12} />
                  REAGIR
                  {totalReactions > 0 && (
                    <motion.span
                      key={totalReactions}
                      initial={{ scale: 1.4 }}
                      animate={{ scale: 1 }}
                      className="bg-[rgba(211,179,121,0.2)] text-[#d3b379] text-[9px] px-1.5 py-0.5 rounded-full"
                    >
                      {totalReactions}
                    </motion.span>
                  )}
                </motion.button>

                {player.instagram && (
                  <motion.a
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    href={`https://www.instagram.com/${player.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#111] border border-[#1e1e1e] text-white/50 hover:border-[rgba(211,179,121,0.2)] hover:text-white/80 hover:shadow-[0_0_15px_rgba(211,179,121,0.05)] transition-all duration-300 font-['Roboto',sans-serif] text-[10px] tracking-[0.15em]"
                  >
                    <Instagram size={12} />
                    INSTAGRAM
                  </motion.a>
                )}
              </div>

              {/* Reaction Panel */}
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#111] rounded-xl border border-[#1e1e1e] p-3">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/25 font-['Roboto',sans-serif] text-[8px] tracking-[0.25em] uppercase mb-2.5 text-center"
                      >
                        COMO VOCE AVALIA {player.nome.split(" ")[0].toUpperCase()}?
                      </motion.p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {reactions.map((r, rIdx) => {
                          const voted = myVote === r.emoji;
                          return (
                            <motion.button
                              key={r.emoji}
                              initial={{ opacity: 0, y: 15, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: 0.1 + rIdx * 0.06, type: "spring", stiffness: 400, damping: 20 }}
                              whileHover={{ scale: 1.12, y: -3 }}
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleReaction(r.emoji)}
                              className={`relative flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                                voted
                                  ? "bg-[rgba(211,179,121,0.1)] border-[rgba(211,179,121,0.3)] shadow-[0_0_12px_rgba(211,179,121,0.08)]"
                                  : "bg-[#0e0e0e] border-[#1a1a1a] hover:border-[rgba(211,179,121,0.25)] hover:bg-[rgba(211,179,121,0.05)]"
                              }`}
                            >
                              {voted && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500 }}
                                  className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[rgba(211,179,121,0.2)] flex items-center justify-center"
                                >
                                  <Check size={8} className="text-[#d3b379]" />
                                </motion.div>
                              )}
                              <span className={`text-xl transition-transform ${voted ? "scale-110" : "group-hover:scale-110"}`}>{r.emoji}</span>
                              <span className={`font-['Roboto',sans-serif] text-[7px] tracking-wider ${
                                voted ? "text-[#d3b379]/60" : "text-white/30 group-hover:text-white/50"
                              }`}>
                                {r.label.toUpperCase()}
                              </span>
                              <motion.span
                                key={reactionCounts[r.emoji]}
                                initial={{ scale: 1.5 }}
                                animate={{ scale: 1 }}
                                className="text-[#d3b379] font-['Anton',sans-serif] text-base leading-none"
                              >
                                {reactionCounts[r.emoji] || 0}
                              </motion.span>
                            </motion.button>
                          );
                        })}
                      </div>
                      {myVote && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-white/15 font-['Roboto',sans-serif] text-[7px] tracking-[0.2em] uppercase mt-2 text-center"
                        >
                          TOQUE PARA REMOVER
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Achievement Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="w-full"
            >
              <AchievementCardGenerator
                playerId={player.id}
                playerName={player.nome}
                playerNumber={player.numero}
                playerPhoto={player.foto}
              />
            </motion.div>
          </motion.div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex-1 p-5 sm:p-6 min-w-0">
            {/* Skills Radar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#111]/80 rounded-2xl border border-[#1e1e1e] p-4 sm:p-5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#d3b379]/[0.02] to-transparent" />
              {/* Subtle rotating glow behind radar */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[rgba(211,179,121,0.05)] rounded-full blur-[50px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-white/20 font-['Roboto',sans-serif] text-[8px] tracking-[0.3em] uppercase text-center mb-1 relative z-10"
              >
                Habilidades
              </motion.p>
              <div className="max-w-[260px] mx-auto relative z-10">
                <SkillsRadar skills={skills} />
              </div>
            </motion.div>

            {/* Season Selector */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="mt-4"
            >
              <div className="bg-[#111] rounded-xl p-1 flex gap-1">
                {seasons.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSeason(s.value)}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-['Roboto',sans-serif] tracking-wider transition-all cursor-pointer relative ${
                      season === s.value
                        ? "text-[#0b0b0b]"
                        : "text-white/50 hover:text-white/80"
                    }`}
                  >
                    {season === s.value && (
                      <motion.div
                        layoutId="season-pill"
                        className="absolute inset-0 bg-gradient-to-r from-[#d3b379] to-[#b8964a] rounded-lg shadow-[0_2px_12px_rgba(211,179,121,0.25)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Live stats indicator */}
            {usingLiveStats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-3 flex items-center justify-center gap-1.5"
              >
                <Zap size={10} className="text-[#d3b379]" />
                <span className="text-[#d3b379]/60 font-['Roboto',sans-serif] text-[9px] tracking-wider">
                  Stats via sumula
                </span>
              </motion.div>
            )}

            {/* Season Stats */}
            <div
              className={`grid ${player.posicao === "Goleiro" ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} gap-2.5 mt-4`}
            >
              <StatBox icon={<Trophy size={14} />} value={stats.jogos} label="Jogos" delay={0.6} season={season} />
              {player.posicao === "Goleiro" && (
                <StatBox icon={<Shield size={14} />} value={stats.defesas || 0} label="Defesas" delay={0.7} season={season} />
              )}
              {player.posicao !== "Goleiro" && (
                <StatBox icon={<Target size={14} />} value={stats.gols} label="Gols" delay={0.7} season={season} />
              )}
              {player.posicao !== "Goleiro" && (
                <StatBox icon={<Handshake size={14} />} value={stats.assistencias} label="Assist." delay={0.8} season={season} />
              )}
              <StatBox icon={<Star size={14} />} value={stats.mvp} label="MVP" delay={0.9} season={season} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatBox({
  icon,
  value,
  label,
  delay,
  season,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  delay: number;
  season: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 300, damping: 24 }}
      whileHover={{ y: -4, scale: 1.05, borderColor: "rgba(211,179,121,0.25)" }}
      style={{ borderColor: "rgba(26,26,26,1)" }}
      className="bg-[#0e0e0e] rounded-xl p-3 text-center border transition-colors cursor-default relative overflow-hidden group"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#d3b379]/0 to-[#d3b379]/0 group-hover:from-[#d3b379]/[0.03] group-hover:to-transparent transition-all duration-500" />

      <div className="flex justify-center mb-1.5 text-[#d3b379]/50 relative z-10">
        <motion.div
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: delay + 0.1, type: "spring", stiffness: 400 }}
        >
          {icon}
        </motion.div>
      </div>
      <motion.p
        key={`${label}-${season}-${value}`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, type: "spring", stiffness: 300 }}
        className="text-[#d3b379] font-['Anton',sans-serif] text-2xl sm:text-3xl leading-none relative z-10"
      >
        <AnimatedNumber value={value} delay={delay + 0.15} />
      </motion.p>
      <p className="text-white/35 font-['Roboto',sans-serif] text-[9px] tracking-[0.15em] uppercase mt-1.5 relative z-10">
        {label}
      </p>
    </motion.div>
  );
}