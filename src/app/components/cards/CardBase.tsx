/**
 * Base layout for all achievement cards (1080x1920 Instagram format)
 */

import React from 'react';

interface CardBaseProps {
  children: React.ReactNode;
  playerName: string;
  playerNumber: number;
  playerPhoto?: string;
}

export function CardBase({ children, playerName, playerNumber, playerPhoto }: CardBaseProps) {
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
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="pt-20 pb-12 text-center">
          <h1 className="font-['Anton',sans-serif] text-[#d3b379] text-8xl tracking-[0.2em] mb-4">
            SADOCK FC
          </h1>
          <div className="w-40 h-1 bg-gradient-to-r from-transparent via-[#d3b379] to-transparent mx-auto" />
        </div>

        {/* Player photo section */}
        {playerPhoto && (
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d3b379] to-[#b8964a] rounded-full blur-xl opacity-50" />
              <div className="relative w-80 h-80 rounded-full overflow-hidden border-8 border-[#d3b379] shadow-[0_0_60px_rgba(211,179,121,0.5)]">
                <img
                  src={playerPhoto}
                  alt={playerName}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Number badge */}
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-[#d3b379] to-[#b8964a] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <span className="font-['Anton',sans-serif] text-[#0a0a0a] text-5xl">
                  {playerNumber}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Achievement content (passed as children) */}
        <div className="flex-1 flex flex-col items-center justify-center px-20">
          {children}
        </div>

        {/* Player name footer */}
        <div className="pb-20 text-center">
          <div className="w-40 h-1 bg-gradient-to-r from-transparent via-[#d3b379] to-transparent mx-auto mb-8" />
          <h2 className="font-['Anton',sans-serif] text-white text-7xl tracking-[0.15em]">
            {playerName.toUpperCase()}
          </h2>
        </div>
      </div>
    </div>
  );
}
