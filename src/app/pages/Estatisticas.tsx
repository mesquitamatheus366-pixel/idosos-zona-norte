import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Trophy, Target, ListChecks, Star, Calendar } from "lucide-react";

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
};

type Foto = { id: string; foto_url: string | null; apelido: string | null; nome: string };

type Modo = "gols" | "assistencias" | "jogos_disputados" | "mvp_count";

const MODOS: { v: Modo; label: string; icon: React.ReactNode; sufixo: string }[] = [
  { v: "gols", label: "GOLS", icon: <Target size={12} />, sufixo: "gols" },
  { v: "assistencias", label: "ASSISTÊNCIAS", icon: <ListChecks size={12} />, sufixo: "assists" },
  { v: "jogos_disputados", label: "PRESENÇA", icon: <Calendar size={12} />, sufixo: "jogos" },
  { v: "mvp_count", label: "MVP", icon: <Star size={12} />, sufixo: "MVPs" },
];

export function Estatisticas() {
  const [rows, setRows] = useState<Agregado[]>([]);
  const [fotos, setFotos] = useState<Record<string, Foto>>({});
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<Modo>("gols");

  useEffect(() => {
    (async () => {
      const [{ data: ag }, { data: jg }] = await Promise.all([
        supabase.from("estatisticas_agregadas").select("*"),
        supabase.from("jogadores").select("id, nome, apelido, foto_url"),
      ]);
      setRows((ag as Agregado[]) || []);
      const fmap: Record<string, Foto> = {};
      ((jg as Foto[]) || []).forEach((f) => (fmap[f.id] = f));
      setFotos(fmap);
      setLoading(false);
    })();
  }, []);

  const ordenado = useMemo(() => {
    return [...rows].sort((a, b) => (b[modo] as number) - (a[modo] as number));
  }, [rows, modo]);

  const modoAtual = MODOS.find((m) => m.v === modo)!;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="text-[#22ff88]" size={20} />
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88]">
            RANKING
          </p>
        </div>
        <h1 className="font-['Roboto',sans-serif] font-bold text-4xl sm:text-5xl mb-8">
          Estatísticas
        </h1>

        <div className="flex gap-2 flex-wrap mb-8">
          {MODOS.map((m) => (
            <button
              key={m.v}
              onClick={() => setModo(m.v)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] tracking-[0.18em] font-bold border transition-all ${
                modo === m.v
                  ? "bg-[#22ff88] text-[#0b0b0b] border-[#22ff88] shadow-[0_0_18px_rgba(34,255,136,0.3)]"
                  : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-white/40">Carregando...</p>}

        {!loading && ordenado.length === 0 && (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Sem jogos registrados ainda.
          </div>
        )}

        {!loading && ordenado.length > 0 && (
          <>
            {/* Pódio top 3 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {ordenado.slice(0, 3).map((r, i) => {
                const f = fotos[r.jogador_id];
                const podium = ["🥇", "🥈", "🥉"][i];
                const altura = ["pt-2", "pt-6", "pt-8"][i];
                return (
                  <div
                    key={r.jogador_id}
                    className={`relative ${altura} text-center`}
                  >
                    <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ${i === 0 ? "ring-[#22ff88] shadow-[0_0_24px_rgba(34,255,136,0.4)]" : "ring-white/15"} bg-white/5 flex items-center justify-center text-white/40 font-bold mb-2`}>
                      {f?.foto_url ? (
                        <img src={f.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (f?.apelido || f?.nome || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                      )}
                    </div>
                    <p className="text-2xl mb-0.5">{podium}</p>
                    <p className="font-bold text-sm truncate px-1">{f?.apelido || f?.nome}</p>
                    <p className={`font-bold ${i === 0 ? "text-[#22ff88]" : "text-white/60"}`}>
                      {r[modo]} <span className="text-[10px] text-white/40">{modoAtual.sufixo}</span>
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Tabela completa */}
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.18em] text-white/40 uppercase border-b border-white/[0.06]">
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-2 py-3">Jogador</th>
                    <th className="px-3 py-3 text-center">J</th>
                    <th className="px-3 py-3 text-center">G</th>
                    <th className="px-3 py-3 text-center">A</th>
                    <th className="px-3 py-3 text-center">V</th>
                    <th className="px-3 py-3 text-center">E</th>
                    <th className="px-3 py-3 text-center">D</th>
                    <th className="px-3 py-3 text-center">MVP</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenado.map((r, i) => {
                    const f = fotos[r.jogador_id];
                    return (
                      <tr key={r.jogador_id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-white/40 tabular-nums">{i + 1}</td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center text-white/40 text-[10px] font-bold">
                              {f?.foto_url ? (
                                <img src={f.foto_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (f?.apelido || r.nome).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                              )}
                            </div>
                            <span className="font-medium">{f?.apelido || r.nome}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-white/60 tabular-nums">{r.jogos_disputados}</td>
                        <td className={`px-3 py-2.5 text-center tabular-nums ${modo === "gols" ? "text-[#22ff88] font-bold" : "text-white/80"}`}>{r.gols}</td>
                        <td className={`px-3 py-2.5 text-center tabular-nums ${modo === "assistencias" ? "text-[#22ff88] font-bold" : ""}`}>{r.assistencias}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-emerald-400">{r.vitorias}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-white/60">{r.empates}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums text-rose-400">{r.derrotas}</td>
                        <td className={`px-3 py-2.5 text-center tabular-nums ${modo === "mvp_count" ? "text-[#22ff88] font-bold" : "text-[#22ff88]/70"}`}>{r.mvp_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
