-- 빵덕후 레벨업 · Supabase 스키마 (1/3: 테이블 · 트리거 · 함수)
--
-- ⚠️ 설계 단계 파일이에요. 아직 어떤 Supabase 프로젝트에도 적용하지 않았어요.
--
-- 원칙
--  1. EXP · 레벨 · 퀘스트는 "저장하지 않고" 리뷰에서 계산해요 (user_progress 뷰). 점수 컬럼이 없으니 클라이언트가 고칠 수도 없어요.
--  2. 서버가 정하는 값(user_id, exp_review, exp_photo, created_at)은 트리거가 강제로 덮어써요.
--  3. EXP는 "DB에 등록된 유효한 빵집"에만 지급돼요 (reviews.bakery_id → bakeries.id 외래키).
--  4. 예시(데모) 데이터는 이 DB에 넣지 않아요. 가짜 사용자도 만들지 않아요.

-- ───────────────────────────── 도우미 함수 ─────────────────────────────

-- 이메일 인증을 마친 사용자인지 (RLS와 트리거에서 써요)
create or replace function public.is_email_verified()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

-- 게임 설정값: 숫자를 바꾸고 싶을 때 SQL Editor에서 update 한 줄이면 돼요 (앱 배포 불필요, 클라이언트는 쓰기 불가).
--   예) update public.game_settings set value = 150 where key = 'daily_exp_cap';
-- 주의: 리뷰/사진 EXP를 바꾸면 src/constants/gameRules.js도 같이 바꿔야 해요 (supabase/tests가 두 값이 같은지 비교해요).
create table public.game_settings (
  key   text primary key,
  value int not null check (value >= 0)
);
insert into public.game_settings (key, value) values
  ('review_exp', 30),      -- 리뷰 1개
  ('photo_exp', 10),       -- 작성할 때 사진이 있는 리뷰의 추가 EXP
  ('daily_exp_cap', 100);  -- 하루(한국 시간)에 "리뷰·사진"으로 받을 수 있는 EXP 상한. 퀘스트 보너스는 1회성이라 상한 밖이에요.

create or replace function public.game_setting(p_key text)
returns int
language sql stable
as $$
  select value from public.game_settings where key = p_key;
$$;

-- 퀘스트 보너스: 첫 리뷰 +20 / 서로 다른 빵집 3곳 +30 / 서로 다른 지역 3곳 +50 (gameRules.js와 같은 숫자)
create or replace function public.game_exp(
  p_reviews int, p_photos int, p_bakeries int, p_districts int
) returns int
language sql stable
as $$
  select p_reviews * public.game_setting('review_exp')
       + p_photos * public.game_setting('photo_exp')
       + case when p_reviews   >= 1 then 20 else 0 end
       + case when p_bakeries  >= 3 then 30 else 0 end
       + case when p_districts >= 3 then 50 else 0 end;
$$;

-- 레벨 번호(0~4): 기준 EXP 0 / 60 / 180 / 400 / 800
create or replace function public.game_level_index(p_exp int)
returns int
language sql immutable
as $$
  select case when p_exp >= 800 then 4
              when p_exp >= 400 then 3
              when p_exp >= 180 then 2
              when p_exp >= 60  then 1
              else 0 end;
$$;

-- ───────────────────────────── profiles ─────────────────────────────

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nickname   text not null check (nickname ~ '^[가-힣a-zA-Z0-9_]{2,12}$'),
  created_at timestamptz not null default now()
);
create unique index profiles_nickname_lower_key on public.profiles (lower(nickname));

-- 닉네임이 형식에 맞고 아직 아무도 안 쓰는지 (가입 화면에서 미리 확인할 때 써요)
create or replace function public.is_nickname_available(p_nickname text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_nickname ~ '^[가-힣a-zA-Z0-9_]{2,12}$'
     and not exists (select 1 from public.profiles p where lower(p.nickname) = lower(p_nickname));
$$;

-- 가입하면 프로필을 자동으로 만들어요. 닉네임이 없거나 중복이면 가입 전체가 취소돼요.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, btrim(coalesce(new.raw_user_meta_data ->> 'nickname', '')));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────── bakeries ─────────────────────────────
-- "유효한 빵집" 목록. 클라이언트는 직접 추가할 수 없고, Edge Function(register-bakery)이
-- 카카오 로컬 REST API로 실제 장소인지 확인한 뒤에만 넣어요 (RLS: 읽기 전용).
-- 예시 빵집(src/constants/bakeries.js의 숫자 ID)은 넣지 않아요 → 예시 빵집 리뷰는 EXP 대상이 아니에요.

create table public.bakeries (
  id            text primary key,                       -- 카카오 장소 ID
  name          text not null,
  district_id   text not null check (district_id in ('haeundae', 'seomyeon', 'nampodong', 'gwangalli', 'dongnae')),
  address       text,
  lat           double precision,
  lng           double precision,
  registered_at timestamptz not null default now()
);

-- ───────────────────────────── reviews ─────────────────────────────

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  bakery_id  text not null references public.bakeries (id),
  rating     numeric(2, 1) not null check (rating between 0.5 and 5 and (rating * 2) = floor(rating * 2)),
  content    text not null check (char_length(btrim(content)) between 1 and 500),
  photo_path text check (photo_path is null or photo_path like user_id::text || '/%'),
  -- 아래 두 칸은 서버(트리거)만 정해요. 클라이언트는 쓰기 권한이 없어요.
  exp_review boolean not null default false,            -- 이 리뷰가 EXP를 받는지 (하루 EXP 상한 안에서 작성됨)
  exp_photo  boolean not null default false,            -- 작성할 때 사진이 있어서 사진 EXP 대상인지
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, bakery_id)                           -- 한 사용자 · 한 빵집 · 리뷰 1개 → 같은 빵집 EXP는 평생 1번
);
create index reviews_bakery_idx on public.reviews (bakery_id, created_at desc);
create index reviews_user_idx on public.reviews (user_id, created_at desc);

create or replace function public.reviews_before_insert()
returns trigger
language plpgsql
as $$
declare
  v_today     date := (now() at time zone 'Asia/Seoul')::date;
  v_review_exp int := public.game_setting('review_exp');
  v_photo_exp  int := public.game_setting('photo_exp');
  v_cap        int := public.game_setting('daily_exp_cap');
  v_total     int;
  v_used      int;   -- 오늘 이미 받은 리뷰·사진 EXP
  v_left      int;   -- 오늘 더 받을 수 있는 EXP
begin
  new.user_id := auth.uid();
  if new.user_id is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '28000';
  end if;
  if not public.is_email_verified() then
    raise exception 'EMAIL_NOT_VERIFIED' using errcode = '42501';
  end if;

  select count(*),
         count(*) filter (where r.exp_review) * v_review_exp
           + count(*) filter (where r.exp_photo and r.photo_path is not null) * v_photo_exp
    into v_total, v_used
    from public.reviews r
   where r.user_id = new.user_id
     and (r.created_at at time zone 'Asia/Seoul')::date = v_today;

  -- 하루 작성 상한 20개(스팸 방지). 별개로 EXP는 하루 daily_exp_cap(기본 100)까지만 지급 (한국 시간 기준).
  -- 남은 EXP가 리뷰 EXP보다 적으면 저장은 되지만 EXP가 없고, 사진 EXP까지는 모자라면 리뷰 EXP만 받아요.
  if v_total >= 20 then
    raise exception 'DAILY_REVIEW_LIMIT' using errcode = 'P0001';
  end if;
  v_left := greatest(v_cap - v_used, 0);
  new.exp_review := v_left >= v_review_exp;
  new.exp_photo  := new.exp_review and new.photo_path is not null and v_left >= v_review_exp + v_photo_exp;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create trigger reviews_before_insert
  before insert on public.reviews
  for each row execute function public.reviews_before_insert();

-- 고칠 수 있는 건 별점 · 내용 · 사진뿐이에요. EXP 칸은 고치기로 바뀌지 않아요.
create or replace function public.reviews_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.id <> old.id or new.user_id <> old.user_id or new.bakery_id <> old.bakery_id
     or new.exp_review <> old.exp_review or new.exp_photo <> old.exp_photo
     or new.created_at <> old.created_at then
    raise exception 'IMMUTABLE_FIELD' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger reviews_before_update
  before update on public.reviews
  for each row execute function public.reviews_before_update();

-- ───────────────────────────── 커뮤니티 ─────────────────────────────

create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category_id text not null check (category_id in ('today-visit', 'new-menu', 'open-run', 'recommend', 'photo')),
  title       text not null check (char_length(btrim(title)) between 1 and 80),
  content     text not null check (char_length(btrim(content)) between 1 and 2000),
  photo_path  text check (photo_path is null or photo_path like user_id::text || '/%'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index posts_feed_idx on public.posts (category_id, created_at desc);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  parent_id  uuid references public.comments (id) on delete cascade,   -- 답글(1단계까지)
  content    text not null check (char_length(btrim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.post_likes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)                        -- 계정당 게시글별 1회
);

-- 글 · 댓글 · 좋아요 공통: 로그인 + 이메일 인증 + 작성자 고정 + 하루 작성 상한
create or replace function public.community_before_insert()
returns trigger
language plpgsql
as $$
declare
  v_limit int := case tg_table_name when 'posts' then 10 when 'comments' then 50 else 200 end;
  v_count int;
begin
  new.user_id := auth.uid();
  if new.user_id is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '28000';
  end if;
  if not public.is_email_verified() then
    raise exception 'EMAIL_NOT_VERIFIED' using errcode = '42501';
  end if;

  execute format(
    'select count(*) from public.%I where user_id = $1 and (created_at at time zone ''Asia/Seoul'')::date = (now() at time zone ''Asia/Seoul'')::date',
    tg_table_name
  ) into v_count using new.user_id;
  if v_count >= v_limit then
    raise exception 'DAILY_LIMIT' using errcode = 'P0001';
  end if;

  new.created_at := now();
  if tg_table_name = 'posts' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

-- 답글은 같은 글의 "최상위 댓글"에만 달 수 있어요 (깊이 1단계)
create or replace function public.comments_check_parent()
returns trigger
language plpgsql
as $$
declare
  v_parent public.comments;
begin
  if new.parent_id is not null then
    select * into v_parent from public.comments c where c.id = new.parent_id;
    if not found or v_parent.post_id <> new.post_id or v_parent.parent_id is not null then
      raise exception 'INVALID_PARENT' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger posts_before_insert      before insert on public.posts      for each row execute function public.community_before_insert();
create trigger comments_before_insert   before insert on public.comments   for each row execute function public.community_before_insert();
create trigger comments_check_parent    before insert on public.comments   for each row execute function public.comments_check_parent();
create trigger post_likes_before_insert before insert on public.post_likes for each row execute function public.community_before_insert();

create or replace function public.posts_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.id <> old.id or new.user_id <> old.user_id or new.created_at <> old.created_at then
    raise exception 'IMMUTABLE_FIELD' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_before_update
  before update on public.posts
  for each row execute function public.posts_before_update();

-- ───────────────────────────── 다녀왔어요 체크 ─────────────────────────────
-- 사용자가 직접 남기는 "나만 보는 체크"예요. 방문을 인증하지 않고, EXP · 도감 · 퀘스트에 반영되지 않아요.

create table public.bakery_visits (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  bakery_id  text not null references public.bakeries (id),
  created_at timestamptz not null default now(),
  primary key (user_id, bakery_id)
);

create or replace function public.visits_before_insert()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  if new.user_id is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '28000';
  end if;
  if not public.is_email_verified() then
    raise exception 'EMAIL_NOT_VERIFIED' using errcode = '42501';
  end if;
  new.created_at := now();
  return new;
end;
$$;

create trigger visits_before_insert
  before insert on public.bakery_visits
  for each row execute function public.visits_before_insert();
