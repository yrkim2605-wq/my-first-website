-- 빵덕후 레벨업 · Supabase 스키마 (10/10: 운영자의 사진 파일 정리 권한)
--
-- 문제: 신고 처리로 글 · 리뷰를 지우면 DB 행은 사라지지만, 사진 파일(Storage)은 그대로 남아요.
--       사진 정책(0003)은 "내 폴더만"이라서 운영자도 남의 사진 파일을 지울 수 없어요.
-- 이 파일이 하는 일: 운영자(public.is_admin())에게만 photos 버킷의 파일을 읽고(목록 · 삭제 조건 확인) 지울 권한을 줘요.
--   · 올리기 · 고치기 권한은 주지 않아요 (운영자도 남의 폴더에 파일을 올릴 수 없어요).
--   · 일반 사용자 정책(0003 · 0008)은 그대로예요.
-- 여러 번 실행해도 안전해요.

drop policy if exists photos_select_admin on storage.objects;
create policy photos_select_admin on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()));

drop policy if exists photos_delete_admin on storage.objects;
create policy photos_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()));
