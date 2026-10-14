-- 빵덕후 레벨업 · Supabase 스키마 (4/4: 커뮤니티 댓글 목록)
--
-- 게시글(posts) · 댓글(comments) · 좋아요(post_likes) 표와 보안 규칙(RLS)은 0001 · 0002에서 이미 만들었어요.
-- 이 파일은 "댓글을 작성자 닉네임 · 레벨과 함께 읽는 뷰"만 추가해요. 표 · 기존 데이터는 건드리지 않아요.
-- 여러 번 실행해도 안전해요 (create or replace).

-- 댓글 목록: 작성자 닉네임 · 레벨 + "내 댓글인지".
-- security_invoker = true → 호출한 사람의 권한(RLS)을 그대로 따라요. 읽기는 누구나, 쓰기는 이 뷰로 할 수 없어요.
create or replace view public.comment_feed with (security_invoker = true) as
select
  c.id,
  c.post_id,
  c.parent_id,
  c.content,
  c.created_at,
  c.user_id,
  up.nickname    as author_nickname,
  up.level_index as author_level_index,
  coalesce(c.user_id = auth.uid(), false) as is_mine   -- 로그인하지 않았으면 false
from public.comments c
join public.user_progress up on up.user_id = c.user_id;

grant select on public.comment_feed to anon, authenticated;
