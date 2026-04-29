import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Trophy, Star, Shield } from "lucide-react";
import { useNavigate } from "react-router";
import imgLogo from "figma:asset/10ca126f7dcca96eb94b5eebb8aab702dae2e834.png";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/* ──────────── Tab config ──────────── */
const TABS = [
  { key: "timeline" as const, label: "Linha do Tempo", icon: Clock },
  { key: "legends" as const, label: "Atletas Marcantes", icon: Star },
  { key: "titles" as const, label: "Títulos", icon: Trophy },
];

/* ──────────── Data ──────────── */
const timelineEvents = [
  {
    year: "2024",
    title: "Fundação do Sadock FC",
    description: "Nasce o Sadock FC, time de fut 7 amador fundado por um grupo de amigos apaixonados por futebol. Os primeiros amistosos começam na Arena Damitex e Parque de Madureira.",
    icon: "star",
  },
  {
    year: "2024",
    title: "Primeiros Amistosos",
    description: "O time disputa seus primeiros jogos amistosos, construindo entrosamento e definindo a identidade tática do elenco. Destaque para as goleadas em campos como Mania da Bola e Campus da Bola.",
    icon: "ball",
  },
  {
    year: "2024",
    title: "Formação do Elenco Base",
    description: "Com jogadores como Dayvid Coelho, Yuri de Paula, Leandro Oscar e Jhon Marques, o Sadock FC consolida seu elenco base que será a espinha dorsal do time.",
    icon: "users",
  },
  {
    year: "2025",
    title: "Copa Sapê - Primeira Competição",
    description: "O Sadock FC entra em sua primeira competição oficial, a Copa Sapê. Uma nova era competitiva começa para o clube.",
    icon: "trophy",
  },
  {
    year: "2025",
    title: "Crescimento e Novas Contratações",
    description: "O elenco se fortalece com novas chegadas. O time ganha profundidade e qualidade, consolidando-se como uma força no futebol amador local.",
    icon: "users",
  },
  {
    year: "2025",
    title: "Identidade Visual Premium",
    description: "Com parceria da Ture Publicidade, o clube ganha identidade visual profissional com uniformes exclusivos, escudo redesenhado e presença digital marcante.",
    icon: "star",
  },
  {
    year: "2026",
    title: "Nova Temporada",
    description: "O Sadock FC inicia 2026 com ambições renovadas, elenco fortalecido e a meta de conquistar seu primeiro título oficial.",
    icon: "trophy",
  },
];

const legendPlayers = [
  {
    playerId: "3",
    name: "Jhon Marques",
    role: "Fixo aguerrido",
    description: "Capitão e pilar defensivo do Sadock FC, Jhon Marques é sinônimo de liderança e consistência em campo. Atuando como fixo, combina solidez defensiva com grande participação ofensiva, sendo o maior garçom da história do clube, o terceiro maior artilheiro e também o jogador com mais partidas pelo Sadock FC.",
    stat: "Capitão",
    number: "4",
    featured: true,
    highlights: ["Maior assistente", "3º artilheiro", "Mais partidas"],
  },
  {
    playerId: "10",
    name: "Dayvid Coelho",
    role: "Artilheiro histórico",
    description: "O nome por trás de muitos dos gols mais importantes da história do Sadock FC. Com instinto goleador e presença constante no ataque, Dayvid Coelho se tornou o maior artilheiro do clube desde a sua fundação.",
    stat: "Artilheiro",
    number: "12",
    featured: false,
    highlights: [],
  },
  {
    playerId: "4",
    name: "Yuri de Paula",
    role: "Meia criativo",
    description: "Criatividade, visão e presença ofensiva. Atuando pela ala, Yuri se tornou um dos jogadores mais decisivos do Sadock FC, ocupando o posto de segundo maior artilheiro da história do clube.",
    stat: "Criador",
    number: "5",
    featured: false,
    highlights: [],
  },
];

const titles = [
  {
    name: "Vice-Campeonato Challenge Cup 2024",
    status: "Vice",
    description: "Campanha sólida com classificação na fase de grupos e uma semifinal dominante. Na grande final, o Sadock FC foi até o fim: empate em 3x3, mas o título ficou com o Efraim, que tinha a vantagem do empate. Uma campanha que mostrou a cara do clube — raça, entrega e futebol de qualidade.",
    year: "2024",
    inProgress: false,
  },
];

/* ──────────── Components ──────────── */

function TimelineSection() {
  return (
    <div className="relative">
      <div className="absolute left-[18px] sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#d3b379]/40 via-[#d3b379]/20 to-transparent" />

      {timelineEvents.map((ev, i) => {
        const isLeft = i % 2 === 0;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`relative flex items-start gap-4 mb-10 sm:mb-14 ${
              isLeft ? "sm:flex-row" : "sm:flex-row-reverse"
            }`}
          >
            <div className="absolute left-[14px] sm:left-1/2 sm:-translate-x-1/2 top-1 z-10">
              <div className="w-[10px] h-[10px] rounded-full bg-[#d3b379] ring-4 ring-[#0b0b0b] shadow-[0_0_12px_rgba(211,179,121,0.4)]" />
            </div>

            <div className={`ml-10 sm:ml-0 sm:w-[calc(50%-32px)] ${isLeft ? "sm:pr-8" : "sm:pl-8"}`}>
              <div className="bg-[#131313] rounded-xl p-5 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(211,179,121,0.2)] transition-colors group">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#d3b379]/10 border border-[#d3b379]/20 text-[#d3b379] font-['Roboto',sans-serif] text-[9px] tracking-[0.2em] mb-3">
                  {ev.year}
                </span>
                <h3 className="font-['Anton',sans-serif] text-white text-lg tracking-wide mb-2 group-hover:text-[#d3b379] transition-colors">
                  {ev.title}
                </h3>
                <p className="font-['Montserrat',sans-serif] text-white/40 text-xs leading-relaxed">
                  {ev.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function LegendsSection({ players }: { players: any[] }) {
  const navigate = useNavigate();

  const featuredPlayer = legendPlayers.find((p) => p.featured)!;
  const otherPlayers = legendPlayers.filter((p) => !p.featured);

  const getPlayerPhoto = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player?.foto || null;
  };

  const handlePlayerClick = (playerId: string) => {
    navigate('/elenco', { state: { highlightPlayerId: playerId } });
  };

  return (
    <div className="space-y-6">
      {/* Featured Player — Jhon Marques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        onClick={() => handlePlayerClick(featuredPlayer.playerId)}
        className="relative bg-gradient-to-br from-[rgba(211,179,121,0.08)] to-[#131313] rounded-2xl p-7 sm:p-9 border border-[rgba(211,179,121,0.25)] overflow-hidden group cursor-pointer hover:border-[rgba(211,179,121,0.4)] transition-all"
      >
        {/* Gold accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />

        {/* Large ghost number */}
        <span className="absolute -top-4 -right-2 font-['Anton',sans-serif] text-[140px] sm:text-[180px] text-[#d3b379]/[0.04] leading-none pointer-events-none select-none">
          {featuredPlayer.number}
        </span>

        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
          {/* Player Photo */}
          {getPlayerPhoto(featuredPlayer.playerId) && (
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-[#d3b379]/30 group-hover:border-[#d3b379]/50 transition-colors">
                <img
                  src={getPlayerPhoto(featuredPlayer.playerId)}
                  alt={featuredPlayer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#d3b379] flex items-center justify-center border-2 border-[#0b0b0b]">
                <span className="font-['Anton',sans-serif] text-[#0b0b0b] text-lg">
                  {featuredPlayer.number}
                </span>
              </div>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#d3b379]/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#d3b379]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#d3b379]/15 border border-[#d3b379]/25 text-[#d3b379] font-['Roboto',sans-serif] text-[8px] tracking-[0.2em] uppercase">
                  {featuredPlayer.stat}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-1">
              <h3 className="font-['Anton',sans-serif] text-white text-3xl sm:text-4xl tracking-wide group-hover:text-[#d3b379] transition-colors">
                {featuredPlayer.name}
              </h3>
              <span className="font-['Roboto',sans-serif] text-white/15 text-[10px] tracking-[0.2em]">
                CAMISA {featuredPlayer.number}
              </span>
            </div>
            <p className="font-['Roboto',sans-serif] text-[#d3b379]/60 text-[11px] tracking-[0.2em] uppercase mb-4">
              {featuredPlayer.role}
            </p>

            <p className="font-['Montserrat',sans-serif] text-white/45 text-sm leading-relaxed mb-6">
              {featuredPlayer.description}
            </p>

            {/* Highlight pills */}
            <div className="flex flex-wrap gap-2">
              {featuredPlayer.highlights.map((h) => (
                <span
                  key={h}
                  className="px-3 py-1.5 rounded-full bg-[#d3b379]/10 border border-[#d3b379]/20 text-[#d3b379] font-['Roboto',sans-serif] text-[9px] tracking-[0.15em] uppercase"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Other Players */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {otherPlayers.map((player, i) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            onClick={() => handlePlayerClick(player.playerId)}
            className="relative bg-[#131313] rounded-xl p-6 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(211,179,121,0.25)] transition-all group overflow-hidden cursor-pointer"
          >
            <span className="absolute top-2 right-4 font-['Anton',sans-serif] text-[72px] text-white/[0.03] leading-none pointer-events-none select-none group-hover:text-[#d3b379]/[0.06] transition-colors">
              {player.number}
            </span>

            <div className="relative z-10 flex gap-4 items-start">
              {/* Player Photo */}
              {getPlayerPhoto(player.playerId) && (
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/[0.08] group-hover:border-[#d3b379]/30 transition-colors">
                    <img
                      src={getPlayerPhoto(player.playerId)}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-[#d3b379]/90 flex items-center justify-center border-2 border-[#131313]">
                    <span className="font-['Anton',sans-serif] text-[#0b0b0b] text-xs">
                      {player.number}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#d3b379]/10 border border-[#d3b379]/20 text-[#d3b379] font-['Roboto',sans-serif] text-[8px] tracking-[0.2em] uppercase mb-3">
                  {player.stat}
                </span>

                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="font-['Anton',sans-serif] text-white text-xl tracking-wide group-hover:text-[#d3b379] transition-colors">
                    {player.name}
                  </h3>
                  <span className="font-['Roboto',sans-serif] text-white/10 text-[9px] tracking-[0.15em]">
                    CAMISA {player.number}
                  </span>
                </div>
                <p className="font-['Roboto',sans-serif] text-[#d3b379]/60 text-[10px] tracking-[0.15em] uppercase mb-3">
                  {player.role}
                </p>
                <p className="font-['Montserrat',sans-serif] text-white/35 text-xs leading-relaxed">
                  {player.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TitlesSection() {
  return (
    <div className="max-w-2xl mx-auto">
      {titles.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="font-['Montserrat',sans-serif] text-white/20 text-sm">Nenhum título conquistado ainda</p>
          <p className="font-['Montserrat',sans-serif] text-white/10 text-xs mt-1">A história está sendo escrita...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {titles.map((title, i) => (
            <motion.div
              key={title.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 sm:p-8 border overflow-hidden ${
                title.inProgress
                  ? "bg-gradient-to-br from-[rgba(211,179,121,0.06)] to-[#131313] border-[rgba(211,179,121,0.2)]"
                  : "bg-[#131313] border-[rgba(255,255,255,0.06)]"
              }`}
            >
              {title.inProgress && (
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />
              )}

              <div className="flex items-start gap-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  title.inProgress ? "bg-[#d3b379]/15" : "bg-white/[0.04]"
                }`}>
                  <Trophy className={`w-6 h-6 ${title.inProgress ? "text-[#d3b379]" : "text-white/30"}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-3 mb-1">
                    <h3 className="font-['Anton',sans-serif] text-white text-xl tracking-wide">{title.name}</h3>
                    {title.inProgress ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#d3b379]/15 border border-[#d3b379]/25 text-[#d3b379] font-['Roboto',sans-serif] text-[8px] tracking-[0.2em] uppercase flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d3b379] opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#d3b379]" />
                        </span>
                        Em disputa
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-white/50 font-['Roboto',sans-serif] text-[8px] tracking-[0.2em] uppercase">
                        {title.status}
                      </span>
                    )}
                  </div>
                  <p className="font-['Roboto',sans-serif] text-white/25 text-[10px] tracking-[0.15em] mb-2">{title.year}</p>
                  <p className="font-['Montserrat',sans-serif] text-white/40 text-xs leading-relaxed">{title.description}</p>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center py-8"
          >
            <p className="font-['Montserrat',sans-serif] text-white/10 text-xs italic">
              A história continua sendo escrita...
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ──────────── Main Component ──────────── */
export function Sobre() {
  const [activeTab, setActiveTab] = useState<"timeline" | "legends" | "titles">("timeline");
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const headers = { 'Authorization': `Bearer ${publicAnonKey}` };
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/players`, { headers });
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players || []);
        }
      } catch (err) {
        console.error('Error fetching players:', err);
      }
    }
    fetchPlayers();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b] pt-24 pb-16 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <motion.div className="flex justify-center mb-5">
            <img src={imgLogo} alt="Sadock FC" className="h-16 w-auto opacity-30" />
          </motion.div>
          <h1 className="font-['Anton',sans-serif] text-white text-4xl sm:text-5xl tracking-wider mb-3">
            SOBRE O CLUBE
          </h1>
          <p className="font-['Montserrat',sans-serif] text-white/25 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Conheça a história, os atletas marcantes e as conquistas do Sadock FC
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex justify-center mb-10"
        >
          <div className="bg-[#111] rounded-xl p-1 flex gap-0.5 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-['Roboto',sans-serif] text-[10px] tracking-[0.15em] uppercase transition-colors whitespace-nowrap ${
                    active ? "text-[#0b0b0b]" : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="sobre-tab-bg"
                      className="absolute inset-0 bg-[#d3b379] rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={12} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "timeline" && <TimelineSection />}
            {activeTab === "legends" && <LegendsSection players={players} />}
            {activeTab === "titles" && <TitlesSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}