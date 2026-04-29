-- ============================================================
-- Idosos da Zona Norte — Migração V2 (corrigida)
-- Posições futsal (5x), nível 1-10, storage de fotos
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1) POSIÇÕES: derruba constraint antiga, migra dados, depois põe a nova
alter table public.jogadores drop constraint if exists jogadores_posicao_check;

-- migra qualquer "linha" existente para "ala" (posição mais comum)
update public.jogadores set posicao = 'ala' where posicao = 'linha';

alter table public.jogadores
  add constraint jogadores_posicao_check
  check (posicao in ('goleiro','fixo','ala','meio','pivo'));

-- 2) NÍVEL: derruba constraint, migra dados, põe a nova
alter table public.jogadores drop constraint if exists jogadores_nivel_check;

-- escala antiga (1-5) → nova (1-10): multiplica por 2 quem tinha nível ≤ 5
update public.jogadores set nivel = nivel * 2 where nivel <= 5;

alter table public.jogadores
  add constraint jogadores_nivel_check
  check (nivel between 1 and 10);

alter table public.jogadores alter column nivel set default 5;

-- 3) STORAGE: bucket público para fotos dos jogadores
insert into storage.buckets (id, name, public)
values ('fotos-jogadores', 'fotos-jogadores', true)
on conflict (id) do nothing;

drop policy if exists "Public read fotos-jogadores" on storage.objects;
drop policy if exists "Admin insert fotos-jogadores" on storage.objects;
drop policy if exists "Admin update fotos-jogadores" on storage.objects;
drop policy if exists "Admin delete fotos-jogadores" on storage.objects;

create policy "Public read fotos-jogadores"
  on storage.objects for select
  using (bucket_id = 'fotos-jogadores');

create policy "Admin insert fotos-jogadores"
  on storage.objects for insert
  with check (bucket_id = 'fotos-jogadores' and auth.role() = 'authenticated');

create policy "Admin update fotos-jogadores"
  on storage.objects for update
  using (bucket_id = 'fotos-jogadores' and auth.role() = 'authenticated');

create policy "Admin delete fotos-jogadores"
  on storage.objects for delete
  using (bucket_id = 'fotos-jogadores' and auth.role() = 'authenticated');
