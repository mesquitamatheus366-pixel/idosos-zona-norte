// New player photos (explicitly named)
import imgYuriDePaula from "figma:asset/61d0ce58e14f74ec17e19e77e27cfdb3331d716b.png";
import imgMatheusRego from "figma:asset/208864519e3004678961d724b2d220f8f50c7329.png";
import imgMatheusMesquita from "figma:asset/cd50ed2e43930354b66a72b1576ea07d9d3d0edf.png";
import imgLucasAurnheimer from "figma:asset/699b6768936b0645155f5ba06de5e3f18000b188.png";

// Original player photos (from first design)
import imgArthurPetrone from "figma:asset/5015cbbad8c38400832f363672e93b21de6c320b.png";
import imgAndreyGomes from "figma:asset/1f8241c4eb73b223af61565b58de11f8cf09bd79.png";
import imgCoutinho from "figma:asset/9c2cffb7055a146616837f190aa6e520c19c7e23.png";
import imgDayvidCoelho from "figma:asset/2aec0f04c5865ebf41e0315ba1c965806328f879.png";
import imgHugoDortas from "figma:asset/e6b3f2ed047e0934856cc362292091ea7885b668.png";
import imgHenriqueLima from "figma:asset/65eaba53ed9515587832f1e6ca318232ea4647ac.png";
import imgFabricioVieira from "figma:asset/d7c74d2f9a832e3fc215a34c3813c176e976c221.png";

// New photos added
import imgLeandroOscar from "figma:asset/f05085536878f0c2082e96d3cf414764712a28ce.png";
import imgJorgeRibeiro from "figma:asset/b20a4917e3a1076fd3c1d94af4b35c3417cbcc2c.png";
import imgJonathanLima from "figma:asset/86909f062c750ac97e704b363c2aefb8ffa297df.png";
import imgJoaoPedro from "figma:asset/5dfd9e662c17e8c1b6ae0f4d8a67321f392777eb.png";
import imgJhonMarques from "figma:asset/2aa8c5d86e6d6d6d98ca6c160b9f129922a4de3e.png";
import imgHugoDortasNew from "figma:asset/8b5aa6a0e932f2fb86d00ed811a35796a6c992d2.png";

export interface SeasonStats {
  jogos: number;
  gols: number;
  assistencias: number;
  defesas?: number;
  mvp: number;
}

export interface Player {
  id: string;
  nome: string;
  posicao: string;
  numero: number;
  foto: string | null;
  instagram?: string;
  aniversario?: string; // formato "DD/MM/AAAA"
  ativo?: boolean; // default true — jogadores inativos não aparecem no site público
  exJogador?: boolean; // se true e ativo=false, aparece em "Passaram pelo Clube"
  stats: {
    "2024": SeasonStats;
    "2025": SeasonStats;
    "2026": SeasonStats;
  };
}

export const players: Player[] = [
  {
    id: "1",
    nome: "Erik Mello",
    posicao: "Goleiro",
    numero: 1,
    foto: imgHugoDortas,
    instagram: "erikeykire",
    aniversario: "02/07/2000",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, defesas: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, defesas: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, defesas: 0, mvp: 0 },
    },
  },
  {
    id: "3",
    nome: "Jhon Marques",
    posicao: "Fixo",
    numero: 4,
    foto: imgJhonMarques,
    instagram: "jhonatanmarques98",
    aniversario: "28/06/1998",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "4",
    nome: "Yuri De Paula",
    posicao: "Ala",
    numero: 5,
    foto: imgYuriDePaula,
    instagram: "yuri.dplima",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "5",
    nome: "Matheus Rego",
    posicao: "Fixo",
    numero: 17,
    foto: imgMatheusRego,
    instagram: "msrego17",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "6",
    nome: "Matheus Mesquita",
    posicao: "Meio",
    numero: 8,
    foto: imgMatheusMesquita,
    instagram: "mesquitamatth",
    aniversario: "06/01/2000",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "7",
    nome: "Lucas Aurnheimer",
    posicao: "Pivô",
    numero: 9,
    foto: imgLucasAurnheimer,
    instagram: "lucas_aur1",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "8",
    nome: "Leandro Oscar",
    posicao: "Meio",
    numero: 10,
    foto: imgLeandroOscar,
    instagram: "l22andro",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "9",
    nome: "Hugo Dortas",
    posicao: "Meio",
    numero: 11,
    foto: imgHugoDortasNew,
    instagram: "hugodortas",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "10",
    nome: "Dayvid Coelho",
    posicao: "Pivô",
    numero: 12,
    foto: imgDayvidCoelho,
    instagram: "dayvid.coelho",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },


  {
    id: "13",
    nome: "Henrique Lima",
    posicao: "Ala",
    numero: 20,
    foto: imgHenriqueLima,
    instagram: "henri.clima",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "14",
    nome: "Edgar Marins",
    posicao: "Goleiro",
    numero: 25,
    foto: null,
    instagram: "crf_edgar.r",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, defesas: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, defesas: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, defesas: 0, mvp: 0 },
    },
  },
  {
    id: "15",
    nome: "Jonathan Lima",
    posicao: "Pivô",
    numero: 99,
    foto: imgJonathanLima,
    instagram: "joutro_mundo",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "16",
    nome: "Fabricio Vieira",
    posicao: "Fixo",
    numero: 23,
    foto: imgFabricioVieira,
    instagram: "fbzada",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "17",
    nome: "Andrey Gomes",
    posicao: "Meio",
    numero: 47,
    foto: imgAndreyGomes,
    instagram: "andreygomes04",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "18",
    nome: "Joao Pedro",
    posicao: "Ala",
    numero: 77,
    foto: imgJoaoPedro,
    instagram: "ofcjp5_",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "19",
    nome: "Arthur Petrone",
    posicao: "Ala",
    numero: 13,
    foto: imgArthurPetrone,
    instagram: "_petronee",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "20",
    nome: "Ramon Tertuliano",
    posicao: "Pivô",
    numero: 97,
    foto: null,
    instagram: "tertulianoramon",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
  {
    id: "21",
    nome: "Coutinho",
    posicao: "Meio",
    numero: 22,
    foto: imgCoutinho,
    instagram: "coutiin_10",
    stats: {
      "2024": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2025": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
      "2026": { jogos: 0, gols: 0, assistencias: 0, mvp: 0 },
    },
  },
];

export function getPlayerStats(player: Player, season: string): SeasonStats {
  const empty: SeasonStats = { jogos: 0, gols: 0, assistencias: 0, mvp: 0 };
  if (!player?.stats) return empty;
  
  if (season === "all") {
    const all: SeasonStats = { jogos: 0, gols: 0, assistencias: 0, mvp: 0 };
    if (player.posicao === "Goleiro") all.defesas = 0;
    (["2024", "2025", "2026"] as const).forEach((s) => {
      const ss = player.stats?.[s];
      if (!ss) return;
      all.jogos += ss.jogos || 0;
      all.gols += ss.gols || 0;
      all.assistencias += ss.assistencias || 0;
      all.mvp += ss.mvp || 0;
      if (player.posicao === "Goleiro" && ss.defesas != null) {
        all.defesas = (all.defesas || 0) + ss.defesas!;
      }
    });
    return all;
  }
  return player.stats[season as "2024" | "2025" | "2026"] || empty;
}

export type BirthdayEntry = { player: Player; nextBirthday: Date; daysUntil: number; age: number };

export function getNextBirthdayPlayers(count = 3): BirthdayEntry[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  const playersWithBirthday = players.filter((p) => p.aniversario);
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