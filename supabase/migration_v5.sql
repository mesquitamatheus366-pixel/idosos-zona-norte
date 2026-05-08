-- ============================================================
-- Idosos da Zona Norte — Migração V5
-- Novo modelo de pontuação:
--   * V/E/D viram contadores por cor de colete (várias partidas/dia)
--   * cartões vermelhos e gols contra rastreados
--   * MVP é calculado (top pontos do dia)
--   * Nota total = soma dos pontos de todos os dias
-- ============================================================

-- 1) Drop views dependentes antes de mexer nas colunas
drop view if exists public.estatisticas_agregadas cascade;
drop view if exists public.estatisticas_por_colete cascade;
drop view if exists public.melhor_time_mes cascade;
drop view if exists public.pontuacao_dia cascade;
drop view if exists public.mvp_por_dia cascade;
drop view if exists public.nota_jogadores cascade;

-- 2) Novas colunas (idempotentes)
alter table public.estatisticas_jogo
  add column if not exists vitorias_vermelho int not null default 0 check (vitorias_vermelho >= 0),
  add column if not exists empates_vermelho int not null default 0 check (empates_vermelho >= 0),
  add column if not exists derrotas_vermelho int not null default 0 check (derrotas_vermelho >= 0),
  add column if not exists vitorias_azul int not null default 0 check (vitorias_azul >= 0),
  add column if not exists empates_azul int not null default 0 check (empates_azul >= 0),
  add column if not exists derrotas_azul int not null default 0 check (derrotas_azul >= 0),
  add column if not exists cartoes_vermelhos int not null default 0 check (cartoes_vermelhos >= 0),
  add column if not exists gols_contra int not null default 0 check (gols_contra >= 0);

-- 3) Migra dados antigos (resultado/cor_colete) para os novos contadores
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'estatisticas_jogo'
      and column_name = 'resultado'
  ) then
    update public.estatisticas_jogo set
      vitorias_vermelho = case when cor_colete = 'vermelho' and resultado = 'V' then 1 else 0 end,
      empates_vermelho  = case when cor_colete = 'vermelho' and resultado = 'E' then 1 else 0 end,
      derrotas_vermelho = case when cor_colete = 'vermelho' and resultado = 'D' then 1 else 0 end,
      vitorias_azul     = case when cor_colete = 'azul'     and resultado = 'V' then 1 else 0 end,
      empates_azul      = case when cor_colete = 'azul'     and resultado = 'E' then 1 else 0 end,
      derrotas_azul     = case when cor_colete = 'azul'     and resultado = 'D' then 1 else 0 end;
  end if;
end $$;

-- 4) Drop colunas antigas
alter table public.estatisticas_jogo
  drop column if exists resultado,
  drop column if exists mvp,
  drop column if exists cor_colete;

-- ============================================================
-- VIEWS
-- ============================================================

-- Pontos por dia, por jogador
create view public.pontuacao_dia as
select
  e.jogo_id,
  e.jogador_id,
  (
    (e.vitorias_vermelho + e.vitorias_azul) * 0.3
    - (e.derrotas_vermelho + e.derrotas_azul) * 0.1
    + e.gols * 0.3
    + e.assistencias * 0.2
    + e.defesas * 0.1
    - e.cartoes_vermelhos * 1.0
    - e.gols_contra * 1.0
    + (case when e.presente then 5.0 else 0.0 end)
  )::numeric(10,2) as pontos
from public.estatisticas_jogo e;

-- MVP por dia: jogador com mais pontos no jogo (ignora <=0)
create view public.mvp_por_dia as
select distinct on (jogo_id)
  jogo_id, jogador_id, pontos
from public.pontuacao_dia
where pontos > 0
order by jogo_id, pontos desc, jogador_id;

-- Nota total acumulada e contagem de MVPs do jogador
create view public.nota_jogadores as
select
  j.id as jogador_id,
  coalesce(sum(p.pontos), 0)::numeric(10,2) as nota_total,
  count(*) filter (where p.pontos > 0) as dias_pontuados,
  (select count(*) from public.mvp_por_dia m where m.jogador_id = j.id)::int as mvp_count
from public.jogadores j
left join public.pontuacao_dia p on p.jogador_id = j.id
group by j.id;

-- Estatísticas agregadas (recriada com novos campos)
create view public.estatisticas_agregadas as
select
  j.id as jogador_id,
  j.nome,
  count(distinct e.jogo_id) filter (where e.presente) as jogos_disputados,
  coalesce(sum(e.gols), 0) as gols,
  coalesce(sum(e.assistencias), 0) as assistencias,
  coalesce(sum(e.defesas), 0) as defesas,
  coalesce(sum(e.vitorias_vermelho + e.vitorias_azul), 0) as vitorias,
  coalesce(sum(e.empates_vermelho + e.empates_azul), 0) as empates,
  coalesce(sum(e.derrotas_vermelho + e.derrotas_azul), 0) as derrotas,
  coalesce(sum(e.cartoes_vermelhos), 0) as cartoes_vermelhos,
  coalesce(sum(e.gols_contra), 0) as gols_contra,
  coalesce((select mvp_count from public.nota_jogadores n where n.jogador_id = j.id), 0) as mvp_count,
  coalesce((select nota_total from public.nota_jogadores n where n.jogador_id = j.id), 0) as nota_total
from public.jogadores j
left join public.estatisticas_jogo e on e.jogador_id = j.id
group by j.id, j.nome;

-- Estatísticas por cor de colete (recriada)
create view public.estatisticas_por_colete as
select
  jogador_id,
  sum(vitorias_vermelho + empates_vermelho + derrotas_vermelho)::int as jogos_vermelho,
  sum(vitorias_azul + empates_azul + derrotas_azul)::int as jogos_azul,
  sum(vitorias_vermelho)::int as v_vermelho,
  sum(empates_vermelho)::int as e_vermelho,
  sum(derrotas_vermelho)::int as d_vermelho,
  sum(vitorias_azul)::int as v_azul,
  sum(empates_azul)::int as e_azul,
  sum(derrotas_azul)::int as d_azul
from public.estatisticas_jogo
where presente = true
group by jogador_id;

-- Melhor do mês (com pontuação calculada)
create view public.melhor_time_mes as
select
  j.id as jogador_id,
  j.nome,
  j.apelido,
  j.posicao,
  j.foto_url,
  j.nivel,
  coalesce(sum(e.gols), 0) as gols,
  coalesce(sum(e.assistencias), 0) as assistencias,
  coalesce((
    select count(*) from public.mvp_por_dia m
    join public.jogos g2 on g2.id = m.jogo_id
    where m.jogador_id = j.id
      and g2.data_jogo >= date_trunc('month', current_date)
  ), 0) as mvps,
  coalesce(sum(p.pontos), 0)::numeric(10,2) as pontos
from public.jogadores j
left join public.jogos g on g.data_jogo >= date_trunc('month', current_date)
left join public.estatisticas_jogo e on e.jogo_id = g.id and e.jogador_id = j.id and e.presente = true
left join public.pontuacao_dia p on p.jogo_id = g.id and p.jogador_id = j.id
where j.ativo = true
group by j.id, j.nome, j.apelido, j.posicao, j.foto_url, j.nivel;
