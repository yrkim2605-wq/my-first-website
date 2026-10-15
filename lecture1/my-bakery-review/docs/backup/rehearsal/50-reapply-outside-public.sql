-- "public 스키마 덤프에 들어오지 않는 것" 중 코드로 다시 만들 수 있는 것들을 복원 뒤에 다시 적용하는 수리 단계 (로컬 시험 전용)
-- 가설(gate-c-plan.md 2장): pg_dump --schema=public 은 아래를 담지 않아요.
--   · auth.users 에 걸린 프로필 자동 생성 트리거 (표가 auth 소속이라서)        → 이 파일이 다시 만들어요
--   · storage.objects 의 정책 · photos 버킷 행 (0003 · 0008 · 0010)            → 실행기가 그 마이그레이션 파일을 그대로 다시 적용해요
-- ⚠️ 이 파일은 마이그레이션(0001_schema.sql)의 트리거 정의와 "똑같아야" 해요. 마이그레이션이 바뀌면 같이 고쳐요 (실행기가 정의를 비교해서 다르면 실패 처리해요).
-- 실행: psql -v ON_ERROR_STOP=1 -d <복원 DB> -f 50-reapply-outside-public.sql      (아직 실행하지 않았어요 — C-prep 단계)

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
