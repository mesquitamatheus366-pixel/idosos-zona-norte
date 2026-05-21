-- ============================================================
-- Idosos da Zona Norte — Migração V12
-- Parcerias: quantas vezes cada dupla jogou no mesmo time
-- ============================================================

create or replace view public.parcerias as
select
  a.jogador_id as jogador_a,
  b.jogador_id as jogador_b,
  count(*)::int as vezes_juntos
from public.partida_jogadores a
join public.partida_jogadores b
  on a.partida_id = b.partida_id
  and a.lado = b.lado
  and a.jogador_id < b.jogador_id
group by a.jogador_id, b.jogador_id;
