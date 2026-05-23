-- ============================================================
-- Idosos da Zona Norte — Migração V15
-- Critério de desempate único: gols + assistências.
-- Se persistir o empate, todos os empatados ficam com MVP.
-- ============================================================

create or replace view public.mvp_por_dia as
with base as (
  select e.jogo_id, e.jogador_id, p.pontos, e.gols, e.assistencias
  from public.pontuacao_dia p
  join public.estatisticas_jogo e
    on e.jogo_id = p.jogo_id and e.jogador_id = p.jogador_id
  where p.pontos > 0 and e.presente = true
),
max_pts as (
  select jogo_id, max(pontos) as mp
  from base
  group by jogo_id
),
top_pts as (
  -- todos os jogadores empatados na pontuação máxima do dia
  select b.* from base b
  join max_pts m on m.jogo_id = b.jogo_id and b.pontos = m.mp
),
max_ga as (
  -- entre os do topo, maior soma de gols + assistências
  select jogo_id, max(gols + assistencias) as mga
  from top_pts
  group by jogo_id
)
select t.jogo_id, t.jogador_id, t.pontos
from top_pts t
join max_ga g on g.jogo_id = t.jogo_id and (t.gols + t.assistencias) = g.mga;
