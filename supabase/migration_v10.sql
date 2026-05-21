-- ============================================================
-- Idosos da Zona Norte — Migração V10
-- Craques do Mês: votação pública por posição
-- ============================================================

-- Votação de um mês
create table if not exists public.votacao_craques (
  id uuid primary key default uuid_generate_v4(),
  mes_referencia date not null,
  aberta boolean not null default true,
  criada_em timestamptz not null default now(),
  unique (mes_referencia)
);

-- Votos (1 por posição por votante anônimo)
create table if not exists public.votos_craques (
  id uuid primary key default uuid_generate_v4(),
  votacao_id uuid not null references public.votacao_craques(id) on delete cascade,
  posicao text not null check (posicao in ('goleiro','fixo','ala','meio','pivo')),
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  votante text not null,
  criado_em timestamptz not null default now(),
  unique (votacao_id, posicao, votante)
);

create index if not exists idx_votos_votacao on public.votos_craques(votacao_id);

alter table public.votacao_craques enable row level security;
alter table public.votos_craques enable row level security;

drop policy if exists "leitura publica votacao" on public.votacao_craques;
drop policy if exists "admin gerencia votacao" on public.votacao_craques;
drop policy if exists "leitura publica votos" on public.votos_craques;
drop policy if exists "qualquer um vota" on public.votos_craques;

create policy "leitura publica votacao" on public.votacao_craques
  for select using (true);
create policy "admin gerencia votacao" on public.votacao_craques
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "leitura publica votos" on public.votos_craques
  for select using (true);
create policy "qualquer um vota" on public.votos_craques
  for insert with check (true);

-- View: contagem de votos por posição/jogador
create or replace view public.resultado_craques as
select
  v.votacao_id,
  v.posicao,
  v.jogador_id,
  count(*)::int as votos
from public.votos_craques v
group by v.votacao_id, v.posicao, v.jogador_id;
