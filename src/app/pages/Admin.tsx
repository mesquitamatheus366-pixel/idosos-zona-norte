import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import { Settings, LogOut } from "lucide-react";

export function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="text-[#d3b379]" size={20} />
              <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#d3b379]">
                ÁREA ADMIN
              </p>
            </div>
            <h1 className="font-['Roboto',sans-serif] font-bold text-4xl">
              Painel
            </h1>
          </div>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 text-[11px] tracking-[0.18em]"
          >
            <LogOut size={14} /> SAIR
          </button>
        </div>

        <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
          Em construção. Em breve: cadastrar/editar jogadores, registrar
          pagamento mensal/diarista, lançar resultado de jogo, escolher MVP e
          ver histórico de sorteios.
        </div>
      </div>
    </div>
  );
}
