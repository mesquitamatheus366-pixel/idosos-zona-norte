/**
 * Match Result Card - Team achievement (1080x1920 Instagram format)
 */

import React from 'react';

interface ResultadoPartidaCardProps {
  resultado: 'VITORIA' | 'EMPATE' | 'DERROTA';
  placarSadock: number;
  placarAdversario: number;
  adversario: string;
  data: string;
  competicao: string;
}

export function ResultadoPartidaCard({
  resultado,
  placarSadock,
  placarAdversario,
  adversario,
  data,
  competicao
}: ResultadoPartidaCardProps) {
  const colors = {
    VITORIA: {
      bg: 'from-green-900/20 to-green-950/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'shadow-[0_0_80px_rgba(34,197,94,0.3)]',
      emoji: '🏆'
    },
    EMPATE: {
      bg: 'from-yellow-900/20 to-yellow-950/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      glow: 'shadow-[0_0_80px_rgba(234,179,8,0.3)]',
      emoji: '🤝'
    },
    DERROTA: {
      bg: 'from-red-900/20 to-red-950/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'shadow-[0_0_80px_rgba(239,68,68,0.3)]',
      emoji: '⚔️'
    }
  };

  const theme = colors[resultado];

  return (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]"
      style={{ width: '1080px', height: '1920px' }}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-40 -left-40 w-96 h-96 rounded-full bg-[#d3b379] blur-[120px]" />
        <div className="absolute bottom-40 -right-40 w-96 h-96 rounded-full bg-[#d3b379] blur-[120px]" />
      </div>

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />

      {/* Bottom accent line */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d3b379] to-transparent" />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 border-l-4 border-t-4 border-[#d3b379]/30" />
      <div className="absolute bottom-0 right-0 w-64 h-64 border-r-4 border-b-4 border-[#d3b379]/30" />

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-['Anton',sans-serif] text-[#d3b379] text-8xl tracking-[0.2em] mb-4">
            SADOCK FC
          </h1>
          <div className="w-40 h-1 bg-gradient-to-r from-transparent via-[#d3b379] to-transparent mx-auto" />
        </div>

        {/* Result badge */}
        <div className={`inline-block px-16 py-8 rounded-full bg-gradient-to-r ${theme.bg} border-3 ${theme.border} mb-12`}>
          <span className={`font-['Roboto',sans-serif] ${theme.text} text-5xl tracking-[0.3em] uppercase font-bold`}>
            {theme.emoji} {resultado} {theme.emoji}
          </span>
        </div>

        {/* Score board */}
        <div className={`bg-gradient-to-br ${theme.bg} border-2 ${theme.border} rounded-[40px] p-16 mb-12 ${theme.glow}`}>
          <div className="flex items-center justify-center gap-16">
            <div className="text-center">
              <p className="font-['Roboto',sans-serif] text-white/40 text-3xl tracking-wider mb-4">SADOCK FC</p>
              <p className={`font-['Anton',sans-serif] ${theme.text} text-[140px] leading-none`}>{placarSadock}</p>
            </div>
            <span className="font-['Anton',sans-serif] text-white/30 text-8xl">×</span>
            <div className="text-center">
              <p className="font-['Roboto',sans-serif] text-white/40 text-3xl tracking-wider mb-4 max-w-[300px] truncate">
                {adversario.toUpperCase()}
              </p>
              <p className={`font-['Anton',sans-serif] text-white text-[140px] leading-none`}>{placarAdversario}</p>
            </div>
          </div>
        </div>

        {/* Match info */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-6">
            <div className="w-16 h-16 rounded-lg bg-[#d3b379]/20 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d3b379" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="font-['Roboto',sans-serif] text-white/60 text-4xl tracking-wide">{data}</span>
          </div>
          <p className="font-['Montserrat',sans-serif] text-white/50 text-3xl tracking-wider">{competicao}</p>
        </div>

        {/* Footer */}
        <div className="mt-16">
          <div className="w-40 h-1 bg-gradient-to-r from-transparent via-[#d3b379] to-transparent mx-auto mb-8" />
          <p className="font-['Roboto',sans-serif] text-white/30 text-2xl tracking-[0.2em] text-center">
            SADOCK FC • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
