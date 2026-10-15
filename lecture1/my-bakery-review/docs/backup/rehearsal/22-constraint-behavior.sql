-- T06b: reviews.rating 검사 제약이 실제로 같은 값을 받아들이고 거부하는지 동작으로 확인 (읽기 전용: 임시 표만 사용, 데이터 변경 없음)
-- 각 DB에 있는 "진짜 제약의 정의문"(pg_get_constraintdef)을 임시 표에 그대로 걸고 값을 넣어 봐요.
-- → 텍스트 표현(괄호 모양)이 달라도 동작이 같은지 알 수 있어요. 제약이 없으면 MISSING 으로 나와서 실패해요.
-- 실행: psql -X -w -At -d <DB> -f 22-constraint-behavior.sql   (출력은 "T06B|값|accepted/rejected" 줄)

create or replace function pg_temp.t06b() returns setof text language plpgsql as $f$
declare
  def text;
  v numeric;
  res text;
begin
  select pg_get_constraintdef(c.oid) into def
    from pg_constraint c
   where c.conrelid = 'public.reviews'::regclass and c.conname = 'reviews_rating_check' and c.contype = 'c';
  if def is null then
    return next 'T06B|MISSING|reviews_rating_check';
    return;
  end if;
  create temp table t06b_probe (rating numeric(2, 1) not null);
  execute 'alter table t06b_probe add constraint t06b_c ' || def;
  foreach v in array array[0, 0.4, 0.5, 0.7, 1, 1.5, 4.5, 4.9, 5, 5.5, 9.9] loop
    begin
      insert into t06b_probe values (v);
      res := 'accepted';
    exception
      when check_violation then res := 'rejected';
      when others then res := 'error:' || sqlstate;
    end;
    return next 'T06B|' || v::text || '|' || res;
  end loop;
  drop table t06b_probe;
end
$f$;

select * from pg_temp.t06b();
