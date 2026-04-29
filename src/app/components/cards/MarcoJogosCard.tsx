import React from 'react';
import { CardBase } from './CardBase';

interface MarcoJogosCardProps {
  playerName: string;
  playerNumber: number;
  playerPhoto?: string;
  total: number;
  milestone: number;
}

export function MarcoJogosCard({ playerName, playerNumber, playerPhoto, total, milestone }: MarcoJogosCardProps) {
  return (
    <CardBase playerName={playerName} playerNumber={playerNumber} playerPhoto={playerPhoto}>
      <div className="text-center space-y-12">
        {/* Achievement type */}
        <div className="inline-block px-12 py-6 rounded-full bg-gradient-to-r from-[#d3b379]/20 to-[#b8964a]/20 border-2 border-[#d3b379]">
          <span className="font-['Roboto',sans-serif] text-[#d3b379] text-4xl tracking-[0.3em] uppercase font-bold">
            👕 MARCO HISTÓRICO 👕
          </span>
        </div>

        {/* Main milestone number */}
        <div className="space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[#d3b379] blur-3xl opacity-40" />
            <div className="relative">
              <h3 className="font-['Anton',sans-serif] text-transparent bg-clip-text bg-gradient-to-r from-[#d3b379] via-white to-[#d3b379] text-[200px] leading-none tracking-wider">
                {milestone}
              </h3>
              <p className="font-['Anton',sans-serif] text-white text-6xl tracking-[0.2em] mt-8">
                JOGOS
              </p>
            </div>
          </div>
          <p className="font-['Montserrat',sans-serif] text-white/70 text-4xl leading-relaxed">
            Pelo Sadock FC
          </p>
        </div>

        {/* Shield decoration */}
        <div className="flex justify-center pt-6">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#d3b379] to-[#b8964a] flex items-center justify-center shadow-[0_0_80px_rgba(211,179,121,0.5)]">
            <span className="text-[#0a0a0a] text-8xl">🛡️</span>
          </div>
        </div>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="w-24 h-1 bg-gradient-to-r from-transparent to-[#d3b379]" />
          <span className="font-['Roboto',sans-serif] text-[#d3b379] text-3xl">★</span>
          <div className="w-24 h-1 bg-gradient-to-l from-transparent to-[#d3b379]" />
        </div>
      </div>
    </CardBase>
  );
}
