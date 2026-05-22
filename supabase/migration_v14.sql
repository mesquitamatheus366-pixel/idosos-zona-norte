-- ============================================================
-- Idosos da Zona Norte — Migração V14
-- Power Ranking em TODAS as estatísticas:
-- o snapshot passa a guardar todos os números (nota, gols, assists, etc)
-- ============================================================

drop view if exists public.power_ranking;
drop table if exists public.ranking_snapshots cascade;

create table public.ranking_snapshots (
  id uuid primary key default uuid_generate_v4(),
  data_snapshot timestamptz not null default now(),
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  nota_total numeric(10,2) not null default 0,
  gols int not null default 0,
  assistencias int not null default 0,
  jogos_disputados int not null default 0,
  mvp_count int not null default 0
);

create index if not exists idx_snap_data on public.ranking_snapshots(data_snapshot);

alter table public.ranking_snapshots enable row level security;

create policy "leitura publica snapshots" on public.ranking_snapshots
  for select using (true);
create policy "admin cria snapshots" on public.ranking_snapshots
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Função: salva a foto de TODAS as estatísticas atuais
create or replace function public.tirar_snapshot_ranking()
returns void
language plpgsql
security definer
as $$
declare
  nova_data timestamptz := now();
begin
  insert into public.ranking_snapshots
    (data_snapshot, jogador_id, nota_total, gols, assistencias, jogos_disputados, mvp_count)
  select
    nova_data, jogador_id, nota_total, gols, assistencias, jogos_disputados, mvp_count
  from public.estatisticas_agregadas
  where jogos_disputados > 0;
end;
$$;
