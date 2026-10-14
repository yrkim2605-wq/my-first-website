-- 빵덕후 레벨업 · 권한 점검 (읽기 전용)
--
-- Supabase 대시보드 → SQL Editor에 붙여넣고 "각 쿼리를 하나씩" 실행해서 결과를 확인해요.
-- 아무것도 바꾸지 않아요 (select만 있어요). 문제가 있으면 결과 표를 그대로 복사해서 알려 주세요.

-- ① 표 · 뷰별 권한 한눈에 보기 (public)
--    기대: 사용자(anon, authenticated)는 읽기 위주, 쓰기는 정해진 칸만. service_role은 bakeries만 읽기/쓰기.
select
  c.relname                                                   as "이름",
  case c.relkind when 'r' then '표' when 'v' then '뷰' end      as "종류",
  c.relrowsecurity                                            as "RLS",
  has_table_privilege('anon', c.oid, 'select')                as "anon 읽기",
  has_table_privilege('authenticated', c.oid, 'select')       as "로그인 읽기",
  (has_any_column_privilege('anon', c.oid, 'insert') or has_any_column_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete'))
                                                              as "anon 쓰기(있으면 안 됨)",
  (has_any_column_privilege('authenticated', c.oid, 'insert') or has_any_column_privilege('authenticated', c.oid, 'update') or has_table_privilege('authenticated', c.oid, 'delete'))
                                                              as "로그인 쓰기(일부 칸)",
  has_table_privilege('service_role', c.oid, 'select')        as "service_role 읽기",
  (has_any_column_privilege('service_role', c.oid, 'insert') or has_any_column_privilege('service_role', c.oid, 'update'))
                                                              as "service_role 쓰기",
  has_table_privilege('service_role', c.oid, 'delete')        as "service_role 삭제(false여야 함)"
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'v')
order by c.relkind, c.relname;

-- ② RLS가 꺼진 표가 있는지 (결과가 0줄이어야 해요)
select c.relname as "RLS가 꺼진 표"
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity;

-- ③ 함수 실행 권한 (앱 · 뷰 · 정책이 쓰는 함수들)
select
  p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as "함수",
  has_function_privilege('anon', p.oid, 'execute')          as "anon",
  has_function_privilege('authenticated', p.oid, 'execute') as "로그인",
  has_function_privilege('service_role', p.oid, 'execute')  as "service_role"
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname in ('is_email_verified', 'is_nickname_available', 'game_setting', 'game_exp', 'game_level_index', 'review_meaningful_length')
order by 1;

-- ④ service_role이 칸 단위로 받은 쓰기 권한 (bakeries의 6개 칸 insert / update만 나와야 해요)
select table_name as "표", column_name as "칸", privilege_type as "권한"
from information_schema.column_privileges
where table_schema = 'public' and grantee = 'service_role' and privilege_type in ('INSERT', 'UPDATE')
order by 1, 3, 2;
