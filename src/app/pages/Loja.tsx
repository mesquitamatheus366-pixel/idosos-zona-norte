import { useState, useEffect } from "react";
import imgUniforme1 from "figma:asset/81098c8153cc1d11c244ffea34c2681834163ac7.png";
import imgUniforme2 from "figma:asset/936df810e0d306a1459d2f66d10ad89318b1fe9d.png";
import imgUniformeComissao from "figma:asset/3237b952514049d612af043ec91927c7a1d463e3.png";
import imgUniformeGoleiro from "figma:asset/ca101167ceea6206b8fd5a2547c956223b17eee6.png";
import { X, ShoppingBag, Shirt } from "lucide-react";
import { motion } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface Product {
  id: string;
  nome: string;
  preco: string;
  categoria: string;
  descricao: string;
  image: string | null;
  icon: "shirt" | "bag";
  estoque?: number;
}

const staticProducts: Product[] = [
  { id: "p1", nome: "Uniforme 1", preco: "R$ 70,00", categoria: "Camisas", descricao: "Camisa oficial principal do Sadock FC, preta com detalhes dourados. Material de alta qualidade com tecnologia dry-fit. Patrocínio Ture Publicidade.", image: imgUniforme1, icon: "shirt", estoque: 50 },
  { id: "p2", nome: "Uniforme 2", preco: "R$ 70,00", categoria: "Camisas", descricao: "Camisa oficial reserva do Sadock FC, rosa com detalhes brancos. Material de alta qualidade com tecnologia dry-fit. Patrocínio Ture Publicidade.", image: imgUniforme2, icon: "shirt", estoque: 45 },
  { id: "p3", nome: "Uniforme Comissão Técnica", preco: "R$ 70,00", categoria: "Camisas", descricao: "Camisa oficial da comissão técnica do Sadock FC, branca com detalhes pretos. Material de alta qualidade. Patrocínio Ture Publicidade.", image: imgUniformeComissao, icon: "shirt", estoque: 20 },
  { id: "p4", nome: "Uniforme Goleiro", preco: "R$ 70,00", categoria: "Camisas", descricao: "Camisa oficial de goleiro do Sadock FC, verde com detalhes brancos. Material de alta qualidade com tecnologia dry-fit. Patrocínio Ture Publicidade.", image: imgUniformeGoleiro, icon: "shirt", estoque: 15 },
  { id: "p5", nome: "Boné Sadock FC", preco: "R$ 59,90", categoria: "Acessórios", descricao: "Boné oficial com bordado do escudo do Sadock FC. Ajuste regulável.", image: null, icon: "bag", estoque: 30 },
  { id: "p6", nome: "Caneca Sadock FC", preco: "R$ 39,90", categoria: "Acessórios", descricao: "Caneca de cerâmica com o escudo do Sadock FC. Capacidade 350ml.", image: null, icon: "bag", estoque: 40 },
];

const categorias = ["Todas", "Camisas", "Acessórios"];

export function Loja() {
  const [products, setProducts] = useState(staticProducts);
  const [categoria, setCategoria] = useState("Todas");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("M");

  useEffect(() => {
    async function loadData() {
      try {
        console.log('[Loja] Fetching shop data from API...');
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/shop`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        if (!res.ok) {
          console.log('[Loja] API error status:', res.status);
          return;
        }
        const data = await res.json();
        console.log('[Loja] API response:', { count: data.items?.length, error: data.error });
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          // Normalize images from backend if available, or fallback to static mapping or generic icon
          const normalized = data.items.map((item: any) => ({
            ...item,
            image: item.image || item.imagem || null,
            icon: item.categoria === "Camisas" ? "shirt" : "bag"
          }));
          setProducts(normalized);
          console.log('[Loja] Using API data:', normalized.length, 'products');
        } else {
          console.log('[Loja] Using static data:', staticProducts.length, 'products');
        }
      } catch (err) {
        console.error("[Loja] Error fetching shop data, using static data:", err);
      }
    }
    loadData();
  }, []);

  const filtered = categoria === "Todas" ? products : products.filter((p) => p.categoria === categoria);

  return (
    <div className="min-h-screen bg-[#0b0b0b] pt-24 pb-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[#d3b379] font-['Roboto',sans-serif] text-[10px] tracking-[0.3em] uppercase mb-2">PRODUTOS OFICIAIS</p>
          <h1 className="font-['Anton',sans-serif] text-white text-5xl sm:text-7xl">LOJA</h1>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categorias.map((c) => {
            const isActive = categoria === c;
            return (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className="relative px-4 py-2 rounded-full text-[11px] tracking-wider font-['Roboto',sans-serif] transition-colors duration-200 cursor-pointer overflow-hidden"
                style={{
                  color: isActive ? "#0b0b0b" : "rgba(255,255,255,0.4)",
                  border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="loja-filter-bg"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#d3b379] to-[#c4a265]"
                    style={{ zIndex: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{c}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => { setSelectedProduct(product); setSelectedSize("M"); }}
              className="bg-gradient-to-b from-[#161616] to-[#111] rounded-2xl overflow-hidden border border-[#1e1e1e] hover:border-[#d3b379]/30 transition-all group text-left cursor-pointer"
            >
              <div className="aspect-square bg-[#151515] flex items-center justify-center overflow-hidden relative">
                {product.image ? (
                  <img src={product.image} alt={product.nome} className="w-[90%] h-[90%] object-contain group-hover:scale-105 transition-transform duration-500" />
                ) : product.icon === "shirt" ? (
                  <Shirt size={56} className="text-white/10 group-hover:text-white/15 transition-colors" />
                ) : (
                  <ShoppingBag size={56} className="text-white/10 group-hover:text-white/15 transition-colors" />
                )}
                <div className="absolute top-3 right-3 bg-[#d3b379] text-[#0b0b0b] px-2 py-1 rounded-md text-[10px] font-['Roboto',sans-serif] tracking-wider">
                  {product.categoria}
                </div>
                <div className="absolute top-3 left-3 bg-red-500/90 text-white px-2 py-1 rounded-md text-[10px] font-['Roboto',sans-serif] tracking-wider">
                  ESGOTADO
                </div>
              </div>
              <div className="p-5">
                <p className="text-white font-['Roboto',sans-serif] text-sm">{product.nome}</p>
                <p className="text-[#d3b379]/40 font-['Anton',sans-serif] text-2xl mt-2 line-through">{product.preco}</p>
                <div className="mt-4 bg-[#1e1e1e] text-white/30 text-center py-2.5 rounded-xl text-[11px] tracking-wider font-['Roboto',sans-serif] cursor-not-allowed">
                  Esgotado
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onClick={() => setSelectedProduct(null)}>
          <div className="bg-gradient-to-b from-[#181818] to-[#0e0e0e] rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#2a2a2a]" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 text-white/50 hover:text-white bg-black/60 rounded-full p-2.5">
                <X size={18} />
              </button>
              <div className="aspect-square bg-[#141414] rounded-t-3xl flex items-center justify-center">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.nome} className="w-[85%] h-[85%] object-contain" />
                ) : selectedProduct.icon === "shirt" ? (
                  <Shirt size={72} className="text-white/10" />
                ) : (
                  <ShoppingBag size={72} className="text-white/10" />
                )}
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-white font-['Anton',sans-serif] text-2xl">{selectedProduct.nome}</h2>
              <p className="text-[#d3b379] font-['Anton',sans-serif] text-3xl mt-2">{selectedProduct.preco}</p>
              <p className="text-white/40 font-['Roboto',sans-serif] text-sm mt-4 leading-relaxed">{selectedProduct.descricao}</p>

              {selectedProduct.categoria === "Camisas" && (
                <div className="mt-6">
                  <p className="text-white/30 font-['Roboto',sans-serif] text-[10px] tracking-[0.2em] uppercase mb-3">Tamanho</p>
                  <div className="flex gap-2">
                    {["P", "M", "G", "GG"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-12 h-12 rounded-xl text-sm font-['Roboto',sans-serif] transition-all ${
                          selectedSize === size
                            ? "bg-[#d3b379] text-[#0b0b0b]"
                            : "bg-[#1e1e1e] text-white/40 hover:text-white border border-[#2a2a2a]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button disabled className="w-full mt-6 bg-[#1e1e1e] text-white/30 py-3.5 rounded-xl font-['Roboto',sans-serif] text-sm tracking-wider cursor-not-allowed">
                Esgotado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}