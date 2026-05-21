import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Shuffle, Check, RotateCcw, Save, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

type Posicao = "goleiro" | "fixo" | "ala" | "meio" | "pivo";
type Tipo = "mensal" | "diarista" | "sem_registro";

type Jogador = {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  nivel: number;
  foto_url: string | null;
  tipo: Tipo;
};

type Time = { numero: number; jogadores: Jogador[]; soma: number };
type Resultado = { times: Time[]; reservas: Jogador[] };

type CorBase = "vermelho" | "azul";

const MAX_POR_TIME = 7; // 1 goleiro + 6 linha

const POSICAO_LABEL: Record<Posicao, string> = {
  goleiro: "Goleiro",
  fixo: "Fixo",
  ala: "Ala",
  meio: "Meio",
  pivo: "Pivô",
};

function rotuloTime(numero: number, base: CorBase, total: number): { label: string; cor: string; bg: string } {
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
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "mensal" | "diarista">("todos");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [corBase, setCorBase] = useState<CorBase>("vermelho");
  const [salvandoJogo, setSalvandoJogo] = useState(false);
  const [movendoId, setMovendoId] = useState<string | null>(null);
  const [parcerias, setParcerias] = useState<Map<string, number>>(new Map());

  function chaveDupla(a: string, b: string) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function moverJogador(jogadorId: string, destino: number | "reserva") {
    if (!resultado) return;
    const times = resultado.times.map((t) => ({ ...t, jogadores: [...t.jogadores] }));
    let reservas = [...resultado.reservas];
    let jogador: Jogador | undefined;

    for (const t of times) {
      const idx = t.jogadores.findIndex((j) => j.id === jogadorId);
      if (idx >= 0) {
        jogador = t.jogadores[idx];
        t.jogadores.splice(idx, 1);
        break;
      }
    }
    if (!jogador) {
      const idx = reservas.findIndex((j) => j.id === jogadorId);
      if (idx >= 0) {
        jogador = reservas[idx];
        reservas.splice(idx, 1);
      }
    }
    if (!jogador) return;

    if (destino === "reserva") {
      reservas.push(jogador);
    } else {
      const t = times.find((t) => t.numero === destino);
      if (!t) return;
      if (t.jogadores.length >= MAX_POR_TIME) {
        toast.error(`Time cheio (máx ${MAX_POR_TIME})`);
        return;
      }
      t.jogadores.push(jogador);
    }
    times.forEach((t) => (t.soma = t.jogadores.reduce((s, j) => s + j.nivel, 0)));
    setResultado({ times, reservas });
    setMovendoId(null);
  }

  useEffect(() => {
    (async () => {
      const [{ data: jg }, { data: st }, { data: pc }] = await Promise.all([
        supabase
          .from("jogadores")
          .select("id, nome, apelido, posicao, nivel, foto_url")
          .eq("ativo", true)
          .order("nome"),
        supabase.from("jogador_status").select("jogador_id, tipo_atual"),
        supabase.from("parcerias").select("jogador_a, jogador_b, vezes_juntos"),
      ]);
      const tipoMap = new Map<string, Tipo>();
      ((st as any[]) || []).forEach((s) => tipoMap.set(s.jogador_id, s.tipo_atual));
      setJogadores(
        ((jg as any[]) || []).map((j) => ({
          ...j,
          tipo: (tipoMap.get(j.id) || "sem_registro") as Tipo,
        }))
      );
      const pMap = new Map<string, number>();
      ((pc as any[]) || []).forEach((p) => {
        pMap.set(chaveDupla(p.jogador_a, p.jogador_b), Number(p.vezes_juntos));
      });
      setParcerias(pMap);
    })();
  }, []);

  const visiveis = useMemo(() => {
    if (filtroTipo === "todos") return jogadores;
    return jogadores.filter((j) => j.tipo === filtroTipo);
  }, [jogadores, filtroTipo]);

  function toggle(id: string) {
    const next = new Set(selecionados);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelecionados(next);
  }

  function marcarTodos() {
    // marca todos os visíveis (respeitando o filtro)
    const next = new Set(selecionados);
    visiveis.forEach((j) => next.add(j.id));
    setSelecionados(next);
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
    const res = distribuirEquilibrado(presentes, numTimes, parcerias);
    setResultado(res);
    if (res.reservas.length > 0) {
      toast.info(`${res.reservas.length} jogador(es) ficaram de reserva (times cheios — máx ${MAX_POR_TIME} por time)`);
    }
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
    const rows = resultado.times.flatMap((t) =>
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

  const selVisiveis = visiveis.filter((j) => selecionados.has(j.id)).length;
  const goleirosCount = useMemo(
    () => jogadores.filter((j) => selecionados.has(j.id) && j.posicao === "goleiro").length,
    [jogadores, selecionados]
  );

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* HEADER */}
      <div className="relative border-b border-white/[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,255,136,0.1),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-[2px] rounded-full bg-[#22ff88]" />
            <p className="font-['Archivo',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88]">
EQUILIBRA NÍVEL, POSIÇÃO E VARIA PARCEIROS
            </p>
          </div>
          <h1 className="font-['Archivo',sans-serif] font-black text-5xl sm:text-6xl tracking-tight">
            Sorteio de Times
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {jogadores.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Nenhum jogador cadastrado. Cadastre na área Admin primeiro.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA DE SELEÇÃO */}
            <div className="lg:col-span-2">
              {/* Filtro tipo */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {([
                  { v: "todos", label: "TODOS" },
                  { v: "mensal", label: "MENSALISTAS" },
                  { v: "diarista", label: "DIARISTAS" },
                ] as const).map((f) => {
                  const n =
                    f.v === "todos"
                      ? jogadores.length
                      : jogadores.filter((j) => j.tipo === f.v).length;
                  return (
                    <button
                      key={f.v}
                      onClick={() => setFiltroTipo(f.v)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] tracking-[0.18em] font-bold border transition-all ${
                        filtroTipo === f.v
                          ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88] shadow-[0_0_14px_rgba(34,255,136,0.3)]"
                          : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {f.label} · {n}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-white/60 text-sm">
                  {selecionados.size} marcados ({selVisiveis} nesse filtro) · {goleirosCount} goleiro(s)
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={marcarTodos}
                    className="px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-[10px] tracking-[0.18em]"
                  >
                    MARCAR FILTRO
                  </button>
                  <button
                    onClick={limpar}
                    className="px-3 py-1.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 text-[10px] tracking-[0.18em]"
                  >
                    LIMPAR
                  </button>
                </div>
              </div>

              {visiveis.length === 0 ? (
                <p className="text-white/40 text-sm py-6 text-center">
                  Nenhum jogador {filtroTipo === "mensal" ? "mensalista" : "diarista"} neste mês.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visiveis.map((j) => {
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
                          className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
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
                        <span
                          className={`text-[8px] tracking-[0.15em] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            j.tipo === "mensal"
                              ? "text-[#22ff88] bg-[#22ff88]/10"
                              : j.tipo === "diarista"
                              ? "text-white/60 bg-white/[0.06]"
                              : "text-white/30"
                          }`}
                        >
                          {j.tipo === "mensal" ? "MEN" : j.tipo === "diarista" ? "DIA" : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUNA DE CONTROLES + RESULTADO */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-[10px] tracking-[0.18em] text-white/40 mb-2">
                  QUANTIDADE DE TIMES
                </p>
                <div className="flex gap-2 mb-2">
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
                <p className="text-[10px] text-white/40 mb-4">
                  Máx {MAX_POR_TIME} por time (1 goleiro + 6 linha). Capacidade: {numTimes * MAX_POR_TIME} jogadores.
                </p>
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
            <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
              <p className="text-[10px] tracking-[0.3em] text-white/40">TIMES SORTEADOS</p>
              <button
                onClick={() => setCorBase((c) => (c === "vermelho" ? "azul" : "vermelho"))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-[10px] tracking-[0.18em]"
              >
                <RefreshCw size={12} /> INVERTER COLETES
              </button>
            </div>
            <p className="text-white/40 text-xs mb-4">
              {movendoId
                ? "Agora clique no time (ou no banco) pra mover o jogador. Clique nele de novo pra cancelar."
                : "Quer ajustar manualmente? Clique num jogador pra movê-lo de time."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {resultado.times.map((t) => {
                const r = rotuloTime(t.numero, corBase, resultado.times.length);
                const podeReceber = movendoId && t.jogadores.length < MAX_POR_TIME;
                return (
                  <div
                    key={t.numero}
                    onClick={() => podeReceber && moverJogador(movendoId!, t.numero)}
                    className={`p-5 rounded-2xl border transition-all ${r.bg} ${
                      podeReceber
                        ? "ring-2 ring-[#22ff88]/60 cursor-pointer hover:bg-[#22ff88]/[0.08]"
                        : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between mb-3">
                      <h3 className={`font-bold text-xl ${r.cor}`}>{r.label}</h3>
                      <p className="text-[10px] tracking-[0.15em] text-white/40">
                        {t.jogadores.length}/{MAX_POR_TIME} · SOMA {t.soma}
                      </p>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {t.jogadores.map((p) => (
                        <li key={p.id}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMovendoId(movendoId === p.id ? null : p.id);
                            }}
                            className={`w-full flex items-center justify-between gap-2 border-b border-white/[0.04] py-1.5 text-left rounded transition-colors ${
                              movendoId === p.id
                                ? "bg-[#22ff88]/15 ring-1 ring-[#22ff88]/50 px-1.5"
                                : "text-white/85 hover:bg-white/[0.04] px-1.5"
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              {p.posicao === "goleiro" && "🧤"}
                              <span className="truncate">{p.apelido || p.nome}</span>
                            </span>
                            <span className="text-white/40 text-[10px] tracking-wider uppercase shrink-0">
                              {POSICAO_LABEL[p.posicao].slice(0, 3)} · N{p.nivel}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {(resultado.reservas.length > 0 || movendoId) && (
              <div
                onClick={() => movendoId && moverJogador(movendoId, "reserva")}
                className={`mt-4 p-5 rounded-2xl border transition-all ${
                  movendoId
                    ? "border-[#22ff88]/50 ring-2 ring-[#22ff88]/40 bg-[#22ff88]/[0.04] cursor-pointer"
                    : "border-amber-500/25 bg-amber-500/[0.04]"
                }`}
              >
                <p className={`text-[10px] tracking-[0.3em] mb-2 ${movendoId ? "text-[#22ff88]" : "text-amber-400"}`}>
                  BANCO / RESERVAS ({resultado.reservas.length})
                </p>
                <p className="text-white/40 text-xs mb-3">
                  {movendoId
                    ? "Clique aqui pra mandar o jogador pro banco."
                    : `Times cheios (${MAX_POR_TIME} por time) ou movidos manualmente.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {resultado.reservas.map((p) => (
                    <button
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovendoId(movendoId === p.id ? null : p.id);
                      }}
                      className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                        movendoId === p.id
                          ? "bg-[#22ff88]/15 border-[#22ff88]/50 text-white"
                          : "bg-white/[0.04] border-white/10 text-white/70 hover:border-white/30"
                      }`}
                    >
                      {p.posicao === "goleiro" && "🧤 "}
                      {p.apelido || p.nome}
                    </button>
                  ))}
                  {resultado.reservas.length === 0 && (
                    <span className="text-white/30 text-xs">Vazio</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * Algoritmo (modo d): equilibra POR POSIÇÃO, varia PARCEIROS e equilibra nível.
 * - 1 goleiro por time
 * - Cada posição (fixo, ala, meio, pivô) é distribuída separadamente
 * - Prioridade ao escolher o time do jogador:
 *   1º balanço de posição · 2º variar parceiros (quem jogou junto fica separado)
 *   3º nível (time mais fraco) · 4º menos gente
 * - Máx 7 por time. Sobras viram reservas.
 */
function distribuirEquilibrado(
  jogadores: Jogador[],
  n: number,
  parcerias: Map<string, number>
): Resultado {
  const times: Time[] = Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    jogadores: [],
    soma: 0,
  }));
  const reservas: Jogador[] = [];

  const chave = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  function alocar(j: Jogador, balancearPosicao: boolean) {
    const candidatos = times
      .map((t, i) => ({
        i,
        countPos: balancearPosicao
          ? t.jogadores.filter((x) => x.posicao === j.posicao).length
          : 0,
        // soma de quantas vezes j já jogou com cada membro do time
        parceria: t.jogadores.reduce(
          (s, x) => s + (parcerias.get(chave(j.id, x.id)) || 0),
          0
        ),
        count: t.jogadores.length,
        soma: t.soma,
      }))
      .filter((t) => t.count < MAX_POR_TIME)
      .sort(
        (a, b) =>
          a.countPos - b.countPos || // 1º: menos jogadores dessa posição
          a.parceria - b.parceria || // 2º: variar parceiros (menos repetição)
          a.soma - b.soma ||         // 3º: time mais fraco
          a.count - b.count          // 4º: time com menos gente
      );
    if (candidatos.length === 0) {
      reservas.push(j);
      return;
    }
    const idx = candidatos[0].i;
    times[idx].jogadores.push(j);
    times[idx].soma += j.nivel;
  }

  // 1) Goleiros — 1 por time; extras entram depois como linha
  const goleiros = shuffle(jogadores.filter((j) => j.posicao === "goleiro")).sort(
    (a, b) => b.nivel - a.nivel
  );
  const extraGoleiros: Jogador[] = [];
  goleiros.forEach((g, i) => {
    if (i < n) {
      times[i].jogadores.push(g);
      times[i].soma += g.nivel;
    } else {
      extraGoleiros.push(g);
    }
  });

  // 2) Cada posição de linha, equilibrando quantidade por posição
  for (const pos of ["fixo", "ala", "meio", "pivo"] as Posicao[]) {
    const grupo = shuffle(jogadores.filter((j) => j.posicao === pos)).sort(
      (a, b) => b.nivel - a.nivel
    );
    grupo.forEach((j) => alocar(j, true));
  }

  // 3) Goleiros extras — distribuídos só por nível (sem balancear posição)
  shuffle(extraGoleiros)
    .sort((a, b) => b.nivel - a.nivel)
    .forEach((j) => alocar(j, false));

  return { times, reservas };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
