import { Calendar } from "lucide-react";

export function Jogos() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-[#d3b379]" size={20} />
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#d3b379]">
            RESULTADOS
          </p>
        </div>
        <h1 className="font-['Roboto',sans-serif] font-bold text-4xl sm:text-5xl mb-10">
          Jogos
        </h1>

        <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-white/50">
          Em construção. Em breve: peladas mensais e diárias com placar e MVP.
        </div>
      </div>
    </div>
  );
}
