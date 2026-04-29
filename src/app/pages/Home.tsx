import { Link } from "react-router";
import { ArrowRight, Users, Calendar, Shuffle, Trophy } from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#22ff88]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <p className="font-['Roboto',sans-serif] text-[11px] tracking-[0.3em] text-[#22ff88] mb-4">
            PELADA · MENSAL E DIÁRIA
          </p>
          <h1 className="font-['Roboto',sans-serif] font-bold text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-6">
            Idosos da<br />
            <span className="text-[#22ff88]">Zona Norte</span>
          </h1>
          <p className="text-white/60 max-w-xl text-lg mb-10">
            Cadastro de jogadores, sorteio de times equilibrado, resultados e
            estatísticas de quem realmente joga (e de quem só aparece pra rir).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/sorteio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#22ff88] text-[#0b0b0b] font-['Roboto',sans-serif] text-[11px] tracking-[0.2em] font-bold hover:bg-[#5cffaa] transition-colors"
            >
              <Shuffle size={14} /> SORTEAR TIMES
            </Link>
            <Link
              to="/jogadores"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white/80 font-['Roboto',sans-serif] text-[11px] tracking-[0.2em] hover:border-white/40 hover:text-white transition-colors"
            >
              VER JOGADORES <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Cards de seções */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SectionCard to="/jogadores" icon={<Users size={20} />} title="Jogadores" desc="Lista, posição, nível, mensalistas e diaristas." />
          <SectionCard to="/jogos" icon={<Calendar size={20} />} title="Jogos" desc="Resultados das peladas mensais e diárias." />
          <SectionCard to="/sorteio" icon={<Shuffle size={20} />} title="Sorteio" desc="Times equilibrados por nível e posição." />
          <SectionCard to="/estatisticas" icon={<Trophy size={20} />} title="Estatísticas" desc="Gols, assistências, presença e MVP." />
        </div>
      </section>
    </div>
  );
}

function SectionCard({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-[#22ff88]/30 hover:bg-[#22ff88]/[0.04] transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-[#22ff88]/10 text-[#22ff88] flex items-center justify-center mb-4 group-hover:bg-[#22ff88]/20 transition-colors">
        {icon}
      </div>
      <h3 className="font-['Roboto',sans-serif] font-bold text-lg mb-1">{title}</h3>
      <p className="text-white/50 text-sm">{desc}</p>
    </Link>
  );
}
