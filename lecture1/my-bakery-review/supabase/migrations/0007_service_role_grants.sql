-- 빵덕후 레벨업 · Supabase 스키마 (7/7: 서버 함수(service_role)의 최소 권한)
--
-- 문제: 빵집 확인 서버 함수 register-bakery는 "서버 비밀 키"로 DB에 접속하고, 이때 쓰이는 DB 역할이 service_role이에요.
--       그런데 0001~0006 어디에도 service_role 권한이 없어서 bakeries 표를 읽지도 쓰지도 못했어요.
--       (실제 오류: 42501 "permission denied for table bakeries — GRANT SELECT ON public.bakeries TO service_role")
--       0002는 anon / authenticated 권한을 모두 거둔 뒤 필요한 것만 다시 줬지만, service_role은 Supabase가 자동으로 줄 거라고 기대하고 있었어요.
--
-- 이 파일이 하는 일: register-bakery가 실제로 쓰는 만큼만 service_role에 권한을 줘요.
--   · 읽기  : 이미 등록된 빵집인지 조회 (select id from bakeries where id = …)
--   · 쓰기  : 새 빵집 등록 (insert … on conflict (id) do update) → bakeries의 6개 칸만 insert / update
--   · 주지 않는 것: delete, truncate, references, trigger, registered_at 칸 수정, 그리고 다른 모든 표(reviews, profiles, posts …)
--
-- 보안은 그대로예요
--   · RLS 정책은 하나도 바꾸지 않아요. (service_role은 원래 RLS를 건너뛰는 서버 전용 역할이고, 이 키는 브라우저에 절대 노출되지 않아요.)
--   · anon / authenticated 권한은 건드리지 않아요 → 사용자는 여전히 bakeries를 읽기만 하고, 직접 등록할 수 없어요.
--   · 여러 번 실행해도 안전해요 (이미 있는 권한을 다시 주는 것뿐이에요).

grant usage on schema public to service_role;

grant select on public.bakeries to service_role;
grant insert (id, name, district_id, address, lat, lng) on public.bakeries to service_role;
grant update (id, name, district_id, address, lat, lng) on public.bakeries to service_role;
