-- ============================================================
-- Idosos da Zona Norte — Migração V4
-- Adiciona coluna "defesas" (goleiro) e atualiza view agregada
-- ============================================================

alter table public.estatisticas_jogo
  add column if not exists defesas int not null default 0
  check (defesas >= 0);

-- Recria a view agregada incluindo defesas
create or replace view public.estatisticas_agregadas as
select
  j.id as jogador_id,
  j.nome,
  count(distinct e.jogo_id) filter (where e.presente) as jogos_disputados,
  coalesce(sum(e.gols), 0) as gols,
  coalesce(sum(e.assistencias), 0) as assistencias,
  coalesce(sum(e.defesas), 0) as defesas,
  count(*) filter (where e.resultado = 'V') as vitorias,
  count(*) filter (where e.resultado = 'E') as empates,
  count(*) filter (where e.resultado = 'D') as derrotas,
  count(*) filter (where e.mvp) as mvp_count
from public.jogadores j
left join public.estatisticas_jogo e on e.jogador_id = j.id
group by j.id, j.nome;

-- Recria a view por colete (caso v3 não tenha rodado, garante que existe)
create or replace view public.estatisticas_por_colete as
select
  jogador_id,
  count(*) filter (where cor_colete = 'vermelho') as jogos_vermelho,
  count(*) filter (where cor_colete = 'azul') as jogos_azul,
  count(*) filter (where cor_colete = 'vermelho' and resultado = 'V') as v_vermelho,
  count(*) filter (where cor_colete = 'vermelho' and resultado = 'E') as e_vermelho,
  count(*) filter (where cor_colete = 'vermelho' and resultado = 'D') as d_vermelho,
  count(*) filter (where cor_colete = 'azul' and resultado = 'V') as v_azul,
  count(*) filter (where cor_colete = 'azul' and resultado = 'E') as e_azul,
  count(*) filter (where cor_colete = 'azul' and resultado = 'D') as d_azul
from public.estatisticas_jogo
where presente = true
group by jogador_id;
