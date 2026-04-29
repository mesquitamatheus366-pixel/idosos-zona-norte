import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Newspaper, Calendar, Search, X } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import imgLogo from "figma:asset/10ca126f7dcca96eb94b5eebb8aab702dae2e834.png";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

/* ──────────── Types ──────────── */
interface NewsItem {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem?: string;
  data: string;
  categoria: string;
  destaque?: boolean;
  createdAt?: string;
}

const CATEGORIAS = ["Todas", "Resultado", "Transferência", "Institucional", "Evento", "Outro"];

/* ──────────── Main Component ──────────── */
export function Noticias() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todas");

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/news`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setNews(data.news || []);
        }
      } catch (err) {
        console.error("[Noticias] Error loading news:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  const sortedNews = useMemo(() => {
    const parseDateStr = (d: string) => {
      const parts = d.split("/");
      if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
      return 0;
    };
    return [...news]
      .filter((n) => {
        if (catFilter !== "Todas" && n.categoria !== catFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            n.titulo.toLowerCase().includes(q) ||
            n.resumo.toLowerCase().includes(q) ||
            n.categoria.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => parseDateStr(b.data) - parseDateStr(a.data));
  }, [news, search, catFilter]);

  const featured = sortedNews.find((n) => n.destaque);
  const restNews = sortedNews.filter((n) => n.id !== featured?.id);

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
            NOTÍCIAS
          </h1>
          <p className="font-['Montserrat',sans-serif] text-white/25 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Fique por dentro de tudo que acontece no Sadock FC
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-8"
        >
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar notícias..."
              className="w-full bg-[#131313] border border-[rgba(255,255,255,0.06)] rounded-lg pl-9 pr-8 py-2.5 text-white/70 text-xs font-['Montserrat',sans-serif] placeholder:text-white/15 focus:outline-none focus:border-[rgba(211,179,121,0.3)] transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-3 py-1.5 rounded-full font-['Roboto',sans-serif] text-[9px] tracking-[0.15em] uppercase whitespace-nowrap transition-all ${
                  catFilter === cat
                    ? "bg-[#d3b379] text-[#0b0b0b]"
                    : "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-white/35 hover:text-white/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#d3b379]/20 border-t-[#d3b379] rounded-full animate-spin mx-auto mb-4" />
            <p className="font-['Montserrat',sans-serif] text-white/20 text-xs">Carregando notícias...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && sortedNews.length === 0 && (
          <div className="text-center py-20">
            <Newspaper className="w-14 h-14 text-white/10 mx-auto mb-4" />
            <p className="font-['Montserrat',sans-serif] text-white/20 text-sm">
              {news.length === 0 ? "Nenhuma notícia publicada ainda" : "Nenhuma notícia encontrada"}
            </p>
            <p className="font-['Montserrat',sans-serif] text-white/10 text-xs mt-1">
              {news.length === 0 ? "As notícias do clube aparecerão aqui" : "Tente ajustar os filtros"}
            </p>
          </div>
        )}

        {!loading && sortedNews.length > 0 && (
          <div>
            {/* Featured */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10"
              >
                <div
                  onClick={() => setExpandedId(expandedId === featured.id ? null : featured.id)}
                  className="relative bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0a0a0a] rounded-3xl overflow-hidden border border-[#d3b379]/30 cursor-pointer hover:border-[#d3b379]/50 transition-all group shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                >
                  {/* Decorative accents */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#d3b379]/10 to-transparent rounded-tl-3xl" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#d3b379]/10 to-transparent rounded-br-3xl" />

                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />

                  <div className="flex flex-col sm:flex-row">
                    {featured.imagem && (
                      <div className="sm:w-2/5 h-64 sm:h-auto overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />
                        <ImageWithFallback
                          src={featured.imagem}
                          alt={featured.titulo}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className={`flex-1 p-7 sm:p-10 relative z-10 ${!featured.imagem ? "w-full" : ""}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#d3b379] to-[#b8964a] text-[#0b0b0b] font-['Roboto',sans-serif] text-[9px] tracking-[0.2em] uppercase font-bold shadow-[0_2px_8px_rgba(211,179,121,0.3)]">
                          ★ Destaque
                        </span>
                        <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-white/50 font-['Roboto',sans-serif] text-[9px] tracking-[0.15em] font-medium">
                          {featured.categoria}
                        </span>
                      </div>
                      <h3 className="font-['Anton',sans-serif] text-white text-2xl sm:text-3xl tracking-wide mb-3 group-hover:text-[#d3b379] transition-colors leading-tight">
                        {featured.titulo}
                      </h3>
                      <p className="font-['Montserrat',sans-serif] text-white/50 text-sm sm:text-base leading-relaxed mb-4">
                        {featured.resumo}
                      </p>
                      <div className="flex items-center gap-2.5 text-white/30">
                        <div className="w-8 h-8 rounded-lg bg-[#d3b379]/10 flex items-center justify-center">
                          <Calendar size={14} className="text-[#d3b379]" />
                        </div>
                        <span className="font-['Roboto',sans-serif] text-xs tracking-wider">{featured.data}</span>
                      </div>

                      <AnimatePresence>
                        {expandedId === featured.id && featured.conteudo && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-5 mt-5 border-t border-[rgba(211,179,121,0.1)]">
                              <p className="font-['Montserrat',sans-serif] text-white/60 text-sm leading-relaxed whitespace-pre-line">
                                {featured.conteudo}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rest of news */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restNews.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={{ y: -6 }}
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(211,179,121,0.3)] transition-all cursor-pointer group overflow-hidden flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(211,179,121,0.08)]"
                >
                  {item.imagem && (
                    <div className="h-44 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent z-10" />
                      <ImageWithFallback
                        src={item.imagem}
                        alt={item.titulo}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-[rgba(211,179,121,0.08)] border border-[rgba(211,179,121,0.15)] text-[#d3b379]/80 font-['Roboto',sans-serif] text-[8px] tracking-[0.15em] font-medium">
                        {item.categoria}
                      </span>
                    </div>
                    <h4 className="font-['Anton',sans-serif] text-white text-lg tracking-wide mb-2.5 group-hover:text-[#d3b379] transition-colors leading-tight">
                      {item.titulo}
                    </h4>
                    <p className="font-['Montserrat',sans-serif] text-white/45 text-xs leading-relaxed flex-1 mb-3">
                      {item.resumo}
                    </p>
                    <div className="flex items-center gap-2 text-white/25">
                      <div className="w-7 h-7 rounded-lg bg-[#d3b379]/8 flex items-center justify-center">
                        <Calendar size={12} className="text-[#d3b379]/60" />
                      </div>
                      <span className="font-['Roboto',sans-serif] text-[10px] tracking-wider">{item.data}</span>
                    </div>

                    <AnimatePresence>
                      {expandedId === item.id && item.conteudo && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-[rgba(211,179,121,0.1)]">
                            <p className="font-['Montserrat',sans-serif] text-white/55 text-xs leading-relaxed whitespace-pre-line">
                              {item.conteudo}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}