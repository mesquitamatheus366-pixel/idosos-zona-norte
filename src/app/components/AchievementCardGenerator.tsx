/**
 * Achievement Card Generator - Fetches achievements and generates downloadable PNG cards
 */

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { renderCardToPNG, downloadBlob, generateCardFilename } from '../utils/cardRenderer';
import {
  EstreiaCard,
  PrimeiroGolCard,
  HatTrickCard,
  MarcoGolsCard,
  MarcoAssistenciasCard,
  MarcoJogosCard,
  MVPCard,
  CleanSheetCard,
} from './cards';

interface Achievement {
  type: string;
  playerId: string;
  playerName: string;
  playerNumber: number;
  playerPhoto?: string;
  data: any;
  matchId: string;
  timestamp: string;
}

interface AchievementCardGeneratorProps {
  playerId: string;
  playerName: string;
  playerNumber: number;
  playerPhoto?: string;
}

export function AchievementCardGenerator({
  playerId,
  playerName,
  playerNumber,
  playerPhoto
}: AchievementCardGeneratorProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-039eccc6/achievements/${playerId}`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setAchievements(data.achievements || []);
        }
      } catch (err) {
        console.error('[AchievementCardGenerator] Error loading achievements:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAchievements();
  }, [playerId]);

  const handleDownloadCard = async (achievement: Achievement) => {
    setGenerating(achievement.type);
    try {
      let CardComponent;
      let props;

      // Map achievement type to card component and props
      switch (achievement.type) {
        case 'ESTREIA':
          CardComponent = EstreiaCard;
          props = {
            playerName,
            playerNumber,
            playerPhoto,
            adversario: achievement.data.adversario,
            data: achievement.data.data,
          };
          break;

        case 'PRIMEIRO_GOL':
          CardComponent = PrimeiroGolCard;
          props = {
            playerName,
            playerNumber,
            playerPhoto,
            adversario: achievement.data.adversario,
            data: achievement.data.data,
          };
          break;

        case 'HAT_TRICK':
          CardComponent = HatTrickCard;
          props = {
            playerName,
            playerNumber,
            playerPhoto,
            gols: achievement.data.gols,
            adversario: achievement.data.adversario,
            data: achievement.data.data,
          };
          break;

        case 'MARCO_GOLS':
          CardComponent = MarcoGolsCard;
          props = {
            playerName,
            playerNumber,
            playerPhoto,
            total: achievement.data.total,
            milestone: achievement.data.milestone,
          };
          break;

        case 'MARCO_ASSISTENCIAS':
          CardComponent = MarcoAssistenciasCard;
          props = {
            playerName,
            playerNumber,
            playerPhoto,
            total: achievement.data.total,
            milestone: achievement.data.milestone,
          };
          break;

        case 'MARCO_JOGOS':
          CardComponent = MarcoJogosCard;
          props = {
            playerName,
            playerNumber,
            playerPhoto,
            total: achievement.data.total,
            milestone: achievement.data.milestone,
          };
          break;

        case 'MVP_PARTIDA':
          CardComponent = MVPCard;
          props = {
            playerName,
            playerNumber,
            playerPhoto,
            adversario: achievement.data.adversario,
            placarSadock: achievement.data.placarSadock,
            placarAdversario: achievement.data.placarAdversario,
            gols: achievement.data.gols,
            assistencias: achievement.data.assistencias,
          };
          break;

        case 'CLEAN_SHEET':
          CardComponent = CleanSheetCard;
          props = {
            playerName,
            playerNumber,
            playerPhoto,
            adversario: achievement.data.adversario,
            defesas: achievement.data.defesas,
          };
          break;

        default:
          console.error('Unknown achievement type:', achievement.type);
          return;
      }

      // Generate PNG
      const blob = await renderCardToPNG(CardComponent, props);

      // Download
      const filename = generateCardFilename(achievement);
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('[AchievementCardGenerator] Error generating card:', err);
      alert('Erro ao gerar card. Tente novamente.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#d3b379]/10 flex items-center justify-center">
          <span className="text-[#d3b379] text-lg">🏆</span>
        </div>
        <h4 className="font-['Roboto',sans-serif] text-white/70 text-sm tracking-wider">
          CONQUISTAS ({achievements.length})
        </h4>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#d3b379]/20 border-t-[#d3b379] rounded-full animate-spin" />
        </div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-6">
          <p className="font-['Roboto',sans-serif] text-white/30 text-xs">
            Nenhuma conquista ainda
          </p>
          <p className="font-['Montserrat',sans-serif] text-white/20 text-[10px] mt-2">
            Conquistas serão geradas automaticamente após as próximas partidas
          </p>
        </div>
      ) : (
        <div className="space-y-2">
        {achievements.map((achievement, i) => (
          <button
            key={i}
            onClick={() => handleDownloadCard(achievement)}
            disabled={generating === achievement.type}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(211,179,121,0.08)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(211,179,121,0.2)] transition-all group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#d3b379]/10 flex items-center justify-center group-hover:bg-[#d3b379]/20 transition-colors">
                <span className="text-xl">{getAchievementEmoji(achievement.type)}</span>
              </div>
              <div className="text-left">
                <p className="font-['Roboto',sans-serif] text-white/80 text-xs tracking-wide">
                  {getAchievementLabel(achievement.type)}
                </p>
                <p className="font-['Montserrat',sans-serif] text-white/40 text-[10px]">
                  {new Date(achievement.timestamp).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {generating === achievement.type && (
                <div className="w-4 h-4 border-2 border-[#d3b379]/20 border-t-[#d3b379] rounded-full animate-spin" />
              )}
              <Download size={14} className="text-[#d3b379]/60 group-hover:text-[#d3b379] transition-colors" />
            </div>
          </button>
        ))}
        </div>
      )}
    </div>
  );
}

function getAchievementEmoji(type: string): string {
  const map: Record<string, string> = {
    ESTREIA: '⭐',
    PRIMEIRO_GOL: '⚽',
    HAT_TRICK: '🎩',
    MARCO_GOLS: '🏆',
    MARCO_ASSISTENCIAS: '🎯',
    MARCO_JOGOS: '👕',
    MVP_PARTIDA: '👑',
    CLEAN_SHEET: '🧤',
    SEQUENCIA_GOLS: '🔥',
    SEQUENCIA_ASSISTENCIAS: '⚡',
  };
  return map[type] || '🏅';
}

function getAchievementLabel(type: string): string {
  const map: Record<string, string> = {
    ESTREIA: 'Estreia',
    PRIMEIRO_GOL: 'Primeiro Gol',
    HAT_TRICK: 'Hat-trick',
    MARCO_GOLS: 'Marco de Gols',
    MARCO_ASSISTENCIAS: 'Marco de Assistências',
    MARCO_JOGOS: 'Marco de Jogos',
    MVP_PARTIDA: 'Craque da Partida',
    CLEAN_SHEET: 'Clean Sheet',
    SEQUENCIA_GOLS: 'Sequência de Gols',
    SEQUENCIA_ASSISTENCIAS: 'Sequência de Assistências',
  };
  return map[type] || type;
}
