-- 빵덕후 레벨업 · Supabase 스키마 (9/10: 신고 + 운영자)
--
-- 하는 일
--   · admins  : 운영자 목록. 앱(브라우저)은 읽지도 쓰지도 못해요. 운영자는 SQL Editor에서만 추가해요.
--   · reports : 글 · 댓글 · 리뷰 신고. 신고자는 "무엇을, 왜"만 쓰고, 나머지(신고자 · 상태 · 작성자 · 내용 일부)는 서버가 정해요.
--   · is_admin()              : 지금 로그인한 사용자가 운영자인지 (서버가 판단)
--   · admin_handle_report()   : 운영자만 쓸 수 있는 처리 함수 ("반려" 또는 "삭제하고 처리")
--
-- 보안 설계
--   ① 일반 사용자가 운영자가 될 길이 없어요: admins 표에는 권한도 정책도 없어서 insert · update · select가 모두 막혀요.
--   ② 신고자는 target_type · target_id · reason · detail 네 칸만 쓸 수 있어요 (컬럼 권한). 상태 · 처리자 · 작성자는 못 건드려요.
--   ③ 트리거가 신고자 · 상태를 덮어쓰고, 이메일 인증 · 대상 존재 · 내 글 신고 금지 · 하루 20건 · 같은 대상 중복 신고 금지를 검사해요.
--   ④ 신고자는 자기 신고만 읽어요. 운영자만 전체를 읽어요. 수정 · 삭제 정책은 없어요.
--   ⑤ 처리(삭제 포함)는 admin_handle_report()로만 가능하고, 함수 안에서 운영자인지 다시 확인해요 (security definer + 호출자 검사).
--   ⑥ 신고자가 탈퇴하면 신고 기록은 남기고 신고자 연결만 끊어요 (on delete set null).
-- 여러 번 실행해도 안전해요.

-- ───────────────────────────── 운영자 ─────────────────────────────

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;   -- 정책을 하나도 만들지 않아요 → 앱 역할은 읽기 · 쓰기 모두 불가
-- Supabase는 새 표에 anon / authenticated 권한을 자동으로 주기 때문에, 명시적으로 모두 거둬요.
revoke all on public.admins from anon, authenticated;

-- 운영자인지 확인. 호출한 사람 자신에 대해서만 답해요 (다른 사람의 운영자 여부는 알 수 없어요).
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ───────────────────────────── 신고 ─────────────────────────────

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid default auth.uid() references public.profiles (id) on delete set null,
  target_type     text not null check (target_type in ('post', 'comment', 'review')),
  target_id       uuid not null,
  reason          text not null check (reason in ('spam', 'abuse', 'illegal', 'privacy', 'other')),
  detail          text check (detail is null or char_length(detail) <= 300),
  -- 아래는 서버(트리거)만 정해요. 신고 시점의 사실을 남겨서, 작성자가 나중에 고치거나 지워도 근거가 남아요.
  target_user_id  uuid,        -- 신고된 글의 작성자
  target_snapshot text,        -- 신고된 내용 앞부분 (최대 200자)
  target_context  text,        -- 이동용 정보: 댓글 → 글 id, 리뷰 → 빵집 id
  status          text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  handled_by      uuid,
  handled_at      timestamptz,
  handled_note    text check (handled_note is null or char_length(handled_note) <= 300),
  created_at      timestamptz not null default now()
);
create unique index if not exists reports_one_per_target on public.reports (reporter_id, target_type, target_id) where reporter_id is not null;
create index if not exists reports_status_idx on public.reports (status, created_at desc);

create or replace function public.reports_before_insert()
returns trigger
language plpgsql
as $$
declare
  v_author  uuid;
  v_text    text;
  v_context text;
  v_count   int;
begin
  new.reporter_id := auth.uid();
  if new.reporter_id is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '28000';
  end if;
  if not public.is_email_verified() then
    raise exception 'EMAIL_NOT_VERIFIED' using errcode = '42501';
  end if;

  -- 대상이 실제로 있는지, 작성자가 누구인지 (클라이언트가 보낸 값은 쓰지 않아요)
  if new.target_type = 'post' then
    select p.user_id, p.title || E'\n' || p.content, null into v_author, v_text, v_context from public.posts p where p.id = new.target_id;
  elsif new.target_type = 'comment' then
    select c.user_id, c.content, c.post_id::text into v_author, v_text, v_context from public.comments c where c.id = new.target_id;
  else
    select r.user_id, r.content, r.bakery_id into v_author, v_text, v_context from public.reviews r where r.id = new.target_id;
  end if;
  if v_author is null then
    raise exception 'TARGET_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_author = new.reporter_id then
    raise exception 'OWN_CONTENT' using errcode = 'P0001';
  end if;

  -- 하루(한국 시간) 신고 상한 20건 (신고 남발 방지)
  select count(*) into v_count from public.reports r
   where r.reporter_id = new.reporter_id
     and (r.created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date;
  if v_count >= 20 then
    raise exception 'DAILY_REPORT_LIMIT' using errcode = 'P0001';
  end if;

  new.target_user_id  := v_author;
  new.target_snapshot := left(v_text, 200);
  new.target_context  := v_context;
  new.detail          := nullif(btrim(new.detail), '');
  new.status          := 'open';
  new.handled_by      := null;
  new.handled_at      := null;
  new.handled_note    := null;
  new.created_at      := now();
  return new;
end;
$$;

drop trigger if exists reports_before_insert on public.reports;
create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.reports_before_insert();

-- 권한: 먼저 모두 거두고 필요한 것만 줘요 (신고자는 4칸만 쓰고, 읽기는 정책이 "내 것 / 운영자"로 거르고, 수정 · 삭제는 없어요)
revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (target_type, target_id, reason, detail) on public.reports to authenticated;

alter table public.reports enable row level security;

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and (select public.is_email_verified()));

drop policy if exists reports_read_own on public.reports;
create policy reports_read_own on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()));

drop policy if exists reports_read_admin on public.reports;
create policy reports_read_admin on public.reports for select to authenticated
  using ((select public.is_admin()));

-- ───────────────────────────── 운영자 처리 ─────────────────────────────
-- p_action: 'dismiss' = 반려 (신고가 맞지 않아요, 내용은 그대로) / 'remove' = 신고된 글 · 댓글 · 리뷰를 삭제하고 처리
-- 돌려주는 값: { photo_path } — 삭제한 글에 사진이 있었다면 그 경로 (사진 파일은 DB 삭제로 지워지지 않아서 운영자가 따로 지워요)
create or replace function public.admin_handle_report(p_report_id uuid, p_action text, p_note text default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_report public.reports;
  v_photo  text;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;
  if p_action not in ('dismiss', 'remove') then
    raise exception 'INVALID_ACTION' using errcode = 'P0001';
  end if;
  if p_note is not null and char_length(p_note) > 300 then
    raise exception 'NOTE_TOO_LONG' using errcode = 'P0001';
  end if;

  select * into v_report from public.reports r where r.id = p_report_id for update;
  if not found then
    raise exception 'REPORT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_report.status <> 'open' then
    raise exception 'ALREADY_HANDLED' using errcode = 'P0001';
  end if;

  if p_action = 'remove' then
    if v_report.target_type = 'post' then
      delete from public.posts where id = v_report.target_id returning photo_path into v_photo;
    elsif v_report.target_type = 'comment' then
      delete from public.comments where id = v_report.target_id;
    else
      delete from public.reviews where id = v_report.target_id returning photo_path into v_photo;
    end if;
    -- 같은 대상에 대한 다른 열린 신고도 함께 처리해요
    update public.reports
       set status = 'resolved', handled_by = auth.uid(), handled_at = now(), handled_note = coalesce(p_note, handled_note)
     where target_type = v_report.target_type and target_id = v_report.target_id and status = 'open';
  else
    update public.reports
       set status = 'rejected', handled_by = auth.uid(), handled_at = now(), handled_note = p_note
     where id = p_report_id;
  end if;

  return jsonb_build_object('photo_path', v_photo);
end;
$$;
revoke all on function public.admin_handle_report(uuid, text, text) from public, anon;
grant execute on function public.admin_handle_report(uuid, text, text) to authenticated;
