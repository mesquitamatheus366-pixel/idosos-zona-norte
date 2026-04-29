import React from 'react';
import { CardBase } from './CardBase';

interface HatTrickCardProps {
  playerName: string;
  playerNumber: number;
  playerPhoto?: string;
  gols: number;
  adversario: string;
  data: string;
}

export function HatTrickCard({ playerName, playerNumber, playerPhoto, gols, adversario, data }: HatTrickCardProps) {
  return (
    <CardBase playerName={playerName} playerNumber={playerNumber} playerPhoto={playerPhoto}>
      <div className="text-center space-y-12">
        {/* Achievement type */}
        <div className="inline-block px-12 py-6 rounded-full bg-gradient-to-r from-[#d3b379]/20 to-[#b8964a]/20 border-2 border-[#d3b379]">
          <span className="font-['Roboto',sans-serif] text-[#d3b379] text-4xl tracking-[0.3em] uppercase font-bold">
            🎩 HAT-TRICK 🎩
          </span>
        </div>

        {/* Main message */}
        <div className="space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[#d3b379] blur-3xl opacity-30" />
            <div className="relative">
              <h3 className="font-['Anton',sans-serif] text-transparent bg-clip-text bg-gradient-to-r from-[#d3b379] via-white to-[#d3b379] text-9xl tracking-wider">
                {gols}
              </h3>
              <p className="font-['Anton',sans-serif] text-white text-5xl tracking-[0.2em] mt-4">
                GOLS EM UMA PARTIDA
              </p>
            </div>
          </div>
          <p className="font-['Montserrat',sans-serif] text-white/70 text-4xl leading-relaxed">
            Atuação histórica!
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

        {/* Soccer balls */}
        <div className="flex justify-center gap-6 pt-6">
          {Array.from({ length: Math.min(gols, 5) }).map((_, i) => (
            <div
              key={i}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#d3b379] to-[#b8964a] flex items-center justify-center shadow-[0_0_40px_rgba(211,179,121,0.3)]"
            >
              <span className="text-[#0a0a0a] text-5xl">⚽</span>
            </div>
          ))}
        </div>
      </div>
    </CardBase>
  );
}
