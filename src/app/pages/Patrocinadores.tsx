import { motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  Shirt,
  Globe,
  Share2,
  Trophy,
  ExternalLink,
  Handshake,
  Star,
  ArrowRight,
  Plus,
} from "lucide-react";

import imgArtemis from "figma:asset/6afdfe009ce312cceac0fa00ea2cb53eeaf20caf.png";
import imgTure from "figma:asset/b0b04b816a7081d98a0e368208ecb173b31103b5.png";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/* ─── Data ─── */

interface Partner {
  id: number | string;
  nome: string;
  descricao: string;
  logo: string | null;
  instagram?: string;
  website?: string;
}

const staticParceirosReais: Partner[] = [
  {
    id: 1,
    nome: "Artemis Art Tattoo",
    descricao:
      "Estúdio de tatuagens autorais. Parceiro oficial do Sadock FC com arte e estilo único.",
    logo: imgArtemis,
    instagram: "https://www.instagram.com/artemisarttattoo/?hl=pt-br",
  },
  {
    id: 2,
    nome: "Ture Publicidade",
    descricao:
      "Agência de publicidade e comunicação visual. Responsável pela identidade e materiais gráficos do clube.",
    logo: imgTure,
    instagram: "https://www.instagram.com/turepublicidade/?hl=pt-br",
  },
];

const vagasPatrocinador = 4; // empty master/official slots
const vagasParceiro = 6; // empty partner slots

const exposicaoItems = [
  {
    icon: <Shirt size={22} />,
    titulo: "Uniforme Oficial",
    descricao:
      "Marca estampada nos uniformes do Sadock FC usados em todas as competições.",
  },
  {
    icon: <Globe size={22} />,
    titulo: "Site do Clube",
    descricao:
      "Logo e link permanente no site oficial com visibilidade constante.",
  },
  {
    icon: <Share2 size={22} />,
    titulo: "Redes Sociais",
    descricao:
      "Menções, posts dedicados e presença visual em todo conteúdo digital.",
  },
  {
    icon: <Trophy size={22} />,
    titulo: "Eventos e Competições",
    descricao:
      "Banners, backdrops e materiais em todos os jogos e eventos do clube.",
  },
];

/* ─── Helpers ─── */

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">
      {label}
    </p>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="relative bg-[#111] rounded-2xl border border-dashed border-[#2a2a2a] hover:border-[#d3b379]/20 p-8 flex flex-col items-center justify-center gap-3 transition-colors duration-300 group cursor-default min-h-[180px]">
      <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-[#252525] flex items-center justify-center group-hover:border-[#d3b379]/20 transition-colors">
        <Plus size={20} className="text-white/15 group-hover:text-[#d3b379]/40 transition-colors" />
      </div>
      <span className="text-white/15 font-['Roboto',sans-serif] text-[10px] tracking-[0.15em] text-center group-hover:text-white/25 transition-colors">
        {label}
      </span>
    </div>
  );
}

/* ─── Page ─── */

export function Patrocinadores() {
  const [parceirosReais, setParceirosReais] = useState<Partner[]>(staticParceirosReais);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('[Patrocinadores] Fetching sponsors from API...');
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/sponsors`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (!res.ok) {
          console.log('[Patrocinadores] API error status:', res.status);
          return;
        }
        const data = await res.json();
        console.log('[Patrocinadores] API response:', { count: data.sponsors?.length, error: data.error });
        if (data.sponsors && Array.isArray(data.sponsors) && data.sponsors.length > 0) {
          setParceirosReais(data.sponsors);
          console.log('[Patrocinadores] Using API data:', data.sponsors.length, 'sponsors');
        } else {
          console.log('[Patrocinadores] Using static data:', staticParceirosReais.length, 'sponsors');
        }
      } catch (err) {
        console.error("[Patrocinadores] Error fetching sponsors, using static data:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b] pt-24 pb-20 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#d3b379]/10 border border-[rgba(211,179,121,0.2)] rounded-full px-4 py-1.5 mb-6">
              <Handshake size={14} className="text-[#d3b379]" />
              <span className="text-[#d3b379] font-['Roboto',sans-serif] text-[11px] tracking-[0.15em]">
                NOSSOS PARCEIROS
              </span>
            </div>
            <h1 className="font-['Anton',sans-serif] text-white text-5xl sm:text-7xl lg:text-8xl leading-[0.95]">
              PATROCINADORES
              <br />
              DO <span className="text-[#d3b379]">SADOCK FC</span>
            </h1>
            <p className="text-white/40 font-['Roboto',sans-serif] text-sm mt-6 max-w-lg mx-auto leading-relaxed">
              Empresas que acreditam e caminham junto com o Sadock FC.
            </p>
          </motion.div>
        </div>

        {/* Section 1 — Parceiros Oficiais (real) */}
        <section className="mb-20">
          <SectionLabel label="Parceiros Oficiais" />
          <h2 className="font-['Anton',sans-serif] text-white text-3xl sm:text-5xl mb-8">
            PARCEIROS <span className="text-[#d3b379]">DO CLUBE</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {parceirosReais.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 * i }}
                whileHover={{ y: -4 }}
                className="relative bg-gradient-to-br from-[#171717] via-[#131313] to-[#0e0e0e] rounded-3xl border border-[#1e1e1e] hover:border-[rgba(211,179,121,0.25)] overflow-hidden group transition-colors duration-300"
              >
                {/* Top accent */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#d3b379]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#d3b379]/3 rounded-full blur-[60px] group-hover:bg-[#d3b379]/8 transition-all duration-700" />

                <div className="relative z-10 p-7 sm:p-9 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  {/* Logo */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                    {p.logo ? (
                      <img
                        src={p.logo}
                        alt={p.nome}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Handshake size={48} className="text-[#333]" />
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="inline-flex items-center gap-2 mb-2">
                      <Star size={12} className="text-[#d3b379]" />
                      <span className="text-[#d3b379] font-['Roboto',sans-serif] text-[9px] tracking-[0.25em] uppercase">
                        Parceiro Oficial
                      </span>
                    </div>
                    <h3 className="font-['Anton',sans-serif] text-white text-2xl sm:text-3xl tracking-wide mb-2">
                      {p.nome}
                    </h3>
                    <p className="text-white/35 font-['Roboto',sans-serif] text-[12px] leading-relaxed mb-5">
                      {p.descricao}
                    </p>
                    {p.instagram && (
                      <a
                        href={p.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#d3b379]/10 hover:bg-[#d3b379]/20 border border-[rgba(211,179,121,0.2)] text-[#d3b379] font-['Roboto',sans-serif] text-[11px] tracking-[0.15em] px-5 py-2.5 rounded-full transition-all"
                      >
                        <Globe size={13} />
                        INSTAGRAM
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 2 — Vagas para Patrocinadores */}
        <section className="mb-20">
          <SectionLabel label="Patrocinadores" />
          <h2 className="font-['Anton',sans-serif] text-white text-3xl sm:text-5xl mb-3">
            ESPAÇOS <span className="text-[#d3b379]">DISPONÍVEIS</span>
          </h2>
          <p className="text-white/25 font-['Roboto',sans-serif] text-sm mb-8 max-w-lg leading-relaxed">
            Estamos em busca de patrocinadores para fortalecer o clube. Entre em
            contato e associe sua marca ao Sadock FC.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: vagasPatrocinador }).map((_, i) => (
              <motion.div
                key={`vaga-pat-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.08 * i }}
              >
                <EmptySlot label="VAGA DISPONÍVEL" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 3 — Vagas para Parceiros */}
        <section className="mb-20">
          <SectionLabel label="Mais Parceiros" />
          <h2 className="font-['Anton',sans-serif] text-white text-3xl sm:text-5xl mb-3">
            NOVOS <span className="text-[#d3b379]">PARCEIROS</span>
          </h2>
          <p className="text-white/25 font-['Roboto',sans-serif] text-sm mb-8 max-w-lg leading-relaxed">
            Espaços abertos para empresas locais e apoiadores do fut 7.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: vagasParceiro }).map((_, i) => (
              <motion.div
                key={`vaga-par-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.05 * i }}
              >
                <EmptySlot label="DISPONÍVEL" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 4 — Exposicao da Marca */}
        <section className="mb-20">
          <SectionLabel label="Exposição da Marca" />
          <h2 className="font-['Anton',sans-serif] text-white text-3xl sm:text-5xl mb-3">
            ONDE SUA <span className="text-[#d3b379]">MARCA APARECE</span>
          </h2>
          <p className="text-white/30 font-['Roboto',sans-serif] text-sm mb-8 max-w-lg leading-relaxed">
            Patrocinadores e parceiros têm visibilidade em múltiplos canais e
            pontos de contato do Sadock FC.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {exposicaoItems.map((item, i) => (
              <motion.div
                key={item.titulo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                whileHover={{ y: -4 }}
                className="bg-gradient-to-b from-[#161616] to-[#0e0e0e] rounded-2xl border border-[#1e1e1e] hover:border-[rgba(211,179,121,0.2)] p-6 transition-colors duration-300 group cursor-default"
              >
                <div className="w-11 h-11 rounded-xl bg-[#d3b379]/8 border border-[rgba(211,179,121,0.15)] flex items-center justify-center text-[#d3b379] mb-4 group-hover:bg-[#d3b379]/15 transition-colors duration-300">
                  {item.icon}
                </div>
                <h3 className="font-['Anton',sans-serif] text-white text-lg tracking-wide mb-2">
                  {item.titulo}
                </h3>
                <p className="text-white/30 font-['Roboto',sans-serif] text-[12px] leading-relaxed">
                  {item.descricao}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 5 — CTA */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#d3b379]/10 via-[#151515] to-[#0b0b0b]" />
            <div className="absolute inset-0 border border-[rgba(211,179,121,0.15)] rounded-3xl" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#d3b379]/40 to-transparent" />
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#d3b379]/8 rounded-full blur-[80px]" />

            <div className="relative z-10 py-16 sm:py-20 px-6 sm:px-12 text-center">
              <div className="inline-flex items-center gap-2 bg-[#d3b379]/10 border border-[rgba(211,179,121,0.2)] rounded-full px-4 py-1.5 mb-6">
                <Handshake size={14} className="text-[#d3b379]" />
                <span className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.2em]">
                  JUNTE-SE A NÓS
                </span>
              </div>

              <h2 className="font-['Anton',sans-serif] text-white text-4xl sm:text-6xl leading-[0.95] mb-5">
                SEJA UM PATROCINADOR
                <br />
                DO <span className="text-[#d3b379]">SADOCK FC</span>
              </h2>

              <p className="text-white/40 font-['Roboto',sans-serif] text-sm max-w-lg mx-auto leading-relaxed mb-10">
                Associe sua marca ao Sadock FC e ganhe visibilidade em jogos,
                redes sociais e na comunidade.
              </p>

              <motion.a
                href="mailto:contato@sadockfc.com"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 bg-[#d3b379] hover:bg-[#c9a96b] text-[#0b0b0b] font-['Anton',sans-serif] text-lg tracking-wider px-8 py-4 rounded-full transition-colors"
              >
                QUERO PATROCINAR
                <ArrowRight size={18} />
              </motion.a>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}