import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Shuffle, Trophy, Target, ListChecks, Star, Calendar, X, UserPlus2 } from "lucide-react";
import { supabase } from "../lib/supabase";

type Posicao = "goleiro" | "fixo" | "ala" | "meio" | "pivo";

const POSICAO_LABEL: Record<Posicao, string> = {
  goleiro: "Goleiro",
  fixo: "Fixo",
  ala: "Ala",
  meio: "Meio",
  pivo: "Pivô",
};

type Jogador = {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  nivel: number;
  foto_url: string | null;
};

type Agregado = {
  jogador_id: string;
  nome: string;
  jogos_disputados: number;
  gols: number;
  assistencias: number;
  mvp_count: number;
};

export function Home() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [agregados, setAgregados] = useState<Agregado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: jg }, { data: ag }] = await Promise.all([
        supabase
          .from("jogadores")
          .select("id, nome, apelido, posicao, nivel, foto_url")
          .eq("ativo", true)
          .order("nome"),
        supabase.from("estatisticas_agregadas").select("*"),
      ]);
      setJogadores((jg as Jogador[]) || []);
      setAgregados((ag as Agregado[]) || []);
      setLoading(false);
    })();
  }, []);

  const fotosMap = useMemo(() => {
    const m: Record<string, Jogador> = {};
    jogadores.forEach((j) => (m[j.id] = j));
    return m;
  }, [jogadores]);

  const lider = (campo: keyof Agregado) =>
    [...agregados]
      .sort((a, b) => (b[campo] as number) - (a[campo] as number))
      .find((r) => (r[campo] as number) > 0);

  const artilheiro = lider("gols");
  const garcom = lider("assistencias");
  const mvp = lider("mvp_count");
  const presenca = lider("jogos_disputados");

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,255,136,0.12),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88] mb-4">
            PELADA · MENSAL E DIÁRIA
          </p>
          <h1 className="font-['Roboto',sans-serif] font-bold text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6">
            Idosos da<br />
            <span className="text-[#22ff88]">Zona Norte</span>
          </h1>
          <p className="text-white/60 max-w-xl text-lg mb-8">
            Cadastro de jogadores, sorteio equilibrado, monte seu time ideal e
            acompanhe estatísticas de quem realmente joga.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/sorteio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#22ff88] text-[#0b0b0b] font-bold text-[11px] tracking-[0.2em] hover:bg-[#5cffaa] transition-colors shadow-[0_0_24px_rgba(34,255,136,0.3)]"
            >
              <Shuffle size={14} /> SORTEAR TIMES
            </Link>
            <Link
              to="/jogadores"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white/80 font-bold text-[11px] tracking-[0.2em] hover:border-white/40 hover:text-white"
            >
              VER JOGADORES <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* TOPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-[#22ff88] mb-1">DESTAQUES</p>
            <h2 className="font-bold text-2xl sm:text-3xl">Líderes da pelada</h2>
          </div>
          <Link to="/estatisticas" className="text-white/50 hover:text-[#22ff88] text-[10px] tracking-[0.2em] flex items-center gap-1">
            VER TUDO <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CardLider titulo="Artilheiro" icone={<Target size={14} />} ag={artilheiro} foto={fotosMap[artilheiro?.jogador_id || ""]} campo="gols" sufixo="gols" />
          <CardLider titulo="Garçom" icone={<ListChecks size={14} />} ag={garcom} foto={fotosMap[garcom?.jogador_id || ""]} campo="assistencias" sufixo="assists" />
          <CardLider titulo="MVPs" icone={<Star size={14} />} ag={mvp} foto={fotosMap[mvp?.jogador_id || ""]} campo="mvp_count" sufixo="MVPs" />
          <CardLider titulo="Presença" icone={<Calendar size={14} />} ag={presenca} foto={fotosMap[presenca?.jogador_id || ""]} campo="jogos_disputados" sufixo="jogos" />
        </div>
      </section>

      {/* FUT7 BUILDER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-white/[0.04]">
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.3em] text-[#22ff88] mb-1">MONTE SEU TIME</p>
          <h2 className="font-bold text-2xl sm:text-3xl">Time ideal · Fut7</h2>
          <p className="text-white/50 text-sm mt-1">
            Clique nas posições e escolha jogadores cadastrados.
          </p>
        </div>
        {loading ? (
          <p className="text-white/40">Carregando...</p>
        ) : jogadores.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Cadastre jogadores na área Admin pra começar.
          </div>
        ) : (
          <Fut7Builder jogadores={jogadores} />
        )}
      </section>

      {/* JOGADORES CADASTRADOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-white/[0.04]">
        <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-[#22ff88] mb-1">ELENCO</p>
            <h2 className="font-bold text-2xl sm:text-3xl">Jogadores cadastrados</h2>
          </div>
          <Link to="/jogadores" className="text-white/50 hover:text-[#22ff88] text-[10px] tracking-[0.2em] flex items-center gap-1">
            VER TODOS <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <p className="text-white/40">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {jogadores.slice(0, 12).map((j) => (
              <Link
                key={j.id}
                to="/jogadores"
                className="group p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-[#22ff88]/30 hover:bg-[#22ff88]/[0.04] transition-all text-center"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center text-white/40 font-bold mb-2">
                  {j.foto_url ? (
                    <img src={j.foto_url} alt={j.nome} className="w-full h-full object-cover" />
                  ) : (
                    (j.apelido || j.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                  )}
                </div>
                <p className="text-sm font-bold truncate">{j.apelido || j.nome}</p>
                <p className="text-[9px] tracking-wider text-white/40 uppercase">{POSICAO_LABEL[j.posicao]}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CardLider({
  titulo,
  icone,
  ag,
  foto,
  campo,
  sufixo,
}: {
  titulo: string;
  icone: React.ReactNode;
  ag: Agregado | undefined;
  foto: Jogador | undefined;
  campo: keyof Agregado;
  sufixo: string;
}) {
  return (
    <div className="p-4 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-[#22ff88]/25 transition-colors">
      <div className="flex items-center gap-1.5 text-[#22ff88] mb-3">
        {icone}
        <span className="text-[9px] tracking-[0.2em] uppercase">{titulo}</span>
      </div>
      {ag && foto ? (
        <>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center text-white/40 text-xs font-bold shrink-0">
              {foto.foto_url ? (
                <img src={foto.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (foto.apelido || foto.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate text-sm">{foto.apelido || foto.nome}</p>
              <p className="text-2xl font-bold text-[#22ff88] tabular-nums leading-none mt-0.5">
                {ag[campo] as number}
                <span className="text-[10px] text-white/40 ml-1 font-normal">{sufixo}</span>
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-white/30 text-sm py-2">Sem registros</p>
      )}
    </div>
  );
}

/* ────────────── FUT7 BUILDER ────────────── */

type Spot = { id: string; pos: Posicao; top: string; left: string };

const SPOTS: Spot[] = [
  { id: "pivo", pos: "pivo", top: "8%", left: "50%" },
  { id: "meio", pos: "meio", top: "28%", left: "50%" },
  { id: "ala-e", pos: "ala", top: "44%", left: "20%" },
  { id: "ala-d", pos: "ala", top: "44%", left: "80%" },
  { id: "fixo", pos: "fixo", top: "62%", left: "50%" },
  { id: "ala2-e", pos: "ala", top: "76%", left: "30%" },
  { id: "goleiro", pos: "goleiro", top: "88%", left: "50%" },
];

function Fut7Builder({ jogadores }: { jogadores: Jogador[] }) {
  const [escalacao, setEscalacao] = useState<Record<string, Jogador | null>>({});
  const [pickerSpot, setPickerSpot] = useState<Spot | null>(null);

  const usados = new Set(Object.values(escalacao).filter(Boolean).map((j) => j!.id));

  function setSpot(spotId: string, jogador: Jogador | null) {
    setEscalacao((e) => ({ ...e, [spotId]: jogador }));
  }

  function limparTudo() {
    setEscalacao({});
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* CAMPO */}
        <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden border border-[#22ff88]/20 bg-gradient-to-b from-[#0a3d1f] via-[#072a14] to-[#0a3d1f] shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]">
          {/* linhas do campo */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 130" preserveAspectRatio="none">
            <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" fill="none">
              <rect x="3" y="3" width="94" height="124" />
              <line x1="3" y1="65" x2="97" y2="65" />
              <circle cx="50" cy="65" r="9" />
              <circle cx="50" cy="65" r="0.6" fill="rgba(255,255,255,0.4)" />
              <rect x="30" y="3" width="40" height="14" />
              <rect x="30" y="113" width="40" height="14" />
              <rect x="40" y="3" width="20" height="6" />
              <rect x="40" y="121" width="20" height="6" />
            </g>
          </svg>

          {SPOTS.map((spot) => {
            const j = escalacao[spot.id];
            return (
              <button
                key={spot.id}
                onClick={() => setPickerSpot(spot)}
                style={{ top: spot.top, left: spot.left, transform: "translate(-50%, -50%)" }}
                className="absolute group"
              >
                {j ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white ring-2 ring-[#22ff88] overflow-hidden flex items-center justify-center text-[#0b0b0b] font-bold text-xs shadow-[0_0_16px_rgba(34,255,136,0.6)] group-hover:scale-110 transition-transform">
                      {j.foto_url ? (
                        <img src={j.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (j.apelido || j.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                      )}
                    </div>
                    <p className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#22ff88] text-[#0b0b0b] whitespace-nowrap max-w-[80px] truncate">
                      {j.apelido || j.nome.split(" ")[0]}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-white/40 bg-black/30 flex items-center justify-center text-white/60 group-hover:border-[#22ff88] group-hover:text-[#22ff88] group-hover:bg-[#22ff88]/10">
                      <UserPlus2 size={18} />
                    </div>
                    <p className="mt-1 text-[9px] tracking-[0.18em] text-white/70 font-bold uppercase">
                      {POSICAO_LABEL[spot.pos]}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ESCALAÇÃO LATERAL */}
        <div>
          <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Escalação</h3>
              <button
                onClick={limparTudo}
                className="text-white/40 hover:text-rose-400 text-[10px] tracking-[0.18em]"
              >
                LIMPAR
              </button>
            </div>
            <ul className="space-y-1.5 text-sm">
              {SPOTS.map((s) => {
                const j = escalacao[s.id];
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-white/[0.04] last:border-0"
                  >
                    <span className="text-[10px] tracking-[0.18em] text-white/40 uppercase w-16 shrink-0">
                      {POSICAO_LABEL[s.pos]}
                    </span>
                    <span className={`flex-1 text-right truncate ${j ? "text-white" : "text-white/30"}`}>
                      {j ? j.apelido || j.nome : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-[10px] text-white/40 mt-4">
              {usados.size}/{SPOTS.length} posições preenchidas
            </p>
          </div>
        </div>
      </div>

      {pickerSpot && (
        <PickerJogador
          spot={pickerSpot}
          jogadores={jogadores}
          usados={usados}
          atual={escalacao[pickerSpot.id]}
          onClose={() => setPickerSpot(null)}
          onPick={(j) => {
            setSpot(pickerSpot.id, j);
            setPickerSpot(null);
          }}
        />
      )}
    </>
  );
}

function PickerJogador({
  spot,
  jogadores,
  usados,
  atual,
  onClose,
  onPick,
}: {
  spot: Spot;
  jogadores: Jogador[];
  usados: Set<string>;
  atual: Jogador | null | undefined;
  onClose: () => void;
  onPick: (j: Jogador | null) => void;
}) {
  const [filtroPos, setFiltroPos] = useState<"recomendados" | "todos">("recomendados");

  const visiveis = useMemo(() => {
    return jogadores
      .filter((j) => !usados.has(j.id) || j.id === atual?.id)
      .filter((j) => filtroPos === "todos" || j.posicao === spot.pos);
  }, [jogadores, usados, atual, filtroPos, spot.pos]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col bg-gradient-to-b from-[#0e1612] to-[#0b0b0b] border border-[#22ff88]/15 rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-[#22ff88]">ESCOLHER JOGADOR</p>
            <h2 className="font-bold text-xl mt-0.5">{POSICAO_LABEL[spot.pos]}</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-2">
          <button
            onClick={() => setFiltroPos("recomendados")}
            className={`px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] font-bold border ${
              filtroPos === "recomendados"
                ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88]"
                : "border-white/10 text-white/60 hover:border-white/30"
            }`}
          >
            DA POSIÇÃO
          </button>
          <button
            onClick={() => setFiltroPos("todos")}
            className={`px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] font-bold border ${
              filtroPos === "todos"
                ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88]"
                : "border-white/10 text-white/60 hover:border-white/30"
            }`}
          >
            TODOS
          </button>
          {atual && (
            <button
              onClick={() => onPick(null)}
              className="ml-auto px-3 py-1.5 rounded-full text-[10px] tracking-[0.18em] font-bold border border-rose-400/30 text-rose-400 hover:bg-rose-400/10"
            >
              REMOVER
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-3 space-y-1">
          {visiveis.length === 0 && (
            <p className="text-white/40 text-center py-8 text-sm">Nenhum jogador disponível.</p>
          )}
          {visiveis.map((j) => (
            <button
              key={j.id}
              onClick={() => onPick(j)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                atual?.id === j.id
                  ? "border-[#22ff88] bg-[#22ff88]/10"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-[#22ff88]/30 hover:bg-[#22ff88]/[0.04]"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center text-white/40 text-xs font-bold shrink-0">
                {j.foto_url ? (
                  <img src={j.foto_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (j.apelido || j.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{j.apelido || j.nome}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">
                  {POSICAO_LABEL[j.posicao]} · nível {j.nivel}/10
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
