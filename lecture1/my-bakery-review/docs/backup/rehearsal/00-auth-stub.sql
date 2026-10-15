-- 가짜 Supabase "기본 환경" (로컬 복구 시험 전용 — 실제 Supabase 프로젝트에는 절대 적용하지 않아요)
-- 진짜 Supabase 프로젝트에는 처음부터 있는 것들(auth · storage 스키마, 역할 3개, auth.uid())을 흉내 내요.
--   · auth.users 는 진짜 Supabase의 주요 칸을 따라 늘렸어요 (비밀번호 해시 · 메타데이터 · 생성 칸 등)
--   · 세션 · 토큰 · 감사 로그 표는 "백업에서 빠져야 한다"는 것을 확인하려고 일부러 만들어요
-- 이 파일은 "새 프로젝트" 역할의 빈 DB에도, "원본" 역할의 DB에도 똑같이 먼저 적용해요 (마이그레이션보다 먼저).
-- 실행: psql -v ON_ERROR_STOP=1 -d <DB> -f 00-auth-stub.sql      (아직 실행하지 않았어요 — C-prep 단계)

create schema if not exists auth;
create schema if not exists storage;

-- 역할은 서버(클러스터) 전체에서 공유돼요. 이미 있으면 건너뛰어요.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema storage to anon, authenticated, service_role;

-- ── auth.users: 진짜 Supabase의 주요 칸 ──
create table auth.users (
  instance_id           uuid,
  id                    uuid primary key default gen_random_uuid(),
  aud                   varchar(255),
  role                  varchar(255),
  email                 varchar(255) unique,
  encrypted_password    varchar(255),
  email_confirmed_at    timestamptz,
  invited_at            timestamptz,
  confirmation_token    varchar(255),
  confirmation_sent_at  timestamptz,
  recovery_token        varchar(255),
  recovery_sent_at      timestamptz,
  last_sign_in_at       timestamptz,
  raw_app_meta_data     jsonb,
  raw_user_meta_data    jsonb,
  is_super_admin        boolean,
  created_at            timestamptz,
  updated_at            timestamptz,
  phone                 text unique,
  banned_until          timestamptz,
  deleted_at            timestamptz,
  is_anonymous          boolean not null default false
);

-- ── auth.identities: email 칸은 "생성 칸"이에요 (진짜와 같게) — 데이터만 덤프할 때 이 칸이 어떻게 되는지도 확인해요 ──
create table auth.identities (
  provider_id     text not null,
  user_id         uuid not null references auth.users (id) on delete cascade,
  identity_data   jsonb not null,
  provider        text not null,
  last_sign_in_at timestamptz,
  created_at      timestamptz,
  updated_at      timestamptz,
  email           text generated always as (lower(identity_data ->> 'email')) stored,
  id              uuid not null default gen_random_uuid() primary key,
  unique (provider_id, provider)
);

-- ── 백업에서 "빠져야 하는" 표들 (세션 · 토큰 · 감사 로그) ──
create table auth.sessions (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz
);
create table auth.refresh_tokens (
  id         bigserial primary key,
  token      text,
  user_id    text,
  revoked    boolean,
  created_at timestamptz
);
create table auth.one_time_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  token_type text not null,
  token_hash text not null,
  relates_to text not null,
  created_at timestamptz not null default now()
);
create table auth.audit_log_entries (
  id         uuid primary key,
  payload    json,
  ip_address text,
  created_at timestamptz
);

-- 현재 로그인한 사용자 번호 (진짜 Supabase는 요청 토큰에서 읽어요. 여기서는 세션 설정으로 흉내 내요)
create or replace function auth.uid()
returns uuid
language sql
stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

-- ── storage: 진짜 Supabase의 기본 구조를 단순화 (마이그레이션 0003 · 0008 · 0010이 이 위에 정책을 만들어요) ──
create table storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean not null default false,
  file_size_limit    bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets (id),
  name       text not null,
  owner      uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;

alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;
grant all on storage.buckets, storage.objects to anon, authenticated;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
