-- DB 하나의 "내용 + 구조 + 권한" 보고서. 원본과 복원본에 똑같이 돌려서 줄 단위로 비교해요 (변경 · 생성 없음, 읽기만).
-- 실행: psql -X -w -d <DB> -f 20-report.sql -o <출력 파일>        (아직 실행하지 않았어요 — C-prep 단계)
-- 출력 형식: "구역|항목|값" 한 줄씩, 정렬되어 나와요. 다른 DB의 보고서와 diff 해요.
--
-- 구역 설명
--   1.rows        표별 행 수 / 행 전체 체크섬 (public · quarantine · auth 일부 · storage)
--   2.account     계정 보존 상세: 비밀번호 해시 · 메타데이터 · 약관 동의 기록(terms_version) 체크섬
--   3.constraint  제약조건(외래키 · 검사) 정의
--   4.trigger     트리거 정의 (auth.users 의 프로필 자동 생성 트리거 포함)
--   5.policy      행 단위 보안 정책 (public · storage) 과 RLS 켜짐 여부
--   6.acl         권한(GRANT): 표 · 열 · 함수 · 스키마 · 기본 권한
--   7.function    함수 정의 체크섬 · security definer · 설정
--   8.view        보기 정의 체크섬 · 옵션
--   9.index       인덱스 정의
--   10.bucket     storage.buckets (photos 버킷 정보)
--   11.schema     스키마 목록

\pset format unaligned
\pset tuples_only on
\pset fieldsep '|'

select * from (

  -- 1) 행 수 + 행 체크섬 (행을 글자로 바꿔 정렬해서 이어붙인 뒤 md5)
  select '1.rows' as sec, format('%s.%s', t.schemaname, t.tablename) as item,
         (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from %I.%I', t.schemaname, t.tablename), false, true, '')))[1]::text
         || ' / ' ||
         (xpath('/row/h/text()', query_to_xml(format('select md5(coalesce(string_agg(x::text, E''\n'' order by x::text), '''')) as h from %I.%I x', t.schemaname, t.tablename), false, true, '')))[1]::text as val
    from pg_tables t
   where t.schemaname in ('public', 'quarantine')
      or (t.schemaname = 'auth' and t.tablename in ('users', 'identities', 'sessions', 'refresh_tokens', 'one_time_tokens', 'audit_log_entries'))
      or (t.schemaname = 'storage' and t.tablename in ('buckets', 'objects'))

  union all
  -- 2) 계정 보존 상세 (값이 아니라 체크섬만 보여줘요)
  select '2.account', 'encrypted_password(체크섬)',
         coalesce(md5(string_agg(u.id::text || ':' || coalesce(u.encrypted_password, ''), ',' order by u.id)), 'none') from auth.users u
  union all
  select '2.account', 'raw_user_meta_data(체크섬)',
         coalesce(md5(string_agg(u.id::text || ':' || coalesce(u.raw_user_meta_data::text, ''), ',' order by u.id)), 'none') from auth.users u
  union all
  select '2.account', 'terms_version 별 사용자 수',
         coalesce(string_agg(v || '=' || n, ', ' order by v), 'none')
    from (select coalesce(u.raw_user_meta_data ->> 'terms_version', '(없음)') v, count(*) n from auth.users u group by 1) s
  union all
  select '2.account', 'terms_agreed_at 있는 사용자 수',
         count(*)::text from auth.users u where u.raw_user_meta_data ? 'terms_agreed_at'
  union all
  select '2.account', 'identities.email 생성 칸 값(체크섬)',
         coalesce(md5(string_agg(i.user_id::text || ':' || coalesce(i.email, ''), ',' order by i.user_id)), 'none') from auth.identities i

  union all
  -- 3) 제약조건
  select '3.constraint', n.nspname || '.' || c.conrelid::regclass::text || ' ' || c.conname,
         pg_get_constraintdef(c.oid) || ' validated=' || c.convalidated::text
    from pg_constraint c join pg_namespace n on n.oid = c.connamespace
   where n.nspname in ('public', 'quarantine')

  union all
  -- 4) 트리거 (auth.users 와 storage 의 것도 포함 — public 덤프에 들어오는지 확인하려고)
  select '4.trigger', n.nspname || '.' || cl.relname || ' ' || t.tgname, pg_get_triggerdef(t.oid)
    from pg_trigger t join pg_class cl on cl.oid = t.tgrelid join pg_namespace n on n.oid = cl.relnamespace
   where not t.tgisinternal and n.nspname in ('public', 'auth', 'storage', 'quarantine')

  union all
  -- 5) 정책 + RLS 켜짐 여부
  select '5.policy', p.schemaname || '.' || p.tablename || ' ' || p.policyname,
         p.cmd || ' roles=' || p.roles::text || ' using=' || coalesce(p.qual, '') || ' check=' || coalesce(p.with_check, '')
    from pg_policies p where p.schemaname in ('public', 'storage', 'quarantine')
  union all
  select '5.policy', 'RLS ' || n.nspname || '.' || c.relname, c.relrowsecurity::text || '/' || c.relforcerowsecurity::text
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind in ('r', 'p') and n.nspname in ('public', 'storage', 'quarantine')

  union all
  -- 6) 권한(GRANT)
  select '6.acl', 'table ' || item, string_agg(g, ',' order by g)
    from (select n.nspname || '.' || c.relname as item,
                 (case a.grantee when 0 then 'PUBLIC' else a.grantee::regrole::text end) || ':' || a.privilege_type as g
            from pg_class c join pg_namespace n on n.oid = c.relnamespace, aclexplode(c.relacl) a
           where c.relacl is not null and n.nspname in ('public', 'storage', 'quarantine') and c.relkind in ('r', 'v', 'm', 'p', 'S')) s
   group by item
  union all
  select '6.acl', 'column ' || item, string_agg(g, ',' order by g)
    from (select n.nspname || '.' || c.relname || '.' || att.attname as item,
                 (case a.grantee when 0 then 'PUBLIC' else a.grantee::regrole::text end) || ':' || a.privilege_type as g
            from pg_attribute att join pg_class c on c.oid = att.attrelid join pg_namespace n on n.oid = c.relnamespace, aclexplode(att.attacl) a
           where att.attacl is not null and n.nspname in ('public', 'storage', 'quarantine')) s
   group by item
  union all
  select '6.acl', 'function ' || n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', coalesce(p.proacl::text, '(기본)')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'quarantine') and p.prokind = 'f'
  union all
  select '6.acl', 'schema ' || n.nspname, coalesce(n.nspacl::text, '(기본)') from pg_namespace n where n.nspname in ('public', 'auth', 'storage', 'quarantine')
  union all
  select '6.acl', 'default ' || coalesce(d.defaclnamespace::regnamespace::text, '-') || ' ' || d.defaclrole::regrole::text || ' ' || d.defaclobjtype::text, coalesce(d.defaclacl::text, '')
    from pg_default_acl d

  union all
  -- 7) 함수
  select '7.function', n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
         md5(pg_get_functiondef(p.oid)) || ' secdef=' || p.prosecdef::text || ' config=' || coalesce(p.proconfig::text, '')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'quarantine') and p.prokind = 'f'

  union all
  -- 8) 보기
  select '8.view', v.schemaname || '.' || v.viewname, md5(v.definition) from pg_views v where v.schemaname in ('public', 'quarantine')
  union all
  select '8.view', 'options ' || n.nspname || '.' || c.relname, coalesce(c.reloptions::text, '')
    from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'v' and n.nspname in ('public', 'quarantine')

  union all
  -- 9) 인덱스
  select '9.index', i.schemaname || '.' || i.indexname, i.indexdef from pg_indexes i where i.schemaname in ('public', 'quarantine')

  union all
  -- 10) photos 버킷 정보
  select '10.bucket', b.id, 'name=' || b.name || ' public=' || b.public::text || ' limit=' || coalesce(b.file_size_limit::text, '') || ' mime=' || coalesce(b.allowed_mime_types::text, '')
    from storage.buckets b

  union all
  -- 11) 스키마 목록
  select '11.schema', n.nspname, '' from pg_namespace n where n.nspname !~ '^pg_' and n.nspname <> 'information_schema'

) q
order by 1, 2, 3;
