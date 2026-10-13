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
