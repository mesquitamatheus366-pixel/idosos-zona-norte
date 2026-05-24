-- ============================================================
-- Idosos da Zona Norte — Migração V17
-- Estatísticas por mês e craque do mês por posição
-- ============================================================

-- Estatísticas agregadas POR MÊS e POR JOGADOR.
create or replace view public.estatisticas_por_mes as
with base as (
  select
    date_trunc('month', g.data_jogo)::date as mes,
    j.id   as jogador_id,
    j.nome,
    j.apelido,
    j.posicao,
    j.foto_url,
    e.jogo_id,
    e.presente,
    e.gols, e.assistencias, e.defesas,
    e.vitorias_vermelho, e.vitorias_azul,
    e.empates_vermelho, e.empates_azul,
    e.derrotas_vermelho, e.derrotas_azul,
    e.cartoes_vermelhos, e.gols_contra,
    p.pontos
  from public.jogos g
  join public.estatisticas_jogo e on e.jogo_id = g.id
  join public.jogadores j         on j.id = e.jogador_id
  left join public.pontuacao_dia p on p.jogo_id = g.id and p.jogador_id = j.id
),
mvp_mes as (
  select date_trunc('month', g.data_jogo)::date as mes, m.jogador_id, count(*)::int as mvp_count
  from public.mvp_por_dia m
  join public.jogos g on g.id = m.jogo_id
  group by 1, 2
)
select
  b.mes,
  b.jogador_id,
  b.nome,
  b.apelido,
  b.posicao,
  b.foto_url,
  count(distinct b.jogo_id) filter (where b.presente) as jogos_disputados,
  coalesce(sum(b.gols), 0)::int          as gols,
  coalesce(sum(b.assistencias), 0)::int  as assistencias,
  coalesce(sum(b.defesas), 0)::int       as defesas,
  coalesce(sum(b.vitorias_vermelho + b.vitorias_azul), 0)::int as vitorias,
  coalesce(sum(b.empates_vermelho  + b.empates_azul), 0)::int  as empates,
  coalesce(sum(b.derrotas_vermelho + b.derrotas_azul), 0)::int as derrotas,
  coalesce(sum(b.cartoes_vermelhos), 0)::int as cartoes_vermelhos,
  coalesce(sum(b.gols_contra), 0)::int       as gols_contra,
  coalesce(max(mm.mvp_count), 0)::int        as mvp_count,
  coalesce(sum(b.pontos), 0)::numeric(10,2)  as nota_total
from base b
left join mvp_mes mm on mm.mes = b.mes and mm.jogador_id = b.jogador_id
group by b.mes, b.jogador_id, b.nome, b.apelido, b.posicao, b.foto_url;

-- Craque do mês POR POSIÇÃO: melhor pontuação de cada posição em
-- cada mês (desempate por gols+assistências).
create or replace view public.craque_mes_por_posicao as
select distinct on (mes, posicao)
  mes,
  posicao,
  jogador_id,
  nome,
  apelido,
  foto_url,
  jogos_disputados,
  gols,
  assistencias,
  mvp_count,
  nota_total
from public.estatisticas_por_mes
where jogos_disputados > 0
order by mes, posicao, nota_total desc, (gols + assistencias) desc;
