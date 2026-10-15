-- 가짜 시험 데이터 (전부 가짜: 이메일은 example.invalid, 비밀번호 해시는 "FAKE_HASH_…" 문자열, IP는 문서용 예약 대역 203.0.113.x)
-- 실제 사람 · 실제 가입 정보 · 실제 비밀번호가 하나도 없어요. 마이그레이션 0001~0010을 적용한 "원본" DB에서만 실행해요.
-- 실행: psql -v ON_ERROR_STOP=1 -d <원본 DB> -f 10-fake-seed.sql      (아직 실행하지 않았어요 — C-prep 단계)
--
-- 주의: 삽입 트리거가 user_id를 auth.uid()로 덮어쓰고 이메일 인증을 확인해요 (0001 · 0009). 그래서 사용자마다
--       set_config('request.jwt.claim.sub', ...)로 "로그인한 척"을 하고 넣어요. (세션 설정이라 이 파일 안에서만 유효)

\set ON_ERROR_STOP on

\set u1 '00000000-0000-4000-8000-000000000001'
\set u2 '00000000-0000-4000-8000-000000000002'
\set u3 '00000000-0000-4000-8000-000000000003'
\set u4 '00000000-0000-4000-8000-000000000004'
\set u5 '00000000-0000-4000-8000-000000000005'
\set u6 '00000000-0000-4000-8000-000000000006'

-- ── 계정 6명 (u1 = 가짜 운영자, u6 = 나중에 탈퇴할 가짜 회원). 프로필은 트리거(on_auth_user_created)가 자동으로 만들어요 ──
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', :'u1', 'authenticated', 'authenticated', 'fake-1@example.invalid', 'FAKE_HASH_do_not_use_0001', '2026-10-14 09:00:00+09', '{"provider":"email","providers":["email"]}', '{"nickname":"가짜운영자","terms_version":"2026-10-draft1","terms_agreed_at":"2026-10-14T00:00:00Z"}', '2026-10-14 09:00:00+09', '2026-10-14 09:00:00+09'),
  ('00000000-0000-0000-0000-000000000000', :'u2', 'authenticated', 'authenticated', 'fake-2@example.invalid', 'FAKE_HASH_do_not_use_0002', '2026-10-14 09:01:00+09', '{"provider":"email","providers":["email"]}', '{"nickname":"가짜테스트2","terms_version":"2026-10-draft1","terms_agreed_at":"2026-10-14T00:01:00Z"}', '2026-10-14 09:01:00+09', '2026-10-14 09:01:00+09'),
  ('00000000-0000-0000-0000-000000000000', :'u3', 'authenticated', 'authenticated', 'fake-3@example.invalid', 'FAKE_HASH_do_not_use_0003', '2026-10-14 09:02:00+09', '{"provider":"email","providers":["email"]}', '{"nickname":"가짜테스트3","terms_version":"2026-10-draft1","terms_agreed_at":"2026-10-14T00:02:00Z"}', '2026-10-14 09:02:00+09', '2026-10-14 09:02:00+09'),
  ('00000000-0000-0000-0000-000000000000', :'u4', 'authenticated', 'authenticated', 'fake-4@example.invalid', 'FAKE_HASH_do_not_use_0004', '2026-10-14 09:03:00+09', '{"provider":"email","providers":["email"]}', '{"nickname":"가짜테스트4","terms_version":"2026-10-draft1","terms_agreed_at":"2026-10-14T00:03:00Z"}', '2026-10-14 09:03:00+09', '2026-10-14 09:03:00+09'),
  ('00000000-0000-0000-0000-000000000000', :'u5', 'authenticated', 'authenticated', 'fake-5@example.invalid', 'FAKE_HASH_do_not_use_0005', '2026-10-14 09:04:00+09', '{"provider":"email","providers":["email"]}', '{"nickname":"가짜테스트5","terms_version":"2026-10-draft1","terms_agreed_at":"2026-10-14T00:04:00Z"}', '2026-10-14 09:04:00+09', '2026-10-14 09:04:00+09'),
  ('00000000-0000-0000-0000-000000000000', :'u6', 'authenticated', 'authenticated', 'fake-withdrawn@example.invalid', 'FAKE_HASH_do_not_use_0006', '2026-10-14 09:05:00+09', '{"provider":"email","providers":["email"]}', '{"nickname":"가짜탈퇴자","terms_version":"2026-10-draft1","terms_agreed_at":"2026-10-14T00:05:00Z"}', '2026-10-14 09:05:00+09', '2026-10-14 09:05:00+09');

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', u.created_at, u.created_at, u.created_at
  from auth.users u;

-- ── "백업에 들어가면 안 되는" 가짜 값들 (세션 · 토큰 · 감사 로그) ──
insert into auth.sessions (id, user_id, created_at)
values ('10000000-0000-4000-8000-000000000001', :'u1', now()), ('10000000-0000-4000-8000-000000000002', :'u2', now());
insert into auth.refresh_tokens (token, user_id, revoked, created_at)
values ('FAKE_REFRESH_TOKEN_0001', :'u1', false, now()), ('FAKE_REFRESH_TOKEN_0002', :'u2', false, now());
insert into auth.one_time_tokens (user_id, token_type, token_hash, relates_to)
values (:'u3', 'recovery_token', 'FAKE_ONE_TIME_HASH_0001', 'fake-3@example.invalid');
insert into auth.audit_log_entries (id, payload, ip_address, created_at)
values ('20000000-0000-4000-8000-000000000001', '{"action":"login","note":"FAKE"}', '203.0.113.7', now()),
       ('20000000-0000-4000-8000-000000000002', '{"action":"login","note":"FAKE"}', '203.0.113.8', now());

-- ── 빵집 3곳 (공용 데이터) ──
insert into public.bakeries (id, name, district_id, address, lat, lng) values
  ('FAKE-B1', '가짜빵집1', 'haeundae',  '가짜시 가짜구 1번지', 35.10, 129.10),
  ('FAKE-B2', '가짜빵집2', 'seomyeon',  '가짜시 가짜구 2번지', 35.20, 129.00),
  ('FAKE-B3', '가짜빵집3', 'nampodong', '가짜시 가짜구 3번지', 35.00, 129.00);

-- ── 일지(리뷰) · 방문 체크 · 글 · 댓글 · 좋아요 · 신고 : 사용자마다 "로그인한 척"하고 넣어요 ──
select set_config('request.jwt.claim.sub', :'u1', false);
insert into public.reviews (bakery_id, rating, content) values
  ('FAKE-B1', 4.0, '가짜 일지입니다 운영자 계정의 시험용 데이터이며 실제 후기가 아니에요 맛있다고 가정해요');

select set_config('request.jwt.claim.sub', :'u2', false);
insert into public.reviews (bakery_id, rating, content, photo_path) values
  ('FAKE-B1', 4.5, '가짜 일지입니다 이것은 시험용 데이터이며 실제 후기가 아니에요 사진이 있다고 가정해요', :'u2' || '/fake-photo-1.jpg'),
  ('FAKE-B2', 4.0, '가짜 일지입니다 두 번째 시험용 데이터이며 실제 후기가 아니에요 바삭하다고 가정해요', null);
insert into public.bakery_visits (bakery_id) values ('FAKE-B1'), ('FAKE-B2');
insert into public.posts (category_id, title, content) values
  ('today-visit', '가짜 글 제목 1', '가짜 글 내용 1 입니다 이것은 시험용 데이터이며 실제 글이 아니에요');

select set_config('request.jwt.claim.sub', :'u3', false);
insert into public.reviews (bakery_id, rating, content) values
  ('FAKE-B2', 3.5, '가짜 일지입니다 세 번째 사용자의 시험용 데이터이며 실제 후기가 아니에요 보통이라고 가정해요'),
  ('FAKE-B3', 5.0, '가짜 일지입니다 세 번째 사용자의 또 다른 시험용 데이터이며 실제 후기가 아니에요 최고라고 가정해요');
insert into public.posts (category_id, title, content) values
  ('recommend', '가짜 글 제목 2', '가짜 글 내용 2 입니다 이것은 시험용 데이터이며 실제 글이 아니에요');
insert into public.comments (post_id, content)
  select id, '가짜 댓글 1 입니다 시험용이에요' from public.posts where title = '가짜 글 제목 1';
insert into public.post_likes (post_id) select id from public.posts where title = '가짜 글 제목 1';

select set_config('request.jwt.claim.sub', :'u4', false);
insert into public.reviews (bakery_id, rating, content) values
  ('FAKE-B1', 4.0, '가짜 일지입니다 네 번째 사용자의 시험용 데이터이며 실제 후기가 아니에요 괜찮다고 가정해요');

select set_config('request.jwt.claim.sub', :'u6', false);   -- 나중에 탈퇴할 가짜 회원의 활동
insert into public.reviews (bakery_id, rating, content) values
  ('FAKE-B3', 2.5, '가짜 일지입니다 탈퇴 예정인 가짜 회원의 시험용 데이터이며 실제 후기가 아니에요');
insert into public.posts (category_id, title, content) values
  ('photo', '가짜 글 제목 3 (탈퇴 예정)', '가짜 글 내용 3 입니다 탈퇴 예정 가짜 회원의 시험용 글이에요');
insert into public.post_likes (post_id) select id from public.posts where title = '가짜 글 제목 1';

-- u2가 u3의 댓글에 답글, u2가 (탈퇴 예정) u6의 글에 댓글 → 복원 때 "탈퇴자의 글에 단 댓글"이 외래키 때문에 어떻게 되는지 보려는 거예요
select set_config('request.jwt.claim.sub', :'u2', false);
insert into public.comments (post_id, parent_id, content)
  select c.post_id, c.id, '가짜 답글 1 입니다 시험용이에요' from public.comments c where c.content like '가짜 댓글 1%';
insert into public.comments (post_id, content)
  select id, '가짜 댓글 2 (탈퇴 예정 회원의 글에 단 댓글) 시험용이에요' from public.posts where title like '가짜 글 제목 3%';

-- 신고: u3가 u6의 글을 신고, u6이 u2의 글을 신고 (u6이 탈퇴하면 reporter_id는 null이 되고 신고 기록은 남아요 — 0009)
select set_config('request.jwt.claim.sub', :'u3', false);
insert into public.reports (target_type, target_id, reason, detail)
  select 'post', id, 'spam', '가짜 신고 1 시험용이에요' from public.posts where title like '가짜 글 제목 3%';
select set_config('request.jwt.claim.sub', :'u6', false);
insert into public.reports (target_type, target_id, reason, detail)
  select 'post', id, 'other', '가짜 신고 2 시험용이에요' from public.posts where title = '가짜 글 제목 1';

select set_config('request.jwt.claim.sub', '', false);

-- 운영자 1명, 사진 파일 기록 1개 (저장소 스텁에만 있고 백업에는 안 들어가야 해요)
insert into public.admins (user_id) values (:'u1');
insert into storage.objects (bucket_id, name, owner) values ('photos', :'u2' || '/fake-photo-1.jpg', :'u2');

-- ── 입력 결과 확인 (기대값은 README.md의 T02 표) ──
select 'SEED|auth.users|' || count(*) from auth.users;
select 'SEED|auth.identities|' || count(*) from auth.identities;
select 'SEED|profiles(트리거로 자동 생성)|' || count(*) from public.profiles;
select 'SEED|bakeries|' || count(*) from public.bakeries;
select 'SEED|reviews|' || count(*) from public.reviews;
select 'SEED|bakery_visits|' || count(*) from public.bakery_visits;
select 'SEED|posts|' || count(*) from public.posts;
select 'SEED|comments|' || count(*) from public.comments;
select 'SEED|post_likes|' || count(*) from public.post_likes;
select 'SEED|reports|' || count(*) from public.reports;
select 'SEED|admins|' || count(*) from public.admins;
select 'SEED|storage.objects|' || count(*) from storage.objects;
select 'SEED|auth.sessions|' || count(*) from auth.sessions;
select 'SEED|auth.refresh_tokens|' || count(*) from auth.refresh_tokens;
select 'SEED|auth.one_time_tokens|' || count(*) from auth.one_time_tokens;
select 'SEED|auth.audit_log_entries|' || count(*) from auth.audit_log_entries;
