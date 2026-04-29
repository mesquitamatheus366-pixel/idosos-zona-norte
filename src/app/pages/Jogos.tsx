import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Calendar, Trophy } from "lucide-react";

type Jogo = {
  id: string;
  data_jogo: string;
  tipo: "diaria" | "mensal";
  local: string | null;
  finalizado: boolean;
  observacoes: string | null;
};

type TimeJogador = {
  jogo_id: string;
  jogador_id: string;
  time_numero: number;
  jogadores: { nome: string; apelido: string | null } | null;
};

type Estatistica = {
  jogo_id: string;
  jogador_id: string;
  gols: number;
  assistencias: number;
  resultado: "V" | "E" | "D" | null;
  mvp: boolean;
  jogadores: { nome: string; apelido: string | null } | null;
};

type Filtro = "todos" | "diaria" | "mensal";

export function Jogos() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [times, setTimes] = useState<Record<string, TimeJogador[]>>({});
  const [stats, setStats] = useState<Record<string, Estatistica[]>>({});
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [aberto, setAberto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let q = supabase.from("jogos").select("*").order("data_jogo", { ascending: false });
      if (filtro !== "todos") q = q.eq("tipo", filtro);
      const { data } = await q;
      const lista = (data as Jogo[]) || [];
      setJogos(lista);

      if (lista.length) {
        const ids = lista.map((j) => j.id);
        const [{ data: ts }, { data: es }] = await Promise.all([
          supabase
            .from("times_sorteados")
            .select("jogo_id, jogador_id, time_numero, jogadores(nome, apelido)")
            .in("jogo_id", ids),
          supabase
            .from("estatisticas_jogo")
            .select("jogo_id, jogador_id, gols, assistencias, resultado, mvp, jogadores(nome, apelido)")
            .in("jogo_id", ids),
        ]);
        const tMap: Record<string, TimeJogador[]> = {};
        (ts as any[] || []).forEach((r) => {
          (tMap[r.jogo_id] ||= []).push(r);
        });
        const sMap: Record<string, Estatistica[]> = {};
        (es as any[] || []).forEach((r) => {
          (sMap[r.jogo_id] ||= []).push(r);
        });
        setTimes(tMap);
        setStats(sMap);
      }
      setLoading(false);
    })();
  }, [filtro]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-[#d3b379]" size={20} />
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#d3b379]">
            HISTÓRICO
          </p>
        </div>
        <h1 className="font-['Roboto',sans-serif] font-bold text-4xl sm:text-5xl mb-8">Jogos</h1>

        <div className="flex gap-2 mb-6">
          {(["todos", "diaria", "mensal"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-full text-[11px] tracking-[0.18em] font-bold border ${
                filtro === f
                  ? "bg-[#d3b379] text-[#0b0b0b] border-[#d3b379]"
                  : "border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {loading && <p className="text-white/40">Carregando...</p>}

        {!loading && jogos.length === 0 && (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Nenhum jogo registrado.
          </div>
        )}

        <div className="space-y-3">
          {jogos.map((j) => {
            const expanded = aberto === j.id;
            const ts = times[j.id] || [];
            const es = stats[j.id] || [];
            const mvp = es.find((e) => e.mvp);
            const data = new Date(j.data_jogo);
            const grupos = agruparPorTime(ts);

            return (
              <div
                key={j.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
              >
                <button
                  onClick={() => setAberto(expanded ? null : j.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02]"
                >
                  <div>
                    <p className="font-bold">
                      {data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-white/50 text-xs">
                      {j.tipo === "mensal" ? "Pelada Mensal" : "Pelada Diária"}
                      {j.local && ` · ${j.local}`}
                      {!j.finalizado && " · em andamento"}
                    </p>
                  </div>
                  {mvp?.jogadores && (
                    <div className="hidden sm:flex items-center gap-1 text-[#d3b379] text-xs">
                      <Trophy size={12} /> MVP: {mvp.jogadores.apelido || mvp.jogadores.nome}
                    </div>
                  )}
                </button>

                {expanded && (
                  <div className="p-4 border-t border-white/[0.04] space-y-4">
                    {grupos.length > 0 && (
                      <div>
                        <p className="text-[10px] tracking-[0.18em] text-white/40 mb-2">TIMES SORTEADOS</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {grupos.map((g) => (
                            <div key={g.numero} className="p-3 rounded-xl border border-white/[0.06]">
                              <p className="font-bold text-sm mb-1">Time {g.numero}</p>
                              <ul className="text-white/70 text-xs space-y-0.5">
                                {g.jogadores.map((p, i) => (
                                  <li key={i}>{p.apelido || p.nome}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {es.length > 0 && (
                      <div>
                        <p className="text-[10px] tracking-[0.18em] text-white/40 mb-2">ESTATÍSTICAS</p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-[10px] tracking-[0.15em] text-white/40">
                              <th className="py-1">Jogador</th>
                              <th className="py-1 text-center">G</th>
                              <th className="py-1 text-center">A</th>
                              <th className="py-1 text-center">RES</th>
                              <th className="py-1 text-center">MVP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {es.map((e, i) => (
                              <tr key={i} className="border-t border-white/[0.04]">
                                <td className="py-1.5">{e.jogadores?.apelido || e.jogadores?.nome}</td>
                                <td className="py-1.5 text-center text-[#d3b379]">{e.gols}</td>
                                <td className="py-1.5 text-center">{e.assistencias}</td>
                                <td className="py-1.5 text-center text-white/60">{e.resultado || "-"}</td>
                                <td className="py-1.5 text-center">{e.mvp ? "⭐" : ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {grupos.length === 0 && es.length === 0 && (
                      <p className="text-white/40 text-sm">Sem dados detalhados deste jogo.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function agruparPorTime(rows: TimeJogador[]) {
  const map: Record<number, { numero: number; jogadores: { nome: string; apelido: string | null }[] }> = {};
  rows.forEach((r) => {
    if (!map[r.time_numero]) map[r.time_numero] = { numero: r.time_numero, jogadores: [] };
    if (r.jogadores) map[r.time_numero].jogadores.push(r.jogadores);
  });
  return Object.values(map).sort((a, b) => a.numero - b.numero);
}
