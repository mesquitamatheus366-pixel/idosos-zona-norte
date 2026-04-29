import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Shuffle, Target, ListChecks, Star, Calendar, X, UserPlus2, Trophy } from "lucide-react";
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

type MelhorMes = {
  jogador_id: string;
  nome: string;
  apelido: string | null;
  posicao: Posicao;
  foto_url: string | null;
  nivel: number;
  gols: number;
  assistencias: number;
  mvps: number;
  pontos: number;
};

export function Home() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [agregados, setAgregados] = useState<Agregado[]>([]);
  const [melhorMes, setMelhorMes] = useState<MelhorMes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: jg }, { data: ag }, { data: mm }] = await Promise.all([
        supabase
          .from("jogadores")
          .select("id, nome, apelido, posicao, nivel, foto_url")
          .eq("ativo", true)
          .order("nome"),
        supabase.from("estatisticas_agregadas").select("*"),
        supabase.from("melhor_time_mes").select("*").order("pontos", { ascending: false }),
      ]);
      setJogadores((jg as Jogador[]) || []);
      setAgregados((ag as Agregado[]) || []);
      setMelhorMes((mm as MelhorMes[]) || []);
      setLoading(false);
    })();
  }, []);

  const fotosMap = useMemo(() => {
    const m: Record<string, Jogador> = {};
    jogadores.forEach((j) => (m[j.id] = j));
    return m;
  }, [jogadores]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* HERO com campo 3D ao lado */}
      <section className="relative overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,255,136,0.12),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88] mb-4">
              PELADA · MENSAL E DIÁRIA
            </p>
            <h1 className="font-['Roboto',sans-serif] font-bold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-6">
              Idosos da<br />
              <span className="text-[#22ff88]">Zona Norte</span>
            </h1>
            <p className="text-white/60 max-w-xl text-base sm:text-lg mb-8">
              Cadastro de jogadores, sorteio equilibrado, monte seu time ideal e
              acompanhe estatísticas de quem realmente joga.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/sorteio"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#22ff88] text-[#0b0b0b] font-bold text-[11px] tracking-[0.2em] hover:bg-[#5cffaa] shadow-[0_0_24px_rgba(34,255,136,0.3)]"
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

          {/* Campo 3D do melhor time do mês */}
          <CampoMelhorMes melhorMes={melhorMes} />
        </div>
      </section>

      {/* DESTAQUES — carrossel auto-rotativo */}
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
        <CarrosselLideres agregados={agregados} fotosMap={fotosMap} />
      </section>

      {/* 4 TIMES BUILDER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-white/[0.04]">
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.3em] text-[#22ff88] mb-1">MONTE OS TIMES</p>
          <h2 className="font-bold text-2xl sm:text-3xl">Os 4 times da pelada</h2>
          <p className="text-white/50 text-sm mt-1">
            Formação 1-2-2-1-1 (goleiro, 2 fixos, 2 alas, meio, pivô). Clica nas posições e escolhe os jogadores.
          </p>
        </div>
        {loading ? (
          <p className="text-white/40">Carregando...</p>
        ) : jogadores.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Cadastre jogadores na área Admin pra começar.
          </div>
        ) : (
          <Builder4Times jogadores={jogadores} />
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {jogadores.slice(0, 16).map((j) => (
              <Link
                key={j.id}
                to="/jogadores"
                className="group p-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-[#22ff88]/30 hover:bg-[#22ff88]/[0.04] transition-all text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center text-white/40 font-bold mb-2">
                  {j.foto_url ? (
                    <img src={j.foto_url} alt={j.nome} className="w-full h-full object-cover" />
                  ) : (
                    (j.apelido || j.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                  )}
                </div>
                <p className="text-xs font-bold truncate">{j.apelido || j.nome}</p>
                <p className="text-[8px] tracking-wider text-white/40 uppercase">{POSICAO_LABEL[j.posicao]}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ────────────── CARROSSEL LÍDERES ────────────── */

const MODOS_CARROSSEL = [
  { v: "gols" as const, label: "ARTILHEIRO", icon: <Target size={14} />, sufixo: "gols" },
  { v: "assistencias" as const, label: "GARÇOM", icon: <ListChecks size={14} />, sufixo: "assists" },
  { v: "mvp_count" as const, label: "MVP", icon: <Star size={14} />, sufixo: "MVPs" },
  { v: "jogos_disputados" as const, label: "PRESENÇA", icon: <Calendar size={14} />, sufixo: "jogos" },
];

function CarrosselLideres({
  agregados,
  fotosMap,
}: {
  agregados: Agregado[];
  fotosMap: Record<string, Jogador>;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % MODOS_CARROSSEL.length), 4000);
    return () => clearInterval(t);
  }, []);

  const modo = MODOS_CARROSSEL[idx];
  const top3 = useMemo(() => {
    return [...agregados]
      .sort((a, b) => (b[modo.v] as number) - (a[modo.v] as number))
      .filter((r) => (r[modo.v] as number) > 0)
      .slice(0, 3);
  }, [agregados, modo.v]);

  return (
    <div className="relative rounded-3xl border border-[#22ff88]/15 bg-gradient-to-br from-[#0e1612] to-[#0b0b0b] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,255,136,0.12),transparent_50%)] pointer-events-none" />
      <div className="relative p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-[#22ff88]">
            {modo.icon}
            <span className="text-[11px] tracking-[0.3em] font-bold">{modo.label}</span>
          </div>
          <div className="flex gap-1">
            {MODOS_CARROSSEL.map((m, i) => (
              <button
                key={m.v}
                onClick={() => setIdx(i)}
                className={`w-8 h-1 rounded-full transition-all ${i === idx ? "bg-[#22ff88]" : "bg-white/10 hover:bg-white/20"}`}
              />
            ))}
          </div>
        </div>

        {top3.length === 0 ? (
          <p className="text-white/40 py-8 text-center">Sem registros ainda em {modo.label.toLowerCase()}.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3.map((r, i) => {
              const f = fotosMap[r.jogador_id];
              const podium = ["🥇", "🥈", "🥉"][i];
              return (
                <div
                  key={`${modo.v}-${r.jogador_id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    i === 0
                      ? "border-[#22ff88]/40 bg-[#22ff88]/[0.06] shadow-[0_0_24px_rgba(34,255,136,0.12)]"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${i === 0 ? "ring-[#22ff88]" : "ring-white/15"} bg-white/5 flex items-center justify-center text-white/40 text-xs font-bold`}>
                      {f?.foto_url ? (
                        <img src={f.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (f?.apelido || r.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base">{podium}</p>
                      <p className="font-bold truncate text-sm">{f?.apelido || r.nome}</p>
                      <p className={`font-bold tabular-nums leading-none ${i === 0 ? "text-[#22ff88]" : "text-white/70"}`}>
                        {r[modo.v] as number}
                        <span className="text-[10px] text-white/40 ml-1 font-normal">{modo.sufixo}</span>
                      </p>
                    </div>
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

/* ────────────── CAMPO 3D MELHOR DO MÊS ────────────── */

const FORMACAO: { pos: Posicao; top: string; left: string; idx: number }[] = [
  { pos: "pivo", top: "10%", left: "50%", idx: 0 },     // pivo
  { pos: "meio", top: "30%", left: "50%", idx: 0 },     // meio
  { pos: "ala", top: "48%", left: "20%", idx: 0 },      // ala esq
  { pos: "ala", top: "48%", left: "80%", idx: 1 },      // ala dir
  { pos: "fixo", top: "68%", left: "32%", idx: 0 },     // fixo esq
  { pos: "fixo", top: "68%", left: "68%", idx: 1 },     // fixo dir
  { pos: "goleiro", top: "88%", left: "50%", idx: 0 },  // goleiro
];

function CampoMelhorMes({ melhorMes }: { melhorMes: MelhorMes[] }) {
  const escalado = useMemo(() => {
    const usados = new Set<string>();
    return FORMACAO.map((spot) => {
      const candidatos = melhorMes
        .filter((m) => m.posicao === spot.pos && !usados.has(m.jogador_id) && m.pontos > 0);
      const escolhido = candidatos[spot.idx] || candidatos[0];
      if (escolhido) usados.add(escolhido.jogador_id);
      return { spot, jogador: escolhido };
    });
  }, [melhorMes]);

  return (
    <div className="relative" style={{ perspective: "1200px" }}>
      <div
        className="relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden border border-[#22ff88]/25 bg-gradient-to-b from-[#0a3d1f] via-[#06321a] to-[#0a3d1f] shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(34,255,136,0.1)]"
        style={{ transform: "rotateX(18deg)", transformStyle: "preserve-3d" }}
      >
        <CampoLinhas />
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div>
            <p className="text-[9px] tracking-[0.3em] text-[#22ff88]">MELHOR DO MÊS</p>
            <p className="text-white/60 text-[10px]">
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase()}
            </p>
          </div>
          <Trophy className="text-[#22ff88]" size={18} />
        </div>
        {escalado.map((e, i) => (
          <div
            key={i}
            className="absolute"
            style={{ top: e.spot.top, left: e.spot.left, transform: "translate(-50%, -50%)" }}
          >
            {e.jogador ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white ring-2 ring-[#22ff88] overflow-hidden flex items-center justify-center text-[#0b0b0b] font-bold text-[10px] shadow-[0_0_12px_rgba(34,255,136,0.5)]">
                  {e.jogador.foto_url ? (
                    <img src={e.jogador.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (e.jogador.apelido || e.jogador.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                  )}
                </div>
                <p className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#22ff88] text-[#0b0b0b] whitespace-nowrap max-w-[70px] truncate">
                  {e.jogador.apelido || e.jogador.nome.split(" ")[0]}
                </p>
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-white/30 bg-black/30 flex items-center justify-center text-white/40 text-[9px] font-bold uppercase">
                {POSICAO_LABEL[e.spot.pos].slice(0, 3)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CampoLinhas() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 130" preserveAspectRatio="none">
      <defs>
        <pattern id="grama" width="6" height="130" patternUnits="userSpaceOnUse">
          <rect width="3" height="130" fill="rgba(0,0,0,0)" />
          <rect x="3" width="3" height="130" fill="rgba(255,255,255,0.025)" />
        </pattern>
      </defs>
      <rect width="100" height="130" fill="url(#grama)" />
      <g stroke="rgba(255,255,255,0.22)" strokeWidth="0.4" fill="none">
        <rect x="3" y="3" width="94" height="124" />
        <line x1="3" y1="65" x2="97" y2="65" />
        <circle cx="50" cy="65" r="9" />
        <circle cx="50" cy="65" r="0.6" fill="rgba(255,255,255,0.5)" />
        <rect x="30" y="3" width="40" height="14" />
        <rect x="30" y="113" width="40" height="14" />
        <rect x="40" y="3" width="20" height="6" />
        <rect x="40" y="121" width="20" height="6" />
      </g>
    </svg>
  );
}

/* ────────────── 4 TIMES BUILDER ────────────── */

type SpotKey = string; // formato "time-X-spot-Y"

const SPOTS_TIME: { id: string; pos: Posicao; top: string; left: string }[] = [
  { id: "pivo", pos: "pivo", top: "12%", left: "50%" },
  { id: "meio", pos: "meio", top: "32%", left: "50%" },
  { id: "ala-e", pos: "ala", top: "50%", left: "20%" },
  { id: "ala-d", pos: "ala", top: "50%", left: "80%" },
  { id: "fixo-e", pos: "fixo", top: "70%", left: "30%" },
  { id: "fixo-d", pos: "fixo", top: "70%", left: "70%" },
  { id: "gk", pos: "goleiro", top: "90%", left: "50%" },
];

const NOMES_TIMES = ["Vermelho 1", "Vermelho 2", "Azul 1", "Azul 2"];
const CORES_TIMES = [
  { fundo: "from-[#3a0a0a] via-[#2a0606] to-[#3a0a0a]", borda: "border-rose-500/30", txt: "text-rose-300" },
  { fundo: "from-[#3a0a0a] via-[#2a0606] to-[#3a0a0a]", borda: "border-rose-500/30", txt: "text-rose-300" },
  { fundo: "from-[#0a1f3a] via-[#06122a] to-[#0a1f3a]", borda: "border-sky-500/30", txt: "text-sky-300" },
  { fundo: "from-[#0a1f3a] via-[#06122a] to-[#0a1f3a]", borda: "border-sky-500/30", txt: "text-sky-300" },
];

function Builder4Times({ jogadores }: { jogadores: Jogador[] }) {
  const [escalacao, setEscalacao] = useState<Record<SpotKey, Jogador | null>>({});
  const [picker, setPicker] = useState<{ time: number; spot: typeof SPOTS_TIME[0]; key: SpotKey } | null>(null);

  const usados = new Set(Object.values(escalacao).filter(Boolean).map((j) => j!.id));

  function setSpot(key: SpotKey, jogador: Jogador | null) {
    setEscalacao((e) => ({ ...e, [key]: jogador }));
  }

  function limpar() {
    setEscalacao({});
  }

  function somaTime(time: number) {
    return SPOTS_TIME.reduce((s, sp) => {
      const j = escalacao[`t${time}-${sp.id}`];
      return s + (j?.nivel || 0);
    }, 0);
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={limpar}
          className="text-white/40 hover:text-rose-400 text-[10px] tracking-[0.18em]"
        >
          LIMPAR TODOS
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map((t) => {
          const cor = CORES_TIMES[t];
          const soma = somaTime(t);
          return (
            <div key={t} className="relative" style={{ perspective: "1100px" }}>
              <div
                className={`relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden border ${cor.borda} bg-gradient-to-b ${cor.fundo} shadow-[0_24px_60px_rgba(0,0,0,0.5)]`}
                style={{ transform: "rotateX(15deg)", transformStyle: "preserve-3d" }}
              >
                <CampoLinhas />
                <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                  <p className={`text-[10px] tracking-[0.25em] font-bold ${cor.txt}`}>
                    {NOMES_TIMES[t].toUpperCase()}
                  </p>
                  <p className="text-[10px] text-white/60 tabular-nums">
                    SOMA <span className={`font-bold ${cor.txt}`}>{soma}</span>
                  </p>
                </div>

                {SPOTS_TIME.map((sp) => {
                  const key: SpotKey = `t${t}-${sp.id}`;
                  const j = escalacao[key];
                  return (
                    <button
                      key={sp.id}
                      onClick={() => setPicker({ time: t, spot: sp, key })}
                      style={{ top: sp.top, left: sp.left, transform: "translate(-50%, -50%)" }}
                      className="absolute group"
                    >
                      {j ? (
                        <div className="flex flex-col items-center">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white ring-2 ring-[#22ff88] overflow-hidden flex items-center justify-center text-[#0b0b0b] font-bold text-[10px] shadow-[0_0_10px_rgba(34,255,136,0.5)] group-hover:scale-110 transition-transform">
                            {j.foto_url ? (
                              <img src={j.foto_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (j.apelido || j.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                            )}
                          </div>
                          <p className="mt-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-[#22ff88] text-[#0b0b0b] whitespace-nowrap max-w-[60px] truncate">
                            {j.apelido || j.nome.split(" ")[0]}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center opacity-80 group-hover:opacity-100">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-white/40 bg-black/40 flex items-center justify-center text-white/60 group-hover:border-[#22ff88] group-hover:text-[#22ff88]">
                            <UserPlus2 size={14} />
                          </div>
                          <p className="mt-0.5 text-[8px] tracking-[0.18em] text-white/70 font-bold uppercase">
                            {POSICAO_LABEL[sp.pos].slice(0, 3)}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {picker && (
        <PickerJogador
          spot={picker.spot}
          jogadores={jogadores}
          usados={usados}
          atual={escalacao[picker.key]}
          tituloTime={NOMES_TIMES[picker.time]}
          onClose={() => setPicker(null)}
          onPick={(j) => {
            setSpot(picker.key, j);
            setPicker(null);
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
  tituloTime,
  onClose,
  onPick,
}: {
  spot: { pos: Posicao };
  jogadores: Jogador[];
  usados: Set<string>;
  atual: Jogador | null | undefined;
  tituloTime?: string;
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
            <p className="text-[10px] tracking-[0.3em] text-[#22ff88]">
              ESCOLHER · {tituloTime?.toUpperCase()}
            </p>
            <h2 className="font-bold text-xl mt-0.5">{POSICAO_LABEL[spot.pos]}</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-2 flex-wrap">
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
