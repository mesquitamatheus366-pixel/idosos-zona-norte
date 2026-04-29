/**
 * Card Detector - Detecta conquistas e marcos após cada partida
 * Gera cards automáticos para Instagram (1080x1920)
 */

interface Player {
  id: string;
  nome: string;
  numero: number;
  posicao: string;
  foto?: string;
}

interface Match {
  id: string;
  data: string;
  equipeCasa: string;
  equipeFora: string;
  placarCasa: number;
  placarFora: number;
  sumula?: any[];
  craqueId?: string;
}

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

/**
 * Detecta todas as conquistas de uma partida
 */
export function detectAchievements(
  match: Match,
  allMatches: Match[],
  players: Player[]
): Achievement[] {
  const achievements: Achievement[] = [];

  if (!match.sumula || match.sumula.length === 0) return achievements;

  const isCasa = match.equipeCasa === 'Sadock FC';
  const sadockScore = isCasa ? match.placarCasa : match.placarFora;
  const adversarioScore = isCasa ? match.placarFora : match.placarCasa;
  const adversarioName = isCasa ? match.equipeFora : match.equipeCasa;

  // Para cada jogador na súmula
  match.sumula.forEach((sumula: any) => {
    if (!sumula.presente) return;

    const player = players.find((p) => p.id === sumula.playerId);
    if (!player) return;

    const playerAllTimeStats = calculatePlayerStats(sumula.playerId, allMatches);

    // 1. ESTREIA (primeiro jogo)
    if (playerAllTimeStats.jogos === 1) {
      achievements.push({
        type: 'ESTREIA',
        playerId: player.id,
        playerName: player.nome,
        playerNumber: player.numero,
        playerPhoto: player.foto,
        data: {
          adversario: adversarioName,
          data: match.data,
        },
        matchId: match.id,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. PRIMEIRO GOL
    if (sumula.gols > 0 && playerAllTimeStats.gols === sumula.gols) {
      achievements.push({
        type: 'PRIMEIRO_GOL',
        playerId: player.id,
        playerName: player.nome,
        playerNumber: player.numero,
        playerPhoto: player.foto,
        data: {
          adversario: adversarioName,
          data: match.data,
        },
        matchId: match.id,
        timestamp: new Date().toISOString(),
      });
    }

    // 3. HAT-TRICK (3+ gols na partida)
    if (sumula.gols >= 3) {
      achievements.push({
        type: 'HAT_TRICK',
        playerId: player.id,
        playerName: player.nome,
        playerNumber: player.numero,
        playerPhoto: player.foto,
        data: {
          gols: sumula.gols,
          adversario: adversarioName,
          data: match.data,
        },
        matchId: match.id,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. MARCOS DE GOLS (5, 10, 20, 30, 40, 50, 100+)
    const goalMilestones = [5, 10, 20, 30, 40, 50, 100];
    goalMilestones.forEach((milestone) => {
      const previousGoals = playerAllTimeStats.gols - sumula.gols;
      if (previousGoals < milestone && playerAllTimeStats.gols >= milestone) {
        achievements.push({
          type: 'MARCO_GOLS',
          playerId: player.id,
          playerName: player.nome,
          playerNumber: player.numero,
          playerPhoto: player.foto,
          data: {
            total: playerAllTimeStats.gols,
            milestone: milestone,
          },
          matchId: match.id,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 5. MARCOS DE ASSISTÊNCIAS (5, 10, 20, 30, 40, 50, 100+)
    const assistMilestones = [5, 10, 20, 30, 40, 50, 100];
    assistMilestones.forEach((milestone) => {
      const previousAssists = playerAllTimeStats.assistencias - (sumula.assistencias || 0);
      if (previousAssists < milestone && playerAllTimeStats.assistencias >= milestone) {
        achievements.push({
          type: 'MARCO_ASSISTENCIAS',
          playerId: player.id,
          playerName: player.nome,
          playerNumber: player.numero,
          playerPhoto: player.foto,
          data: {
            total: playerAllTimeStats.assistencias,
            milestone: milestone,
          },
          matchId: match.id,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 6. MARCOS DE JOGOS (10, 20, 30, 40, 50, 60, 70, 80, 90, 100+)
    const gameMilestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    gameMilestones.forEach((milestone) => {
      if (playerAllTimeStats.jogos === milestone) {
        achievements.push({
          type: 'MARCO_JOGOS',
          playerId: player.id,
          playerName: player.nome,
          playerNumber: player.numero,
          playerPhoto: player.foto,
          data: {
            total: playerAllTimeStats.jogos,
            milestone: milestone,
          },
          matchId: match.id,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // 7. SEQUÊNCIA DE GOLS (3+ gols na partida)
    if (sumula.gols >= 3) {
      achievements.push({
        type: 'SEQUENCIA_GOLS',
        playerId: player.id,
        playerName: player.nome,
        playerNumber: player.numero,
        playerPhoto: player.foto,
        data: {
          gols: sumula.gols,
          adversario: adversarioName,
        },
        matchId: match.id,
        timestamp: new Date().toISOString(),
      });
    }

    // 8. SEQUÊNCIA DE ASSISTÊNCIAS (3+ assistências na partida)
    if ((sumula.assistencias || 0) >= 3) {
      achievements.push({
        type: 'SEQUENCIA_ASSISTENCIAS',
        playerId: player.id,
        playerName: player.nome,
        playerNumber: player.numero,
        playerPhoto: player.foto,
        data: {
          assistencias: sumula.assistencias,
          adversario: adversarioName,
        },
        matchId: match.id,
        timestamp: new Date().toISOString(),
      });
    }

    // 9. CLEAN SHEET GOLEIRO (goleiro sem sofrer gols)
    if (player.posicao === 'Goleiro' && adversarioScore === 0) {
      achievements.push({
        type: 'CLEAN_SHEET',
        playerId: player.id,
        playerName: player.nome,
        playerNumber: player.numero,
        playerPhoto: player.foto,
        data: {
          adversario: adversarioName,
          defesas: sumula.defesas || 0,
        },
        matchId: match.id,
        timestamp: new Date().toISOString(),
      });
    }

    // 10. MVP DA PARTIDA
    if (match.craqueId === player.id) {
      achievements.push({
        type: 'MVP_PARTIDA',
        playerId: player.id,
        playerName: player.nome,
        playerNumber: player.numero,
        playerPhoto: player.foto,
        data: {
          adversario: adversarioName,
          placarSadock: sadockScore,
          placarAdversario: adversarioScore,
          gols: sumula.gols || 0,
          assistencias: sumula.assistencias || 0,
        },
        matchId: match.id,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 11. CARD DE RESULTADO (vitória, empate, derrota)
  const result = sadockScore > adversarioScore ? 'VITORIA' : sadockScore < adversarioScore ? 'DERROTA' : 'EMPATE';
  achievements.push({
    type: 'RESULTADO_PARTIDA',
    playerId: 'team', // Card do time
    playerName: 'Sadock FC',
    playerNumber: 0,
    data: {
      resultado: result,
      placarSadock: sadockScore,
      placarAdversario: adversarioScore,
      adversario: adversarioName,
      data: match.data,
      competicao: (match as any).competicao || 'Amistoso',
    },
    matchId: match.id,
    timestamp: new Date().toISOString(),
  });

  return achievements;
}

/**
 * Calcula estatísticas totais de um jogador
 */
function calculatePlayerStats(playerId: string, matches: Match[]) {
  let jogos = 0;
  let gols = 0;
  let assistencias = 0;
  let defesas = 0;
  let mvps = 0;

  matches.forEach((match) => {
    if (!match.sumula) return;

    const playerSumula = match.sumula.find((s: any) => s.playerId === playerId && s.presente);
    if (playerSumula) {
      jogos++;
      gols += playerSumula.gols || 0;
      assistencias += playerSumula.assistencias || 0;
      defesas += playerSumula.defesas || 0;
      if (playerSumula.mvp) mvps += playerSumula.mvp;
    }
  });

  return { jogos, gols, assistencias, defesas, mvps };
}
