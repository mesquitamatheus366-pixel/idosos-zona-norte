-- ============================================================
-- Idosos da Zona Norte — Migração V7
-- Ajuste da fórmula de pontuação:
--   Vitória +0,4 · Empate +0,1 · Derrota -0,1
--   Gol +0,3 · Assistência +0,2 · Defesa +0,1
--   Presença +5,0 · Cartão vermelho -1,0 · Gol contra -0,5
-- ============================================================

create or replace view public.pontuacao_dia as
select
  e.jogo_id,
  e.jogador_id,
  (
    (e.vitorias_vermelho + e.vitorias_azul) * 0.4
    + (e.empates_vermelho + e.empates_azul) * 0.1
    - (e.derrotas_vermelho + e.derrotas_azul) * 0.1
    + e.gols * 0.3
    + e.assistencias * 0.2
    + e.defesas * 0.1
    - e.cartoes_vermelhos * 1.0
    - e.gols_contra * 0.5
    + (case when e.presente then 5.0 else 0.0 end)
  )::numeric(10,2) as pontos
from public.estatisticas_jogo e;
