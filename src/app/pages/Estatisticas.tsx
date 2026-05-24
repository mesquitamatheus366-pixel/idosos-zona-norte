import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Trophy, Target, ListChecks, Star, Calendar, Award, TrendingUp, TrendingDown, Minus, Camera, Crown } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

type Agregado = {
  jogador_id: string;
  nome: string;
  jogos_disputados: number;
  gols: number;
  assistencias: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  mvp_count: number;
  nota_total: number;
};

type Foto = { id: string; foto_url: string | null; apelido: string | null; nome: string; posicao?: string | null };

type Modo = "nota_total" | "gols" | "assistencias" | "jogos_disputados" | "mvp_count";

const MODOS: { v: Modo; label: string; icon: React.ReactNode; sufixo: string }[] = [
  { v: "nota_total", label: "NOTA TOTAL", icon: <Award size={12} />, sufixo: "pts" },
  { v: "gols", label: "GOLS", icon: <Target size={12} />, sufixo: "gols" },
  { v: "assistencias", label: "ASSISTÊNCIAS", icon: <ListChecks size={12} />, sufixo: "assists" },
  { v: "jogos_disputados", label: "PRESENÇA", icon: <Calendar size={12} />, sufixo: "jogos" },
  { v: "mvp_count", label: "MVPs", icon: <Star size={12} />, sufixo: "MVPs" },
];

const POSICOES: { v: string; label: string }[] = [
  { v: "todas", label: "TODAS" },
  { v: "goleiro", label: "GOLEIRO" },
  { v: "fixo", label: "FIXO" },
  { v: "ala", label: "ALA" },
  { v: "meio", label: "MEIO" },
  { v: "pivo", label: "PIVÔ" },
];

const MESES_LABEL = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

type SnapRow = {
  jogador_id: string;
  nota_total: number;
  gols: number;
  assistencias: number;
  jogos_disputados: number;
  mvp_count: number;
};

type LinhaMes = {
  mes: string;
  jogador_id: string;
  nome: string;
  apelido: string | null;
  posicao: string;
  foto_url: string | null;
  jogos_disputados: number;
  gols: number;
  assistencias: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  mvp_count: number;
  nota_total: number;
};

type Craque = {
  mes: string;
  posicao: string;
  jogador_id: string;
  nome: string;
  apelido: string | null;
  foto_url: string | null;
  jogos_disputados: number;
  gols: number;
  assistencias: number;
  mvp_count: number;
  nota_total: number;
};

function mesKey(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mesLabel(key: string) {
  const [ano, mes] = key.split("-");
  return `${MESES_LABEL[Number(mes) - 1]}/${ano}`;
}

export function Estatisticas() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Agregado[]>([]);
  const [fotos, setFotos] = useState<Record<string, Foto>>({});
  const [snapshot, setSnapshot] = useState<SnapRow[]>([]);
  const [linhasMes, setLinhasMes] = useState<LinhaMes[]>([]);
  const [craques, setCraques] = useState<Craque[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<Modo>("nota_total");
  const [posicao, setPosicao] = useState<string>("todas");
  const [mes, setMes] = useState<string>("total"); // "total" = temporada inteira

  async function carregar() {
    const [{ data: ag }, { data: jg }, { data: sn }, { data: pm }, { data: cq }] = await Promise.all([
      supabase.from("estatisticas_agregadas").select("*"),
      supabase.from("jogadores").select("id, nome, apelido, foto_url, posicao"),
      supabase.from("ranking_snapshots").select("*").order("data_snapshot", { ascending: false }),
      supabase.from("estatisticas_por_mes").select("*"),
      supabase.from("craque_mes_por_posicao").select("*"),
    ]);
    setRows(((ag as any[]) || []).map((r) => ({
      jogador_id: r.jogador_id,
      nome: r.nome,
      jogos_disputados: Number(r.jogos_disputados) || 0,
      gols: Number(r.gols) || 0,
      assistencias: Number(r.assistencias) || 0,
      vitorias: Number(r.vitorias) || 0,
      empates: Number(r.empates) || 0,
      derrotas: Number(r.derrotas) || 0,
      mvp_count: Number(r.mvp_count) || 0,
      nota_total: Number(r.nota_total) || 0,
    })));
    const fmap: Record<string, Foto> = {};
    ((jg as Foto[]) || []).forEach((f) => (fmap[f.id] = f));
    setFotos(fmap);
    const todasSnaps = (sn as any[]) || [];
    const ultimaData = todasSnaps[0]?.data_snapshot;
    setSnapshot(
      todasSnaps
        .filter((s) => s.data_snapshot === ultimaData)
        .map((s) => ({
          jogador_id: s.jogador_id,
          nota_total: Number(s.nota_total) || 0,
          gols: Number(s.gols) || 0,
          assistencias: Number(s.assistencias) || 0,
          jogos_disputados: Number(s.jogos_disputados) || 0,
          mvp_count: Number(s.mvp_count) || 0,
        }))
    );
    setLinhasMes(((pm as any[]) || []).map((r) => ({
      mes: r.mes,
      jogador_id: r.jogador_id,
      nome: r.nome,
      apelido: r.apelido,
      posicao: r.posicao,
      foto_url: r.foto_url,
      jogos_disputados: Number(r.jogos_disputados) || 0,
      gols: Number(r.gols) || 0,
      assistencias: Number(r.assistencias) || 0,
      vitorias: Number(r.vitorias) || 0,
      empates: Number(r.empates) || 0,
      derrotas: Number(r.derrotas) || 0,
      mvp_count: Number(r.mvp_count) || 0,
      nota_total: Number(r.nota_total) || 0,
    })));
    setCraques(((cq as any[]) || []).map((r) => ({
      mes: r.mes,
      posicao: r.posicao,
      jogador_id: r.jogador_id,
      nome: r.nome,
      apelido: r.apelido,
      foto_url: r.foto_url,
      jogos_disputados: Number(r.jogos_disputados) || 0,
      gols: Number(r.gols) || 0,
      assistencias: Number(r.assistencias) || 0,
      mvp_count: Number(r.mvp_count) || 0,
      nota_total: Number(r.nota_total) || 0,
    })));
    setLoading(false);
  }

  async function registrarSnapshot() {
    const { error } = await supabase.rpc("tirar_snapshot_ranking");
    if (error) toast.error(error.message);
    else {
      toast.success("Ranking da semana registrado! As setas vão comparar a partir daqui.");
      carregar();
    }
  }

  useEffect(() => {
    carregar();
    const onVisible = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // lista de meses disponíveis (mais recente primeiro)
  const mesesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    linhasMes.forEach((l) => set.add(mesKey(l.mes)));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [linhasMes]);

  // base de agregação: total da temporada OU do mês escolhido
  const baseRows: Agregado[] = useMemo(() => {
    if (mes === "total") return rows;
    return linhasMes
      .filter((l) => mesKey(l.mes) === mes)
      .map((l) => ({
        jogador_id: l.jogador_id,
        nome: l.nome,
        jogos_disputados: l.jogos_disputados,
        gols: l.gols,
        assistencias: l.assistencias,
        vitorias: l.vitorias,
        empates: l.empates,
        derrotas: l.derrotas,
        mvp_count: l.mvp_count,
        nota_total: l.nota_total,
      }));
  }, [mes, rows, linhasMes]);

  // filtra por posição (usando a posição do jogador no cadastro)
  const filtradoPorPosicao = useMemo(() => {
    if (posicao === "todas") return baseRows;
    return baseRows.filter((r) => (fotos[r.jogador_id]?.posicao || "").toLowerCase() === posicao);
  }, [baseRows, posicao, fotos]);

  const ordenado = useMemo(() => {
    return [...filtradoPorPosicao].sort((a, b) => {
      const diff = (Number(b[modo]) || 0) - (Number(a[modo]) || 0);
      if (diff !== 0) return diff;
      const gaA = (Number(a.gols) || 0) + (Number(a.assistencias) || 0);
      const gaB = (Number(b.gols) || 0) + (Number(b.assistencias) || 0);
      return gaB - gaA;
    });
  }, [filtradoPorPosicao, modo]);

  // variação só faz sentido na visão da temporada (snapshot é do agregado)
  const temSnapshot = snapshot.length > 0 && mes === "total" && posicao === "todas";
  const variacao = useMemo(() => {
    const v: Record<string, number | null> = {};
    if (!temSnapshot) {
      ordenado.forEach((r) => (v[r.jogador_id] = null));
      return v;
    }
    const snapOrd = [...snapshot].sort((a, b) => {
      const diff = (Number(b[modo]) || 0) - (Number(a[modo]) || 0);
      if (diff !== 0) return diff;
      const gaA = (Number(a.gols) || 0) + (Number(a.assistencias) || 0);
      const gaB = (Number(b.gols) || 0) + (Number(b.assistencias) || 0);
      return gaB - gaA;
    });
    const rankThen: Record<string, number> = {};
    snapOrd.forEach((s, i) => (rankThen[s.jogador_id] = i + 1));
    ordenado.forEach((r, i) => {
      const then = rankThen[r.jogador_id];
      v[r.jogador_id] = then === undefined ? null : then - (i + 1);
    });
    return v;
  }, [ordenado, snapshot, modo, temSnapshot]);

  // craques do mês escolhido (1 por posição)
  const craquesDoMes = useMemo(() => {
    if (mes === "total") return [];
    return craques.filter((c) => mesKey(c.mes) === mes);
  }, [craques, mes]);

  const modoAtual = MODOS.find((m) => m.v === modo)!;

  const valorExibido = (r: Agregado) =>
    modo === "nota_total" ? Number(r[modo]).toFixed(1) : String(r[modo]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* HEADER */}
      <div className="relative border-b border-white/[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,255,136,0.1),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-[2px] rounded-full bg-[#22ff88]" />
            <p className="font-['Archivo',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88]">
              CLASSIFICAÇÃO
            </p>
          </div>
          <h1 className="font-['Archivo',sans-serif] font-black text-5xl sm:text-6xl tracking-tight mb-4">
            Estatísticas
          </h1>

          {/* Seletor de MÊS */}
          <div className="flex gap-2 flex-wrap items-center mb-3">
            <span className="text-[10px] tracking-[0.25em] text-white/40 mr-1">PERÍODO:</span>
            <button
              onClick={() => setMes("total")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] font-bold border transition-all ${
                mes === "total"
                  ? "bg-white text-[#0b0b0b] border-white"
                  : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"
              }`}
            >
              TEMPORADA
            </button>
            {mesesDisponiveis.map((mk) => (
              <button
                key={mk}
                onClick={() => setMes(mk)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] font-bold border transition-all ${
                  mes === mk
                    ? "bg-white text-[#0b0b0b] border-white"
                    : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"
                }`}
              >
                {mesLabel(mk)}
              </button>
            ))}
          </div>

          {/* Seletor de POSIÇÃO */}
          <div className="flex gap-2 flex-wrap items-center mb-3">
            <span className="text-[10px] tracking-[0.25em] text-white/40 mr-1">POSIÇÃO:</span>
            {POSICOES.map((p) => (
              <button
                key={p.v}
                onClick={() => setPosicao(p.v)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] font-bold border transition-all ${
                  posicao === p.v
                    ? "bg-[#22ff88]/15 text-[#22ff88] border-[#22ff88]/40"
                    : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Modos */}
          <div className="flex gap-2 flex-wrap items-center">
            {MODOS.map((m) => (
              <button
                key={m.v}
                onClick={() => setModo(m.v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] tracking-[0.18em] font-bold border transition-all ${
                  modo === m.v
                    ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88] shadow-[0_0_18px_rgba(34,255,136,0.3)]"
                    : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
            {user && (
              <button
                onClick={registrarSnapshot}
                title="Salva a foto do ranking de hoje pra comparar na próxima semana"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] tracking-[0.18em] font-bold border border-[#22ff88]/40 text-[#22ff88] hover:bg-[#22ff88]/10"
              >
                <Camera size={13} /> FECHAR SEMANA
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading && (
          <div className="h-64 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
        )}

        {/* CRAQUES DO MÊS POR POSIÇÃO */}
        {!loading && mes !== "total" && craquesDoMes.length > 0 && (
          <div className="mb-8 p-5 rounded-2xl border border-[#22ff88]/20 bg-gradient-to-br from-[#22ff88]/[0.06] to-transparent">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={16} className="text-[#22ff88]" />
              <p className="text-[10px] tracking-[0.25em] text-[#22ff88] font-bold">
                CRAQUES DE {mesLabel(mes)} · POR POSIÇÃO
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {POSICOES.filter((p) => p.v !== "todas").map((p) => {
                const c = craquesDoMes.find((cq) => cq.posicao === p.v);
                return (
                  <div
                    key={p.v}
                    className="p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-center"
                  >
                    <p className="text-[9px] tracking-[0.2em] text-white/40 mb-2">{p.label}</p>
                    {c ? (
                      <>
                        <div className="w-14 h-14 mx-auto rounded-full overflow-hidden ring-2 ring-[#22ff88]/40 bg-white/5 flex items-center justify-center text-white/40 text-xs font-bold mb-2">
                          {c.foto_url ? (
                            <img src={c.foto_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (c.apelido || c.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                          )}
                        </div>
                        <p className="font-bold text-xs truncate">{c.apelido || c.nome}</p>
                        <p className="text-[#22ff88] font-['Archivo',sans-serif] font-black tabular-nums text-lg">
                          {c.nota_total.toFixed(1)}
                        </p>
                        <p className="text-[9px] text-white/35 tracking-wider">
                          {c.gols}G · {c.assistencias}A
                        </p>
                      </>
                    ) : (
                      <p className="text-white/25 text-xs py-6">sem dados</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && ordenado.length === 0 && (
          <div className="p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50 text-center">
            <Trophy className="mx-auto mb-3 text-white/20" size={32} />
            {mes === "total" ? "Sem jogos registrados ainda." : `Sem jogos no período (${mesLabel(mes)}).`}
          </div>
        )}

        {!loading && ordenado.length > 0 && (
          <>
            {/* PÓDIO — 2º, 1º, 3º */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 items-end">
              {[1, 0, 2].map((pos) => {
                const r = ordenado[pos];
                if (!r) return <div key={pos} />;
                const f = fotos[r.jogador_id];
                const ehPrimeiro = pos === 0;
                const medalha = ["🥇", "🥈", "🥉"][pos];
                const ring = ehPrimeiro
                  ? "ring-[#22ff88] shadow-[0_0_30px_rgba(34,255,136,0.45)]"
                  : pos === 1
                  ? "ring-white/30"
                  : "ring-amber-700/50";
                return (
                  <motion.div
                    key={r.jogador_id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + pos * 0.08, duration: 0.4 }}
                    className="text-center"
                  >
                    <div
                      className={`mx-auto rounded-full overflow-hidden ring-2 ${ring} bg-white/5 flex items-center justify-center text-white/40 font-bold mb-2 ${
                        ehPrimeiro ? "w-20 h-20 sm:w-28 sm:h-28" : "w-16 h-16 sm:w-20 sm:h-20"
                      }`}
                    >
                      {f?.foto_url ? (
                        <img src={f.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (f?.apelido || f?.nome || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                      )}
                    </div>
                    <p className={ehPrimeiro ? "text-3xl mb-0.5" : "text-2xl mb-0.5"}>{medalha}</p>
                    <p className="font-bold text-xs sm:text-sm truncate px-1">{f?.apelido || f?.nome}</p>
                    <p
                      className={`font-['Archivo',sans-serif] font-black tabular-nums ${
                        ehPrimeiro ? "text-2xl sm:text-3xl text-[#22ff88]" : "text-lg text-white/70"
                      }`}
                    >
                      {valorExibido(r)}
                    </p>
                    <p className="text-[9px] tracking-[0.18em] text-white/35 uppercase">{modoAtual.sufixo}</p>
                    <div
                      className={`mt-2 rounded-t-lg ${
                        ehPrimeiro
                          ? "h-10 bg-gradient-to-t from-[#22ff88]/20 to-[#22ff88]/5 border-t-2 border-[#22ff88]/40"
                          : "h-6 bg-gradient-to-t from-white/[0.06] to-transparent border-t border-white/10"
                      }`}
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* POWER RANKING — mexidas (só na temporada) */}
            {temSnapshot && (() => {
              const subiram = ordenado
                .filter((r) => (variacao[r.jogador_id] ?? 0) > 0)
                .sort((a, b) => (variacao[b.jogador_id] || 0) - (variacao[a.jogador_id] || 0))
                .slice(0, 3);
              const cairam = ordenado
                .filter((r) => (variacao[r.jogador_id] ?? 0) < 0)
                .sort((a, b) => (variacao[a.jogador_id] || 0) - (variacao[b.jogador_id] || 0))
                .slice(0, 3);
              if (subiram.length === 0 && cairam.length === 0) return null;
              return (
                <div className="mb-6 p-4 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
                  <p className="text-[10px] tracking-[0.25em] text-[#22ff88] mb-3">⚡ MEXIDAS NO RANKING</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] tracking-[0.18em] text-emerald-400 mb-1.5 flex items-center gap-1">
                        <TrendingUp size={12} /> SUBIRAM
                      </p>
                      {subiram.length ? (
                        <div className="space-y-1">
                          {subiram.map((r) => (
                            <div key={r.jogador_id} className="flex items-center justify-between text-sm">
                              <span className="truncate">{fotos[r.jogador_id]?.apelido || r.nome}</span>
                              <span className="text-emerald-400 font-bold tabular-nums">
                                +{variacao[r.jogador_id]} {Number(variacao[r.jogador_id]) === 1 ? "posição" : "posições"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/30 text-xs">Ninguém subiu.</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.18em] text-rose-400 mb-1.5 flex items-center gap-1">
                        <TrendingDown size={12} /> CAÍRAM
                      </p>
                      {cairam.length ? (
                        <div className="space-y-1">
                          {cairam.map((r) => (
                            <div key={r.jogador_id} className="flex items-center justify-between text-sm">
                              <span className="truncate">{fotos[r.jogador_id]?.apelido || r.nome}</span>
                              <span className="text-rose-400 font-bold tabular-nums">
                                {variacao[r.jogador_id]} {Math.abs(Number(variacao[r.jogador_id])) === 1 ? "posição" : "posições"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/30 text-xs">Ninguém caiu.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TABELA */}
            <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.18em] text-white/40 uppercase border-b border-white/[0.07] bg-white/[0.02]">
                    <th className="px-4 py-3.5 w-12 text-center">#</th>
                    {temSnapshot && <th className="px-1 py-3.5 w-10 text-center">Mov</th>}
                    <th className="px-2 py-3.5">Jogador</th>
                    <th className={`px-3 py-3.5 text-center ${modo === "nota_total" ? "text-[#22ff88]" : ""}`}>Nota</th>
                    <th className="px-3 py-3.5 text-center">J</th>
                    <th className={`px-3 py-3.5 text-center ${modo === "gols" ? "text-[#22ff88]" : ""}`}>G</th>
                    <th className={`px-3 py-3.5 text-center ${modo === "assistencias" ? "text-[#22ff88]" : ""}`}>A</th>
                    <th className="px-3 py-3.5 text-center">V</th>
                    <th className="px-3 py-3.5 text-center">E</th>
                    <th className="px-3 py-3.5 text-center">D</th>
                    <th className={`px-3 py-3.5 text-center ${modo === "mvp_count" ? "text-[#22ff88]" : ""}`}>MVP</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenado.map((r, i) => {
                    const f = fotos[r.jogador_id];
                    const top3 = i < 3;
                    return (
                      <tr
                        key={r.jogador_id}
                        className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${
                          i === 0 ? "bg-[#22ff88]/[0.04]" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-black tabular-nums ${
                              i === 0
                                ? "bg-[#22ff88] text-[#0b0b0b]"
                                : top3
                                ? "bg-white/10 text-white"
                                : "text-white/40"
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        {temSnapshot && (
                          <td className="px-1 py-3 text-center">
                            <VariacaoBadge v={variacao[r.jogador_id]} />
                          </td>
                        )}
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center text-white/40 text-[10px] font-bold shrink-0">
                              {f?.foto_url ? (
                                <img src={f.foto_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (f?.apelido || r.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                              )}
                            </div>
                            <span className="font-bold">{f?.apelido || r.nome}</span>
                          </div>
                        </td>
                        <td className={`px-3 py-3 text-center tabular-nums font-bold ${modo === "nota_total" ? "text-[#22ff88]" : "text-[#22ff88]/70"}`}>
                          {Number(r.nota_total || 0).toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-center text-white/55 tabular-nums">{r.jogos_disputados}</td>
                        <td className={`px-3 py-3 text-center tabular-nums ${modo === "gols" ? "text-[#22ff88] font-bold" : "text-white/80"}`}>{r.gols}</td>
                        <td className={`px-3 py-3 text-center tabular-nums ${modo === "assistencias" ? "text-[#22ff88] font-bold" : "text-white/80"}`}>{r.assistencias}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-emerald-400">{r.vitorias}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-white/50">{r.empates}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-rose-400">{r.derrotas}</td>
                        <td className={`px-3 py-3 text-center tabular-nums ${modo === "mvp_count" ? "text-[#22ff88] font-bold" : "text-[#22ff88]/60"}`}>{r.mvp_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-white/30 text-[10px] mt-3 tracking-wide">
              J = jogos · G = gols · A = assistências · V/E/D = vitórias/empates/derrotas · MVP = vezes craque do dia
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function VariacaoBadge({ v }: { v: number | null | undefined }) {
  if (v === null || v === undefined) {
    return <span className="text-white/20 text-[10px]">novo</span>;
  }
  if (v > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-bold tabular-nums">
        <TrendingUp size={11} />
        {v}
      </span>
    );
  }
  if (v < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-rose-400 text-xs font-bold tabular-nums">
        <TrendingDown size={11} />
        {Math.abs(v)}
      </span>
    );
  }
  return <Minus size={12} className="inline text-white/25" />;
}
