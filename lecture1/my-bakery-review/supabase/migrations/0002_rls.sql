-- 빵덕후 레벨업 · Supabase 스키마 (2/3: 권한 · RLS · 뷰)
--
-- ⚠️ 설계 단계 파일이에요. 아직 어떤 Supabase 프로젝트에도 적용하지 않았어요.
--
-- 방어는 3겹이에요.
--   ① GRANT(컬럼 권한): 클라이언트가 아예 쓸 수 없는 컬럼은 권한 자체를 주지 않아요 (exp_review 등).
--   ② RLS 정책: 내 행만 쓰기, 이메일 인증을 마친 사용자만 쓰기.
--   ③ 트리거(0001): 서버가 정하는 값은 클라이언트가 보낸 값을 무시하고 덮어써요.

-- ───────────────────────────── ① 기본 권한 ─────────────────────────────
-- Supabase는 public 스키마 새 테이블에 anon/authenticated 권한을 넉넉히 주기 때문에, 먼저 모두 거두고 필요한 것만 다시 줘요.

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

-- 읽기: 로그인하지 않아도 공개 데이터는 볼 수 있어요 (이메일 등 개인 정보는 이 테이블들에 없어요)
grant select on public.profiles, public.bakeries, public.reviews,
                public.posts, public.comments, public.post_likes, public.game_settings to anon, authenticated;
-- 다녀왔어요 체크는 본인만 읽어요
grant select on public.bakery_visits to authenticated;

-- 쓰기: 고칠 수 있는 컬럼만 열어 줘요 (user_id · exp_* · created_at은 열지 않아요)
grant update (nickname)                                   on public.profiles     to authenticated;
grant insert (bakery_id, rating, content, photo_path)     on public.reviews      to authenticated;
grant update (rating, content, photo_path)                on public.reviews      to authenticated;
grant delete                                              on public.reviews      to authenticated;
grant insert (category_id, title, content, photo_path)    on public.posts        to authenticated;
grant update (category_id, title, content, photo_path)    on public.posts        to authenticated;
grant delete                                              on public.posts        to authenticated;
grant insert (post_id, parent_id, content)                on public.comments     to authenticated;   -- 댓글은 수정 불가, 삭제만
grant delete                                              on public.comments     to authenticated;
grant insert (post_id)                                    on public.post_likes   to authenticated;
grant delete                                              on public.post_likes   to authenticated;
grant insert (bakery_id)                                  on public.bakery_visits to authenticated;
grant delete                                              on public.bakery_visits to authenticated;
-- bakeries는 읽기 전용: 등록은 Edge Function(서버 비밀 키)만 해요

-- 정책과 트리거가 부르는 함수
grant execute on function public.is_email_verified()          to anon, authenticated;
grant execute on function public.is_nickname_available(text)  to anon, authenticated;
grant execute on function public.game_setting(text)           to anon, authenticated;
grant execute on function public.game_exp(int, int, int, int) to anon, authenticated;
grant execute on function public.game_level_index(int)        to anon, authenticated;

-- ───────────────────────────── ② RLS 정책 ─────────────────────────────

alter table public.profiles      enable row level security;
alter table public.bakeries      enable row level security;
alter table public.reviews       enable row level security;
alter table public.posts         enable row level security;
alter table public.comments      enable row level security;
alter table public.post_likes    enable row level security;
alter table public.bakery_visits enable row level security;
alter table public.game_settings enable row level security;

-- 읽기 (공개)
create policy profiles_read   on public.profiles   for select using (true);
create policy bakeries_read   on public.bakeries   for select using (true);
create policy reviews_read    on public.reviews    for select using (true);
create policy posts_read      on public.posts      for select using (true);
create policy game_settings_read on public.game_settings for select using (true);   -- 쓰기 정책 없음 → 클라이언트는 못 바꿔요
create policy comments_read   on public.comments   for select using (true);
create policy post_likes_read on public.post_likes for select using (true);
-- 읽기 (본인만)
create policy visits_read_own on public.bakery_visits for select to authenticated
  using (user_id = (select auth.uid()));

-- 프로필: 내 닉네임만 바꿀 수 있고, 인증을 마친 사용자만
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select public.is_email_verified()))
  with check (id = (select auth.uid()));

-- 리뷰
create policy reviews_insert_own on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_email_verified()));
create policy reviews_update_own on public.reviews for update to authenticated
  using (user_id = (select auth.uid()) and (select public.is_email_verified()))
  with check (user_id = (select auth.uid()));
create policy reviews_delete_own on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.is_email_verified()));

-- 게시글
create policy posts_insert_own on public.posts for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_email_verified()));
create policy posts_update_own on public.posts for update to authenticated
  using (user_id = (select auth.uid()) and (select public.is_email_verified()))
  with check (user_id = (select auth.uid()));
create policy posts_delete_own on public.posts for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.is_email_verified()));

-- 댓글 (수정 정책 없음 → 수정 불가)
create policy comments_insert_own on public.comments for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_email_verified()));
create policy comments_delete_own on public.comments for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.is_email_verified()));

-- 좋아요
create policy post_likes_insert_own on public.post_likes for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_email_verified()));
create policy post_likes_delete_own on public.post_likes for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.is_email_verified()));

-- 다녀왔어요 체크
create policy visits_insert_own on public.bakery_visits for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_email_verified()));
create policy visits_delete_own on public.bakery_visits for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.is_email_verified()));

-- ───────────────────────────── ③ 뷰 (security_invoker: 호출한 사람의 RLS를 그대로 따라요) ─────────────────────────────

-- 사용자별 활동 통계. EXP 대상 리뷰(exp_review)만 EXP · 퀘스트에 쓰고,
-- 도감(discovered_count)은 EXP 상한과 상관없이 내가 쓴 리뷰의 서로 다른 빵집 수예요.
create view public.user_stats with (security_invoker = true) as
select
  p.id        as user_id,
  p.nickname,
  count(r.id)                                              as review_count,
  count(distinct r.bakery_id)                              as discovered_count,
  count(r.id) filter (where r.exp_review)                  as exp_review_count,
  count(r.id) filter (where r.exp_photo and r.photo_path is not null) as exp_photo_count,
  count(distinct r.bakery_id) filter (where r.exp_review)  as quest_bakery_count,
  count(distinct b.district_id) filter (where r.exp_review) as quest_district_count
from public.profiles p
left join public.reviews r on r.user_id = p.id
left join public.bakeries b on b.id = r.bakery_id
group by p.id, p.nickname;

-- EXP와 레벨 (서버 계산). 앱의 "작성자 레벨 표시"와 랭킹이 이 값을 써요.
create view public.user_progress with (security_invoker = true) as
select
  s.*,
  public.game_exp(s.exp_review_count::int, s.exp_photo_count::int, s.quest_bakery_count::int, s.quest_district_count::int) as exp,
  public.game_level_index(
    public.game_exp(s.exp_review_count::int, s.exp_photo_count::int, s.quest_bakery_count::int, s.quest_district_count::int)
  ) as level_index
from public.user_stats s;

-- 실제 사용자 랭킹: EXP 대상 리뷰가 1개 이상인 사용자만. 예시 데이터는 DB에 없으니 섞일 수 없어요.
create view public.leaderboard with (security_invoker = true) as
select
  rank() over (order by exp desc, review_count desc) as rank,
  user_id, nickname, exp, level_index, review_count, discovered_count
from public.user_progress
where exp_review_count > 0;

-- 게시글 목록: 작성자 닉네임 · 레벨 · 좋아요/댓글 수 · 내가 눌렀는지
create view public.post_feed with (security_invoker = true) as
select
  po.id, po.category_id, po.title, po.content, po.photo_path, po.created_at, po.updated_at,
  po.user_id, up.nickname as author_nickname, up.level_index as author_level_index,
  (select count(*) from public.post_likes l where l.post_id = po.id) as like_count,
  (select count(*) from public.comments c   where c.post_id = po.id) as comment_count,
  exists (select 1 from public.post_likes l where l.post_id = po.id and l.user_id = auth.uid()) as liked_by_me
from public.posts po
join public.user_progress up on up.user_id = po.user_id;

grant select on public.user_stats, public.user_progress, public.leaderboard, public.post_feed to anon, authenticated;
