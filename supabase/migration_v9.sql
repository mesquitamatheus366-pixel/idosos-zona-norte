-- ============================================================
-- Idosos da Zona Norte — Migração V9
-- Títulos / campeonatos conquistados pelos jogadores
-- (todo último domingo do mês tem torneio)
-- ============================================================

create table if not exists public.titulos (
  id uuid primary key default uuid_generate_v4(),
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  titulo text not null,
  data_conquista date,
  criado_em timestamptz not null default now()
);

create index if not exists idx_titulos_jogador on public.titulos(jogador_id);

alter table public.titulos enable row level security;

drop policy if exists "leitura publica titulos" on public.titulos;
drop policy if exists "admin escreve titulos" on public.titulos;

create policy "leitura publica titulos" on public.titulos
  for select using (true);

create policy "admin escreve titulos" on public.titulos
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
