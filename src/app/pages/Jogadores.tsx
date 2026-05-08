import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Users, X, Trophy, Target, ListChecks, Star, Calendar, Shield } from "lucide-react";

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
  ativo: boolean;
};

type Status = {
  jogador_id: string;
  tipo_atual: "mensal" | "diarista" | "sem_registro";
  meses_como_mensalista: number;
};

type StatLite = {
  jogador_id: string;
  jogos_disputados: number;
  gols: number;
  assistencias: number;
  mvp_count: number;
};

export function Jogadores() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [stats, setStats] = useState<Record<string, StatLite>>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | Posicao>("todos");
  const [aberto, setAberto] = useState<Jogador | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: jg }, { data: st }, { data: ag }] = await Promise.all([
        supabase.from("jogadores").select("*").eq("ativo", true).order("nome"),
        supabase.from("jogador_status").select("*"),
        supabase.from("estatisticas_agregadas").select("jogador_id, jogos_disputados, gols, assistencias, mvp_count"),
      ]);
      setJogadores((jg as Jogador[]) || []);
      const map: Record<string, Status> = {};
      ((st as Status[]) || []).forEach((s) => (map[s.jogador_id] = s));
      setStatus(map);
      const sm: Record<string, StatLite> = {};
      ((ag as StatLite[]) || []).forEach((a) => (sm[a.jogador_id] = a));
      setStats(sm);
      setLoading(false);
    })();
  }, []);

  const visiveis = filtro === "todos" ? jogadores : jogadores.filter((j) => j.posicao === filtro);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Users className="text-[#22ff88]" size={20} />
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88]">
            ELENCO
          </p>
        </div>
        <h1 className="font-['Roboto',sans-serif] font-bold text-4xl sm:text-5xl mb-8">
          Jogadores
        </h1>

        {loading && <p className="text-white/40">Carregando...</p>}

        {!loading && jogadores.length === 0 && (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Nenhum jogador cadastrado ainda. Cadastre pela área Admin.
          </div>
        )}

        {!loading && jogadores.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap mb-6">
              <FiltroPill ativo={filtro === "todos"} onClick={() => setFiltro("todos")}>
                TODOS · {jogadores.length}
              </FiltroPill>
              {(Object.keys(POSICAO_LABEL) as Posicao[]).map((p) => {
                const n = jogadores.filter((j) => j.posicao === p).length;
                if (n === 0) return null;
                return (
                  <FiltroPill key={p} ativo={filtro === p} onClick={() => setFiltro(p)}>
                    {POSICAO_LABEL[p].toUpperCase()} · {n}
                  </FiltroPill>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visiveis.map((j) => {
                const s = status[j.id];
                const isMensal = s?.tipo_atual === "mensal";
                const isDiarista = s?.tipo_atual === "diarista";

                return (
                  <button
                    key={j.id}
                    onClick={() => setAberto(j)}
                    className="text-left group relative p-5 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:border-[#22ff88]/30 hover:shadow-[0_0_28px_rgba(34,255,136,0.1)] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/[0.02] overflow-hidden ring-1 ring-white/10 flex items-center justify-center text-white/40 text-sm font-bold shrink-0">
                        {j.foto_url ? (
                          <img src={j.foto_url} alt={j.nome} className="w-full h-full object-cover" />
                        ) : (
                          (j.apelido || j.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-['Roboto',sans-serif] font-bold truncate text-lg">
                          {j.apelido || j.nome}
                        </h3>
                        {j.apelido && j.nome !== j.apelido && (
                          <p className="text-white/30 text-xs truncate">{j.nome}</p>
                        )}
                        <p className="text-white/50 text-xs uppercase tracking-wider mt-0.5">
                          {POSICAO_LABEL[j.posicao]}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <BarraNivel nivel={j.nivel} />
                      <span
                        className={`px-2.5 py-1 rounded-full border text-[9px] tracking-[0.18em] font-bold whitespace-nowrap ${
                          isMensal
                            ? "text-[#22ff88] border-[#22ff88]/40 bg-[#22ff88]/10"
                            : isDiarista
                            ? "text-white/70 border-white/15 bg-white/[0.04]"
                            : "text-white/30 border-white/10"
                        }`}
                      >
                        {isMensal
                          ? `MENSALISTA · ${s.meses_como_mensalista}m`
                          : isDiarista
                          ? "DIARISTA"
                          : "—"}
                      </span>
                    </div>

                    {/* Mini stats */}
                    <div className="mt-4 pt-4 border-t border-white/[0.04] grid grid-cols-4 gap-2 text-center">
                      <MiniStat label="J" valor={stats[j.id]?.jogos_disputados || 0} />
                      <MiniStat label="G" valor={stats[j.id]?.gols || 0} destaque />
                      <MiniStat label="A" valor={stats[j.id]?.assistencias || 0} />
                      <MiniStat label="MVP" valor={stats[j.id]?.mvp_count || 0} destaque />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {aberto && <ModalJogadorDetalhes jogador={aberto} status={status[aberto.id]} onClose={() => setAberto(null)} />}
    </div>
  );
}

type Agregado = {
  jogador_id: string;
  jogos_disputados: number;
  gols: number;
  assistencias: number;
  defesas: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  cartoes_vermelhos: number;
  gols_contra: number;
  mvp_count: number;
  nota_total: number;
};

type ColeteStats = {
  jogador_id: string;
  jogos_vermelho: number;
  jogos_azul: number;
  v_vermelho: number;
  e_vermelho: number;
  d_vermelho: number;
  v_azul: number;
  e_azul: number;
  d_azul: number;
};

function ModalJogadorDetalhes({
  jogador,
  status,
  onClose,
}: {
  jogador: Jogador;
  status?: Status;
  onClose: () => void;
}) {
  const [stats, setStats] = useState<Agregado | null>(null);
  const [colete, setColete] = useState<ColeteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ag }, { data: cs }] = await Promise.all([
        supabase.from("estatisticas_agregadas").select("*").eq("jogador_id", jogador.id).maybeSingle(),
        supabase.from("estatisticas_por_colete").select("*").eq("jogador_id", jogador.id).maybeSingle(),
      ]);
      setStats((ag as Agregado) || null);
      setColete((cs as ColeteStats) || null);
      setLoading(false);
    })();
  }, [jogador.id]);

  const isMensal = status?.tipo_atual === "mensal";
  const isDiarista = status?.tipo_atual === "diarista";
  const totalJogos = (stats?.vitorias || 0) + (stats?.empates || 0) + (stats?.derrotas || 0);
  const aproveit = totalJogos > 0
    ? Math.round(((stats?.vitorias || 0) * 3 + (stats?.empates || 0)) / (totalJogos * 3) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-gradient-to-b from-[#0e1612] to-[#0b0b0b] border border-[#22ff88]/15 rounded-3xl shadow-[0_0_60px_rgba(34,255,136,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur text-white/70 hover:text-white flex items-center justify-center"
        >
          <X size={18} />
        </button>

        {/* Header com foto grande */}
        <div className="relative h-44 bg-gradient-to-br from-[#22ff88]/15 via-transparent to-transparent overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,255,136,0.15),transparent)]" />
        </div>
        <div className="px-6 -mt-16 relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-white/10 to-white/[0.02] overflow-hidden ring-4 ring-[#0b0b0b] flex items-center justify-center text-white/50 text-2xl font-bold">
            {jogador.foto_url ? (
              <img src={jogador.foto_url} alt={jogador.nome} className="w-full h-full object-cover" />
            ) : (
              (jogador.apelido || jogador.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
            )}
          </div>
          <div className="mt-3">
            <h2 className="font-['Roboto',sans-serif] font-bold text-3xl">{jogador.apelido || jogador.nome}</h2>
            {jogador.apelido && jogador.nome !== jogador.apelido && (
              <p className="text-white/40 text-sm">{jogador.nome}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/70 text-[10px] tracking-[0.18em] font-bold uppercase">
                {POSICAO_LABEL[jogador.posicao]}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] tracking-[0.18em] font-bold border ${
                  isMensal
                    ? "text-[#22ff88] border-[#22ff88]/40 bg-[#22ff88]/10"
                    : isDiarista
                    ? "text-white/70 border-white/15 bg-white/[0.04]"
                    : "text-white/30 border-white/10"
                }`}
              >
                {isMensal ? `MENSALISTA · ${status?.meses_como_mensalista}M` : isDiarista ? "DIARISTA" : "SEM REGISTRO"}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 mt-6">
          {/* NOTA TOTAL acumulada */}
          <div className="mb-5 p-4 rounded-2xl border border-[#22ff88]/30 bg-gradient-to-br from-[#22ff88]/10 to-transparent">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-[#22ff88] mb-1">NOTA TOTAL</p>
                <p className="text-4xl font-bold tabular-nums text-[#22ff88] leading-none">
                  {(stats?.nota_total || 0).toFixed(1)}
                </p>
                <p className="text-white/40 text-[10px] mt-1.5">
                  acumulada de todas as peladas
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-[0.18em] text-white/40 mb-1">NÍVEL TÉCNICO</p>
                <p className="text-xl font-bold tabular-nums text-white/80">
                  {jogador.nivel}<span className="text-sm text-white/30">/10</span>
                </p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#22ff88] to-[#5cffaa] rounded-full"
                style={{ width: `${(jogador.nivel / 10) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-[10px] tracking-[0.18em] text-white/40 mb-3">ESTATÍSTICAS</p>
          {loading ? (
            <p className="text-white/40 text-sm">Carregando...</p>
          ) : !stats || stats.jogos_disputados === 0 ? (
            <p className="text-white/40 text-sm py-4">Nenhum jogo registrado ainda.</p>
          ) : (
            <>
              <div className={`grid gap-2 mb-4 ${jogador.posicao === "goleiro" ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
                <StatBox icon={<Calendar size={14} />} label="Jogos" valor={stats.jogos_disputados} />
                <StatBox icon={<Target size={14} />} label="Gols" valor={stats.gols} destaque />
                <StatBox icon={<ListChecks size={14} />} label="Assists" valor={stats.assistencias} />
                {jogador.posicao === "goleiro" && (
                  <StatBox icon={<Shield size={14} />} label="Defesas" valor={stats.defesas || 0} destaque />
                )}
                <StatBox icon={<Star size={14} />} label="MVP" valor={stats.mvp_count} destaque />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <StatMini cor="emerald" label="V" valor={stats.vitorias} />
                <StatMini cor="zinc" label="E" valor={stats.empates} />
                <StatMini cor="rose" label="D" valor={stats.derrotas} />
              </div>
              <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="text-[#22ff88]" size={16} />
                  <span className="text-sm text-white/70">Aproveitamento</span>
                </div>
                <span className="font-bold text-[#22ff88]">{aproveit}%</span>
              </div>

              {/* POR COLETE */}
              {colete && (colete.jogos_vermelho > 0 || colete.jogos_azul > 0) && (
                <>
                  <p className="text-[10px] tracking-[0.18em] text-white/40 mb-3 mt-6">POR COLETE</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ColeteCard
                      cor="vermelho"
                      jogos={colete.jogos_vermelho}
                      v={colete.v_vermelho}
                      e={colete.e_vermelho}
                      d={colete.d_vermelho}
                    />
                    <ColeteCard
                      cor="azul"
                      jogos={colete.jogos_azul}
                      v={colete.v_azul}
                      e={colete.e_azul}
                      d={colete.d_azul}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ColeteCard({
  cor,
  jogos,
  v,
  e,
  d,
}: {
  cor: "vermelho" | "azul";
  jogos: number;
  v: number;
  e: number;
  d: number;
}) {
  const cls =
    cor === "vermelho"
      ? "border-rose-500/30 bg-rose-500/[0.06] text-rose-300"
      : "border-sky-500/30 bg-sky-500/[0.06] text-sky-300";
  const aproveit = jogos > 0 ? Math.round(((v * 3 + e) / (jogos * 3)) * 100) : 0;
  return (
    <div className={`p-3 rounded-xl border ${cls}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-[0.18em] font-bold uppercase">
          {cor === "vermelho" ? "🔴 Vermelho" : "🔵 Azul"}
        </span>
        <span className="text-xs opacity-80 tabular-nums">{jogos} jogo{jogos !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center text-white">
        <div>
          <p className="text-[9px] tracking-[0.18em] text-emerald-400/80">V</p>
          <p className="font-bold tabular-nums">{v}</p>
        </div>
        <div>
          <p className="text-[9px] tracking-[0.18em] text-white/40">E</p>
          <p className="font-bold tabular-nums">{e}</p>
        </div>
        <div>
          <p className="text-[9px] tracking-[0.18em] text-rose-400/80">D</p>
          <p className="font-bold tabular-nums">{d}</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
        <span className="text-[9px] text-white/50 tracking-wider uppercase">Aproveit.</span>
        <span className="text-xs font-bold tabular-nums">{aproveit}%</span>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  valor,
  destaque,
}: {
  icon: React.ReactNode;
  label: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-xl border ${
        destaque ? "border-[#22ff88]/30 bg-[#22ff88]/5" : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className={`flex items-center gap-1.5 ${destaque ? "text-[#22ff88]" : "text-white/40"}`}>
        {icon}
        <span className="text-[9px] tracking-[0.18em] uppercase">{label}</span>
      </div>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${destaque ? "text-[#22ff88]" : "text-white"}`}>
        {valor}
      </p>
    </div>
  );
}

function StatMini({ cor, label, valor }: { cor: "emerald" | "zinc" | "rose"; label: string; valor: number }) {
  const cls =
    cor === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
      : cor === "rose"
      ? "border-rose-500/20 bg-rose-500/5 text-rose-300"
      : "border-white/10 bg-white/[0.02] text-white/70";
  return (
    <div className={`p-2 rounded-lg border ${cls} text-center`}>
      <p className="text-[10px] tracking-[0.18em] opacity-80">{label}</p>
      <p className="text-xl font-bold tabular-nums">{valor}</p>
    </div>
  );
}

function FiltroPill({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-[10px] tracking-[0.18em] font-bold border transition-all ${
        ativo
          ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88] shadow-[0_0_16px_rgba(34,255,136,0.3)]"
          : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, valor, destaque }: { label: string; valor: number; destaque?: boolean }) {
  return (
    <div>
      <p className="text-[8px] tracking-[0.18em] text-white/30 uppercase">{label}</p>
      <p className={`text-base font-bold tabular-nums ${destaque ? "text-[#22ff88]" : "text-white/85"}`}>{valor}</p>
    </div>
  );
}

function BarraNivel({ nivel }: { nivel: number }) {
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#22ff88] to-[#5cffaa] rounded-full"
          style={{ width: `${(nivel / 10) * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-white/40 tabular-nums">{nivel}/10</span>
    </div>
  );
}
