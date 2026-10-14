-- 빵덕후 레벨업 · Supabase 스키마 (6/6: 리뷰 내용 글자 수 서버 검사)
--
-- 리뷰(모험 일지) 내용은 "공백을 뺀 실제 글자 20자 이상, 앞뒤 공백을 뺀 전체 500자 이하"여야 해요.
-- 화면에서도 막지만, 화면을 우회해도 저장되지 않도록 서버(DB 트리거)가 한 번 더 검사해요.
--
-- 안전한 점
--   · 표 구조 · 기존 데이터는 바꾸지 않아요. 새 일지를 저장할 때와, 일지 "내용"을 고칠 때만 검사해요.
--   · 이미 저장된 20자 미만 일지는 그대로 남아요 (삭제 · 변경 없음). 그 일지의 별점/사진만 고치는 요청(내용 칸을 안 보내는 요청)도 막지 않아요.
--   · EXP 지급 · 하루 한도 계산(reviews_before_insert)은 그대로예요. 이 검사가 먼저 실행돼서, 거절된 일지는 EXP 계산도 하지 않아요.
--   · 여러 번 실행해도 안전해요 (create or replace / drop trigger if exists).

-- 공백을 뺀 글자 수. 화면(src/utils/reviewContent.js)과 같은 글자 번호 목록을 써요:
--   9~13(탭 · 줄바꿈 등), 32(띄어쓰기), 160(NBSP), 5760, 8192~8203, 8232, 8233, 8239, 8287, 12288(전각 공백), 65279
-- (supabase/tests/review-content.test.mjs가 화면 계산과 이 함수가 같은 결과를 내는지 확인해요)
create or replace function public.review_meaningful_length(p_text text)
returns int
language sql
immutable
set search_path = ''
as $$
  select char_length(
    regexp_replace(
      coalesce(p_text, ''),
      '[' || chr(9) || '-' || chr(13) || chr(32) || chr(160) || chr(5760) || chr(8192) || '-' || chr(8203)
          || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279) || ']',
      '',
      'g'
    )
  );
$$;

grant execute on function public.review_meaningful_length(text) to anon, authenticated;

create or replace function public.reviews_validate_content()
returns trigger
language plpgsql
as $$
begin
  if public.review_meaningful_length(new.content) < 20 then
    raise exception 'REVIEW_TOO_SHORT' using errcode = '23514';
  end if;
  if char_length(btrim(new.content)) > 500 then
    raise exception 'REVIEW_TOO_LONG' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- 트리거 이름이 reviews_a_ 로 시작해서 다른 트리거(reviews_before_*)보다 먼저 실행돼요.
drop trigger if exists reviews_a_validate_content_ins on public.reviews;
create trigger reviews_a_validate_content_ins
  before insert on public.reviews
  for each row execute function public.reviews_validate_content();

-- "update of content" = 내용 칸을 고치겠다고 보낸 요청일 때만 검사해요 (별점/사진만 고치는 요청은 검사하지 않아요)
drop trigger if exists reviews_a_validate_content_upd on public.reviews;
create trigger reviews_a_validate_content_upd
  before update of content on public.reviews
  for each row execute function public.reviews_validate_content();
