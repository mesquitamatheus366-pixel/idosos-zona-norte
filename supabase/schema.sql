-- ============================================================
-- Idosos da Zona Norte — Schema inicial
-- Execute este script no SQL Editor do Supabase
-- (Project → SQL Editor → New query → cole tudo → Run)
-- ============================================================

-- Extensão para UUID
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- JOGADORES
-- ----------------------------------------------------------------
create table if not exists public.jogadores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  apelido text,
  foto_url text,
  posicao text not null check (posicao in ('goleiro','linha')),
  nivel int not null default 3 check (nivel between 1 and 5),
  telefone text,
  ativo boolean not null default true,
  observacoes text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_jogadores_ativo on public.jogadores(ativo);

-- ----------------------------------------------------------------
-- PAGAMENTOS (define se o jogador é mensalista ou diarista naquele mês)
-- ----------------------------------------------------------------
create table if not exists public.pagamentos (
  id uuid primary key default uuid_generate_v4(),
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  mes_referencia date not null, -- usar sempre o dia 01 do mês (ex: 2026-04-01)
  tipo text not null check (tipo in ('mensal','diarista')),
  valor numeric(10,2),
  pago_em timestamptz not null default now(),
  observacoes text,
  unique (jogador_id, mes_referencia)
);

create index if not exists idx_pagamentos_jogador on public.pagamentos(jogador_id);
create index if not exists idx_pagamentos_mes on public.pagamentos(mes_referencia);

-- ----------------------------------------------------------------
-- JOGOS
-- ----------------------------------------------------------------
create table if not exists public.jogos (
  id uuid primary key default uuid_generate_v4(),
  data_jogo timestamptz not null,
  tipo text not null check (tipo in ('diaria','mensal')),
  local text,
  observacoes text,
  finalizado boolean not null default false,
  criado_em timestamptz not null default now()
);

create index if not exists idx_jogos_data on public.jogos(data_jogo desc);

-- ----------------------------------------------------------------
-- TIMES SORTEADOS (1 jogador pertence a 1 time num jogo)
-- ----------------------------------------------------------------
create table if not exists public.times_sorteados (
  id uuid primary key default uuid_generate_v4(),
  jogo_id uuid not null references public.jogos(id) on delete cascade,
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  time_numero int not null check (time_numero between 1 and 8),
  unique (jogo_id, jogador_id)
);

-- ----------------------------------------------------------------
-- ESTATÍSTICAS POR JOGO
-- ----------------------------------------------------------------
create table if not exists public.estatisticas_jogo (
  id uuid primary key default uuid_generate_v4(),
  jogo_id uuid not null references public.jogos(id) on delete cascade,
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  presente boolean not null default true,
  gols int not null default 0,
  assistencias int not null default 0,
  resultado text check (resultado in ('V','E','D')),
  mvp boolean not null default false,
  unique (jogo_id, jogador_id)
);

-- ----------------------------------------------------------------
-- VIEW: situação atual do jogador (mensalista ou diarista no mês corrente)
-- ----------------------------------------------------------------
create or replace view public.jogador_status as
with ultimo as (
  select distinct on (jogador_id)
    jogador_id, mes_referencia, tipo
  from public.pagamentos
  order by jogador_id, mes_referencia desc
),
mensal_seq as (
  -- conta meses consecutivos como mensalista
  select p.jogador_id,
         count(*) as meses_mensal_consec
  from public.pagamentos p
  where p.tipo = 'mensal'
    and p.mes_referencia >= (
      coalesce(
        (select max(mes_referencia) from public.pagamentos p2
         where p2.jogador_id = p.jogador_id and p2.tipo = 'diarista'),
        '1900-01-01'::date
      )
    )
  group by p.jogador_id
)
select j.id as jogador_id,
       j.nome,
       coalesce(u.tipo, 'sem_registro') as tipo_atual,
       u.mes_referencia as mes_atual,
       coalesce(m.meses_mensal_consec, 0) as meses_como_mensalista
from public.jogadores j
left join ultimo u on u.jogador_id = j.id
left join mensal_seq m on m.jogador_id = j.id;

-- ----------------------------------------------------------------
-- VIEW: estatísticas agregadas por jogador
-- ----------------------------------------------------------------
create or replace view public.estatisticas_agregadas as
select
  j.id as jogador_id,
  j.nome,
  count(distinct e.jogo_id) filter (where e.presente) as jogos_disputados,
  coalesce(sum(e.gols),0) as gols,
  coalesce(sum(e.assistencias),0) as assistencias,
  count(*) filter (where e.resultado = 'V') as vitorias,
  count(*) filter (where e.resultado = 'E') as empates,
  count(*) filter (where e.resultado = 'D') as derrotas,
  count(*) filter (where e.mvp) as mvp_count
from public.jogadores j
left join public.estatisticas_jogo e on e.jogador_id = j.id
group by j.id, j.nome;

-- ----------------------------------------------------------------
-- RLS: leitura pública, escrita só autenticado (admin)
-- ----------------------------------------------------------------
alter table public.jogadores enable row level security;
alter table public.pagamentos enable row level security;
alter table public.jogos enable row level security;
alter table public.times_sorteados enable row level security;
alter table public.estatisticas_jogo enable row level security;

-- leitura pública
create policy "leitura publica jogadores" on public.jogadores for select using (true);
create policy "leitura publica pagamentos" on public.pagamentos for select using (true);
create policy "leitura publica jogos" on public.jogos for select using (true);
create policy "leitura publica times" on public.times_sorteados for select using (true);
create policy "leitura publica stats" on public.estatisticas_jogo for select using (true);

-- escrita só autenticado
create policy "admin escreve jogadores" on public.jogadores for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin escreve pagamentos" on public.pagamentos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin escreve jogos" on public.jogos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin escreve times" on public.times_sorteados for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin escreve stats" on public.estatisticas_jogo for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
