import React from 'react';
import { CardBase } from './CardBase';

interface PrimeiroGolCardProps {
  playerName: string;
  playerNumber: number;
  playerPhoto?: string;
  adversario: string;
  data: string;
}

export function PrimeiroGolCard({ playerName, playerNumber, playerPhoto, adversario, data }: PrimeiroGolCardProps) {
  return (
    <CardBase playerName={playerName} playerNumber={playerNumber} playerPhoto={playerPhoto}>
      <div className="text-center space-y-12">
        {/* Achievement type */}
        <div className="inline-block px-12 py-6 rounded-full bg-gradient-to-r from-[#d3b379]/20 to-[#b8964a]/20 border-2 border-[#d3b379]">
          <span className="font-['Roboto',sans-serif] text-[#d3b379] text-4xl tracking-[0.3em] uppercase font-bold">
            ⚽ PRIMEIRO GOL ⚽
          </span>
        </div>

        {/* Main message */}
        <div className="space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[#d3b379] blur-3xl opacity-20" />
            <h3 className="relative font-['Anton',sans-serif] text-transparent bg-clip-text bg-gradient-to-r from-[#d3b379] to-[#b8964a] text-8xl tracking-wider">
              HISTÓRICO!
            </h3>
          </div>
          <p className="font-['Montserrat',sans-serif] text-white/70 text-4xl leading-relaxed">
            O início de uma <br />
            grande trajetória
          </p>
        </div>

        {/* Match details */}
        <div className="pt-8 space-y-4">
          <div className="flex items-center justify-center gap-6">
            <div className="w-16 h-16 rounded-lg bg-[#d3b379]/20 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d3b379" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <span className="font-['Roboto',sans-serif] text-white/60 text-3xl tracking-wide">
              {data}
            </span>
          </div>
          <p className="font-['Montserrat',sans-serif] text-white/50 text-3xl">
            vs {adversario}
          </p>
        </div>

        {/* Soccer ball decoration */}
        <div className="flex justify-center pt-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#d3b379] to-[#b8964a] flex items-center justify-center shadow-[0_0_60px_rgba(211,179,121,0.4)]">
            <span className="text-[#0a0a0a] text-7xl">⚽</span>
          </div>
        </div>
      </div>
    </CardBase>
  );
}
