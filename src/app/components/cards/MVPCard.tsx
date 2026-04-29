import React from 'react';
import { CardBase } from './CardBase';

interface MVPCardProps {
  playerName: string;
  playerNumber: number;
  playerPhoto?: string;
  adversario: string;
  placarSadock: number;
  placarAdversario: number;
  gols: number;
  assistencias: number;
}

export function MVPCard({
  playerName,
  playerNumber,
  playerPhoto,
  adversario,
  placarSadock,
  placarAdversario,
  gols,
  assistencias
}: MVPCardProps) {
  return (
    <CardBase playerName={playerName} playerNumber={playerNumber} playerPhoto={playerPhoto}>
      <div className="text-center space-y-12">
        {/* Achievement type */}
        <div className="inline-block px-12 py-6 rounded-full bg-gradient-to-r from-[#d3b379]/20 to-[#b8964a]/20 border-2 border-[#d3b379]">
          <span className="font-['Roboto',sans-serif] text-[#d3b379] text-4xl tracking-[0.3em] uppercase font-bold">
            👑 CRAQUE DA PARTIDA 👑
          </span>
        </div>

        {/* Main message */}
        <div className="space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-[#d3b379] blur-3xl opacity-40" />
            <div className="relative">
              <h3 className="font-['Anton',sans-serif] text-transparent bg-clip-text bg-gradient-to-r from-[#d3b379] via-white to-[#d3b379] text-8xl tracking-wider">
                MVP
              </h3>
            </div>
          </div>
          <p className="font-['Montserrat',sans-serif] text-white/70 text-4xl leading-relaxed">
            Melhor jogador em campo
          </p>
        </div>

        {/* Match result */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-[#d3b379]/20 rounded-3xl p-8 space-y-6">
          <p className="font-['Montserrat',sans-serif] text-white/50 text-3xl">vs {adversario}</p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="font-['Roboto',sans-serif] text-white/40 text-2xl tracking-wider mb-2">SADOCK FC</p>
              <p className="font-['Anton',sans-serif] text-[#d3b379] text-7xl">{placarSadock}</p>
            </div>
            <span className="font-['Anton',sans-serif] text-white/30 text-6xl">×</span>
            <div className="text-center">
              <p className="font-['Roboto',sans-serif] text-white/40 text-2xl tracking-wider mb-2">ADVERSÁRIO</p>
              <p className="font-['Anton',sans-serif] text-white text-7xl">{placarAdversario}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-12 pt-4">
          {gols > 0 && (
            <div className="text-center">
              <p className="font-['Anton',sans-serif] text-[#d3b379] text-6xl">{gols}</p>
              <p className="font-['Roboto',sans-serif] text-white/50 text-2xl tracking-wider mt-2">
                {gols === 1 ? 'GOL' : 'GOLS'}
              </p>
            </div>
          )}
          {assistencias > 0 && (
            <div className="text-center">
              <p className="font-['Anton',sans-serif] text-[#d3b379] text-6xl">{assistencias}</p>
              <p className="font-['Roboto',sans-serif] text-white/50 text-2xl tracking-wider mt-2">
                {assistencias === 1 ? 'ASSISTÊNCIA' : 'ASSISTÊNCIAS'}
              </p>
            </div>
          )}
        </div>

        {/* Crown decoration */}
        <div className="flex justify-center pt-6">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#d3b379] to-[#b8964a] flex items-center justify-center shadow-[0_0_80px_rgba(211,179,121,0.5)]">
            <span className="text-[#0a0a0a] text-8xl">👑</span>
          </div>
        </div>
      </div>
    </CardBase>
  );
}
