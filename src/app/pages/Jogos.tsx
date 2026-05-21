import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, Trophy, ChevronDown, Target, MapPin } from "lucide-react";
import { motion } from "motion/react";

type Jogo = {
  id: string;
  data_jogo: string;
  tipo: "diaria" | "mensal";
  local: string | null;
  finalizado: boolean;
  observacoes: string | null;
};

type TimeJogador = {
  jogo_id: string;
  jogador_id: string;
  time_numero: number;
  jogadores: { nome: string; apelido: string | null } | null;
};

type Estatistica = {
  jogo_id: string;
  jogador_id: string;
  presente: boolean;
  gols: number;
  assistencias: number;
  defesas: number;
  cartoes_vermelhos: number;
  gols_contra: number;
  vitorias_vermelho: number;
  empates_vermelho: number;
  derrotas_vermelho: number;
  vitorias_azul: number;
  empates_azul: number;
  derrotas_azul: number;
  jogadores: { nome: string; apelido: string | null } | null;
};

type Pontos = { jogo_id: string; jogador_id: string; pontos: number };

type Partida = {
  id: string;
  jogo_id: string;
  ordem: number;
  cor_a: "vermelho" | "azul";
  cor_b: "vermelho" | "azul";
  gols_a: number;
  gols_b: number;
};

type PartidaJogador = {
  partida_id: string;
  jogador_id: string;
  lado: "A" | "B";
  gols: number;
  assistencias: number;
  jogadores: { nome: string; apelido: string | null } | null;
};

type Filtro = "todos" | "diaria" | "mensal";

const MESES_CURTO = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function Jogos() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [times, setTimes] = useState<Record<string, TimeJogador[]>>({});
  const [stats, setStats] = useState<Record<string, Estatistica[]>>({});
  const [pontosMap, setPontosMap] = useState<Record<string, Record<string, number>>>({});
  const [partidas, setPartidas] = useState<Record<string, Partida[]>>({});
  const [partidaJogadores, setPartidaJogadores] = useState<Record<string, PartidaJogador[]>>({});
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [aberto, setAberto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("jogos").select("*").order("data_jogo", { ascending: false });
      if (filtro !== "todos") q = q.eq("tipo", filtro);
      const { data } = await q;
      const lista = (data as Jogo[]) || [];
      setJogos(lista);

      if (lista.length) {
        const ids = lista.map((j) => j.id);
        const [{ data: ts }, { data: es }, { data: ps }, { data: prts }] = await Promise.all([
          supabase
            .from("times_sorteados")
            .select("jogo_id, jogador_id, time_numero, jogadores(nome, apelido)")
            .in("jogo_id", ids),
          supabase
            .from("estatisticas_jogo")
            .select("*, jogadores(nome, apelido)")
            .in("jogo_id", ids),
          supabase.from("pontuacao_dia").select("*").in("jogo_id", ids),
          supabase.from("partidas").select("*").in("jogo_id", ids).order("ordem"),
        ]);
        const tMap: Record<string, TimeJogador[]> = {};
        ((ts as any[]) || []).forEach((r) => {
          (tMap[r.jogo_id] ||= []).push(r);
        });
        const sMap: Record<string, Estatistica[]> = {};
        ((es as any[]) || []).forEach((r) => {
          (sMap[r.jogo_id] ||= []).push(r);
        });
        const pMap: Record<string, Record<string, number>> = {};
        ((ps as Pontos[]) || []).forEach((p) => {
          (pMap[p.jogo_id] ||= {})[p.jogador_id] = Number(p.pontos);
        });
        const prMap: Record<string, Partida[]> = {};
        ((prts as Partida[]) || []).forEach((p) => {
          (prMap[p.jogo_id] ||= []).push(p);
        });
        setTimes(tMap);
        setStats(sMap);
        setPontosMap(pMap);
        setPartidas(prMap);

        const partidaIds = (prts as Partida[] || []).map((p) => p.id);
        if (partidaIds.length) {
          const { data: pjs } = await supabase
            .from("partida_jogadores")
            .select("*, jogadores(nome, apelido)")
            .in("partida_id", partidaIds);
          const pjMap: Record<string, PartidaJogador[]> = {};
          ((pjs as PartidaJogador[]) || []).forEach((r) => {
            (pjMap[r.partida_id] ||= []).push(r);
          });
          setPartidaJogadores(pjMap);
        } else {
          setPartidaJogadores({});
        }
      }
      setLoading(false);
    })();
  }, [filtro]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* HEADER */}
      <div className="relative border-b border-white/[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,255,136,0.1),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-[2px] rounded-full bg-[#22ff88]" />
            <p className="font-['Archivo',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88]">
              HISTÓRICO
            </p>
          </div>
          <h1 className="font-['Archivo',sans-serif] font-black text-5xl sm:text-6xl tracking-tight mb-4">
            Jogos
          </h1>
          <div className="flex gap-2">
            {(["todos", "diaria", "mensal"] as Filtro[]).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 rounded-full text-[11px] tracking-[0.18em] font-bold border transition-all ${
                  filtro === f
                    ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88] shadow-[0_0_18px_rgba(34,255,136,0.3)]"
                    : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"
                }`}
              >
                {f === "diaria" ? "DIÁRIAS" : f === "mensal" ? "CAMPEONATOS" : "TODOS"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && jogos.length === 0 && (
          <div className="p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50 text-center">
            <Calendar className="mx-auto mb-3 text-white/20" size={32} />
            Nenhum jogo registrado ainda.
          </div>
        )}

        <div className="space-y-3">
          {jogos.map((j, idx) => {
            const expanded = aberto === j.id;
            const ts = times[j.id] || [];
            const es = stats[j.id] || [];
            const prts = partidas[j.id] || [];
            const data = new Date(j.data_jogo);
            const grupos = agruparPorTime(ts);
            const ptsDoJogo = pontosMap[j.id] || {};

            const mvp = es
              .filter((e) => (ptsDoJogo[e.jogador_id] || 0) > 0)
              .sort((a, b) => (ptsDoJogo[b.jogador_id] || 0) - (ptsDoJogo[a.jogador_id] || 0))[0];

            const totalGols = es.reduce((s, e) => s + (e.gols || 0), 0);

            return (
              <motion.div
                key={j.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.35 }}
                className={`rounded-2xl border bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden transition-all ${
                  expanded ? "border-[#22ff88]/30" : "border-white/[0.06] hover:border-white/[0.14]"
                }`}
              >
                <button
                  onClick={() => setAberto(expanded ? null : j.id)}
                  className="w-full p-4 flex items-center gap-4 text-left"
                >
                  {/* Tile de data */}
                  <div className="shrink-0 w-16 h-16 rounded-xl bg-[#22ff88]/[0.07] border border-[#22ff88]/20 flex flex-col items-center justify-center">
                    <span className="font-['Archivo',sans-serif] font-black text-2xl leading-none text-[#22ff88]">
                      {String(data.getDate()).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] tracking-[0.15em] text-white/50 mt-0.5">
                      {MESES_CURTO[data.getMonth()]} {data.getFullYear()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] tracking-[0.15em] font-bold ${
                          j.tipo === "mensal"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-[#22ff88]/15 text-[#22ff88]"
                        }`}
                      >
                        {j.tipo === "mensal" ? "CAMPEONATO" : "DIÁRIA"}
                      </span>
                      {!j.finalizado && (
                        <span className="px-2 py-0.5 rounded text-[9px] tracking-[0.15em] font-bold bg-white/[0.06] text-white/50">
                          EM ANDAMENTO
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm sm:text-base">
                      {data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-white/45 text-xs">
                      {j.local && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {j.local}
                        </span>
                      )}
                      {prts.length > 0 && <span>{prts.length} partida{prts.length !== 1 ? "s" : ""}</span>}
                      {totalGols > 0 && (
                        <span className="flex items-center gap-1">
                          <Target size={11} className="text-[#22ff88]" /> {totalGols} gols
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MVP + chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    {mvp?.jogadores && (
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[9px] tracking-[0.18em] text-white/35">MVP DO DIA</span>
                        <span className="flex items-center gap-1 text-[#22ff88] text-sm font-bold">
                          <Trophy size={12} /> {mvp.jogadores.apelido || mvp.jogadores.nome}
                        </span>
                      </div>
                    )}
                    <ChevronDown
                      size={20}
                      className={`text-white/30 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {expanded && (
                  <div className="p-4 border-t border-white/[0.05] space-y-5">
                    {/* PARTIDAS */}
                    {prts.length > 0 && (
                      <div>
                        <SubHeader>PARTIDAS DO DIA · {prts.length}</SubHeader>
                        <div className="space-y-2">
                          {prts.map((p) => {
                            const pjs = partidaJogadores[p.id] || [];
                            const ladoA = pjs.filter((x) => x.lado === "A");
                            const ladoB = pjs.filter((x) => x.lado === "B");
                            const winner = p.gols_a > p.gols_b ? "A" : p.gols_b > p.gols_a ? "B" : null;
                            return (
                              <div key={p.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                                {/* Placar broadcast */}
                                <div className="relative flex items-center justify-center gap-4 py-3 bg-white/[0.02] border-b border-white/[0.04]">
                                  <span className="text-[9px] tracking-[0.2em] text-white/30 font-bold absolute left-3 top-1/2 -translate-y-1/2">
                                    P{p.ordem}
                                  </span>
                                  <LadoColeta cor={p.cor_a} placar={p.gols_a} venceu={winner === "A"} alinhar="right" />
                                  <span className="text-white/25 font-black text-xl">×</span>
                                  <LadoColeta cor={p.cor_b} placar={p.gols_b} venceu={winner === "B"} alinhar="left" />
                                </div>
                                <div className="grid grid-cols-2 gap-2 p-2 text-xs">
                                  <TimePartida cor={p.cor_a} jogadores={ladoA} />
                                  <TimePartida cor={p.cor_b} jogadores={ladoB} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {grupos.length > 0 && (
                      <div>
                        <SubHeader>TIMES SORTEADOS</SubHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {grupos.map((g) => (
                            <div key={g.numero} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                              <p className="font-bold text-sm mb-1.5 text-[#22ff88]">Time {g.numero}</p>
                              <ul className="text-white/70 text-xs space-y-0.5">
                                {g.jogadores.map((p, i) => (
                                  <li key={i}>{p.apelido || p.nome}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {es.length > 0 && (
                      <div>
                        <SubHeader>ESTATÍSTICAS DO DIA</SubHeader>
                        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[10px] tracking-[0.15em] text-white/40 border-b border-white/[0.06] bg-white/[0.02]">
                                <th className="px-3 py-2.5">Jogador</th>
                                <th className="px-2 py-2.5 text-center">Pts</th>
                                <th className="px-2 py-2.5 text-center">G</th>
                                <th className="px-2 py-2.5 text-center">A</th>
                                <th className="px-2 py-2.5 text-center">DEF</th>
                                <th className="px-2 py-2.5 text-center" title="Vitórias / Empates / Derrotas">V/E/D</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...es]
                                .sort((a, b) => (ptsDoJogo[b.jogador_id] || 0) - (ptsDoJogo[a.jogador_id] || 0))
                                .map((e) => {
                                  const pts = ptsDoJogo[e.jogador_id] || 0;
                                  const v = e.vitorias_vermelho + e.vitorias_azul;
                                  const emp = e.empates_vermelho + e.empates_azul;
                                  const d = e.derrotas_vermelho + e.derrotas_azul;
                                  const isMvp = mvp?.jogador_id === e.jogador_id;
                                  return (
                                    <tr key={e.jogador_id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                                      <td className="px-3 py-2">
                                        {isMvp && "🏆 "}
                                        {e.jogadores?.apelido || e.jogadores?.nome}
                                      </td>
                                      <td className={`px-2 py-2 text-center font-bold tabular-nums ${pts > 0 ? "text-[#22ff88]" : pts < 0 ? "text-rose-400" : "text-white/40"}`}>
                                        {Math.min(10, Math.max(0, pts)).toFixed(1)}
                                      </td>
                                      <td className="px-2 py-2 text-center text-[#22ff88] tabular-nums">{e.gols}</td>
                                      <td className="px-2 py-2 text-center tabular-nums">{e.assistencias}</td>
                                      <td className="px-2 py-2 text-center tabular-nums">{e.defesas}</td>
                                      <td className="px-2 py-2 text-center tabular-nums text-white/70">
                                        <span className="text-emerald-400">{v}</span>
                                        <span className="text-white/25">/</span>
                                        <span className="text-white/60">{emp}</span>
                                        <span className="text-white/25">/</span>
                                        <span className="text-rose-400">{d}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {grupos.length === 0 && es.length === 0 && prts.length === 0 && (
                      <p className="text-white/40 text-sm text-center py-3">Sem dados detalhados deste jogo.</p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="w-4 h-[2px] rounded-full bg-[#22ff88]/60" />
      <p className="text-[10px] tracking-[0.2em] text-white/45 font-bold">{children}</p>
    </div>
  );
}

function LadoColeta({
  cor,
  placar,
  venceu,
  alinhar,
}: {
  cor: "vermelho" | "azul";
  placar: number;
  venceu: boolean;
  alinhar: "left" | "right";
}) {
  return (
    <div className={`flex items-center gap-2 ${alinhar === "right" ? "flex-row-reverse" : ""}`}>
      <span
        className={`w-5 h-5 rounded-full border-2 ${
          cor === "vermelho" ? "bg-rose-500 border-rose-300" : "bg-sky-500 border-sky-300"
        }`}
      />
      <span
        className={`font-['Archivo',sans-serif] font-black text-3xl tabular-nums ${
          venceu ? "text-[#22ff88]" : "text-white/70"
        }`}
      >
        {placar}
      </span>
    </div>
  );
}

function TimePartida({
  cor,
  jogadores,
}: {
  cor: "vermelho" | "azul";
  jogadores: PartidaJogador[];
}) {
  return (
    <div
      className={`p-2 rounded-lg ${
        cor === "vermelho"
          ? "border border-rose-500/20 bg-rose-500/[0.05]"
          : "border border-sky-500/20 bg-sky-500/[0.05]"
      }`}
    >
      <ul className="space-y-0.5">
        {jogadores.map((x) => (
          <li key={x.jogador_id} className="flex justify-between gap-2">
            <span className="truncate text-white/80">{x.jogadores?.apelido || x.jogadores?.nome}</span>
            <span className="text-white/40 text-[10px] shrink-0">
              {x.gols ? `${x.gols}⚽` : ""} {x.assistencias ? `${x.assistencias}🅰` : ""}
            </span>
          </li>
        ))}
        {jogadores.length === 0 && <li className="text-white/25">—</li>}
      </ul>
    </div>
  );
}

function agruparPorTime(rows: TimeJogador[]) {
  const map: Record<number, { numero: number; jogadores: { nome: string; apelido: string | null }[] }> = {};
  rows.forEach((r) => {
    if (!map[r.time_numero]) map[r.time_numero] = { numero: r.time_numero, jogadores: [] };
    if (r.jogadores) map[r.time_numero].jogadores.push(r.jogadores);
  });
  return Object.values(map).sort((a, b) => a.numero - b.numero);
}
