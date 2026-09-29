-- WashMom — Supabase şeması
-- Supabase Dashboard → SQL Editor → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırılabilir (idempotent): var olanları bozmaz.

-- ============================================================
-- 1) garments tablosu
-- ============================================================
create table if not exists public.garments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 80),
  image_path      text not null,                     -- Storage yolu (public URL değil)

  -- AI'ın orijinal çıktısı (kullanıcı düzeltse de saklanır)
  ai_fabric       text,
  ai_confidence   real,
  ai_color_group  text,
  top_predictions jsonb,

  -- Nihai değerler (AI veya kullanıcı düzeltmesi)
  fabric          text not null check (fabric in ('denim','cotton','knitted','chiffon','leather','furry','other')),
  color_group     text not null check (color_group in ('white','light','colored','dark')),
  washing_profile text not null check (washing_profile in ('delicate','normal','heavy','special_care')),

  needs_review    boolean not null default false,
  user_corrected  boolean not null default false,
  user_note       text check (user_note is null or char_length(user_note) <= 500),
  model_version   text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists garments_user_created_idx
  on public.garments (user_id, created_at desc);

-- ============================================================
-- 2) updated_at'i otomatik güncelleyen trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists garments_set_updated_at on public.garments;
create trigger garments_set_updated_at
  before update on public.garments
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3) Row Level Security: herkes sadece kendi satırlarını görür/değiştirir
-- ============================================================
alter table public.garments enable row level security;

drop policy if exists "garments_select_own" on public.garments;
create policy "garments_select_own" on public.garments
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "garments_insert_own" on public.garments;
create policy "garments_insert_own" on public.garments
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "garments_update_own" on public.garments;
create policy "garments_update_own" on public.garments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "garments_delete_own" on public.garments;
create policy "garments_delete_own" on public.garments
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ============================================================
-- 4) Storage: private "garment-images" bucket'ı
--    Yol: {user_id}/{uuid}.jpg → klasör adı kullanıcının kendi id'si olmalı
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('garment-images', 'garment-images', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "garment_images_select_own" on storage.objects;
create policy "garment_images_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'garment-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "garment_images_insert_own" on storage.objects;
create policy "garment_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'garment-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "garment_images_delete_own" on storage.objects;
create policy "garment_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'garment-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
