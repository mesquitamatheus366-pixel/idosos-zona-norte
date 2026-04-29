import { User, Crown } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { Player } from "../data/players";

// ─── Gold particle canvas ───────────────────────────────────────────
function GoldParticles({ hovered }: { hovered: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const hoveredRef = useRef(hovered);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const count = 14;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      baseR: 0.6 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.07,
      baseVy: -(0.05 + Math.random() * 0.1),
      baseOpacity: 0.025 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
    }));

    let intensity = 0;

    const draw = (t: number) => {
      const target = hoveredRef.current ? 1 : 0;
      intensity += (target - intensity) * 0.04;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        const speed = 1 + intensity * 0.8;
        p.x += (p.vx * speed) / w;
        p.y += (p.baseVy * speed) / h;

        if (p.y < -0.05) {
          p.y = 1.05;
          p.x = Math.random();
        }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        const flicker = 0.7 + 0.3 * Math.sin(t * 0.001 + p.phase);
        const alpha = p.baseOpacity * flicker * (1 + intensity * 3);
        const radius = p.baseR * (1 + intensity * 0.5);

        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(211,179,121,${alpha})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
    />
  );
}

// ─── 3D tilt hook (desktop only) ───────────────────────────────────
function use3DTilt(maxTilt = 8) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>(0);
  const [hovered, setHovered] = useState(false);

  // Current smoothed values
  const current = useRef({ rx: 0, ry: 0, mx: 0.5, my: 0.5, scale: 1 });
  // Target values
  const target = useRef({ rx: 0, ry: 0, mx: 0.5, my: 0.5, scale: 1 });
  // Is desktop
  const isDesktop = useRef(true);

  useEffect(() => {
    isDesktop.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  const onMove = useCallback(
    (e: ReactMouseEvent) => {
      if (!cardRef.current || !isDesktop.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0-1
      const y = (e.clientY - rect.top) / rect.height; // 0-1
      target.current.ry = (x - 0.5) * maxTilt * 2; // left-right
      target.current.rx = -(y - 0.5) * maxTilt * 2; // up-down
      target.current.mx = x;
      target.current.my = y;
    },
    [maxTilt]
  );

  const onEnter = useCallback(() => {
    if (!isDesktop.current) return;
    setHovered(true);
    target.current.scale = 1.03;
  }, []);

  const onLeave = useCallback(() => {
    if (!isDesktop.current) return;
    setHovered(false);
    target.current = { rx: 0, ry: 0, mx: 0.5, my: 0.5, scale: 1 };
  }, []);

  // Smooth animation loop
  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = 0.08;

    const animate = () => {
      const c = current.current;
      const t = target.current;
      c.rx = lerp(c.rx, t.rx, ease);
      c.ry = lerp(c.ry, t.ry, ease);
      c.mx = lerp(c.mx, t.mx, ease);
      c.my = lerp(c.my, t.my, ease);
      c.scale = lerp(c.scale, t.scale, ease);

      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(800px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale3d(${c.scale},${c.scale},1)`;
      }

      // Update CSS custom properties for the light reflection
      if (cardRef.current) {
        cardRef.current.style.setProperty("--light-x", `${c.mx * 100}%`);
        cardRef.current.style.setProperty("--light-y", `${c.my * 100}%`);
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { cardRef, hovered, onMove, onEnter, onLeave };
}

// ─── Captain config ─────────────────────────────────────────────────
const CAPTAIN_MAP: Record<string, { rank: number; label: string }> = {
  "3": { rank: 1, label: "1º CAPITÃO" },
  "16": { rank: 2, label: "2º CAPITÃO" },
  "14": { rank: 3, label: "3º CAPITÃO" },
};

// ─── Player Card ────────────────────────────────────────────────────
interface PlayerCardProps {
  player: Player;
  onClick: (player: Player) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (playerId: string) => void;
}

export function PlayerCard({ player, onClick, selectionMode = false, isSelected = false, onToggleSelect }: PlayerCardProps) {
  const { cardRef, hovered, onMove, onEnter, onLeave } = use3DTilt(7);
  const captain = CAPTAIN_MAP[player.id];

  const handleClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(player.id);
    } else {
      onClick(player);
    }
  };

  return (
    <div className="[perspective:1000px]">
      <button
        ref={cardRef}
        onClick={handleClick}
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        className={`group relative bg-gradient-to-b from-[#1c1c1c] to-[#111] rounded-2xl overflow-hidden cursor-pointer w-full text-left transition-[border-color,box-shadow] duration-700 ease-out ${
          isSelected
            ? "border-2 border-[#d3b379] shadow-[0_4px_20px_rgba(211,179,121,0.3),0_0_0_3px_rgba(211,179,121,0.2)] hover:shadow-[0_20px_70px_rgba(211,179,121,0.35),0_8px_30px_rgba(0,0,0,0.5)]"
            : captain
            ? "border-2 border-[#d3b379]/40 shadow-[0_4px_20px_rgba(211,179,121,0.15)] hover:border-[#d3b379]/70 hover:shadow-[0_20px_70px_rgba(211,179,121,0.25),0_8px_30px_rgba(0,0,0,0.5)]"
            : "border border-[#222] shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-[#d3b379]/50 hover:shadow-[0_20px_70px_rgba(211,179,121,0.18),0_8px_30px_rgba(0,0,0,0.5)]"
        }`}
      >
        {/* Selection checkbox */}
        {selectionMode && (
          <div className={`absolute top-3 right-3 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? 'bg-[#d3b379] shadow-[0_0_12px_rgba(211,179,121,0.5)]'
              : 'bg-white/10 border border-white/20 backdrop-blur-sm'
          }`}>
            {isSelected && (
              <svg className="w-4 h-4 text-[#0b0b0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}

        {/* Captain badge */}
        {captain && !selectionMode && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-gradient-to-r from-[#d3b379] to-[#b8964a] px-2.5 py-1 rounded-full shadow-[0_2px_10px_rgba(211,179,121,0.4)]">
            <Crown size={10} className="text-[#0b0b0b]" />
            <span className="font-['Roboto',sans-serif] text-[8px] font-bold tracking-[0.15em] text-[#0b0b0b]">
              {captain.label}
            </span>
          </div>
        )}

        {/* Large jersey number watermark — sits behind everything */}
        <div
          className="absolute top-2 right-3 font-['Anton',sans-serif] text-[72px] text-white/[0.04] leading-none select-none pointer-events-none transition-all duration-700 group-hover:text-white/[0.07]"
          style={{ transform: "translateZ(5px)" }}
        >
          {player.numero}
        </div>

        {/* Photo area with layered depth */}
        <div className="aspect-[3/4] overflow-hidden bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] relative">
          {/* Layer 1: Gold glow behind player */}
          <div className="absolute inset-0 z-[2] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[90%] h-[80%] rounded-full bg-[#d3b379]/[0.12] blur-[50px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[35%] w-[60%] h-[50%] rounded-full bg-[#d3b379]/[0.09] blur-[30px]" />
          </div>

          {/* Layer 2: Floating gold particles */}
          <GoldParticles hovered={hovered} />

          {/* Layer 3: Player image */}
          {player.foto ? (
            <img
              src={player.foto}
              alt={player.nome}
              className="relative z-[2] w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-110"
            />
          ) : (
            <div className="relative z-[2] w-full h-full flex items-center justify-center">
              <User size={64} className="text-[#333]" />
            </div>
          )}

          {/* Layer 4: Bottom gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-90 z-[3]" />

          {/* Layer 5: Cursor-tracking light reflection */}
          <div
            className="absolute inset-0 z-[4] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "radial-gradient(circle 180px at var(--light-x, 50%) var(--light-y, 50%), rgba(211,179,121,0.12) 0%, rgba(211,179,121,0.04) 40%, transparent 70%)",
            }}
          />
        </div>

        {/* Info bar */}
        <div className="p-4 relative -mt-14 z-10">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.2em] uppercase mb-1 opacity-80">
                {player.posicao}
              </p>
              <p className="text-white font-['Roboto',sans-serif] text-sm sm:text-base truncate">
                {player.nome}
              </p>
            </div>
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-['Anton',sans-serif] text-lg sm:text-xl shrink-0 ml-2 ${
                captain
                  ? "bg-gradient-to-br from-[#d3b379] to-[#a08340] text-[#0b0b0b] shadow-[0_4px_16px_rgba(211,179,121,0.45),0_0_20px_rgba(211,179,121,0.15)]"
                  : "bg-gradient-to-br from-[#d3b379] to-[#b8964a] text-[#0b0b0b] shadow-[0_4px_12px_rgba(211,179,121,0.3)]"
              }`}
            >
              {player.numero}
            </div>
          </div>
        </div>

        {/* Captain bottom glow */}
        {captain && (
          <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none z-[5] bg-gradient-to-t from-[#d3b379]/[0.06] to-transparent" />
        )}

        {/* Full-card gold overlay on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-t from-[#d3b379]/10 via-[#d3b379]/3 to-transparent" />

        {/* Edge shine on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none shadow-[inset_0_1px_0_rgba(211,179,121,0.12),inset_0_0_20px_rgba(211,179,121,0.04)]" />

        {/* Top-edge specular highlight that follows cursor */}
        <div
          className="absolute inset-x-0 top-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(211,179,121,0.25) var(--light-x, 50%), transparent)",
          }}
        />
      </button>
    </div>
  );
}