-- ============================================================
-- Idosos da Zona Norte — Migração V13
-- NOTA TOTAL = SOMA das notas diárias.
--   Cada dia: nota cravada 0-10
--   Total: soma de todos os dias (pode passar de 10)
-- ============================================================

create or replace view public.nota_jogadores as
select
  j.id as jogador_id,
  coalesce(
    sum(least(10, greatest(0, p.pontos))),
    0
  )::numeric(10,2) as nota_total,
  count(p.pontos) as dias_pontuados,
  (select count(*) from public.mvp_por_dia m where m.jogador_id = j.id)::int as mvp_count
from public.jogadores j
left join public.pontuacao_dia p on p.jogador_id = j.id
group by j.id;
