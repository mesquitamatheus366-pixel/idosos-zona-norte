import { motion } from "motion/react";

export interface Skills {
  ritmo: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
}

const LABELS: { key: keyof Skills; label: string }[] = [
  { key: "ritmo", label: "RIT" },
  { key: "finalizacao", label: "FIN" },
  { key: "passe", label: "PAS" },
  { key: "drible", label: "DRI" },
  { key: "defesa", label: "DEF" },
  { key: "fisico", label: "FIS" },
];

const CENTER = 100;
const MAX_R = 70;
const RINGS = [0.25, 0.5, 0.75, 1];

function getPoint(index: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  const r = (value / 99) * MAX_R;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

function getRingPoints(fraction: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = fraction * MAX_R;
    return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
  }).join(" ");
}

function getStatColor(val: number): string {
  if (val >= 80) return "#22c55e";
  if (val >= 65) return "#d3b379";
  if (val >= 50) return "#eab308";
  return "#ef4444";
}

interface SkillsRadarProps {
  skills: Skills;
}

export function SkillsRadar({ skills }: SkillsRadarProps) {
  const points = LABELS.map((l, i) => getPoint(i, skills[l.key]));
  const polygonPoints = points.map(([x, y]) => `${x},${y}`).join(" ");
  const zeroPoints = LABELS.map((_, i) => `${CENTER},${CENTER}`).join(" ");

  const overall = Math.round(
    Object.values(skills).reduce((a, b) => a + b, 0) / 6
  );

  return (
    <div className="relative">
      {/* Overall badge */}
      <motion.div
        className="absolute -top-2 -right-1 z-10"
        initial={{ opacity: 0, scale: 0, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 3 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 400, damping: 12 }}
      >
        <motion.div
          className="bg-gradient-to-br from-[#d3b379] to-[#9a7b3f] w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_2px_12px_rgba(211,179,121,0.4)]"
          whileHover={{ scale: 1.15, rotate: 8 }}
          animate={{ boxShadow: ["0 2px 12px rgba(211,179,121,0.3)", "0 2px 20px rgba(211,179,121,0.6)", "0 2px 12px rgba(211,179,121,0.3)"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="font-['Anton',sans-serif] text-[#0b0b0b] text-lg leading-none">{overall}</span>
        </motion.div>
      </motion.div>

      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background rings with stagger */}
        {RINGS.map((r, i) => (
          <motion.polygon
            key={r}
            points={getRingPoints(r)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            style={{ transformOrigin: "100px 100px" }}
          />
        ))}

        {/* Axis lines with stagger */}
        {LABELS.map((_, i) => {
          const [x, y] = getPoint(i, 99);
          return (
            <motion.line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
            />
          );
        })}

        {/* Filled area - morphs from center */}
        <motion.polygon
          initial={{ points: zeroPoints, opacity: 0 }}
          animate={{ points: polygonPoints, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          fill="rgba(211,179,121,0.12)"
          stroke="#d3b379"
          strokeWidth="1.5"
        />

        {/* Outer glow polygon */}
        <motion.polygon
          initial={{ points: zeroPoints, opacity: 0 }}
          animate={{ points: polygonPoints, opacity: 0.15 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          fill="none"
          stroke="#d3b379"
          strokeWidth="4"
          filter="url(#glow)"
        />

        {/* SVG filter for glow */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Vertex dots with pulse */}
        {points.map(([x, y], i) => (
          <g key={i}>
            {/* Pulse ring */}
            <motion.circle
              cx={x}
              cy={y}
              fill="none"
              stroke="#d3b379"
              strokeWidth="0.5"
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: [3, 8, 3], opacity: [0, 0.3, 0] }}
              transition={{ delay: 0.9 + i * 0.1, duration: 2, repeat: Infinity, repeatDelay: 2 + i * 0.5 }}
            />
            {/* Dot */}
            <motion.circle
              cx={x}
              cy={y}
              fill="#d3b379"
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: 3, opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.08, type: "spring", stiffness: 500, damping: 15 }}
            />
          </g>
        ))}

        {/* Labels with values - fade in stagger */}
        {LABELS.map((l, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const labelR = MAX_R + 22;
          const lx = CENTER + labelR * Math.cos(angle);
          const ly = CENTER + labelR * Math.sin(angle);
          const val = skills[l.key];
          return (
            <motion.g
              key={l.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.07, duration: 0.3 }}
            >
              <text
                x={lx}
                y={ly - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white/25 text-[7px] tracking-wider"
                style={{ fontFamily: "'Roboto', sans-serif" }}
              >
                {l.label}
              </text>
              <text
                x={lx}
                y={ly + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px]"
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fill: getStatColor(val),
                }}
              >
                {val}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Generate FIFA-like skills based on player position and real stats.
 */
export function generateSkills(
  posicao: string,
  stats: { jogos: number; gols: number; assistencias: number; defesas?: number; mvp: number }
): Skills {
  const bases: Record<string, Skills> = {
    Goleiro: { ritmo: 45, finalizacao: 20, passe: 50, drible: 30, defesa: 82, fisico: 70 },
    Fixo: { ritmo: 58, finalizacao: 48, passe: 65, drible: 55, defesa: 78, fisico: 75 },
    Ala: { ritmo: 78, finalizacao: 68, passe: 62, drible: 75, defesa: 45, fisico: 65 },
    Meio: { ritmo: 68, finalizacao: 60, passe: 72, drible: 70, defesa: 58, fisico: 68 },
    "Pivô": { ritmo: 60, finalizacao: 78, passe: 55, drible: 65, defesa: 40, fisico: 75 },
    Pivo: { ritmo: 60, finalizacao: 78, passe: 55, drible: 65, defesa: 40, fisico: 75 },
  };

  const base = bases[posicao] || bases["Meio"];
  const s = { ...base };

  const jogos = stats.jogos || 1;
  const goalsPerGame = stats.gols / jogos;
  const assistsPerGame = stats.assistencias / jogos;

  s.finalizacao = Math.min(99, Math.round(s.finalizacao + goalsPerGame * 30));
  s.passe = Math.min(99, Math.round(s.passe + assistsPerGame * 35));
  s.drible = Math.min(99, Math.round(s.drible + (goalsPerGame + assistsPerGame) * 12));

  const mvpRate = stats.mvp / jogos;
  if (mvpRate > 0) {
    const mvpBonus = Math.min(8, Math.round(mvpRate * 40));
    s.ritmo = Math.min(99, s.ritmo + mvpBonus);
    s.finalizacao = Math.min(99, s.finalizacao + mvpBonus);
    s.passe = Math.min(99, s.passe + mvpBonus);
    s.drible = Math.min(99, s.drible + mvpBonus);
    s.defesa = Math.min(99, s.defesa + mvpBonus);
    s.fisico = Math.min(99, s.fisico + mvpBonus);
  }

  const expBonus = Math.min(6, Math.round(jogos / 10));
  s.fisico = Math.min(99, s.fisico + expBonus);
  s.defesa = Math.min(99, s.defesa + expBonus);

  if (posicao === "Goleiro" && stats.defesas) {
    const defPerGame = stats.defesas / jogos;
    s.defesa = Math.min(99, Math.round(s.defesa + defPerGame * 10));
    s.ritmo = Math.min(99, Math.round(s.ritmo + defPerGame * 5));
  }

  return s;
}
