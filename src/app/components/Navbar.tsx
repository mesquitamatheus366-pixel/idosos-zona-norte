import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Settings, Shuffle } from "lucide-react";

const navLinks = [
  { label: "INÍCIO", path: "/" },
  { label: "JOGADORES", path: "/jogadores" },
  { label: "JOGOS", path: "/jogos" },
  { label: "SORTEIO", path: "/sorteio" },
  { label: "ESTATÍSTICAS", path: "/estatisticas" },
];

function LogoIZN() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group shrink-0">
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#22ff88] to-[#0a8a3f] flex items-center justify-center shadow-[0_0_18px_rgba(34,255,136,0.35)] group-hover:shadow-[0_0_28px_rgba(34,255,136,0.5)] transition-shadow">
        <span className="font-['Roboto',sans-serif] font-black text-[#0b0b0b] text-[13px] tracking-tighter">
          IZN
        </span>
      </div>
      <div className="hidden sm:flex flex-col leading-none">
        <span className="font-['Roboto',sans-serif] font-bold text-[13px] tracking-[0.18em] text-white">
          IDOSOS
        </span>
        <span className="font-['Roboto',sans-serif] text-[9px] tracking-[0.32em] text-[#22ff88]">
          DA ZONA NORTE
        </span>
      </div>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b0b0b]/85 backdrop-blur-xl border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4">
        <LogoIZN />

        {/* Desktop Nav — centered */}
        <div className="hidden md:flex items-center justify-center gap-0.5">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            const isSorteio = link.path === "/sorteio";

            if (isSorteio) {
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative mx-1 px-4 py-1.5 font-['Roboto',sans-serif] text-[10px] tracking-[0.18em] transition-all rounded-full border flex items-center gap-1.5 ${
                    active
                      ? "text-[#0b0b0b] bg-[#22ff88] border-[#22ff88] shadow-[0_0_14px_rgba(34,255,136,0.4)]"
                      : "text-[#22ff88] bg-[#22ff88]/[0.06] border-[#22ff88]/30 hover:bg-[#22ff88]/[0.12] hover:border-[#22ff88]/50 hover:shadow-[0_0_12px_rgba(34,255,136,0.2)]"
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
                    ? "text-[#22ff88] bg-[#22ff88]/[0.08]"
                    : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            to="/admin"
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-full transition-all duration-300 text-white/30 hover:text-[#22ff88] hover:bg-[#22ff88]/[0.08]"
            title="Admin"
          >
            <Settings size={16} />
          </Link>

          <button
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-[#0e0e0e] border-t border-white/[0.04] px-4 pb-4">
          {navLinks.map((link) => {
            const isSorteio = link.path === "/sorteio";
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={`block py-3 font-['Roboto',sans-serif] text-[11px] tracking-[0.2em] border-b border-white/[0.04] ${
                  isSorteio
                    ? active
                      ? "text-[#0b0b0b] bg-[#22ff88] px-3 rounded-lg border-transparent font-bold"
                      : "text-[#22ff88] font-bold"
                    : active
                    ? "text-[#22ff88]"
                    : "text-white/55"
                }`}
              >
                {isSorteio && <Shuffle size={13} className="inline mr-2 -mt-0.5" />}
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-9 h-9 mt-3 rounded-full text-white/30 hover:text-[#22ff88] hover:bg-[#22ff88]/[0.08] transition-all"
            title="Admin"
          >
            <Settings size={18} />
          </Link>
        </div>
      )}
    </nav>
  );
}
