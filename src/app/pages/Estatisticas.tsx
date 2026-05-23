import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Trophy, Target, ListChecks, Star, Calendar, Award, TrendingUp, TrendingDown, Minus, Camera } from "lucide-react";
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

type Foto = { id: string; foto_url: string | null; apelido: string | null; nome: string };

type Modo = "nota_total" | "gols" | "assistencias" | "jogos_disputados" | "mvp_count";

const MODOS: { v: Modo; label: string; icon: React.ReactNode; sufixo: string }[] = [
  { v: "nota_total", label: "NOTA TOTAL", icon: <Award size={12} />, sufixo: "pts" },
  { v: "gols", label: "GOLS", icon: <Target size={12} />, sufixo: "gols" },
  { v: "assistencias", label: "ASSISTÊNCIAS", icon: <ListChecks size={12} />, sufixo: "assists" },
  { v: "jogos_disputados", label: "PRESENÇA", icon: <Calendar size={12} />, sufixo: "jogos" },
  { v: "mvp_count", label: "MVPs", icon: <Star size={12} />, sufixo: "MVPs" },
];

type SnapRow = {
  jogador_id: string;
  nota_total: number;
  gols: number;
  assistencias: number;
  jogos_disputados: number;
  mvp_count: number;
};

export function Estatisticas() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Agregado[]>([]);
  const [fotos, setFotos] = useState<Record<string, Foto>>({});
  const [snapshot, setSnapshot] = useState<SnapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<Modo>("nota_total");

  async function carregar() {
    const [{ data: ag }, { data: jg }, { data: sn }] = await Promise.all([
      supabase.from("estatisticas_agregadas").select("*"),
      supabase.from("jogadores").select("id, nome, apelido, foto_url"),
      supabase.from("ranking_snapshots").select("*").order("data_snapshot", { ascending: false }),
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
    // pega só as linhas do snapshot mais recente
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

  const ordenado = useMemo(() => {
    return [...rows].sort((a, b) => {
      const diff = (Number(b[modo]) || 0) - (Number(a[modo]) || 0);
      if (diff !== 0) return diff;
      // Desempate: gols + assistências (somados)
      const gaA = (Number(a.gols) || 0) + (Number(a.assistencias) || 0);
      const gaB = (Number(b.gols) || 0) + (Number(b.assistencias) || 0);
      return gaB - gaA;
    });
  }, [rows, modo]);

  // variação de posição NO MODO ATUAL (compara ranking de agora com o do snapshot)
  const temSnapshot = snapshot.length > 0;
  const variacao = useMemo(() => {
    const v: Record<string, number | null> = {};
    if (snapshot.length === 0) {
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
  }, [ordenado, snapshot, modo]);

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

        {!loading && ordenado.length === 0 && (
          <div className="p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50 text-center">
            <Trophy className="mx-auto mb-3 text-white/20" size={32} />
            Sem jogos registrados ainda.
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
                    {/* base do pódio */}
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

            {/* POWER RANKING — mexidas */}
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
