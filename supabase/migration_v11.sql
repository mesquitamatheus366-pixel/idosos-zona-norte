-- ============================================================
-- Idosos da Zona Norte — Migração V11
-- Power Ranking: snapshots do ranking pra mostrar quem subiu/desceu
-- ============================================================

create table if not exists public.ranking_snapshots (
  id uuid primary key default uuid_generate_v4(),
  data_snapshot timestamptz not null default now(),
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  posicao_rank int not null,
  nota_total numeric(10,2) not null
);

create index if not exists idx_snap_data on public.ranking_snapshots(data_snapshot);

alter table public.ranking_snapshots enable row level security;

drop policy if exists "leitura publica snapshots" on public.ranking_snapshots;
drop policy if exists "admin cria snapshots" on public.ranking_snapshots;

create policy "leitura publica snapshots" on public.ranking_snapshots
  for select using (true);
create policy "admin cria snapshots" on public.ranking_snapshots
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Função: salva a foto do ranking atual
create or replace function public.tirar_snapshot_ranking()
returns void
language plpgsql
security definer
as $$
declare
  nova_data timestamptz := now();
begin
  insert into public.ranking_snapshots (data_snapshot, jogador_id, posicao_rank, nota_total)
  select
    nova_data,
    jogador_id,
    row_number() over (order by nota_total desc, gols desc, assistencias desc),
    nota_total
  from public.estatisticas_agregadas
  where jogos_disputados > 0;
end;
$$;

-- View: ranking atual + variação contra o último snapshot
create or replace view public.power_ranking as
with atual as (
  select
    jogador_id, nome, nota_total, gols, assistencias,
    row_number() over (order by nota_total desc, gols desc, assistencias desc) as rank_atual
  from public.estatisticas_agregadas
  where jogos_disputados > 0
),
ult as (
  select jogador_id, posicao_rank
  from public.ranking_snapshots
  where data_snapshot = (select max(data_snapshot) from public.ranking_snapshots)
)
select
  a.jogador_id,
  a.nome,
  a.nota_total,
  a.rank_atual,
  u.posicao_rank as rank_anterior,
  case
    when u.posicao_rank is null then null
    else u.posicao_rank - a.rank_atual
  end as variacao
from atual a
left join ult u on u.jogador_id = a.jogador_id;
