-- ============================================================
-- Idosos da Zona Norte — Migração V3
-- Cor do colete (vermelho/azul) + view "melhor time do mês"
-- ============================================================

-- 1) cor do colete em estatisticas_jogo
alter table public.estatisticas_jogo
  add column if not exists cor_colete text
  check (cor_colete in ('vermelho','azul'));

-- 2) view: ranking do mês corrente (gols + assists*0.5 + mvp*2)
create or replace view public.melhor_time_mes as
with mes_atual as (
  select date_trunc('month', current_date)::date as ini
), pontuacao as (
  select
    j.id as jogador_id,
    j.nome,
    j.apelido,
    j.posicao,
    j.foto_url,
    j.nivel,
    coalesce(sum(e.gols), 0) as gols,
    coalesce(sum(e.assistencias), 0) as assistencias,
    coalesce(sum(case when e.mvp then 1 else 0 end), 0) as mvps,
    (coalesce(sum(e.gols), 0)
     + coalesce(sum(e.assistencias), 0) * 0.5
     + coalesce(sum(case when e.mvp then 1 else 0 end), 0) * 2) as pontos
  from public.jogadores j
  left join public.estatisticas_jogo e on e.jogador_id = j.id and e.presente = true
  left join public.jogos g
    on g.id = e.jogo_id
    and g.data_jogo >= (select ini from mes_atual)
  where j.ativo = true
  group by j.id, j.nome, j.apelido, j.posicao, j.foto_url, j.nivel
)
select * from pontuacao;

-- 3) view: estatísticas por colete (V/E/D em vermelho e azul)
create or replace view public.estatisticas_por_colete as
select
  jogador_id,
  count(*) filter (where cor_colete = 'vermelho' and resultado = 'V') as v_vermelho,
  count(*) filter (where cor_colete = 'vermelho' and resultado = 'E') as e_vermelho,
  count(*) filter (where cor_colete = 'vermelho' and resultado = 'D') as d_vermelho,
  count(*) filter (where cor_colete = 'azul' and resultado = 'V') as v_azul,
  count(*) filter (where cor_colete = 'azul' and resultado = 'E') as e_azul,
  count(*) filter (where cor_colete = 'azul' and resultado = 'D') as d_azul
from public.estatisticas_jogo
where presente = true
group by jogador_id;
