import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Users } from "lucide-react";

type Jogador = {
  id: string;
  nome: string;
  apelido: string | null;
  posicao: "goleiro" | "linha";
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

  useEffect(() => {
    (async () => {
      const [{ data: jg }, { data: st }] = await Promise.all([
        supabase.from("jogadores").select("*").eq("ativo", true).order("nome"),
        supabase.from("jogador_status").select("*"),
      ]);
      setJogadores((jg as Jogador[]) || []);
      const map: Record<string, Status> = {};
      (st as Status[] || []).forEach((s) => (map[s.jogador_id] = s));
      setStatus(map);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Users className="text-[#d3b379]" size={20} />
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#d3b379]">
            ELENCO
          </p>
        </div>
        <h1 className="font-['Roboto',sans-serif] font-bold text-4xl sm:text-5xl mb-10">
          Jogadores
        </h1>

        {loading && <p className="text-white/40">Carregando...</p>}

        {!loading && jogadores.length === 0 && (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
            Nenhum jogador cadastrado ainda. Cadastre pela área Admin.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jogadores.map((j) => {
            const s = status[j.id];
            const tag =
              s?.tipo_atual === "mensal"
                ? `MENSALISTA · ${s.meses_como_mensalista}m`
                : s?.tipo_atual === "diarista"
                ? "DIARISTA"
                : "SEM REGISTRO";
            const tagColor =
              s?.tipo_atual === "mensal"
                ? "text-[#d3b379] border-[#d3b379]/30 bg-[#d3b379]/10"
                : s?.tipo_atual === "diarista"
                ? "text-white/70 border-white/15 bg-white/[0.04]"
                : "text-white/30 border-white/10";

            return (
              <div
                key={j.id}
                className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/5 overflow-hidden flex items-center justify-center text-white/30 text-xs">
                    {j.foto_url ? (
                      <img src={j.foto_url} alt={j.nome} className="w-full h-full object-cover" />
                    ) : (
                      j.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-['Roboto',sans-serif] font-bold truncate">
                      {j.apelido || j.nome}
                    </h3>
                    <p className="text-white/40 text-xs uppercase tracking-wider">
                      {j.posicao} · nível {j.nivel}
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-4 inline-block px-2.5 py-1 rounded-full border text-[10px] tracking-[0.15em] font-bold ${tagColor}`}
                >
                  {tag}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
