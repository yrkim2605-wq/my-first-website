-- 상황 B 프로토타입 시험 — 결과를 "RESULT|번호|통과여부|설명" 줄로 내보내요 (실행기가 읽어서 표로 만들어요).
-- 전제: 30-quarantine-functions.sql 까지 적용된 DB. 이 파일은 데이터를 바꿔요(확인 · 정리 시험) — 시험 전용 DB에서만 실행해요.
-- 실행: psql -X -w -v ON_ERROR_STOP=1 -At -d <DB> -f 31-quarantine-tests.sql      (아직 실행하지 않았어요 — C-prep 단계)

\set u2 '00000000-0000-4000-8000-000000000002'
\set u3 '00000000-0000-4000-8000-000000000003'

create temp table t_res (id text, ok boolean, detail text);

-- 외부 역할로 바꿔서 SQL을 실행해 보고 결과를 글자로 돌려줘요: ALLOWED / DENIED / ERROR:<코드>
create or replace function pg_temp.try_as(p_role text, p_sql text) returns text language plpgsql as $$
begin
  execute format('set local role %I', p_role);
  execute p_sql;
  reset role;
  return 'ALLOWED';
exception
  when insufficient_privilege then return 'DENIED';
  when others then return 'ERROR:' || sqlstate;
end
$$;

-- 로그인한 사용자(authenticated)로 바꿔서 값 하나를 돌려받아요
create or replace function pg_temp.as_user(p_uid uuid, p_sql text) returns text language plpgsql as $$
declare
  v text;
begin
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  execute 'set local role authenticated';
  execute p_sql into v;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  return v;
exception when others then
  return 'ERROR:' || sqlstate || ':' || sqlerrm;
end
$$;

-- Q01) 외부 역할 3개가 격리 표 7개를 읽으려 하면 모두 거부돼야 해요
insert into t_res
select format('Q01.%s.%s', r, t), x = 'DENIED', x
  from (select r, t, pg_temp.try_as(r, format('select 1 from quarantine.%I limit 1', t)) as x
          from (values ('anon'), ('authenticated'), ('service_role')) a(r)
         cross join (values ('profiles'), ('reviews'), ('posts'), ('comments'), ('post_likes'), ('bakery_visits'), ('reports')) b(t)) s;

-- Q02) 외부 역할이 격리 표에 쓰기(삭제)도 못 해야 해요
insert into t_res
select format('Q02.%s', r), x = 'DENIED', x
  from (select r, pg_temp.try_as(r, 'delete from quarantine.reviews') as x from (values ('anon'), ('authenticated'), ('service_role')) a(r)) s;

-- Q03) 정리 함수와 도우미 함수는 외부 역할이 실행할 수 없어야 해요
insert into t_res
select format('Q03.%s.%s', r, f), x = 'DENIED', x
  from (select r, f, pg_temp.try_as(r, format('select %s', f)) as x
          from (values ('anon'), ('authenticated'), ('service_role')) a(r)
         cross join (values ('quarantine.purge_unconfirmed()'), ('quarantine.flush_dependents()')) b(f)) s;

-- Q04) 확인 전에는 공개 쪽에 사용자 소유 데이터가 하나도 없어야 해요
insert into t_res
select 'Q04.공개쪽_사용자_데이터_0건', n = 0, 'profiles+reviews+posts+comments+likes+visits = ' || n
  from (select (select count(*) from public.profiles) + (select count(*) from public.reviews) + (select count(*) from public.posts)
             + (select count(*) from public.comments) + (select count(*) from public.post_likes) + (select count(*) from public.bakery_visits) as n) s;

-- Q05) 순위 · 피드 보기에 확인 전 사용자가 반영되지 않아요
insert into t_res
select 'Q05.랭킹_보기_0건', n = 0, 'ranking_exp=' || n
  from (select count(*) as n from public.ranking_exp) s;

-- Q06) 로그인한 대기 사용자(u2)의 상태는 pending, 공개 쪽에서는 내 일지가 안 보여요
insert into t_res
select 'Q06.u2_상태_pending', pg_temp.as_user(:'u2'::uuid, 'select public.restore_status()') = 'pending', pg_temp.as_user(:'u2'::uuid, 'select public.restore_status()');
insert into t_res
select 'Q06.u2_공개쪽_내_일지_0건', pg_temp.as_user(:'u2'::uuid, format('select count(*)::text from public.reviews where user_id = %L', :'u2')) = '0', 'count=' || pg_temp.as_user(:'u2'::uuid, format('select count(*)::text from public.reviews where user_id = %L', :'u2'));

-- Q07) u2가 확인하면: 내 일지 · 방문 · 글이 공개로 이동하고, 상태가 active가 돼요
create temp table t_before as
  select (select count(*) from quarantine.reviews where user_id = :'u2') as q_rev,
         (select count(*) from quarantine.posts where user_id = :'u2') as q_post,
         (select count(*) from quarantine.bakery_visits where user_id = :'u2') as q_vis;
insert into t_res
select 'Q07.u2_confirm_결과', pg_temp.as_user(:'u2'::uuid, 'select public.confirm_restore()') = 'ok', 'ok 여야 해요';
insert into t_res
select 'Q07.u2_이동한_일지_수_일치',
       (select count(*) from public.reviews where user_id = :'u2') = (select q_rev from t_before),
       'public=' || (select count(*) from public.reviews where user_id = :'u2') || ' / 이동 전 격리=' || (select q_rev from t_before);
insert into t_res
select 'Q07.u2_이동한_글_방문_수_일치',
       (select count(*) from public.posts where user_id = :'u2') = (select q_post from t_before)
       and (select count(*) from public.bakery_visits where user_id = :'u2') = (select q_vis from t_before),
       'posts=' || (select count(*) from public.posts where user_id = :'u2') || ', visits=' || (select count(*) from public.bakery_visits where user_id = :'u2');
insert into t_res
select 'Q07.u2_상태_active', pg_temp.as_user(:'u2'::uuid, 'select public.restore_status()') = 'active', pg_temp.as_user(:'u2'::uuid, 'select public.restore_status()');
insert into t_res
select 'Q07.u2_원래_날짜_유지(트리거_건너뜀)',
       (select min(created_at) from public.reviews where user_id = :'u2') = (select min(created_at) from quarantine.reviews where user_id = :'u2')
       and (select bool_and(r.exp_review = q.exp_review and r.exp_photo = q.exp_photo) from public.reviews r join quarantine.reviews q using (id) where r.user_id = :'u2'),
       '공개 쪽 created_at/EXP 칸이 격리 쪽 원본과 같아야 해요 (트리거가 켜져 있었다면 지금 시각 · 재계산 값으로 바뀌어요)';

-- Q08) 아직 확인하지 않은 다른 사용자(u3)의 데이터는 공개 쪽에 없어요 (u2 확인이 다른 사람 데이터를 끌고 오지 않음)
insert into t_res
select 'Q08.u3_아직_공개_안됨', (select count(*) from public.profiles where id = :'u3') = 0 and (select count(*) from public.reviews where user_id = :'u3') = 0,
       'u3 profiles=' || (select count(*) from public.profiles where id = :'u3') || ', reviews=' || (select count(*) from public.reviews where user_id = :'u3');

-- Q09) 순위 보기에는 이제 확인한 u2만 반영돼요
insert into t_res
select 'Q09.랭킹_u2만', (select count(*) from public.ranking_exp) >= 1 and not exists (select 1 from public.ranking_exp r where r.user_id = :'u3'),
       'ranking_exp 행 수=' || (select count(*) from public.ranking_exp);

-- Q10) 교차 의존: u3이 쓴 댓글은 u2의 글에 달렸지만 u3이 아직 확인 전이라, 공개 쪽 댓글에 없어야 해요 (격리에 남아 대기)
insert into t_res
select 'Q10.u3_댓글_대기', (select count(*) from public.comments where user_id = :'u3') = 0 and (select count(*) from quarantine.comments where user_id = :'u3') >= 1,
       'public 댓글(u3)=' || (select count(*) from public.comments where user_id = :'u3') || ', 격리 댓글(u3)=' || (select count(*) from quarantine.comments where user_id = :'u3');

-- Q11) u3이 확인하면 대기하던 댓글도 같이 공개돼요
insert into t_res
select 'Q11.u3_confirm_결과', pg_temp.as_user(:'u3'::uuid, 'select public.confirm_restore()') = 'ok', 'ok 여야 해요';
insert into t_res
select 'Q11.u3_댓글_공개됨', (select count(*) from public.comments where user_id = :'u3') >= 1, 'public 댓글(u3)=' || (select count(*) from public.comments where user_id = :'u3');

-- Q12) 정리: 확인하지 않은 계정만 삭제되고, 확인한 u2 · u3은 남아요
create temp table t_users_before as select count(*) as n from auth.users;
create temp table t_u2_reviews_before as select count(*) as n from public.reviews where user_id = :'u2';
create temp table t_purged as select quarantine.purge_unconfirmed() as n;
insert into t_res
select 'Q12.정리_삭제_수', (select n from t_purged) = (select n from t_users_before) - 2,
       '삭제=' || (select n from t_purged) || ', 정리 전 계정=' || (select n from t_users_before) || ' (확인한 u2 · u3 두 명만 남아야 해요)';
insert into t_res
select 'Q12.정리_후_남은_계정은_u2_u3만', (select count(*) from auth.users) = 2 and (select count(*) from auth.users where id in (:'u2'::uuid, :'u3'::uuid)) = 2,
       '정리 후 계정 수=' || (select count(*) from auth.users);
insert into t_res
select 'Q12.정리_후_공개_안된_사용자의_격리_행_0',
       (select count(*) from quarantine.profiles q where not exists (select 1 from public.profiles p where p.id = q.id))
       + (select count(*) from quarantine.reviews q where not exists (select 1 from public.profiles p where p.id = q.user_id))
       + (select count(*) from quarantine.posts q where not exists (select 1 from public.profiles p where p.id = q.user_id))
       + (select count(*) from quarantine.bakery_visits q where not exists (select 1 from public.profiles p where p.id = q.user_id))
       + (select count(*) from quarantine.comments q where not exists (select 1 from public.profiles p where p.id = q.user_id))
       + (select count(*) from quarantine.post_likes q where not exists (select 1 from public.profiles p where p.id = q.user_id)) = 0,
       '탈퇴자(확인 안 한 사람) 행이 격리에 남아 있지 않아야 해요';
insert into t_res
select 'Q12.정리_후_확인한_사용자의_공개_데이터_유지', (select count(*) from public.reviews where user_id = :'u2') = (select n from t_u2_reviews_before),
       'u2 일지 ' || (select count(*) from public.reviews where user_id = :'u2') || ' / 정리 전 ' || (select n from t_u2_reviews_before);

select 'RESULT|' || id || '|' || ok::text || '|' || coalesce(detail, '') from t_res order by id;
