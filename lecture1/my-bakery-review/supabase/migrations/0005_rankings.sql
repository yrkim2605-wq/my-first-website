-- 빵덕후 레벨업 · Supabase 스키마 (5/5: 실제 랭킹)
--
-- 기존 표 · 데이터는 건드리지 않고, "보기 전용 뷰" 4개를 추가해요. 여러 번 실행해도 안전해요 (create or replace).
--   ranking_exp              모험가 EXP 순위 (누적)
--   ranking_monthly_reviews  이번 달 리뷰왕 (한국 시간 기준 이번 달에 쓴 일지 수)
--   ranking_bakeries         리뷰 많은 빵집
--   ranking_posts            좋아요 많은 글
--
-- 규칙
--   · 순위 번호(rank)는 1, 2, 3… 겹치지 않는 번호예요. 동점이면 아래 "동점 규칙" 순서대로 가려요.
--   · 공개 정보만 담아요: 닉네임 · 레벨 · EXP · 일지/좋아요 수. 이메일 등 개인 정보는 이 뷰들에 없어요.
--   · 누구나(로그인 안 해도) 읽을 수 있고, 아무도 이 뷰로 데이터를 바꿀 수 없어요 (읽기 권한만 줘요).
--   · "내 순위"는 앱이 이 뷰에서 내 user_id 한 줄을 찾아서 보여줘요 (순위는 전체 기준으로 먼저 계산돼요).
--
-- 동점 규칙 (모든 사용자 순위 공통): 1) 기준 값이 큰 쪽 → 2) 보조 값이 큰 쪽 → 3) 먼저 가입한 쪽 → 4) user_id 순
--   EXP 순위        : EXP → 일지 수
--   이번 달 리뷰왕  : 이번 달 일지 수 → 누적 EXP
--   리뷰 많은 빵집  : 일지 수 → 평균 별점 → 이름 → 빵집 ID
--   좋아요 많은 글  : 좋아요 수 → 댓글 수 → 먼저 쓴 글 → 글 ID

-- ───────────────────────────── EXP 순위 ─────────────────────────────
-- EXP 대상 일지가 1개 이상인 모험가만 올라와요 (기존 leaderboard 뷰와 같은 기준, 동점 규칙만 더 분명해요).
create or replace view public.ranking_exp with (security_invoker = true) as
select
  row_number() over (order by up.exp desc, up.review_count desc, p.created_at asc, up.user_id asc) as rank,
  up.user_id,
  up.nickname,
  up.exp,
  up.level_index,
  up.review_count,
  up.discovered_count
from public.user_progress up
join public.profiles p on p.id = up.user_id
where up.exp_review_count > 0;

-- ───────────────────────────── 이번 달 리뷰왕 ─────────────────────────────
-- 한국 시간(Asia/Seoul) 기준 "이번 달 1일 0시"부터 지금까지 작성한(created_at) 일지 수예요.
-- 고쳐 쓴 일지는 처음 쓴 달로 세요. 일지가 없는 모험가는 올라오지 않아요.
create or replace view public.ranking_monthly_reviews with (security_invoker = true) as
select
  row_number() over (order by m.month_review_count desc, up.exp desc, p.created_at asc, m.user_id asc) as rank,
  m.user_id,
  up.nickname,
  up.level_index,
  m.month_review_count,
  up.exp,
  to_char(date_trunc('month', now() at time zone 'Asia/Seoul'), 'YYYY-MM') as month_label
from (
  select r.user_id, count(*) as month_review_count
  from public.reviews r
  where (r.created_at at time zone 'Asia/Seoul') >= date_trunc('month', now() at time zone 'Asia/Seoul')
  group by r.user_id
) m
join public.user_progress up on up.user_id = m.user_id
join public.profiles p on p.id = m.user_id;

-- ───────────────────────────── 리뷰 많은 빵집 ─────────────────────────────
-- 서버에 등록된 실제 빵집(bakeries)만 올라오고, 일지가 1개 이상인 곳만 보여요.
create or replace view public.ranking_bakeries with (security_invoker = true) as
select
  row_number() over (order by s.review_count desc, s.avg_rating desc, b.name asc, b.id asc) as rank,
  b.id as bakery_id,
  b.name as bakery_name,
  b.district_id,
  s.review_count,
  s.avg_rating
from (
  select r.bakery_id, count(*) as review_count, round(avg(r.rating), 1) as avg_rating
  from public.reviews r
  group by r.bakery_id
) s
join public.bakeries b on b.id = s.bakery_id;

-- ───────────────────────────── 좋아요 많은 글 ─────────────────────────────
-- 좋아요가 1개 이상인 글만 올라와요.
create or replace view public.ranking_posts with (security_invoker = true) as
select
  row_number() over (order by f.like_count desc, f.comment_count desc, f.created_at asc, f.id asc) as rank,
  f.id as post_id,
  f.category_id,
  f.title,
  f.user_id,
  f.author_nickname,
  f.author_level_index,
  f.like_count,
  f.comment_count,
  f.created_at
from public.post_feed f
where f.like_count > 0;

-- ───────────────────────────── 권한: 읽기 전용 ─────────────────────────────
-- Supabase는 새로 만든 뷰에도 넉넉한 권한을 붙일 수 있어서, 먼저 모두 거두고 읽기만 다시 줘요.
-- (0004의 comment_feed도 같이 읽기 전용으로 단단히 해요)
revoke all on public.ranking_exp, public.ranking_monthly_reviews, public.ranking_bakeries, public.ranking_posts,
              public.comment_feed from anon, authenticated;
grant select on public.ranking_exp, public.ranking_monthly_reviews, public.ranking_bakeries, public.ranking_posts,
                public.comment_feed to anon, authenticated;
