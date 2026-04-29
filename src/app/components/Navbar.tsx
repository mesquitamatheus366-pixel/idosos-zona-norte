import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Settings, Shuffle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import imgLogo from "figma:asset/10ca126f7dcca96eb94b5eebb8aab702dae2e834.png";

const navLinks = [
  { label: "INÍCIO", path: "/" },
  { label: "JOGADORES", path: "/jogadores" },
  { label: "JOGOS", path: "/jogos" },
  { label: "SORTEIO", path: "/sorteio" },
  { label: "ESTATÍSTICAS", path: "/estatisticas" },
  { label: "SOBRE", path: "/sobre" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0b]/90 backdrop-blur-lg border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={imgLogo} alt="Idosos da Zona Norte" className="h-11 w-auto transition-transform duration-300 group-hover:scale-105" />
          <span className="hidden sm:inline font-['Roboto',sans-serif] text-[11px] tracking-[0.2em] text-[#d3b379]">IDOSOS DA ZONA NORTE</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            const isSorteio = link.path === "/sorteio";

            if (isSorteio) {
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative ml-2 px-4 py-1.5 font-['Roboto',sans-serif] text-[10px] tracking-[0.18em] transition-all rounded-full border flex items-center gap-1.5 ${
                    active
                      ? "text-[#0b0b0b] bg-[#d3b379] border-[#d3b379] shadow-[0_0_12px_rgba(211,179,121,0.3)]"
                      : "text-[#d3b379] bg-[#d3b379]/[0.08] border-[#d3b379]/30 hover:bg-[#d3b379]/[0.15] hover:border-[#d3b379]/50 hover:shadow-[0_0_10px_rgba(211,179,121,0.15)]"
                  }`}
                >
                  <Shuffle size={12} />
                  {link.label}
                </Link>
              );
            }

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 font-['Roboto',sans-serif] text-[10px] tracking-[0.18em] transition-all rounded-lg ${
                  active
                    ? "text-[#d3b379] bg-[#d3b379]/[0.08]"
                    : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          
          {/* Admin Button — only gear icon */}
          <Link
            to="/admin"
            className="ml-3 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 text-white/25 hover:text-[#d3b379] hover:bg-[#d3b379]/[0.08]"
            title="Admin"
          >
            <Settings size={16} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white/70 hover:text-white transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-[#0e0e0e] border-t border-white/[0.04] px-4 pb-4">
          {navLinks.map((link) => {
            const isSorteio = link.path === "/sorteio";
            return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className={`block py-3 font-['Roboto',sans-serif] text-[11px] tracking-[0.2em] border-b border-white/[0.04] ${
                isSorteio
                  ? location.pathname === link.path
                    ? "text-[#0b0b0b] bg-[#d3b379] px-3 rounded-lg border-transparent font-bold"
                    : "text-[#d3b379] font-bold"
                  : location.pathname === link.path
                    ? "text-[#d3b379]"
                    : "text-white/50"
              }`}
            >
              {isSorteio && <Shuffle size={13} className="inline mr-2 -mt-0.5" />}
              {link.label}
            </Link>
            );
          })}
          
          {/* Admin gear icon — mobile */}
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-9 h-9 mt-3 rounded-full text-white/25 hover:text-[#d3b379] hover:bg-[#d3b379]/[0.08] transition-all"
            title="Admin"
          >
            <Settings size={18} />
          </Link>
        </div>
      )}
    </nav>
  );
}