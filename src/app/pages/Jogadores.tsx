import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Users } from "lucide-react";

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

export function Jogadores() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | Posicao>("todos");

  useEffect(() => {
    (async () => {
      const [{ data: jg }, { data: st }] = await Promise.all([
        supabase.from("jogadores").select("*").eq("ativo", true).order("nome"),
        supabase.from("jogador_status").select("*"),
      ]);
      setJogadores((jg as Jogador[]) || []);
      const map: Record<string, Status> = {};
      ((st as Status[]) || []).forEach((s) => (map[s.jogador_id] = s));
      setStatus(map);
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
                  <div
                    key={j.id}
                    className="group relative p-5 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:border-[#22ff88]/25 hover:shadow-[0_0_28px_rgba(34,255,136,0.08)] transition-all"
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
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
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
