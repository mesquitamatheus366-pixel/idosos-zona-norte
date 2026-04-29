import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Shuffle, Check, RotateCcw, Save, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

type Posicao = "goleiro" | "fixo" | "ala" | "meio" | "pivo";

type Jogador = {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  nivel: number;
  foto_url: string | null;
};

type Time = { numero: number; jogadores: Jogador[]; soma: number };

type CorBase = "vermelho" | "azul";

const POSICAO_LABEL: Record<Posicao, string> = {
  goleiro: "Goleiro",
  fixo: "Fixo",
  ala: "Ala",
  meio: "Meio",
  pivo: "Pivô",
};

function rotuloTime(numero: number, base: CorBase, total: number): { label: string; cor: string; bg: string } {
  // numero 1..total: metade vermelha + metade azul (alternando se total for ímpar)
  const meio = Math.ceil(total / 2);
  const isVermelho = base === "vermelho" ? numero <= meio : numero > meio;
  const grupo = isVermelho ? "vermelho" : "azul";
  const indice = isVermelho
    ? base === "vermelho" ? numero : numero - meio
    : base === "vermelho" ? numero - meio : numero;
  const label = `${grupo === "vermelho" ? "Vermelho" : "Azul"} ${indice}`;
  const cor = grupo === "vermelho" ? "text-rose-400" : "text-sky-400";
  const bg = grupo === "vermelho"
    ? "border-rose-500/30 bg-rose-500/[0.05]"
    : "border-sky-500/30 bg-sky-500/[0.05]";
  return { label, cor, bg };
}

export function Sorteio() {
  const { user } = useAuth();
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [numTimes, setNumTimes] = useState(2);
  const [resultado, setResultado] = useState<Time[] | null>(null);
  const [corBase, setCorBase] = useState<CorBase>("vermelho");
  const [salvandoJogo, setSalvandoJogo] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("jogadores")
        .select("id, nome, apelido, posicao, nivel, foto_url")
        .eq("ativo", true)
        .order("nome");
      setJogadores((data as Jogador[]) || []);
    })();
  }, []);

  function toggle(id: string) {
    const next = new Set(selecionados);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelecionados(next);
  }

  function marcarTodos() {
    setSelecionados(new Set(jogadores.map((j) => j.id)));
  }

  function limpar() {
    setSelecionados(new Set());
    setResultado(null);
  }

  function sortear() {
    const presentes = jogadores.filter((j) => selecionados.has(j.id));
    if (presentes.length < numTimes * 2) {
      toast.error(`Mínimo ${numTimes * 2} jogadores para ${numTimes} times`);
      return;
    }
    setResultado(distribuirEquilibrado(presentes, numTimes));
  }

  async function salvarJogo() {
    if (!resultado) return;
    if (!user) {
      toast.error("Faça login no Admin para salvar o jogo.");
      return;
    }
    setSalvandoJogo(true);
    const { data: jogo, error: jErr } = await supabase
      .from("jogos")
      .insert({ data_jogo: new Date().toISOString(), tipo: "diaria" })
      .select()
      .single();
    if (jErr || !jogo) {
      toast.error(jErr?.message || "Erro ao criar jogo");
      setSalvandoJogo(false);
      return;
    }
    const rows = resultado.flatMap((t) =>
      t.jogadores.map((p) => ({
        jogo_id: jogo.id,
        jogador_id: p.id,
        time_numero: t.numero,
      }))
    );
    const { error: tErr } = await supabase.from("times_sorteados").insert(rows);
    setSalvandoJogo(false);
    if (tErr) toast.error(tErr.message);
    else toast.success("Sorteio salvo como jogo!");
  }

  const goleirosCount = useMemo(
    () => jogadores.filter((j) => selecionados.has(j.id) && j.posicao === "goleiro").length,
    [jogadores, selecionados]
  );

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Shuffle className="text-[#22ff88]" size={20} />
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88]">
            EQUILIBRADO POR NÍVEL E POSIÇÃO
          </p>
        </div>
        <h1 className="font-['Roboto',sans-serif] font-bold text-4xl sm:text-5xl mb-8">
          Sorteio de Times
        </h1>

        {jogadores.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Nenhum jogador cadastrado. Cadastre na área Admin primeiro.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA DE SELEÇÃO */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-white/60 text-sm">
                  {selecionados.size}/{jogadores.length} marcados · {goleirosCount} goleiro(s)
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={marcarTodos}
                    className="px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-[10px] tracking-[0.18em]"
                  >
                    MARCAR TODOS
                  </button>
                  <button
                    onClick={limpar}
                    className="px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-[10px] tracking-[0.18em]"
                  >
                    LIMPAR
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {jogadores.map((j) => {
                  const sel = selecionados.has(j.id);
                  return (
                    <button
                      key={j.id}
                      onClick={() => toggle(j.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        sel
                          ? "border-[#22ff88]/50 bg-[#22ff88]/[0.06]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          sel ? "bg-[#22ff88] border-[#22ff88] text-[#0b0b0b]" : "border-white/20"
                        }`}
                      >
                        {sel && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{j.apelido || j.nome}</p>
                        <p className="text-white/40 text-[10px] tracking-wider uppercase">
                          {POSICAO_LABEL[j.posicao]} · nível {j.nivel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLUNA DE CONTROLES + RESULTADO */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[10px] tracking-[0.18em] text-white/40 mb-2">
                  QUANTIDADE DE TIMES
                </p>
                <div className="flex gap-2 mb-4">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumTimes(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border ${
                        numTimes === n
                          ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88]"
                          : "border-white/15 text-white/60 hover:border-white/30"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <button
                  onClick={sortear}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#22ff88] text-[#0b0b0b] font-bold text-[11px] tracking-[0.2em]"
                >
                  <Shuffle size={14} /> SORTEAR
                </button>
                {resultado && (
                  <button
                    onClick={() => setResultado(null)}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 text-[10px] tracking-[0.18em]"
                  >
                    <RotateCcw size={12} /> NOVO SORTEIO
                  </button>
                )}
              </div>

              {resultado && user && (
                <button
                  onClick={salvarJogo}
                  disabled={salvandoJogo}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-[#22ff88]/40 text-[#22ff88] hover:bg-[#22ff88]/10 text-[11px] tracking-[0.18em] font-bold"
                >
                  <Save size={14} /> {salvandoJogo ? "SALVANDO..." : "SALVAR COMO JOGO"}
                </button>
              )}
            </div>
          </div>
        )}

        {resultado && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-[10px] tracking-[0.3em] text-white/40">TIMES SORTEADOS</p>
              <button
                onClick={() => setCorBase((c) => (c === "vermelho" ? "azul" : "vermelho"))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-[10px] tracking-[0.18em]"
              >
                <RefreshCw size={12} /> INVERTER COLETES
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {resultado.map((t) => {
                const r = rotuloTime(t.numero, corBase, resultado.length);
                return (
                  <div
                    key={t.numero}
                    className={`p-5 rounded-2xl border ${r.bg}`}
                  >
                    <div className="flex items-baseline justify-between mb-3">
                      <h3 className={`font-bold text-xl ${r.cor}`}>{r.label}</h3>
                      <p className="text-[10px] tracking-[0.15em] text-white/40">
                        SOMA {t.soma}
                      </p>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {t.jogadores.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-2 text-white/85 border-b border-white/[0.04] py-1.5 last:border-0"
                        >
                          <span className="truncate flex items-center gap-1.5">
                            {p.posicao === "goleiro" && "🧤"}
                            <span className="truncate">{p.apelido || p.nome}</span>
                          </span>
                          <span className="text-white/40 text-[10px] tracking-wider uppercase shrink-0">
                            {POSICAO_LABEL[p.posicao].slice(0, 3)} · N{p.nivel}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Algoritmo: 1 goleiro por time + linha equilibrada por nível (greedy descending) */
function distribuirEquilibrado(jogadores: Jogador[], n: number): Time[] {
  const times: Time[] = Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    jogadores: [],
    soma: 0,
  }));

  const goleiros = shuffle(jogadores.filter((j) => j.posicao === "goleiro"));
  const linha = jogadores.filter((j) => j.posicao !== "goleiro");

  // 1 goleiro por time; sobras viram linha
  goleiros.forEach((g, i) => {
    if (i < n) {
      times[i].jogadores.push(g);
      times[i].soma += g.nivel;
    } else {
      linha.push(g);
    }
  });

  // ordena linha por nível desc, com tie-break aleatório
  const linhaOrd = shuffle(linha).sort((a, b) => b.nivel - a.nivel);

  // greedy: cada jogador vai pro time de menor soma (com menos jogadores em caso de empate)
  for (const j of linhaOrd) {
    const idx = times
      .map((t, i) => ({ i, soma: t.soma, count: t.jogadores.length }))
      .sort((a, b) => a.soma - b.soma || a.count - b.count)[0].i;
    times[idx].jogadores.push(j);
    times[idx].soma += j.nivel;
  }

  return times;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
