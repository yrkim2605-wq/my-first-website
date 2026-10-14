-- 로컬 테스트용 가짜 Supabase 환경이에요 (진짜 Supabase에는 적용하지 않아요).
-- auth 스키마 · auth.uid() · anon/authenticated 역할만 흉내 내요.

create schema auth;

create table auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'
);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create role anon nologin;
create role authenticated nologin;
grant usage on schema auth to anon, authenticated;

-- 서버 함수(Edge Function)가 서버 비밀 키로 쓰는 역할. 진짜 Supabase처럼 RLS는 건너뛰지만(bypassrls) 표 권한은 따로 받아야 해요.
-- 이 시험 환경에서는 자동 권한이 없어서, 마이그레이션이 직접 준 권한만 가져요.
create role service_role nologin bypassrls;
grant usage on schema auth to service_role;
