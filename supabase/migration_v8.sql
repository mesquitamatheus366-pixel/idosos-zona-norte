-- ============================================================
-- Idosos da Zona Norte — Migração V8
-- Nota do jogador = MÉDIA das notas diárias (cada dia 0-10).
-- Assim a nota fica naturalmente entre 0 e 10:
--   0 = jogou muito mal somando os dias · 10 = craque
-- ============================================================

create or replace view public.nota_jogadores as
select
  j.id as jogador_id,
  coalesce(
    round(avg(least(10, greatest(0, p.pontos))), 2),
    0
  )::numeric(10,2) as nota_total,
  count(p.pontos) as dias_pontuados,
  (select count(*) from public.mvp_por_dia m where m.jogador_id = j.id)::int as mvp_count
from public.jogadores j
left join public.pontuacao_dia p on p.jogador_id = j.id
group by j.id;
