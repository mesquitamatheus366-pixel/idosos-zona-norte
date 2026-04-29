import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Trophy } from "lucide-react";

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

export function Estatisticas() {
  const [rows, setRows] = useState<Agregado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("estatisticas_agregadas")
        .select("*")
        .order("gols", { ascending: false });
      setRows((data as Agregado[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="text-[#22ff88]" size={20} />
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88]">
            RANKING
          </p>
        </div>
        <h1 className="font-['Roboto',sans-serif] font-bold text-4xl sm:text-5xl mb-10">
          Estatísticas
        </h1>

        {loading && <p className="text-white/40">Carregando...</p>}

        {!loading && rows.length === 0 && (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Sem jogos registrados ainda.
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] tracking-[0.18em] text-white/40 uppercase border-b border-white/[0.06]">
                  <th className="px-4 py-3">Jogador</th>
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
                {rows.map((r) => (
                  <tr key={r.jogador_id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{r.nome}</td>
                    <td className="px-3 py-3 text-center text-white/60">{r.jogos_disputados}</td>
                    <td className="px-3 py-3 text-center text-[#22ff88] font-bold">{r.gols}</td>
                    <td className="px-3 py-3 text-center">{r.assistencias}</td>
                    <td className="px-3 py-3 text-center text-emerald-400">{r.vitorias}</td>
                    <td className="px-3 py-3 text-center text-white/60">{r.empates}</td>
                    <td className="px-3 py-3 text-center text-rose-400">{r.derrotas}</td>
                    <td className="px-3 py-3 text-center text-[#22ff88]">{r.mvp_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
