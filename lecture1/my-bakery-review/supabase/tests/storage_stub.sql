-- 로컬 테스트용 가짜 Supabase 저장소(Storage) 환경이에요 (진짜 Supabase에는 적용하지 않아요).
-- 진짜 Supabase처럼: storage.objects / storage.buckets는 RLS가 켜져 있고, anon / authenticated는 표 권한은 넉넉하지만 정책이 문을 지켜요.
--   · objects : 0003_storage.sql의 정책(내 폴더에만 올리기 · 고치기 · 지우기)만 있고, 읽기 정책은 없어요 (공개 버킷은 공개 주소로 읽어요)
--   · buckets : 정책이 없어서 앱 역할은 버킷 설정(크기 제한 · 허용 형식)을 읽지도 바꾸지도 못해요

create schema storage;

create table storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean not null default false,
  file_size_limit    bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name      text not null,
  owner     uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- "폴더/폴더/파일명"에서 파일명을 뺀 폴더 목록 (진짜 storage.foldername과 같은 동작)
create function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;

alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.buckets, storage.objects to anon, authenticated;
grant execute on function storage.foldername(text) to anon, authenticated;
