export interface PlayerMatchStat {
  playerId: string;
  presente: boolean;
  gols: number;
  assistencias: number;
  defesas: number;
  mvp: boolean;
}

export interface Match {
  id: string;
  data: string;
  competicao: string;
  local: string;
  equipeCasa: string;
  equipeFora: string;
  placarCasa: number;
  placarFora: number;
  temporada: string;
  golsSadock: string;
  assistenciasSadock: string;
  horario?: string;
  adversarioLogo?: string;
  sumula?: PlayerMatchStat[];
  coachPresente?: boolean;
  coachesPresentes?: string[]; // IDs dos treinadores presentes
  wo?: boolean;
  woTipo?: 'sadock' | 'adversario'; // quem ganhou o W.O.
}

export const matches: Match[] = [
  // ===== 2024 =====
  { id: "m1", data: "2024", competicao: "Amistoso", local: "Arena Damitex", equipeCasa: "Fut Resenha", equipeFora: "Sadock FC", placarCasa: 4, placarFora: 1, temporada: "2024", golsSadock: "Dayvid Coelho (1)", assistenciasSadock: "" },
  { id: "m2", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Sape FC", placarCasa: 7, placarFora: 8, temporada: "2024", golsSadock: "Yuri de Paula (1), Leandro Oscar (1), Dayvid Coelho (2)", assistenciasSadock: "Jhon Marques (1)" },
  { id: "m3", data: "2024", competicao: "Amistoso", local: "Mania da Bola", equipeCasa: "Serrinha FC", equipeFora: "Sadock FC", placarCasa: 10, placarFora: 15, temporada: "2024", golsSadock: "Yuri de Paula (3), Jorge Ribeiro (3), Luiz Davi (1), Yuri Cursino (1)", assistenciasSadock: "Leandro Oscar (2), Yuri Cursino (1), Luiz Davi (2), Rodrigo Diguin (1), Yuri de Paula (1), Jhon Marques (2)" },
  { id: "m4", data: "2024", competicao: "Esporte da Sorte", local: "IAPC Cascadura", equipeCasa: "Sadock FC", equipeFora: "Cerberus FC", placarCasa: 0, placarFora: 1, temporada: "2024", golsSadock: "", assistenciasSadock: "" },
  { id: "m5", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Panela de Pressao", placarCasa: 2, placarFora: 0, temporada: "2024", golsSadock: "Lucas Aurnheimer (2)", assistenciasSadock: "Jhon Marques (1)" },
  { id: "m6", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Galatasape FC", placarCasa: 4, placarFora: 3, temporada: "2024", golsSadock: "Leandro Oscar (1), Jorge Ribeiro (2), Jhon Marques (2)", assistenciasSadock: "Leandro Oscar (1), Jorge Ribeiro (1), Jhon Marques (1)" },
  { id: "m7", data: "2024", competicao: "Amistoso", local: "Arena Manet", equipeCasa: "Sadock FC", equipeFora: "FJU Del Castilho", placarCasa: 4, placarFora: 2, temporada: "2024", golsSadock: "Lucas Aurnheimer (1), Leandro Oscar (1), Yuri de Paula (2)", assistenciasSadock: "Yuri de Paula (1), Luiz Davi (2)" },
  { id: "m8", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Juventus Madu", equipeFora: "Sadock FC", placarCasa: 3, placarFora: 11, temporada: "2024", golsSadock: "Leandro Oscar (2), Lucas Aurnheimer (2), Yuri Cursino (2), Yuri de Paula (2), Jhon Marques (2)", assistenciasSadock: "Jhon Marques (1), Rodrigo Diguin (2), Yuri de Paula (1), Leandro Oscar (2), Lucas Aurnheimer (1)" },
  { id: "m9", data: "2024", competicao: "Amistoso", local: "IAPC Cascadura", equipeCasa: "Cerberus FC", equipeFora: "Sadock FC", placarCasa: 5, placarFora: 4, temporada: "2024", golsSadock: "Yuri de Paula (1), Rodrigo Diguin (1), Jhon Marques (2)", assistenciasSadock: "Jhon Marques (1), Rodrigo Diguin (1), Yuri de Paula (1)" },
  { id: "m10", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Juventus Madu", equipeFora: "Sadock FC", placarCasa: 3, placarFora: 3, temporada: "2024", golsSadock: "Dayvid Coelho (2)", assistenciasSadock: "Rodrigo Diguin (1), Dayvid Coelho (1)" },
  { id: "m11", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Meninos de Ouro", placarCasa: 5, placarFora: 3, temporada: "2024", golsSadock: "Yuri Cursino (1), Henrique Lima (1), Yuri de Paula (1), Jhon Marques (2)", assistenciasSadock: "Yuri de Paula (1), Jhon Marques (1)" },
  { id: "m12", data: "2024", competicao: "Amistoso", local: "Arena Obstinado", equipeCasa: "IEC Cordovil", equipeFora: "Sadock FC", placarCasa: 13, placarFora: 11, temporada: "2024", golsSadock: "Jhon Marques (2), Yuri de Paula (2), Jorge Ribeiro (1), Leandro Oscar (1), Lucas Aurnheimer (1), Jonathan Lima (1)", assistenciasSadock: "Jhon Marques (1), Yuri de Paula (1), Jorge Ribeiro (1), Leandro Oscar (2), Dayvid Coelho (1)" },
  { id: "m13", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Cerberus FC", placarCasa: 4, placarFora: 4, temporada: "2024", golsSadock: "Dayvid Coelho (1), Yuri de Paula (2), Rodrigo Diguin (1)", assistenciasSadock: "Jhon Marques (2)" },
  { id: "m14", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Uniao e Gelo FC", placarCasa: 8, placarFora: 6, temporada: "2024", golsSadock: "Dayvid Coelho (2), Henrique Lima (2), Rodrigo Diguin (1), Yuri de Paula (2)", assistenciasSadock: "Dayvid Coelho (1), Luiz Davi (2), Jorge Ribeiro (1), Rodrigo Diguin (1), Yuri de Paula (1), Jhon Marques (2)" },
  { id: "m15", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Inter de Litrao FC", placarCasa: 3, placarFora: 4, temporada: "2024", golsSadock: "Dayvid Coelho (1), Henrique Lima (1), Rodrigo Diguin (1)", assistenciasSadock: "Jonathan Lima (2), Dayvid Coelho (1), Rodrigo Diguin (1)" },
  { id: "m16", data: "2024", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Racing FC", placarCasa: 6, placarFora: 0, temporada: "2024", golsSadock: "Dayvid Coelho (2), Jonathan Lima (1), Leandro Oscar (1), Rodrigo Diguin (2)", assistenciasSadock: "Leandro Oscar (1), Yuri Cursino (1), Rodrigo Diguin (1), Jhon Marques (2)" },
  { id: "m17", data: "2024", competicao: "Challenge Cup", local: "Arena Red Time", equipeCasa: "Sadock FC", equipeFora: "Efraim FC", placarCasa: 4, placarFora: 6, temporada: "2024", golsSadock: "Dayvid Coelho (2), Yuri Cursino (1), Rodrigo Diguin (1)", assistenciasSadock: "Leandro Oscar (1), Dayvid Coelho (1), Rodrigo Diguin (1)" },
  { id: "m18", data: "2024", competicao: "Challenge Cup", local: "Arena Red Time", equipeCasa: "Sadock FC", equipeFora: "Boa Esporte FC", placarCasa: 4, placarFora: 3, temporada: "2024", golsSadock: "Dayvid Coelho (2), Leandro Oscar (1)", assistenciasSadock: "Leandro Oscar (2)" },
  { id: "m19", data: "2024", competicao: "Challenge Cup", local: "Arena Red Time", equipeCasa: "Sadock FC", equipeFora: "Colorados FC", placarCasa: 3, placarFora: 0, temporada: "2024", golsSadock: "", assistenciasSadock: "" },
  { id: "m20", data: "2024", competicao: "Challenge Cup", local: "Arena Red Time", equipeCasa: "Sadock FC", equipeFora: "Efraim FC", placarCasa: 3, placarFora: 3, temporada: "2024", golsSadock: "Leandro Oscar (1)", assistenciasSadock: "" },

  // ===== 2025 =====
  { id: "m21", data: "2025", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Jogadelos FC", placarCasa: 5, placarFora: 5, temporada: "2025", golsSadock: "Lucas Aurnheimer (1), Leandro Oscar (1), Hugo Dortas (1), Rodrigo Diguin (1), Yuri de Paula (1)", assistenciasSadock: "" },
  { id: "m22", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "Sapo City", equipeFora: "Sadock FC", placarCasa: 0, placarFora: 3, temporada: "2025", golsSadock: "", assistenciasSadock: "" },
  { id: "m23", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "Sadock FC", equipeFora: "Boa Esporte FC", placarCasa: 1, placarFora: 1, temporada: "2025", golsSadock: "Rodrigo Diguin (1)", assistenciasSadock: "" },
  { id: "m24", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "Sadock FC", equipeFora: "Pai Heroi FC", placarCasa: 1, placarFora: 4, temporada: "2025", golsSadock: "Rodrigo Diguin (1)", assistenciasSadock: "" },
  { id: "m25", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "Sadock FC", equipeFora: "Cerberus FC", placarCasa: 2, placarFora: 1, temporada: "2025", golsSadock: "Yuri De Paula (2)", assistenciasSadock: "Dayvid Coelho (1), Jhon Marques (1)" },
  { id: "m26", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "Shalk 04 FC", equipeFora: "Sadock FC", placarCasa: 5, placarFora: 2, temporada: "2025", golsSadock: "Dayvid Coelho (1), Jhon Marques (1)", assistenciasSadock: "Jorge Ribeiro (1), Leandro Oscar (1)" },
  { id: "m27", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "Sadock FC", equipeFora: "Fut Resenha", placarCasa: 5, placarFora: 3, temporada: "2025", golsSadock: "Dayvid Coelho (2), Jhon Marques (1), Rodrigo Diguin (1)", assistenciasSadock: "Dayvid Coelho (1)" },
  { id: "m28", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "Sadock FC", equipeFora: "Imperio", placarCasa: 3, placarFora: 0, temporada: "2025", golsSadock: "", assistenciasSadock: "" },
  { id: "m29", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "Sadock FC", equipeFora: "Choppecoense FC", placarCasa: 2, placarFora: 2, temporada: "2025", golsSadock: "Yuri de Paula (2)", assistenciasSadock: "Dayvid Coelho (2)" },
  { id: "m30", data: "2025", competicao: "Liga Praca Seca", local: "Arena Butinha", equipeCasa: "La Furia FC", equipeFora: "Sadock FC", placarCasa: 8, placarFora: 2, temporada: "2025", golsSadock: "Fabricio Vieira (1)", assistenciasSadock: "Jhon Marques (1)" },
  { id: "m31", data: "2025", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Viracopo FC", placarCasa: 6, placarFora: 5, temporada: "2025", golsSadock: "Dayvid Coelho (2), Jonathan Lima (1), Henrique Lima (1), Rodrigo Diguin (2)", assistenciasSadock: "Yuri de Paula (1), Rodrigo Diguin (1), Hugo Dortas (4)" },
  { id: "m32", data: "2025", competicao: "Premier Europa League", local: "Universidade da Bola", equipeCasa: "Sadock FC", equipeFora: "Real City FC", placarCasa: 2, placarFora: 2, temporada: "2025", golsSadock: "Hugo Dortas (1), Yuri Cursino (1)", assistenciasSadock: "Dayvid Coelho (1), Leandro Oscar (1)" },
  { id: "m33", data: "2025", competicao: "Premier Europa League", local: "Universidade da Bola", equipeCasa: "Sadock FC", equipeFora: "Maestros FC", placarCasa: 1, placarFora: 3, temporada: "2025", golsSadock: "Dayvid Coelho (1)", assistenciasSadock: "" },
  { id: "m34", data: "2025", competicao: "Premier Europa League", local: "Universidade da Bola", equipeCasa: "Sadock FC", equipeFora: "Boa Esporte FC", placarCasa: 2, placarFora: 4, temporada: "2025", golsSadock: "", assistenciasSadock: "Jhon Marques (1)" },
  { id: "m35", data: "2025", competicao: "Premier Europa League", local: "Universidade da Bola", equipeCasa: "Cacau FC", equipeFora: "Sadock FC", placarCasa: 0, placarFora: 3, temporada: "2025", golsSadock: "", assistenciasSadock: "" },
  { id: "m36", data: "2025", competicao: "Premier Europa League", local: "Universidade da Bola", equipeCasa: "Sadock FC", equipeFora: "RB Quintino", placarCasa: 1, placarFora: 6, temporada: "2025", golsSadock: "Ramon Tertuliano (1)", assistenciasSadock: "Jhon Marques (1)" },
  { id: "m37", data: "2025", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Fut Fominhas FC", placarCasa: 3, placarFora: 5, temporada: "2025", golsSadock: "Dayvid Coelho (1), Rodrigo Diguin (1)", assistenciasSadock: "Fabricio Vieira (1), Dayvid Coelho (1)" },
  { id: "m38", data: "2025", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Uniao e Gelo FC", placarCasa: 3, placarFora: 4, temporada: "2025", golsSadock: "Rodrigo Diguin (2), Yuri de Paula (1)", assistenciasSadock: "Fabricio Vieira (1), Dayvid Coelho (1)" },
  { id: "m39", data: "2025", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "RB Sape FC", equipeFora: "Sadock FC", placarCasa: 0, placarFora: 5, temporada: "2025", golsSadock: "Dayvid Coelho (1), Hugo Dortas (1), Andrey Gomes (1), Joao Pedro (1), Yuri de Paula (1)", assistenciasSadock: "Yuri de Paula (2), Joao Pedro (1), Leandro Oscar (1)" },
  { id: "m40", data: "2025", competicao: "Amistoso", local: "Parque de Madureira", equipeCasa: "Sadock FC", equipeFora: "Uniao e Gelo FC", placarCasa: 2, placarFora: 2, temporada: "2025", golsSadock: "Dayvid Coelho (2)", assistenciasSadock: "Yuri de Paula (1)" },
  { id: "m41", data: "2025", competicao: "Copa Euro 2025", local: "Universidade da Bola", equipeCasa: "Sadock FC", equipeFora: "Boa Esporte FC", placarCasa: 0, placarFora: 0, temporada: "2025", golsSadock: "", assistenciasSadock: "" },
  { id: "m42", data: "2025", competicao: "Copa Euro 2025", local: "Universidade da Bola", equipeCasa: "Sadock FC", equipeFora: "Sem Lei FC", placarCasa: 3, placarFora: 4, temporada: "2025", golsSadock: "Hugo Dortas (1), Fabricio Vieira (2)", assistenciasSadock: "Fabricio Vieira (1)" },
  { id: "m43", data: "2025", competicao: "Copa Euro 2025", local: "Universidade da Bola", equipeCasa: "Sadock FC", equipeFora: "Imperio", placarCasa: 4, placarFora: 0, temporada: "2025", golsSadock: "Arthur Petrone (1), Joao Pedro (1), Hugo Dortas (1)", assistenciasSadock: "Hugo Dortas (1), Fabricio Vieira (1)" },

  // ===== 2026 =====
  { id: "m44", data: "2026", competicao: "Copa Euro 2025", local: "Universidade da Bola", equipeCasa: "Sadock FC", equipeFora: "Boa Esporte FC", placarCasa: 2, placarFora: 5, temporada: "2026", golsSadock: "Ramon Tertuliano (1), Joao Pedro (1)", assistenciasSadock: "Ramon Tertuliano (1)" },
  { id: "m45", data: "2026", competicao: "Copa Sape 2026", local: "Campo do Sape", equipeCasa: "Sadock FC", equipeFora: "Vai que Cola FC", placarCasa: 2, placarFora: 5, temporada: "2026", golsSadock: "Arthur Petrone (1), Leandro Oscar (1)", assistenciasSadock: "" },
  { id: "m46", data: "2026", competicao: "Copa Sape 2026", local: "Campo do Sape", equipeCasa: "Sadock FC", equipeFora: "Baile de Quintino", placarCasa: 1, placarFora: 4, temporada: "2026", golsSadock: "Arthur Petrone (1)", assistenciasSadock: "" },
  { id: "m47", data: "15/03/2026", competicao: "Amistoso", local: "", equipeCasa: "Sadock FC", equipeFora: "Real Estrela", placarCasa: 2, placarFora: 4, temporada: "2026", golsSadock: "Jhon Marques (1), Arthur Petrone (1)", assistenciasSadock: "Ramon Tertuliano (1), Arthur Petrone (1)" },
];

export function isSadockCasa(match: Match): boolean {
  return match?.equipeCasa === "Sadock FC";
}

export function getSadockScore(match: Match): number {
  if (!match) return 0;
  return isSadockCasa(match) ? (match.placarCasa ?? 0) : (match.placarFora ?? 0);
}

export function getAdversarioScore(match: Match): number {
  if (!match) return 0;
  return isSadockCasa(match) ? (match.placarFora ?? 0) : (match.placarCasa ?? 0);
}

export function getAdversario(match: Match): string {
  if (!match) return "";
  return isSadockCasa(match) ? (match.equipeFora || "") : (match.equipeCasa || "");
}

export function getMatchResult(match: Match): "V" | "E" | "D" {
  if (match.wo) {
    return match.woTipo === 'sadock' ? 'V' : 'D';
  }
  const s = getSadockScore(match);
  const a = getAdversarioScore(match);
  if (s > a) return "V";
  if (s === a) return "E";
  return "D";
}

export function getLocalType(match: Match): "Casa" | "Fora" {
  return isSadockCasa(match) ? "Casa" : "Fora";
}

/** Parse match date string (DD/MM/YYYY or just YYYY) into Date */
export function parseMatchDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  }
  const y = parseInt(dateStr, 10);
  if (!isNaN(y)) return new Date(y, 0, 1);
  return null;
}

/** Check if a match is in the future (hasn't been played yet) */
export function isFutureMatch(match: Match): boolean {
  const d = parseMatchDate(match.data);
  if (!d) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d.getTime() > now.getTime();
}

/** Sort matches by date ascending (oldest first). Matches without parseable
 *  dates are placed according to their array index so they keep the original
 *  order relative to each other. */
export function sortMatchesByDate(matches: Match[], direction: 'asc' | 'desc' = 'asc'): Match[] {
  return [...matches].sort((a, b) => {
    const da = parseMatchDate(a.data);
    const db = parseMatchDate(b.data);
    // If both have dates with only year (no day), use array index as tiebreaker
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    // For same-date matches (e.g. both "2024"), preserve original order
    if (ta === tb) return 0;
    return direction === 'asc' ? ta - tb : tb - ta;
  });
}