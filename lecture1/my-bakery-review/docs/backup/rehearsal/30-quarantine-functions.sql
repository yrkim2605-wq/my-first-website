-- 상황 B(운영 DB 전체 손실) 용 "재확인 대기(quarantine)" 프로토타입 — 로컬 시험 전용 (docs/backup/reconfirm-pending-design.md 의 설계를 PostgreSQL에서 흉내 내 봐요)
-- ⚠️ 구현 승인이 난 기능이 아니에요. 설계가 일반 PostgreSQL에서 성립하는지만 보는 용도이고, 앱 코드에는 아무것도 추가하지 않아요.
-- 전제: 이 DB에는 (1) 00-auth-stub.sql (2) 계정 데이터 복원 (3) 마이그레이션 0001~0010 (4) quarantine 스키마 복원 이 끝나 있어요.
-- 실행: psql -v ON_ERROR_STOP=1 -d <DB> -f 30-quarantine-functions.sql      (아직 실행하지 않았어요 — C-prep 단계)
--
-- ❓ 진짜 Supabase에서만 확인할 수 있는 것 (이 로컬 시험으로는 보장하지 않아요)
--   · confirm_restore 안의 `set local session_replication_role = replica` 는 슈퍼유저 권한이 필요해요. 로컬 서버의 postgres는
--     슈퍼유저라 되지만, 진짜 Supabase의 postgres 역할로 되는지는 모르겠어요. 안 되면 다른 방법(트리거에 "복원 중" 표시를 두는 등)이 필요해요.
--   · 진짜 Supabase의 기본 권한(default privileges)이 quarantine 스키마에도 anon/authenticated 권한을 자동으로 주는지, 그리고
--     Data API(PostgREST)의 노출 스키마 설정이 quarantine을 노출하지 않는지는 대시보드에서 확인해야 해요.

-- 1) 격리 스키마를 외부 역할에게서 완전히 닫아요 (스키마 사용 권한도, 표 권한도 없음)
revoke all on schema quarantine from public, anon, authenticated, service_role;
revoke all on all tables in schema quarantine from public, anon, authenticated, service_role;
revoke all on all sequences in schema quarantine from public, anon, authenticated, service_role;

-- 2) 내 상태 확인: 'active'(이미 공개됨) / 'pending'(격리 중 — 확인 필요) / 'unknown'
create or replace function public.restore_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when auth.uid() is null then 'unknown'
    when exists (select 1 from public.profiles p where p.id = auth.uid()) then 'active'
    when exists (select 1 from quarantine.profiles q where q.id = auth.uid()) then 'pending'
    else 'unknown'
  end;
$$;
revoke all on function public.restore_status() from public, anon;
grant execute on function public.restore_status() to authenticated;

-- 3) 격리 중인 "댓글 · 좋아요"를 공개 쪽으로 복사할 수 있는 만큼 복사해요 (글과 댓글/좋아요 쓴 사람이 둘 다 공개된 것만).
--    격리 쪽 원본은 지우지 않아요: 글쓴이의 격리 행을 지우면 연쇄 삭제로 "아직 확인 안 한 사람의 댓글"이 같이 사라지기 때문이에요.
--    (여러 번 불러도 안전해요: 이미 공개된 행은 건너뛰어요. 격리 스키마는 마지막 정리 때 통째로 지워요)
create or replace function quarantine.flush_dependents()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  -- 안전장치: 이 함수는 confirm_restore() 안에서만 써요. 그 밖에서 부르면(트리거가 켜진 상태) 데이터를 잘못 바꿀 수 있어서 거부해요.
  if current_setting('session_replication_role') <> 'replica' then
    raise exception 'ONLY_INSIDE_CONFIRM_RESTORE' using errcode = '42501';
  end if;
  -- 댓글: 최상위 먼저, 답글은 부모가 공개된 뒤에 (한 번에 못 옮기면 여러 번 반복)
  loop
    with moved as (
      insert into public.comments
        select c.* from quarantine.comments c
         where exists (select 1 from public.profiles p where p.id = c.user_id)
           and exists (select 1 from public.posts po where po.id = c.post_id)
           and (c.parent_id is null or exists (select 1 from public.comments pc where pc.id = c.parent_id))
      on conflict (id) do nothing
      returning id
    )
    select count(*) into n from moved;
    exit when n = 0;
  end loop;
  -- 좋아요
  insert into public.post_likes
    select l.* from quarantine.post_likes l
     where exists (select 1 from public.profiles p where p.id = l.user_id)
       and exists (select 1 from public.posts po where po.id = l.post_id)
  on conflict (post_id, user_id) do nothing;
end;
$$;
revoke all on function quarantine.flush_dependents() from public, anon, authenticated, service_role;

-- 4) 본인 확인: 내 행만 격리 → 공개로 옮겨요. 원래 날짜 · EXP 칸이 바뀌지 않게 트리거를 건너뛰어요(로컬 슈퍼유저 한정, ❓ 위 설명)
create or replace function public.confirm_restore()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v uuid := auth.uid();
begin
  if v is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '28000';
  end if;
  if exists (select 1 from public.profiles p where p.id = v) then
    return 'already_active';
  end if;
  if not exists (select 1 from quarantine.profiles q where q.id = v) then
    return 'nothing_to_restore';
  end if;
  -- 복원 뒤 새로 가입한 사람이 같은 닉네임을 쓰고 있으면 닉네임을 바꿔야 해요 (유일 인덱스 때문)
  if exists (select 1 from public.profiles p join quarantine.profiles q on lower(p.nickname) = lower(q.nickname) where q.id = v) then
    raise exception 'NICKNAME_TAKEN' using errcode = '23505';
  end if;

  set local session_replication_role = replica;   -- 트리거(작성자 덮어쓰기 · 날짜 · EXP 재계산)와 외래키 자동 검사를 건너뛰어요
  insert into public.profiles       select * from quarantine.profiles       where id = v;
  insert into public.reviews        select * from quarantine.reviews        where user_id = v;
  insert into public.bakery_visits  select * from quarantine.bakery_visits  where user_id = v;
  insert into public.posts          select * from quarantine.posts          where user_id = v;
  -- 격리 쪽 내 행은 지우지 않아요 (내 글에 달린 다른 사람의 대기 중 댓글이 연쇄 삭제되지 않게). 아래 flush가 대기 중인 댓글 · 좋아요를 옮겨요.
  perform quarantine.flush_dependents();

  -- 외래키 자동 검사를 껐으므로 "직접" 검증해요: 옮긴 행이 가리키는 대상이 공개 쪽에 모두 있어야 해요.
  -- 하나라도 없으면 예외 → 이 함수가 한 일(복사 · session_replication_role 변경)이 전부 되돌아가요.
  if exists (select 1 from public.reviews r where r.user_id = v and not exists (select 1 from public.bakeries b where b.id = r.bakery_id))
     or exists (select 1 from public.bakery_visits x where x.user_id = v and not exists (select 1 from public.bakeries b where b.id = x.bakery_id))
     or exists (select 1 from public.posts po where po.user_id = v and not exists (select 1 from public.profiles p where p.id = po.user_id))
     or exists (select 1 from public.comments c
                 where (c.user_id = v or c.post_id in (select id from public.posts where user_id = v))
                   and (not exists (select 1 from public.posts po where po.id = c.post_id)
                        or not exists (select 1 from public.profiles p where p.id = c.user_id)
                        or (c.parent_id is not null and not exists (select 1 from public.comments pc where pc.id = c.parent_id))))
     or exists (select 1 from public.post_likes l
                 where (l.user_id = v or l.post_id in (select id from public.posts where user_id = v))
                   and (not exists (select 1 from public.posts po where po.id = l.post_id)
                        or not exists (select 1 from public.profiles p where p.id = l.user_id)))
  then
    raise exception 'ORPHAN_AFTER_RESTORE' using errcode = '23503';
  end if;

  set local session_replication_role = origin;   -- 정상 경로에서는 여기서 원래대로 되돌려요 (예외 경로에서는 트랜잭션 롤백이 되돌려요)
  return 'ok';
end;
$$;
revoke all on function public.confirm_restore() from public, anon;
grant execute on function public.confirm_restore() to authenticated;

-- 5) 정리(운영자 전용): 확인하지 않은 계정을 삭제해요. auth.users 삭제가 격리 표의 내 행들로 연쇄돼요.
create or replace function quarantine.purge_unconfirmed()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  -- 확인하지 않은 계정(탈퇴했을 수 있는 사람)에 대한 신고의 "내용 앞부분" 기록(target_snapshot)도 같이 지워요.
  -- (신고 표는 계정 삭제로 연쇄 삭제되지 않고 신고자 연결만 끊기기 때문에 따로 지워야 격리에 남지 않아요)
  delete from quarantine.reports r
   where r.target_user_id is not null
     and not exists (select 1 from public.profiles p where p.id = r.target_user_id);
  with pending as (
    select q.id from quarantine.profiles q
     where not exists (select 1 from public.profiles p where p.id = q.id)
  ), removed as (
    delete from auth.users u using pending where u.id = pending.id returning u.id
  )
  select count(*) into n from removed;
  return n;
end;
$$;
revoke all on function quarantine.purge_unconfirmed() from public, anon, authenticated, service_role;
