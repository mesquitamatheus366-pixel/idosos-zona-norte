import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Award, Check, Target, ListChecks, Star } from "lucide-react";
import { toast } from "sonner";

type Posicao = "goleiro" | "fixo" | "ala" | "meio" | "pivo";

const POSICOES: { v: Posicao; label: string }[] = [
  { v: "goleiro", label: "Goleiro" },
  { v: "fixo", label: "Fixo" },
  { v: "ala", label: "Ala" },
  { v: "meio", label: "Meio" },
  { v: "pivo", label: "Pivô" },
];

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Votacao = { id: string; mes_referencia: string; aberta: boolean };

type Candidato = {
  jogador_id: string;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  foto_url: string | null;
  gols: number;
  assistencias: number;
  mvps: number;
  pontos: number;
};

type Resultado = { posicao: Posicao; jogador_id: string; votos: number };

// id anônimo do votante guardado no navegador
function getVotanteId(): string {
  let id = localStorage.getItem("izn_votante");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("izn_votante", id);
  }
  return id;
}

export function Craques() {
  const [votacao, setVotacao] = useState<Votacao | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [meusVotos, setMeusVotos] = useState<Record<string, string>>({}); // posicao -> jogador_id
  const [loading, setLoading] = useState(true);
  const votanteId = useMemo(() => getVotanteId(), []);

  async function carregar() {
    setLoading(true);
    const { data: vt } = await supabase
      .from("votacao_craques")
      .select("*")
      .order("mes_referencia", { ascending: false })
      .limit(1);
    const v = (vt as Votacao[])?.[0] || null;
    setVotacao(v);

    const { data: mm } = await supabase
      .from("melhor_time_mes")
      .select("*")
      .order("pontos", { ascending: false });
    setCandidatos((mm as Candidato[]) || []);

    if (v) {
      const [{ data: res }, { data: mv }] = await Promise.all([
        supabase.from("resultado_craques").select("*").eq("votacao_id", v.id),
        supabase
          .from("votos_craques")
          .select("posicao, jogador_id")
          .eq("votacao_id", v.id)
          .eq("votante", votanteId),
      ]);
      setResultados((res as Resultado[]) || []);
      const map: Record<string, string> = {};
      ((mv as any[]) || []).forEach((m) => (map[m.posicao] = m.jogador_id));
      setMeusVotos(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function votar(posicao: Posicao, jogadorId: string) {
    if (!votacao) return;
    if (!votacao.aberta) {
      toast.error("Votação encerrada.");
      return;
    }
    if (meusVotos[posicao]) {
      toast.error("Você já votou nessa posição.");
      return;
    }
    const { error } = await supabase.from("votos_craques").insert({
      votacao_id: votacao.id,
      posicao,
      jogador_id: jogadorId,
      votante: votanteId,
    });
    if (error) {
      toast.error(error.code === "23505" ? "Você já votou nessa posição." : error.message);
      return;
    }
    toast.success("Voto computado! 🗳️");
    setMeusVotos((m) => ({ ...m, [posicao]: jogadorId }));
    // atualiza resultados
    const { data: res } = await supabase
      .from("resultado_craques")
      .select("*")
      .eq("votacao_id", votacao.id);
    setResultados((res as Resultado[]) || []);
  }

  const mesLabel = useMemo(() => {
    if (!votacao) return "";
    const [ano, mes] = votacao.mes_referencia.split("-").map(Number);
    return `${MESES[mes - 1]} ${ano}`;
  }, [votacao]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* HEADER */}
      <div className="relative border-b border-white/[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,255,136,0.12),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-[2px] rounded-full bg-[#22ff88]" />
            <p className="font-['Archivo',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88]">
              VOTAÇÃO POPULAR
            </p>
          </div>
          <h1 className="font-['Archivo',sans-serif] font-black text-5xl sm:text-6xl tracking-tight">
            Craques do Mês
          </h1>
          {votacao && (
            <p className="text-white/50 mt-3">
              {mesLabel} ·{" "}
              {votacao.aberta ? (
                <span className="text-[#22ff88]">Votação aberta — escolha 1 por posição</span>
              ) : (
                <span className="text-amber-400">Votação encerrada — resultado final</span>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading && <p className="text-white/40">Carregando...</p>}

        {!loading && !votacao && (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Nenhuma votação aberta no momento. O admin libera a votação dos craques no fim do mês.
          </div>
        )}

        {!loading && votacao && (
          <div className="space-y-8">
            {POSICOES.map((pos) => {
              const cands = candidatos
                .filter((c) => c.posicao === pos.v)
                .sort((a, b) => Number(b.pontos) - Number(a.pontos));
              if (cands.length === 0) return null;

              const votosPos = resultados.filter((r) => r.posicao === pos.v);
              const totalVotos = votosPos.reduce((s, r) => s + r.votos, 0);
              const jaVotou = !!meusVotos[pos.v];
              const mostrarResultado = jaVotou || !votacao.aberta;

              return (
                <div key={pos.v}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-[2px] rounded-full bg-[#22ff88]" />
                    <h2 className="font-['Archivo',sans-serif] font-extrabold text-2xl">
                      {pos.label}
                    </h2>
                    {jaVotou && (
                      <span className="text-[10px] tracking-[0.15em] text-[#22ff88] flex items-center gap-1">
                        <Check size={12} /> VOTADO
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cands.map((c) => {
                      const votos = votosPos.find((r) => r.jogador_id === c.jogador_id)?.votos || 0;
                      const pct = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
                      const euVotei = meusVotos[pos.v] === c.jogador_id;

                      return (
                        <div
                          key={c.jogador_id}
                          className={`relative p-4 rounded-2xl border overflow-hidden transition-all ${
                            euVotei
                              ? "border-[#22ff88]/50 bg-[#22ff88]/[0.07]"
                              : "border-white/[0.06] bg-white/[0.02]"
                          }`}
                        >
                          {/* Barra de % ao fundo */}
                          {mostrarResultado && (
                            <div
                              className="absolute inset-y-0 left-0 bg-[#22ff88]/[0.08]"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="relative flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center text-white/40 text-xs font-bold shrink-0">
                              {c.foto_url ? (
                                <img src={c.foto_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (c.apelido || c.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{c.apelido || c.nome}</p>
                              <div className="flex gap-2.5 mt-0.5 text-[10px] text-white/50">
                                <span className="flex items-center gap-0.5">
                                  <Target size={10} className="text-[#22ff88]" /> {c.gols}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <ListChecks size={10} /> {c.assistencias}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Star size={10} className="text-[#22ff88]" /> {c.mvps}
                                </span>
                              </div>
                            </div>
                            {mostrarResultado ? (
                              <div className="text-right shrink-0">
                                <p className="font-extrabold text-lg text-[#22ff88] tabular-nums leading-none">
                                  {pct}%
                                </p>
                                <p className="text-[9px] text-white/40">{votos} voto{votos !== 1 ? "s" : ""}</p>
                              </div>
                            ) : (
                              <button
                                onClick={() => votar(pos.v, c.jogador_id)}
                                className="shrink-0 px-4 py-2 rounded-full bg-[#22ff88] text-[#0b0b0b] font-bold text-[10px] tracking-[0.18em] hover:bg-[#5cffaa]"
                              >
                                VOTAR
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
