import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight, Calendar, MapPin, ChevronLeft, ChevronRight, Crosshair, Users, Clock, ArrowUp, Trophy, Swords, Cake, Shield, Star, Gamepad2, Instagram, Newspaper } from "lucide-react";
import imgCamisa from "figma:asset/d9c63b95058494debdfa9e207b9f4daf10109316.png";
import imgCamisaBlack from "figma:asset/81098c8153cc1d11c244ffea34c2681834163ac7.png";
import imgCamisaGreen from "figma:asset/ca101167ceea6206b8fd5a2547c956223b17eee6.png";
import imgCamisaWhite from "figma:asset/3237b952514049d612af043ec91927c7a1d463e3.png";
import imgCamisaPink from "figma:asset/936df810e0d306a1459d2f66d10ad89318b1fe9d.png";
import imgLogo from "figma:asset/10ca126f7dcca96eb94b5eebb8aab702dae2e834.png";
import { players as staticPlayers, BirthdayEntry } from "../data/players";
import { getPlayerStats } from "../data/players";
import { matches as staticMatches } from "../data/matches";
import { getMatchResult, getSadockScore, getAdversarioScore, isFutureMatch, sortMatchesByDate } from "../data/matches";
import type { Match } from "../data/matches";
import { PlayerCard } from "../components/PlayerCard";
import { PlayerModal } from "../components/PlayerModal";
import type { Player } from "../data/players";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useScroll } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { mergePlayerPhotos } from "../data/playerPhotos";
import { computePlayerStatsFromSumula, countMatchesWithSumula } from "../data/statsFromSumula";
import { HomeLoadingSkeleton } from "../components/LoadingSkeleton";

/* ──────────── Helpers ──────────── */

function getHybridStats(
  player: Player,
  matchesList: Match[],
  season: string = "all"
): { jogos: number; gols: number; assistencias: number; defesas: number; mvp: number } {
  const sumulaCount = countMatchesWithSumula(matchesList, season);
  if (sumulaCount > 0) {
    const sumulaStats = computePlayerStatsFromSumula(matchesList, player.id, season);
    if (sumulaStats.jogos > 0) {
      return sumulaStats;
    }
    // Player not in any sumula — fall back to legacy
    const legacy = getPlayerStats(player, season);
    return { jogos: legacy.jogos, gols: legacy.gols, assistencias: legacy.assistencias, defesas: legacy.defesas || 0, mvp: legacy.mvp };
  }
  const s = getPlayerStats(player, season);
  return { jogos: s.jogos, gols: s.gols, assistencias: s.assistencias, defesas: s.defesas || 0, mvp: s.mvp };
}

function getNextBirthdayPlayersDynamic(playersList: Player[], count = 3): BirthdayEntry[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  const playersWithBirthday = playersList.filter((p) => p.aniversario);
  if (playersWithBirthday.length === 0) return [];

  const entries: BirthdayEntry[] = playersWithBirthday.map((p) => {
    const [dd, mm, yyyy] = p.aniversario!.split("/").map(Number);
    let next = new Date(currentYear, mm - 1, dd);
    let age = currentYear - yyyy;
    if (next.getTime() < now.getTime() - 86400000) {
      next = new Date(currentYear + 1, mm - 1, dd);
      age = currentYear + 1 - yyyy;
    }
    const diff = next.getTime() - now.getTime();
    const daysUntil = Math.ceil(diff / 86400000);
    return { player: p, nextBirthday: next, daysUntil, age };
  });

  return entries.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, count);
}

function getTeamInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
}

function OpponentShield({ name }: { name: string }) {
  const initials = getTeamInitials(name);
  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
      <svg viewBox="0 0 80 96" className="absolute inset-0 w-full h-full" fill="none">
        <path d="M40 2L6 16V44C6 68 40 92 40 92C40 92 74 68 74 44V16L40 2Z" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />
        <path d="M40 8L12 20V44C12 64 40 85 40 85C40 85 68 64 68 44V20L40 8Z" fill="none" stroke="#2a2a2a" strokeWidth="0.75" />
      </svg>
      <span className="relative z-10 text-white/50 font-['Anton',sans-serif] text-[11px] sm:text-sm tracking-wider">
        {initials}
      </span>
    </div>
  );
}

/** Parse "DD/MM/YYYY" → Date, returns null if invalid */
function parseMatchDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts.map(Number);
    if (dd && mm && yyyy) return new Date(yyyy, mm - 1, dd);
  }
  return null;
}

/** Find the next upcoming match (future date) */
function getNextMatch(matchesList: any[]): { match: any; date: Date } | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let closest: any = null;
  let closestDate: Date | null = null;

  for (const m of matchesList) {
    const d = parseMatchDate(m.data);
    if (!d || d.getTime() < now.getTime()) continue;
    if (!closestDate || d.getTime() < closestDate.getTime()) {
      closest = m;
      closestDate = d;
    }
  }
  return closest && closestDate ? { match: closest, date: closestDate } : null;
}

const jerseys = [
  { src: imgCamisaBlack, label: "Uniforme 1", color: "#d3b379" },
  { src: imgCamisaPink, label: "Uniforme 2", color: "#d946ef" },
  { src: imgCamisaWhite, label: "Uniforme Comissão Técnica", color: "#a0a0a0" },
  { src: imgCamisaGreen, label: "Uniforme Goleiro", color: "#2dd4bf" },
];

/* ──────────── Hooks ──────────── */

function useCountUp(end: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { value, ref };
}

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: false });

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        passed: false,
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function useMouseParallax() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 50, damping: 20 });
  const springY = useSpring(y, { stiffness: 50, damping: 20 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      x.set(cx * 30);
      y.set(cy * 30);
    },
    [x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { springX, springY, handleMouseMove, handleMouseLeave };
}

/* ──────────── Animated Stat ──────────── */

function AnimatedStat({ end, label }: { end: number; label: string }) {
  const { value, ref } = useCountUp(end, 1500);
  return (
    <motion.div
      ref={ref}
      className="relative group cursor-default"
      whileHover={{ scale: 1.08, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <p className="text-[#d3b379] font-['Anton',sans-serif] text-5xl sm:text-6xl tabular-nums group-hover:drop-shadow-[0_0_12px_rgba(211,179,121,0.4)] transition-all">
        {value}
      </p>
      <div className="h-px w-8 bg-gradient-to-r from-[#d3b379]/40 to-transparent mt-2 mb-1.5 group-hover:w-12 transition-all" />
      <p className="text-white/30 text-[10px] tracking-[0.2em] font-['Roboto',sans-serif] uppercase">
        {label}
      </p>
    </motion.div>
  );
}

/* ──────────── Voting Card ──────────── */

function VotingCard({ player, matchId, voteCount, percentage, onVote, isLeading }: { player: Player; matchId: string; voteCount: number; percentage: number; onVote: () => void; isLeading: boolean }) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);
    await onVote();
    setIsVoting(false);
  };

  return (
    <motion.button
      onClick={handleVote}
      disabled={isVoting}
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex-shrink-0 w-32 rounded-2xl p-3 transition-all duration-300 group overflow-hidden ${
        isLeading
          ? 'bg-gradient-to-b from-[#d3b379]/20 via-[#1e1e1e] to-[#0f0f0f] border-2 border-[#d3b379] shadow-[0_0_30px_rgba(211,179,121,0.3)]'
          : 'bg-gradient-to-b from-[#1e1e1e] to-[#0f0f0f] border border-white/[0.08] hover:border-[rgba(211,179,121,0.3)]'
      }`}
    >
      {/* Animated gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
        isLeading ? 'bg-gradient-to-t from-[#d3b379]/10 to-transparent' : 'bg-gradient-to-t from-[rgba(211,179,121,0.05)] to-transparent'
      }`} />

      {/* Progress bar background with glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-[rgba(211,179,121,0.2)] via-[rgba(211,179,121,0.08)] to-transparent"
        initial={{ height: 0 }}
        animate={{ height: `${percentage}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ bottom: 0, top: 'auto' }}
      />

      {/* Leading crown */}
      {isLeading && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-2 -right-2 z-20 w-7 h-7 bg-gradient-to-br from-[#d3b379] to-[#b8964a] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(211,179,121,0.5)]"
        >
          <svg className="w-4 h-4 text-[#0b0b0b]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </motion.div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Player photo with glow */}
        <div className={`w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] transition-all duration-300 ${
          isLeading
            ? 'border-2 border-[#d3b379] shadow-[0_0_20px_rgba(211,179,121,0.4)]'
            : 'border-2 border-white/[0.08] group-hover:border-[rgba(211,179,121,0.4)] group-hover:shadow-[0_0_15px_rgba(211,179,121,0.2)]'
        }`}>
          {player.foto ? (
            <img src={player.foto} alt={player.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-7 h-7 text-white/10" />
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="text-center w-full">
          <p className={`font-['Roboto',sans-serif] text-[11px] font-semibold truncate transition-colors ${
            isLeading ? 'text-[#d3b379]' : 'text-white group-hover:text-[#d3b379]'
          }`}>
            {player.nome.split(' ')[0]}
          </p>
          <p className="font-['Roboto',sans-serif] text-white/40 text-[9px] font-medium">
            #{player.numero}
          </p>
        </div>

        {/* Vote stats with enhanced styling */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          <div className="flex items-center gap-1">
            <Star className={`w-3.5 h-3.5 transition-all duration-300 ${
              voteCount > 0
                ? 'text-[#d3b379] fill-[#d3b379] drop-shadow-[0_0_8px_rgba(211,179,121,0.6)]'
                : 'text-white/20'
            }`} />
            <span className={`font-['Anton',sans-serif] text-sm transition-colors ${
              voteCount > 0 ? 'text-[#d3b379]' : 'text-white/30'
            }`}>
              {voteCount}
            </span>
          </div>
          {percentage > 0 && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-['Roboto',sans-serif] text-[#d3b379] text-[10px] font-semibold px-2 py-0.5 bg-[#d3b379]/10 rounded-full"
            >
              {percentage}%
            </motion.span>
          )}
        </div>
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Loading state */}
      {isVoting && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
          <div className="w-5 h-5 border-2 border-[#d3b379] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </motion.button>
  );
}

/* ──────────── Flip Countdown ──────────── */

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            initial={{ y: -20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-white font-['Anton',sans-serif] text-2xl sm:text-3xl tabular-nums relative z-10"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-white/25 font-['Roboto',sans-serif] text-[8px] tracking-[0.2em] uppercase mt-2">{label}</span>
    </div>
  );
}

/* ──────────── Scroll Progress ──────────── */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#d3b379] to-[#9a7b3f] origin-left z-[60]"
      style={{ scaleX }}
    />
  );
}

/* ──────────── Back to Top ──────────── */

function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handle = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.15, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gradient-to-br from-[#d3b379] to-[#9a7b3f] flex items-center justify-center shadow-[0_4px_20px_rgba(211,179,121,0.3)] cursor-pointer"
        >
          <ArrowUp size={18} className="text-[#0b0b0b]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ──────────── Marquee ──────────── */

function ResultsMarquee({ matches }: { matches: any[] }) {
  const sorted = useMemo(() => sortMatchesByDate(matches.filter((m: any) => !isFutureMatch(m))), [matches]);
  const last10 = useMemo(() => sorted.slice(-10).reverse(), [sorted]);
  const items = useMemo(() => [...last10, ...last10], [last10]);

  return (
    <div className="overflow-hidden border-y border-white/[0.04] py-3 bg-[#0a0a0a]">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {items.map((m, i) => {
          const r = getMatchResult(m);
          const color = r === "V" ? "#22c55e" : r === "D" ? "#ef4444" : "#eab308";
          const opp = m.equipeCasa === "Sadock FC" ? m.equipeFora : m.equipeCasa;
          const sS = getSadockScore(m);
          const aS = getAdversarioScore(m);
          return (
            <div key={`${m.id}-${i}`} className="flex items-center gap-3 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-white/50 font-['Roboto',sans-serif] text-[11px] tracking-wider">
                {m.wo ? (
                  <>Sadock <span className="text-white font-['Anton',sans-serif] text-sm">W.O.</span> {opp}</>
                ) : (
                  <>Sadock <span className="text-white font-['Anton',sans-serif] text-sm">{sS}</span>
                  <span className="text-white/20 mx-1">x</span>
                  <span className="text-white font-['Anton',sans-serif] text-sm">{aS}</span> {opp}</>
                )}
              </span>
              <span className="text-white/15 font-['Roboto',sans-serif] text-[9px]">{m.competicao}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ──────────── Animated Gradient Border ──────────── */

function GradientBorderCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative group h-full ${className}`}>
      {/* Animated gradient border */}
      <div className="absolute -inset-[1px] rounded-2xl overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity duration-500">
        <motion.div
          className="absolute inset-0 bg-[conic-gradient(from_0deg,#d3b379,transparent,#d3b379,transparent,#d3b379)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{ width: "200%", height: "200%", left: "-50%", top: "-50%" }}
        />
      </div>
      <div className="relative bg-gradient-to-b from-[#171717] to-[#0e0e0e] rounded-2xl overflow-hidden z-10 h-full">
        {children}
      </div>
    </div>
  );
}

/* ──────────── Main ──────────── */

export function Home() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [jerseyIndex, setJerseyIndex] = useState(0);
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);

  // Start empty — only show data after API loads (static as fallback on error)
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<typeof staticMatches>([]);
  const [news, setNews] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('[Home] Fetching data from API...');
        const headers = { 'Authorization': `Bearer ${publicAnonKey}` };
        const [resPlayers, resMatches, resNews] = await Promise.all([
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/players`, { headers }),
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/matches`, { headers }),
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/news`, { headers })
        ]);

        if (resPlayers.ok) {
          const dataPlayers = await resPlayers.json();
          if (dataPlayers.players && Array.isArray(dataPlayers.players) && dataPlayers.players.length > 0) {
            setPlayers(mergePlayerPhotos(dataPlayers.players));
          }
        }

        if (resMatches.ok) {
          const dataMatches = await resMatches.json();
          if (dataMatches.matches && Array.isArray(dataMatches.matches) && dataMatches.matches.length > 0) {
            setMatches(dataMatches.matches);
          }
        }

        if (resNews.ok) {
          const dataNews = await resNews.json();
          if (dataNews.news && Array.isArray(dataNews.news)) {
            setNews(dataNews.news);
          }
        }
      } catch (err) {
        console.error("[Home] Error fetching data, falling back to static:", err);
        setPlayers(staticPlayers);
        setMatches(staticMatches);
      } finally {
        setDataLoaded(true);
      }
    }
    loadData();
  }, []);

  const nextMatchInfo = useMemo(() => getNextMatch(matches), [matches]);
  const nextMatchDate = useMemo(() => nextMatchInfo?.date || new Date(2099, 0, 1), [nextMatchInfo]);
  const countdown = useCountdown(nextMatchDate);
  const { springX, springY, handleMouseMove, handleMouseLeave } = useMouseParallax();

  // Jersey parallax transforms
  const jerseyX = useTransform(springX, (v) => v * 0.8);
  const jerseyY = useTransform(springY, (v) => v * 0.8);
  const glowX = useTransform(springX, (v) => v * 1.2);
  const glowY = useTransform(springY, (v) => v * 1.2);
  const textX = useTransform(springX, (v) => v * -0.3);
  const textY = useTransform(springY, (v) => v * -0.3);

  // Drag state for carousel
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; index: number } | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setJerseyIndex((prev) => (prev + 1) % jerseys.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const playersWithPhoto = players.filter((p) => p.foto && p.ativo !== false).sort((a, b) => a.numero - b.numero);

  // Responsive visible count for carousel
  const [visibleCount, setVisibleCount] = useState(5);
  useEffect(() => {
    function updateVisibleCount() {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(2);
      else if (w < 1024) setVisibleCount(3);
      else setVisibleCount(5);
    }
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const maxIndex = Math.max(0, playersWithPhoto.length - visibleCount);

  // Reset carousel index if it exceeds new maxIndex after resize
  useEffect(() => {
    if (carouselIndex > maxIndex) setCarouselIndex(maxIndex);
  }, [maxIndex]);

  const scrollLeft = () => setCarouselIndex((prev) => Math.max(0, prev - 1));
  const scrollRight = () => setCarouselIndex((prev) => Math.min(maxIndex, prev + 1));

  // Drag handlers for carousel
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStart.current = { x: clientX, index: carouselIndex };
    setIsDragging(true);
  };
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStart.current || !carouselRef.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const diff = dragStart.current.x - clientX;
    const itemWidth = carouselRef.current.offsetWidth / visibleCount;
    const indexDelta = Math.round(diff / itemWidth);
    const newIndex = Math.max(0, Math.min(maxIndex, dragStart.current.index + indexDelta));
    setCarouselIndex(newIndex);
  };
  const handleDragEnd = () => {
    dragStart.current = null;
    setIsDragging(false);
  };

  const playedMatches = useMemo(() => sortMatchesByDate(matches.filter((m) => !isFutureMatch(m))), [matches]);
  const totalMatches = playedMatches.length;
  const wins = playedMatches.filter((m) => getMatchResult(m) === "V").length;
  const totalGoals = playedMatches.filter((m) => !m.wo).reduce((sum, m) => sum + getSadockScore(m), 0);

  const recentForm = useMemo(() => playedMatches.slice(-5).reverse(), [playedMatches]);

  const active = useMemo(() => players.filter((p) => p.ativo !== false), [players]);

  const topScorer = useMemo(() => {
    return active
      .map((p) => { const s = getHybridStats(p, matches, "all"); return { ...p, totalGols: s.gols, totalJogos: s.jogos }; })
      .filter((p) => p.totalGols > 0)
      .sort((a, b) => b.totalGols - a.totalGols)[0] || null;
  }, [active, matches]);

  const topAssister = useMemo(() => {
    return active
      .map((p) => { const s = getHybridStats(p, matches, "all"); return { ...p, totalAssist: s.assistencias, totalJogos: s.jogos }; })
      .filter((p) => p.totalAssist > 0)
      .sort((a, b) => b.totalAssist - a.totalAssist)[0] || null;
  }, [active, matches]);

  const topGames = useMemo(() => {
    return active
      .map((p) => { const s = getHybridStats(p, matches, "all"); return { ...p, totalJogos: s.jogos }; })
      .filter((p) => p.totalJogos > 0)
      .sort((a, b) => b.totalJogos - a.totalJogos)[0] || null;
  }, [active, matches]);

  const topDefesas = useMemo(() => {
    return active
      .filter((p) => p.posicao === "Goleiro")
      .map((p) => { const s = getHybridStats(p, matches, "all"); return { ...p, totalDefesas: s.defesas, totalJogos: s.jogos }; })
      .filter((p) => p.totalDefesas > 0)
      .sort((a, b) => b.totalDefesas - a.totalDefesas)[0] || null;
  }, [active, matches]);

  const topMVP = useMemo(() => {
    return active
      .map((p) => { const s = getHybridStats(p, matches, "all"); return { ...p, totalMVP: s.mvp, totalJogos: s.jogos }; })
      .filter((p) => p.totalMVP > 0)
      .sort((a, b) => b.totalMVP - a.totalMVP)[0] || null;
  }, [active, matches]);

  const nextBirthdayPlayers = useMemo(() => getNextBirthdayPlayersDynamic(players, 3), [players]);

  if (!dataLoaded) return <HomeLoadingSkeleton />;

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <ScrollProgress />
      <BackToTop />

      {/* ═══ HERO ═══ */}
      <section
        className="relative pt-16 min-h-[90vh] flex items-center overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background animated glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d3b379]/5 rounded-full blur-[120px] pointer-events-none"
          style={{ x: glowX, y: glowY }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(211,179,121,1) 1px, transparent 1px), linear-gradient(90deg, rgba(211,179,121,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-8 py-16">
          <motion.div
            className="z-10 max-w-2xl"
            style={{ x: textX, y: textY }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-[#d3b379]/10 border border-[rgba(211,179,121,0.2)] rounded-full px-4 py-1.5 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#d3b379] animate-pulse" />
              <span className="text-[#d3b379] font-['Roboto',sans-serif] text-[11px] tracking-[0.15em]">TEMPORADA 2026</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="font-['Anton',sans-serif] text-white text-5xl sm:text-7xl lg:text-8xl leading-[0.95]"
            >
              BEM-VINDOS
              <br />
              AO <span className="text-[#d3b379] drop-shadow-[0_0_30px_rgba(211,179,121,0.3)]">SADOCK FC</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-white/40 font-['Roboto',sans-serif] text-sm mt-6 max-w-md leading-relaxed"
            >
              Acompanhe o elenco, resultados, estatísticas e tudo sobre o Sadock FC.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex gap-10 sm:gap-14 mt-10"
            >
              <AnimatedStat end={totalMatches} label="Jogos" />
              <AnimatedStat end={wins} label="Vitórias" />
              <AnimatedStat end={totalGoals} label="Gols" />
            </motion.div>
          </motion.div>

          {/* Jersey Carousel with parallax */}
          <motion.div
            className="relative w-72 sm:w-96 lg:w-[550px] shrink-0 flex flex-col items-center"
            style={{ x: jerseyX, y: jerseyY }}
          >
            <div className="relative w-full aspect-square flex items-center justify-center">
              <motion.div
                key={`glow-${jerseyIndex}`}
                className="absolute inset-0 rounded-full blur-[80px] opacity-20"
                style={{ backgroundColor: jerseys[jerseyIndex].color }}
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <AnimatePresence mode="wait">
                <motion.img
                  key={jerseyIndex}
                  src={jerseys[jerseyIndex].src}
                  alt={jerseys[jerseyIndex].label}
                  className="w-[95%] h-auto drop-shadow-2xl relative z-10"
                  initial={{ opacity: 0, x: 60, rotate: 5 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: -60, rotate: -5 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                />
              </AnimatePresence>
            </div>
            <div className="flex flex-col items-center gap-3 mt-2 z-10">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`label-${jerseyIndex}`}
                  className="text-white/50 font-['Roboto',sans-serif] text-[11px] tracking-[0.2em] uppercase"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {jerseys[jerseyIndex].label}
                </motion.p>
              </AnimatePresence>
              <div className="flex gap-2">
                {jerseys.map((j, i) => (
                  <button
                    key={i}
                    onClick={() => setJerseyIndex(i)}
                    className="relative w-2.5 h-2.5 rounded-full cursor-pointer transition-transform hover:scale-150"
                    style={{ backgroundColor: i === jerseyIndex ? jerseys[jerseyIndex].color : "rgba(255,255,255,0.15)" }}
                  >
                    {i === jerseyIndex && (
                      <motion.div
                        layoutId="jersey-dot"
                        className="absolute inset-[-3px] rounded-full border"
                        style={{ borderColor: jerseys[jerseyIndex].color }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-white/15 font-['Roboto',sans-serif] text-[8px] tracking-[0.3em] uppercase">Rolar</span>
          <motion.div
            className="w-5 h-8 rounded-full border border-[rgba(255,255,255,0.1)] flex items-start justify-center p-1"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-1.5 rounded-full bg-[#d3b379]/50"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ Results Marquee ═══ */}
      <ResultsMarquee matches={matches} />

      {/* ═══ Próxima Partida ═══ */}
      {nextMatchInfo && (
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white/30 font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-3"
          >
            Próxima Partida
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-b from-[#171717] to-[#111] rounded-3xl p-6 sm:p-8 border border-[#222] relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />
            {/* Subtle pulsing background */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[rgba(211,179,121,0.02)] blur-[60px]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            {(() => {
              const nm = nextMatchInfo.match;
              const isSadockHome = nm.equipeCasa === "Sadock FC";
              const advName = isSadockHome ? (nm.equipeFora || "Adversário") : (nm.equipeCasa || "Adversário");
              const competicao = nm.competicao || "";
              const local = nm.local || "";
              const dataStr = nm.data || "";

              return (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center lg:gap-12 relative z-10">
              {/* Left: Match info */}
              <div className="flex-1 flex flex-col items-center">
                <motion.div
                  className="flex justify-center mb-5"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="font-['Roboto',sans-serif] text-[9px] tracking-[0.25em] uppercase px-3 py-1 rounded-full border border-[rgba(211,179,121,0.3)] bg-[#d3b379]/10 text-[#d3b379] flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d3b379] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d3b379]" />
                    </span>
                    EM BREVE
                  </span>
                </motion.div>

                <div className="flex items-center justify-center gap-6 sm:gap-10">
                  <motion.div
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="bg-[#1e1e1e] rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border border-[#2a2a2a]">
                      <img src={imgLogo} alt="SDK" className="h-9 sm:h-11 w-auto" />
                    </div>
                    <span className="text-[#d3b379] font-['Roboto',sans-serif] text-[9px] tracking-[0.15em]">SADOCK FC</span>
                  </motion.div>

                  <motion.div
                    className="text-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <p className="text-white/50 font-['Anton',sans-serif] text-2xl sm:text-3xl tracking-wider">VS</p>
                    {competicao && <p className="text-white/20 font-['Roboto',sans-serif] text-[9px] tracking-wider mt-1">{competicao}</p>}
                  </motion.div>

                  <motion.div
                    className="flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {nm.adversarioLogo ? (
                      <div className="bg-[#1e1e1e] rounded-2xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border border-[#2a2a2a] p-2">
                        <img src={nm.adversarioLogo} alt={advName} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <OpponentShield name={advName} />
                    )}
                    <span className="text-white/50 font-['Roboto',sans-serif] text-[9px] tracking-[0.15em] text-center max-w-[70px]">
                      {advName}
                    </span>
                  </motion.div>
                </div>

                <div className="flex items-center justify-center gap-4 mt-5">
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Calendar size={10} />
                    <span className="font-['Roboto',sans-serif] text-[10px] tracking-wider">{dataStr}</span>
                  </div>
                  {nm.horario && (
                  <div className="flex items-center gap-1.5 text-white/30">
                    <Clock size={10} />
                    <span className="font-['Roboto',sans-serif] text-[10px] tracking-wider">{nm.horario}</span>
                  </div>
                  )}
                </div>

                {local && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-white/15">
                  <MapPin size={10} />
                  <span className="font-['Roboto',sans-serif] text-[10px] tracking-wider">{local}</span>
                </div>
                )}
              </div>

              {/* Divider */}
              {!countdown.passed && (
                <>
                  <div className="hidden lg:block w-px self-stretch bg-white/[0.06]" />
                  <div className="lg:hidden h-px w-full bg-white/[0.06] my-6" />
                </>
              )}

              {/* Right: Countdown */}
              {!countdown.passed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex-1 flex flex-col items-center justify-center"
                >
                  <p className="text-center text-white/20 font-['Roboto',sans-serif] text-[8px] tracking-[0.3em] uppercase mb-4">Falta para o jogo</p>
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <CountdownUnit value={countdown.days} label="Dias" />
                    <span className="text-white/15 font-['Anton',sans-serif] text-xl mt-[-18px]">:</span>
                    <CountdownUnit value={countdown.hours} label="Horas" />
                    <span className="text-white/15 font-['Anton',sans-serif] text-xl mt-[-18px]">:</span>
                    <CountdownUnit value={countdown.minutes} label="Min" />
                    <span className="text-white/15 font-['Anton',sans-serif] text-xl mt-[-18px]">:</span>
                    <CountdownUnit value={countdown.seconds} label="Seg" />
                  </div>
                </motion.div>
              )}
            </div>
              );
            })()}
          </motion.div>

          {/* Últimos 5 jogos - interactive */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-5"
          >
            <p className="text-center text-white/20 font-['Roboto',sans-serif] text-[9px] tracking-[0.25em] uppercase mb-3">
              Últimos 5 jogos
            </p>
            <div className="flex items-center justify-center gap-2">
              {recentForm.map((m, i) => {
                const r = getMatchResult(m);
                const color = r === "V" ? "#22c55e" : r === "D" ? "#ef4444" : "#eab308";
                const sScore = getSadockScore(m);
                const aScore = getAdversarioScore(m);
                const opp = m.equipeCasa === "Sadock FC" ? m.equipeFora : m.equipeCasa;
                const isHovered = hoveredMatch === m.id;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.15, y: -8 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
                    onHoverStart={() => setHoveredMatch(m.id)}
                    onHoverEnd={() => setHoveredMatch(null)}
                    className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#151515] border border-[#1e1e1e] cursor-default relative"
                    style={{ borderColor: isHovered ? `${color}40` : `${color}20` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color, boxShadow: isHovered ? `0 0 12px ${color}80` : `0 0 6px ${color}60` }}
                    />
                    <span className="font-['Anton',sans-serif] text-sm tabular-nums" style={{ color }}>
                      {m.wo ? 'W.O.' : `${sScore}x${aScore}`}
                    </span>

                    {/* Craque badge */}
                    {m.craqueId && (() => {
                      const craquePlayer = players.find((p: Player) => p.id === m.craqueId);
                      return craquePlayer ? (
                        <div className="absolute -top-1 -right-1">
                          <Trophy className="w-3.5 h-3.5 text-[#d3b379] drop-shadow-[0_0_6px_rgba(211,179,121,0.6)]" />
                        </div>
                      ) : null;
                    })()}

                    {/* Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.9 }}
                          className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 whitespace-nowrap z-20"
                        >
                          <p className="text-white/60 font-['Roboto',sans-serif] text-[9px] text-center">vs {opp}</p>
                          <p className="text-white/25 font-['Roboto',sans-serif] text-[8px] text-center">{m.competicao}</p>
                          {m.craqueId && (() => {
                            const craquePlayer = players.find((p: Player) => p.id === m.craqueId);
                            return craquePlayer ? (
                              <div className="flex items-center justify-center gap-1 mt-1 pt-1 border-t border-white/[0.08]">
                                <Trophy className="w-3 h-3 text-[#d3b379]" />
                                <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[8px] font-semibold">
                                  {craquePlayer.nome.split(' ')[0]}
                                </p>
                              </div>
                            ) : null;
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex justify-center mt-8"
          >
            <Link
              to="/partidas"
              className="group flex items-center gap-2 px-6 py-2.5 rounded-full border border-[rgba(211,179,121,0.2)] bg-[#d3b379]/[0.06] text-[#d3b379] font-['Roboto',sans-serif] text-[11px] tracking-[0.15em] uppercase hover:bg-[#d3b379]/[0.12] hover:border-[rgba(211,179,121,0.4)] hover:shadow-[0_0_20px_rgba(211,179,121,0.1)] transition-all"
            >
              Ver todas as partidas
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
      )}

      {/* ═══ Votação Craque da Partida ═══ */}
      {(() => {
        const votingMatches = matches.filter((m: any) => m.votingOpen && m.sumula && m.sumula.some((s: any) => s.presente));
        if (votingMatches.length === 0) return null;

        return votingMatches.map((match: any) => {
          const isCasa = match.equipeCasa === 'Sadock FC';
          const placarSadock = isCasa ? match.placarCasa : match.placarFora;
          const placarAdv = isCasa ? match.placarFora : match.placarCasa;
          const advName = isCasa ? (match.equipeFora || 'Adversário') : (match.equipeCasa || 'Adversário');

          // Only show the 3 selected candidatos instead of all players
          const candidatos = match.candidatos || [];
          const playersInMatch = candidatos
            .map((playerId: string) => players.find((p: Player) => p.id === playerId))
            .filter(Boolean);

          return (
            <section key={match.id} className="py-8 px-4 sm:px-8">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a] rounded-2xl p-5 border border-[rgba(211,179,121,0.25)] relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                >
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#d3b379]/10 to-transparent rounded-tl-2xl" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-[#d3b379]/10 to-transparent rounded-br-2xl" />

                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />

                  <div className="relative z-10">
                    {/* Elegant Header */}
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d3b379] to-[#b8964a] flex items-center justify-center shadow-[0_4px_12px_rgba(211,179,121,0.3)]">
                          <Trophy className="w-5 h-5 text-[#0b0b0b]" />
                        </div>
                        <div>
                          <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.2em] uppercase font-semibold mb-0.5">
                            Craque da Partida
                          </p>
                          <p className="font-['Anton',sans-serif] text-white text-base sm:text-lg tracking-wide">
                            SADOCK {placarSadock} × {placarAdv} {advName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/30 font-['Roboto',sans-serif] text-[10px] tracking-wider mb-0.5">{match.data}</p>
                        <p className="text-white/40 font-['Roboto',sans-serif] text-[11px] font-medium">{match.competicao || 'Amistoso'}</p>
                      </div>
                    </div>

                    {/* Horizontal Scroll Voting */}
                    <div className="relative">
                      <div className="flex gap-4 justify-center overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(211,179,121,0.2)]" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(211,179,121,0.2) transparent' }}>
                      {(() => {
                        // Calculate who's leading
                        const voteCounts = playersInMatch.map((p: Player) => ({
                          playerId: p.id,
                          count: match.votes?.[p.id]?.total || 0
                        }));
                        const maxVotes = Math.max(...voteCounts.map(v => v.count));
                        const leaderId = maxVotes > 0 ? voteCounts.find(v => v.count === maxVotes)?.playerId : null;

                        return playersInMatch.map((player: Player) => {
                          const voteCount = match.votes?.[player.id]?.total || 0;
                          const totalVotes = Object.values(match.votes || {}).reduce((sum: number, v: any) => sum + (v.total || 0), 0);
                          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                          const isLeading = player.id === leaderId && maxVotes > 0;

                          return (
                            <VotingCard
                              key={player.id}
                              player={player}
                              matchId={match.id}
                              voteCount={voteCount}
                              percentage={percentage}
                              isLeading={isLeading}
                              onVote={async () => {
                              try {
                                const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/matches/${match.id}/vote`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${publicAnonKey}`,
                                  },
                                  body: JSON.stringify({ playerId: player.id }),
                                });

                                if (res.ok) {
                                  // Reload matches to get updated votes
                                  const matchesRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/matches`, {
                                    headers: { 'Authorization': `Bearer ${publicAnonKey}` },
                                  });
                                  if (matchesRes.ok) {
                                    const data = await matchesRes.json();
                                    setMatches(data.matches || []);
                                  }
                                } else {
                                  const error = await res.json();
                                  alert(error.error || 'Erro ao votar');
                                }
                              } catch (err) {
                                console.error('Error voting:', err);
                                alert('Erro ao votar');
                              }
                            }}
                          />
                        );
                      });
                      })()}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="mt-5 pt-4 border-t border-white/[0.04]">
                      <p className="text-center text-white/30 font-['Roboto',sans-serif] text-[10px] flex items-center justify-center gap-2">
                        <svg className="w-3.5 h-3.5 text-[#d3b379]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Cada pessoa pode votar apenas uma vez por partida
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>
          );
        });
      })()}

      {/* ═══ Próximos Aniversariantes ═══ */}
      {nextBirthdayPlayers.length > 0 && (
        <section className="py-10 px-4 sm:px-8">
          <div className="max-w-2xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center text-white/30 font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-4 flex items-center justify-center gap-2"
            >
              <Cake size={12} className="text-[#d3b379]/60" />
              Próximos Aniversariantes
            </motion.p>
            <div className="flex flex-col gap-3">
              {nextBirthdayPlayers.map((entry, i) => (
                <motion.div
                  key={entry.player.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                  whileHover={{ y: -3 }}
                  className={`relative rounded-2xl p-4 sm:p-5 border overflow-hidden group transition-colors ${
                    i === 0
                      ? "bg-gradient-to-br from-[#171717] to-[#111] border-[rgba(211,179,121,0.2)]"
                      : "bg-[#131313] border-[#1e1e1e] hover:border-[rgba(211,179,121,0.15)]"
                  }`}
                >
                  {/* Top gold line - only on first */}
                  {i === 0 && (
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d3b379]/60 to-transparent" />
                  )}

                  {/* Floating particles - only on first */}
                  {i === 0 && (
                    <>
                      <motion.div
                        className="absolute top-4 right-8 w-1.5 h-1.5 rounded-full bg-[#d3b379]/20"
                        animate={{ y: [0, -8, 0], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute top-10 right-20 w-1 h-1 rounded-full bg-[#d3b379]/15"
                        animate={{ y: [0, -6, 0], opacity: [0.15, 0.4, 0.15] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
                      />
                      <motion.div
                        className="absolute bottom-6 left-10 w-1 h-1 rounded-full bg-[#d3b379]/10"
                        animate={{ y: [0, -10, 0], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }}
                      />
                    </>
                  )}

                  <div className="relative z-10 flex items-center gap-4 sm:gap-5">
                    {/* Rank badge */}
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-['Anton',sans-serif] ${
                      i === 0
                        ? "bg-[#d3b379]/20 text-[#d3b379] border border-[rgba(211,179,121,0.3)]"
                        : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
                    }`}>
                      {i + 1}
                    </div>

                    {/* Player photo */}
                    <motion.div
                      className={`relative shrink-0 rounded-full overflow-hidden border-2 ${
                        i === 0 ? "w-14 h-14 sm:w-16 sm:h-16 border-[rgba(211,179,121,0.3)]" : "w-11 h-11 sm:w-12 sm:h-12 border-[rgba(255,255,255,0.1)]"
                      }`}
                      whileHover={{ scale: 1.1, borderColor: "rgba(211,179,121,0.6)" }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#d3b379]/10" />
                      {entry.player.foto ? (
                        <img src={entry.player.foto} alt={entry.player.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                          <Users size={i === 0 ? 20 : 16} className="text-white/20" />
                        </div>
                      )}
                    </motion.div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-white font-['Anton',sans-serif] tracking-wide truncate ${
                        i === 0 ? "text-lg sm:text-xl" : "text-base"
                      }`}>
                        {entry.player.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/30 font-['Roboto',sans-serif] text-[10px] tracking-[0.15em]">
                          #{entry.player.numero} · {entry.player.posicao}
                        </span>
                        <span className="text-white/15 font-['Roboto',sans-serif] text-[9px]">·</span>
                        <span className="text-white/20 font-['Roboto',sans-serif] text-[9px] flex items-center gap-1">
                          <Calendar size={8} />
                          {entry.nextBirthday.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    </div>

                    {/* Days counter */}
                    <div className="shrink-0 text-center">
                      {entry.daysUntil === 0 ? (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <p className="text-[#d3b379] font-['Anton',sans-serif] text-xl sm:text-2xl leading-none">HOJE</p>
                          <p className="text-[#d3b379]/60 font-['Roboto',sans-serif] text-[8px] tracking-wider mt-0.5">
                            {entry.age} anos
                          </p>
                        </motion.div>
                      ) : (
                        <>
                          <motion.p
                            className={`text-[#d3b379] font-['Anton',sans-serif] leading-none ${
                              i === 0 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
                            }`}
                            whileHover={{ scale: 1.15, textShadow: "0 0 20px rgba(211,179,121,0.4)" }}
                          >
                            {entry.daysUntil}
                          </motion.p>
                          <p className="text-white/25 font-['Roboto',sans-serif] text-[8px] tracking-[0.2em] uppercase mt-0.5">
                            {entry.daysUntil === 1 ? "dia" : "dias"}
                          </p>
                          <p className="text-white/15 font-['Roboto',sans-serif] text-[7px] tracking-wider mt-0.5">
                            faz {entry.age}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Notícias ═══ */}
      {news.length > 0 && (() => {
        const sortedNews = [...news].sort((a, b) => {
          const parseDate = (d: string) => {
            const parts = d.split("/");
            if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
            return 0;
          };
          return parseDate(b.data) - parseDate(a.data);
        });
        const latestNews = sortedNews.slice(0, 3);

        return (
          <section className="py-12 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d3b379] to-[#b8964a] flex items-center justify-center shadow-[0_4px_12px_rgba(211,179,121,0.3)]">
                    <Newspaper className="w-5 h-5 text-[#0b0b0b]" />
                  </div>
                </div>
                <h2 className="font-['Anton',sans-serif] text-white text-3xl sm:text-4xl tracking-wider mb-2">
                  NOTÍCIAS
                </h2>
                <p className="text-white/30 font-['Roboto',sans-serif] text-sm">
                  Fique por dentro do que acontece no clube
                </p>
              </motion.div>

              {/* News Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {latestNews.map((item: any, i: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -8 }}
                  >
                    <Link
                      to="/noticias"
                      className="block bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0a0a0a] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] hover:border-[rgba(211,179,121,0.3)] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(211,179,121,0.1)] group"
                    >
                      {/* Image */}
                      {item.imagem && (
                        <div className="h-48 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                          <img
                            src={item.imagem}
                            alt={item.titulo}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          {item.destaque && (
                            <div className="absolute top-3 right-3 z-20">
                              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#d3b379] to-[#b8964a] text-[#0b0b0b] font-['Roboto',sans-serif] text-[8px] tracking-[0.2em] uppercase font-bold shadow-[0_2px_8px_rgba(211,179,121,0.4)]">
                                ★ Destaque
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-5">
                        {/* Category */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-full bg-[rgba(211,179,121,0.08)] border border-[rgba(211,179,121,0.15)] text-[#d3b379]/80 font-['Roboto',sans-serif] text-[8px] tracking-[0.15em] font-medium">
                            {item.categoria}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-['Anton',sans-serif] text-white text-lg sm:text-xl tracking-wide mb-2.5 group-hover:text-[#d3b379] transition-colors leading-tight line-clamp-2">
                          {item.titulo}
                        </h3>

                        {/* Summary */}
                        <p className="font-['Montserrat',sans-serif] text-white/45 text-xs leading-relaxed mb-4 line-clamp-3">
                          {item.resumo}
                        </p>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-white/25">
                          <div className="w-7 h-7 rounded-lg bg-[#d3b379]/8 flex items-center justify-center">
                            <Calendar size={12} className="text-[#d3b379]/60" />
                          </div>
                          <span className="font-['Roboto',sans-serif] text-[10px] tracking-wider">{item.data}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* See all button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex justify-center"
              >
                <Link
                  to="/noticias"
                  className="group flex items-center gap-2 px-6 py-3 rounded-full border border-[rgba(211,179,121,0.2)] bg-[#d3b379]/[0.06] text-[#d3b379] font-['Roboto',sans-serif] text-xs tracking-[0.15em] uppercase font-semibold hover:bg-[#d3b379]/[0.12] hover:border-[rgba(211,179,121,0.4)] hover:shadow-[0_0_20px_rgba(211,179,121,0.15)] transition-all"
                >
                  Ver todas as notícias
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </section>
        );
      })()}

      {/* ═══ Highlight Stats Cards ═══ */}
      <section className="py-16 px-4 sm:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-white/30 font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-8"
          >
            Destaques Individuais
          </motion.p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              topScorer && { data: topScorer, icon: <Crosshair size={11} className="text-[#d3b379]" />, label: "Artilheiro", stat: topScorer.totalGols, statLabel: "Gols" },
              topAssister && { data: topAssister, icon: <Users size={11} className="text-[#d3b379]" />, label: "Assistências", stat: topAssister.totalAssist, statLabel: "Assistências" },
              topGames && { data: topGames, icon: <Gamepad2 size={11} className="text-[#d3b379]" />, label: "Mais Jogos", stat: topGames.totalJogos, statLabel: "Jogos" },
              topDefesas && { data: topDefesas, icon: <Shield size={11} className="text-[#d3b379]" />, label: "Paredão", stat: topDefesas.totalDefesas, statLabel: "Defesas" },
              topMVP && { data: topMVP, icon: <Star size={11} className="text-[#d3b379]" />, label: "Maior MVP", stat: topMVP.totalMVP, statLabel: "Vezes MVP" },
            ].filter(Boolean).map((item: any, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 }}
                className="h-full"
              >
                <GradientBorderCard>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="cursor-default h-full"
                  >
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />

                    <div className="p-4 sm:p-5 flex flex-col items-center text-center relative z-10 h-full">
                      <div className="flex items-center gap-1 mb-3 sm:mb-4">
                        {item.icon}
                        <span className="text-[#d3b379] font-['Roboto',sans-serif] text-[8px] sm:text-[9px] tracking-[0.2em] uppercase">{item.label}</span>
                      </div>

                      <motion.div
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 mb-3"
                        style={{ borderColor: "rgba(211,179,121,0.3)" }}
                        whileHover={{ scale: 1.1, borderColor: "rgba(211,179,121,0.6)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#d3b379]/10" />
                        {item.data.foto ? (
                          <img src={item.data.foto} alt={item.data.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                            <Users size={22} className="text-white/20" />
                          </div>
                        )}
                      </motion.div>

                      <p className="text-white font-['Anton',sans-serif] text-sm sm:text-base tracking-wide mb-0.5 line-clamp-1">{item.data.nome}</p>
                      <p className="text-white/30 font-['Roboto',sans-serif] text-[8px] sm:text-[9px] tracking-[0.12em] uppercase mb-3 sm:mb-4">#{item.data.numero} · {item.data.posicao}</p>

                      <motion.p
                        className="text-[#d3b379] font-['Anton',sans-serif] text-4xl sm:text-5xl leading-none"
                        whileHover={{ scale: 1.15, textShadow: "0 0 20px rgba(211,179,121,0.4)" }}
                      >
                        {item.stat}
                      </motion.p>
                      <p className="text-white/30 font-['Roboto',sans-serif] text-[8px] sm:text-[9px] tracking-[0.15em] uppercase mt-1 mb-3">{item.statLabel}</p>

                      <div className="h-px w-10 bg-gradient-to-r from-transparent via-[#d3b379]/20 to-transparent mb-3 mt-auto" />

                      <div className="text-white/25">
                        <span className="font-['Roboto',sans-serif] text-[9px] sm:text-[10px]">{item.data.totalJogos} jogos</span>
                      </div>
                    </div>
                  </motion.div>
                </GradientBorderCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Elenco Preview (draggable carousel) ═══ */}
      <section className="py-16 px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">NOSSO TIME</p>
              <h2 className="font-['Anton',sans-serif] text-white text-4xl sm:text-6xl">ELENCO</h2>
            </motion.div>
            <Link
              to="/elenco"
              className="flex items-center gap-2 text-[#d3b379] font-['Roboto',sans-serif] text-xs tracking-wider hover:gap-3 transition-all group"
            >
              Ver todos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Progress dots for carousel */}
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: Math.min(maxIndex + 1, 10) }, (_, i) => (
              <motion.div
                key={i}
                className="h-1 rounded-full cursor-pointer"
                animate={{
                  width: i === carouselIndex ? 16 : 6,
                  backgroundColor: i === carouselIndex ? "#d3b379" : "rgba(255,255,255,0.1)",
                }}
                transition={{ duration: 0.3 }}
                onClick={() => setCarouselIndex(i)}
              />
            ))}
          </div>

          {/* Carousel with flanking arrows */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Left Arrow */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={scrollLeft}
              disabled={carouselIndex === 0}
              className="hidden sm:flex shrink-0 w-10 h-10 rounded-full border border-[#222] items-center justify-center text-white/40 hover:text-[#d3b379] hover:border-[rgba(211,179,121,0.4)] hover:bg-[#d3b379]/5 transition-all disabled:opacity-20 disabled:hover:text-white/40 disabled:hover:border-[#222] disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              <ChevronLeft size={18} />
            </motion.button>

            <div
              ref={carouselRef}
              className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none min-w-0"
              onMouseDown={handleDragStart}
              onMouseMove={isDragging ? handleDragMove : undefined}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={isDragging ? handleDragMove : undefined}
              onTouchEnd={handleDragEnd}
            >
              <motion.div
                className="flex gap-3 sm:gap-4"
                animate={{ x: `-${carouselIndex * (100 / visibleCount + 0.8)}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {playersWithPhoto.map((p, i) => (
                  <motion.div
                    key={p.id}
                    className="w-[48%] sm:w-[32%] lg:w-[calc(20%-0.8rem)] shrink-0"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  >
                    <PlayerCard player={p} onClick={setSelectedPlayer} />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Arrow */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={scrollRight}
              disabled={carouselIndex >= maxIndex}
              className="hidden sm:flex shrink-0 w-10 h-10 rounded-full border border-[#222] items-center justify-center text-white/40 hover:text-[#d3b379] hover:border-[rgba(211,179,121,0.4)] hover:bg-[#d3b379]/5 transition-all disabled:opacity-20 disabled:hover:text-white/40 disabled:hover:border-[#222] disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ═══ Recent Matches ═══ */}
      <section className="py-16 px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">RESULTADOS</p>
              <h2 className="font-['Anton',sans-serif] text-white text-4xl sm:text-6xl">PARTIDAS</h2>
            </motion.div>
            <Link
              to="/partidas"
              className="flex items-center gap-2 text-[#d3b379] font-['Roboto',sans-serif] text-xs tracking-wider hover:gap-3 transition-all group"
            >
              Ver todas <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matches
              .filter((m) => !isFutureMatch(m))
              .slice(-6)
              .reverse()
              .map((m, i) => {
                const result = getMatchResult(m);
                const adversario = m.equipeCasa === "Sadock FC" ? m.equipeFora : m.equipeCasa;
                const resultColor = result === "V" ? "emerald" : result === "D" ? "red" : "amber";
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="bg-[#151515] rounded-xl p-4 border border-[#1e1e1e] hover:border-[rgba(211,179,121,0.2)] transition-all cursor-default group relative overflow-hidden"
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#d3b379]/0 to-[#d3b379]/0 group-hover:from-[#d3b379]/[0.02] group-hover:to-transparent transition-all duration-500" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#d3b379] text-[10px] tracking-wider font-['Roboto',sans-serif]">{m.competicao}</span>
                        <motion.span
                          className={`text-[10px] tracking-wider font-['Roboto',sans-serif] px-2 py-0.5 rounded-full ${
                            result === "V"
                              ? "text-emerald-400 bg-emerald-400/10"
                              : result === "D"
                              ? "text-red-400 bg-red-400/10"
                              : "text-amber-400 bg-amber-400/10"
                          }`}
                          whileHover={{ scale: 1.1 }}
                        >
                          {m.wo ? (result === "V" ? "W.O. ✓" : "W.O.") : result === "V" ? "VITÓRIA" : result === "D" ? "DERROTA" : "EMPATE"}
                        </motion.span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-xs font-['Roboto',sans-serif]">Sadock FC</span>
                        <span className="font-['Anton',sans-serif] text-lg text-white">
                          {m.wo ? 'W.O.' : <>{getSadockScore(m)} <span className="text-white/20 text-sm mx-1">x</span> {getAdversarioScore(m)}</>}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0 justify-end">
                          <span className="text-white/40 text-xs font-['Roboto',sans-serif] truncate max-w-[70px] text-right">{adversario}</span>
                          {(m as any).adversarioLogo && (
                            <img src={(m as any).adversarioLogo} alt={adversario} className="w-5 h-5 rounded object-contain shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Extra info on hover */}
                      <motion.div
                        initial={false}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-1 mt-2 text-white/20">
                          <MapPin size={10} />
                          <span className="text-[10px] font-['Roboto',sans-serif] truncate">{m.local}</span>
                        </div>
                        {m.golsSadock && (
                          <div className="mt-2 pt-2 border-t border-white/[0.04]">
                            <div className="flex items-start gap-1.5">
                              <Swords size={9} className="text-[#d3b379]/40 mt-0.5 shrink-0" />
                              <p className="text-white/20 font-['Roboto',sans-serif] text-[9px] leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                {m.golsSadock}
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-10 px-4 text-center">
        <motion.img
          src={imgLogo}
          alt="Sadock FC"
          className="h-10 mx-auto mb-5 opacity-40"
          whileHover={{ opacity: 0.7, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        />

        {/* Redes Sociais */}
        <div className="flex items-center justify-center gap-5 mb-5">
          <motion.a
            href="https://www.instagram.com/sadockfc/?hl=pt-br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/30 hover:text-[#d3b379] transition-colors"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Instagram size={18} />
            <span className="font-['Roboto',sans-serif] text-[11px] tracking-wider">@sadockfc</span>
          </motion.a>

          <div className="w-px h-4 bg-white/10" />

          <motion.a
            href="https://www.tiktok.com/@sadockfc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/30 hover:text-[#d3b379] transition-colors"
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
            <span className="font-['Roboto',sans-serif] text-[11px] tracking-wider">@sadockfc</span>
          </motion.a>
        </div>

        <p className="text-white/20 font-['Roboto',sans-serif] text-[10px] tracking-[0.2em]">
          SADOCK FC &copy; 2026 · TODOS OS DIREITOS RESERVADOS
        </p>
      </footer>

      {/* Player Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerModal player={selectedPlayer} matches={matches} onClose={() => setSelectedPlayer(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}