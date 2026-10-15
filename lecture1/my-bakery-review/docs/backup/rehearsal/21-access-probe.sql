-- 역할별 "실제 접근" 동작 시험 (읽기 전용: select count(*) 만 실행, 데이터 변경 없음)
-- anon · authenticated · service_role 로 역할을 바꿔서(set local role) public 의 모든 표 · 보기를 읽어 보고 결과를 적어요.
--   결과: rows=<행 수> | denied(권한 없음) | error:<SQLSTATE>
-- 권한(GRANT)과 행 단위 보안 정책(RLS)이 합쳐진 "실제로 보이는 결과"를 원본과 복원본이 같은지 비교하려는 거예요.
-- 로그인 정보(JWT) 없이 읽으므로 anon 과 같은 조건이에요. 임시 함수(pg_temp)만 쓰고 세션이 끝나면 사라져요.
-- 실행: psql -X -w -At -d <DB> -f 21-access-probe.sql   (출력은 "probe|역할|항목|결과" 줄)

create or replace function pg_temp.access_probe() returns setof text language plpgsql as $f$
declare
  r text;
  t record;
  n bigint;
  res text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    for t in
      select c.relname
        from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
       where ns.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p')
       order by c.relname
    loop
      begin
        execute format('set local role %I', r);
        execute format('select count(*) from public.%I', t.relname) into n;
        res := 'rows=' || n::text;
      exception
        when insufficient_privilege then res := 'denied';
        when others then res := 'error:' || sqlstate;
      end;
      reset role;
      return next 'probe|' || r || '|select ' || t.relname || '|' || res;
    end loop;
  end loop;
end
$f$;

select * from pg_temp.access_probe();
