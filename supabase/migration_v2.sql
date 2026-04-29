-- ============================================================
-- Idosos da Zona Norte — Migração V2
-- Novas posições (futsal), nível 1-10, storage de fotos
-- Execute no SQL Editor do Supabase: Project → SQL Editor → New query
-- ============================================================

-- 1) POSIÇÕES: trocar de {goleiro,linha} para 5 posições de futsal
alter table public.jogadores drop constraint if exists jogadores_posicao_check;
alter table public.jogadores
  add constraint jogadores_posicao_check
  check (posicao in ('goleiro','fixo','ala','meio','pivo'));

-- migra qualquer "linha" existente para "ala" (posição mais comum)
update public.jogadores set posicao = 'ala' where posicao = 'linha';

-- 2) NÍVEL: aumentar de 1-5 para 1-10
alter table public.jogadores drop constraint if exists jogadores_nivel_check;
alter table public.jogadores
  add constraint jogadores_nivel_check
  check (nivel between 1 and 10);

-- escala antiga (1-5) → nova (1-10): multiplica por 2 quem tinha nível ≤ 5
update public.jogadores set nivel = nivel * 2 where nivel <= 5;
alter table public.jogadores alter column nivel set default 5;

-- 3) STORAGE: bucket público para fotos dos jogadores
insert into storage.buckets (id, name, public)
values ('fotos-jogadores', 'fotos-jogadores', true)
on conflict (id) do nothing;

-- limpa policies antigas (se existirem) pra recriar
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
