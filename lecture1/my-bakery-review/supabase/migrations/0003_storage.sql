-- 빵덕후 레벨업 · Supabase 스키마 (3/3: 사진 저장소)
--
-- ⚠️ 설계 단계 파일이에요. 아직 어떤 Supabase 프로젝트에도 적용하지 않았고,
--    storage 스키마가 필요해서 로컬 테스트(supabase/tests)에도 포함되지 않았어요. 실제 프로젝트에 적용한 뒤 계정 2개로 검증해요.

-- 공개 읽기 버킷. 1MB 이하 JPEG/WebP만 받아요 (앱이 올리기 전에 800px로 줄여요).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 1048576, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 경로 규칙: "{내 user_id}/{파일명}". 내 폴더에만 올리고 · 고치고 · 지울 수 있어요.
-- (읽기는 공개 버킷이라 정책이 필요 없어요)
create policy photos_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_email_verified())
  );

create policy photos_update_own on storage.objects for update to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_email_verified())
  );

create policy photos_delete_own on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_email_verified())
  );
