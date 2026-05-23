-- ============================================================
-- Idosos da Zona Norte — Migração V16
-- Presença passa de 5,0 para 3,5 pontos
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
    + (case when e.presente then 3.5 else 0.0 end)
  )::numeric(10,2) as pontos
from public.estatisticas_jogo e;
