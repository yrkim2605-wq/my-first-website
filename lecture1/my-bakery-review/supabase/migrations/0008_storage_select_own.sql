-- 빵덕후 레벨업 · Supabase 스키마 (8/8: 사진 저장소 — 내 폴더 읽기 정책)
--
-- 문제: 0003은 사진을 "내 폴더에만 올리기 · 고치기 · 지우기" 정책만 만들고 읽기(SELECT) 정책은 만들지 않았어요.
--       그런데 PostgreSQL은 DELETE / UPDATE가 조건(WHERE)으로 행을 찾을 때 읽기 정책도 함께 요구해요.
--       그래서 작성자 본인이 자기 사진을 지우거나 옮기려 해도 "읽을 수 있는 행이 없다"로 처리돼서, 오류도 없이 0건만 처리돼요.
--       (리뷰 · 게시글의 사진 파일 정리가 조용히 실패하고 파일이 남을 수 있어요.)
--
-- 이 파일이 하는 일: 로그인한 사용자가 "내 폴더({내 user_id}/…)의 파일"만 읽을 수 있게 해요.
--   · 다른 사람의 파일 이름 목록은 여전히 볼 수 없어요 (남의 폴더는 읽기 정책에 걸려요).
--   · 사진 보기는 그대로예요: photos 버킷은 공개라서, 사진 주소(공개 URL)로 누구나 볼 수 있어요 (이 정책과 무관해요).
--   · 올리기 · 고치기 · 지우기 정책(0003)은 그대로이고, 비로그인에게는 아무 권한도 주지 않아요.
--   · 여러 번 실행해도 안전해요 (drop policy if exists).

drop policy if exists photos_select_own on storage.objects;
create policy photos_select_own on storage.objects for select to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
