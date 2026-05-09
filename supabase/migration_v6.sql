-- ============================================================
-- Idosos da Zona Norte — Migração V6
-- Partidas individuais dentro de uma diária + função de recalc
-- ============================================================

-- 1) Tabela de partidas (várias por dia)
create table if not exists public.partidas (
  id uuid primary key default uuid_generate_v4(),
  jogo_id uuid not null references public.jogos(id) on delete cascade,
  ordem int not null default 1,
  cor_a text not null default 'vermelho' check (cor_a in ('vermelho','azul')),
  cor_b text not null default 'azul' check (cor_b in ('vermelho','azul')),
  gols_a int not null default 0 check (gols_a >= 0),
  gols_b int not null default 0 check (gols_b >= 0),
  finalizada boolean not null default true,
  criada_em timestamptz not null default now()
);

create index if not exists idx_partidas_jogo on public.partidas(jogo_id);

-- 2) Quem jogou em cada partida
create table if not exists public.partida_jogadores (
  partida_id uuid not null references public.partidas(id) on delete cascade,
  jogador_id uuid not null references public.jogadores(id) on delete cascade,
  lado char(1) not null check (lado in ('A','B')),
  gols int not null default 0 check (gols >= 0),
  assistencias int not null default 0 check (assistencias >= 0),
  defesas int not null default 0 check (defesas >= 0),
  cartoes_vermelhos int not null default 0 check (cartoes_vermelhos >= 0),
  gols_contra int not null default 0 check (gols_contra >= 0),
  primary key (partida_id, jogador_id)
);

-- 3) RLS
alter table public.partidas enable row level security;
alter table public.partida_jogadores enable row level security;

drop policy if exists "leitura publica partidas" on public.partidas;
drop policy if exists "admin escreve partidas" on public.partidas;
drop policy if exists "leitura publica partida_jogadores" on public.partida_jogadores;
drop policy if exists "admin escreve partida_jogadores" on public.partida_jogadores;

create policy "leitura publica partidas" on public.partidas for select using (true);
create policy "admin escreve partidas" on public.partidas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "leitura publica partida_jogadores" on public.partida_jogadores for select using (true);
create policy "admin escreve partida_jogadores" on public.partida_jogadores for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4) Função: recalcula estatisticas_jogo a partir das partidas do dia
create or replace function public.recompute_estatisticas_jogo(p_jogo_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Apaga as linhas existentes desse jogo
  delete from public.estatisticas_jogo where jogo_id = p_jogo_id;

  -- Recria a partir de partidas + partida_jogadores
  with p as (
    select id, gols_a, gols_b, cor_a, cor_b,
      case
        when gols_a > gols_b then 'A'
        when gols_b > gols_a then 'B'
        else null
      end as winner
    from public.partidas
    where jogo_id = p_jogo_id and finalizada = true
  )
  insert into public.estatisticas_jogo (
    jogo_id, jogador_id, presente,
    gols, assistencias, defesas, cartoes_vermelhos, gols_contra,
    vitorias_vermelho, empates_vermelho, derrotas_vermelho,
    vitorias_azul, empates_azul, derrotas_azul
  )
  select
    p_jogo_id,
    pj.jogador_id,
    true,
    coalesce(sum(pj.gols), 0),
    coalesce(sum(pj.assistencias), 0),
    coalesce(sum(pj.defesas), 0),
    coalesce(sum(pj.cartoes_vermelhos), 0),
    coalesce(sum(pj.gols_contra), 0),
    coalesce(sum(case when p.winner = pj.lado and (case when pj.lado = 'A' then p.cor_a else p.cor_b end) = 'vermelho' then 1 else 0 end), 0),
    coalesce(sum(case when p.winner is null and (case when pj.lado = 'A' then p.cor_a else p.cor_b end) = 'vermelho' then 1 else 0 end), 0),
    coalesce(sum(case when p.winner is not null and p.winner <> pj.lado and (case when pj.lado = 'A' then p.cor_a else p.cor_b end) = 'vermelho' then 1 else 0 end), 0),
    coalesce(sum(case when p.winner = pj.lado and (case when pj.lado = 'A' then p.cor_a else p.cor_b end) = 'azul' then 1 else 0 end), 0),
    coalesce(sum(case when p.winner is null and (case when pj.lado = 'A' then p.cor_a else p.cor_b end) = 'azul' then 1 else 0 end), 0),
    coalesce(sum(case when p.winner is not null and p.winner <> pj.lado and (case when pj.lado = 'A' then p.cor_a else p.cor_b end) = 'azul' then 1 else 0 end), 0)
  from p
  join public.partida_jogadores pj on pj.partida_id = p.id
  group by pj.jogador_id;
end;
$$;

-- 5) Trigger automática: ao mudar partidas/partida_jogadores, recalcula
create or replace function public.trg_recompute_jogo()
returns trigger
language plpgsql
as $$
declare
  p_jogo uuid;
begin
  if tg_table_name = 'partidas' then
    p_jogo := coalesce(new.jogo_id, old.jogo_id);
  else
    select jogo_id into p_jogo from public.partidas
      where id = coalesce(new.partida_id, old.partida_id);
  end if;
  if p_jogo is not null then
    perform public.recompute_estatisticas_jogo(p_jogo);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_partidas_recompute on public.partidas;
create trigger trg_partidas_recompute
  after insert or update or delete on public.partidas
  for each row execute function public.trg_recompute_jogo();

drop trigger if exists trg_partida_jogadores_recompute on public.partida_jogadores;
create trigger trg_partida_jogadores_recompute
  after insert or update or delete on public.partida_jogadores
  for each row execute function public.trg_recompute_jogo();
