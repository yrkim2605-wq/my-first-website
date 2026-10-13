# Supabase 도입 계획서 (빵덕후 레벨업)

> 상태: **승인됨(2026-10-13)** · 정책과 1단계 설계는 `docs/supabase-step1-design.md` 참고. 이 문서의 일부 추천안(이메일 인증 시점, 예시 데이터, 방문 체크 서버 저장 등)은 승인된 정책으로 대체됐어요.
> 작성일: 2026-10-13 · 대상 폴더: `lecture1/my-bakery-review` · 브랜치: `rpg-redesign`

## 0. 한눈에 보기

| 질문 | 답 |
|---|---|
| 무료 플랜으로 되나요? | 네. 포트폴리오·소규모 커뮤니티 규모(수백 명)는 충분해요. 단, **7일 비활동 시 프로젝트 자동 일시정지**, **자동 백업 없음**, **인증 메일 발송 제한**은 대비가 필요해요. |
| 로그인 방식은? | **이메일 + 비밀번호 + 닉네임**(추천). 비밀번호는 Supabase가 해시로 관리하고 우리 코드/DB에는 저장하지 않아요. 카카오 로그인은 2차로 추가할 수 있어요. |
| 기존 화면 코드는 얼마나 바뀌나요? | `src/storage/` 안쪽만 교체하는 구조예요(모든 함수가 이미 Promise). 환경변수 스위치로 **로컬 모드로 되돌릴 수 있게** 둬요. |
| 기존 데이터는요? | **지우지 않아요.** 로그인 후 "이 브라우저의 기록 가져오기"를 사용자가 직접 눌러 복사하고, 원본은 그대로 남겨요. |
| 가장 큰 위험은? | 서버에서 빵집 방문을 검증할 수 없어 **리뷰 EXP 어뷰징**이 가능하다는 점(7장). 완전 차단은 어렵고 완화책만 있어요. |

---

## 1. 무료 플랜으로 구현 가능한 범위

### 1-1. 무료 플랜 한도 (확인 필요)
검색한 2026년 자료들 기준이에요. **자료마다 숫자가 달라서(특히 파일 저장소와 egress) 가입 전에 [공식 요금 페이지](https://supabase.com/pricing)에서 꼭 다시 확인**해 주세요.

| 항목 | 무료 플랜(자료 기준) | 우리 서비스에 대입 |
|---|---|---|
| 프로젝트 수 | 2개 | 1개면 충분 |
| 데이터베이스 | 500MB | 리뷰 1건 약 1KB → 수만 건도 여유 |
| 파일 저장소 | 500MB~1GB (자료마다 다름) | 사진 1장 약 80~200KB(800px JPEG) → 보수적으로 **2,500~5,000장** |
| 월 데이터 전송(egress) | 5GB (일부 자료는 다르게 표기) | 사진 보기 약 2.5만 회/월 수준. 목록은 작은 썸네일 + lazy loading으로 절약 |
| 월 활성 사용자(MAU) | 50,000 | 충분 |
| 비활동 일시정지 | 7일 동안 접속 없으면 정지 | 방문 없는 주에 **서비스가 멈출 수 있음** → 대비책 필요 |
| 자동 백업 | 없음(유료 플랜 기능) | 정기 수동 내보내기 필요 |
| 이미지 변환(썸네일 서버 생성) | 유료 | 업로드 전에 **브라우저에서 2종 크기로 리사이즈**(이미 `resizeImageFile` 있음) |
| 인증 메일 | 기본 메일 서버는 **시간당 아주 적은 수(자료상 약 2통)** | 이메일 인증을 켜려면 **커스텀 SMTP**(예: Resend, SendLayer 등 무료 구간) 필요 |

### 1-2. 무료 플랜에서 되는 것 / 어려운 것
- **됨:** 이메일 로그인, 카카오·구글 OAuth, Postgres + RLS, 사진 저장소, 실시간(필요 시), Edge Function(소량), 예약 작업(pg_cron)
- **주의:** 일시정지, 백업 없음, 메일 제한, 유출 비밀번호 차단 같은 일부 보안 옵션은 유료일 수 있음(대시보드에서 확인)
- **업그레이드 기준:** 실제 사용자가 늘어 일시정지·백업이 문제가 되면 Pro(월 약 $25, 자료 기준)

### 1-3. 일시정지·백업 대비책 (무료 유지용)
1. 일시정지 방지: GitHub Actions로 하루 1회 가벼운 조회를 보내는 **keep-alive**(단, 무료 정책상 허용되는 범위의 단순 조회만)
2. 백업: 주 1회 `pg_dump` 또는 대시보드 CSV 내보내기를 개인 저장소 밖에 보관(사진은 개수가 적을 때 수동 다운로드)

---

## 2. 로그인 · 회원가입 구현 방식

### 2-1. 선택지 비교
| 방식 | 장점 | 단점 | 판단 |
|---|---|---|---|
| **이메일 + 비밀번호 + 닉네임** | 가장 단순, 추가 서비스 없음 | 인증 메일을 켜면 SMTP 필요 | **1차 추천** |
| 매직링크(비밀번호 없음) | 비밀번호 관리 불필요 | 메일 의존도 높음, 무료 메일 한도에 바로 걸림 | 비추천 |
| 카카오 / 구글 OAuth | 가입 장벽 낮음, 메일 불필요 | 각 개발자 콘솔 설정, 카카오는 비즈 앱·동의항목 설정 필요 | **2차 추가 후보** |

### 2-2. 가입 흐름
1. 가입 화면: 이메일, 비밀번호(8자 이상), 닉네임(2~12자, 대소문자 무시 중복 불가) 입력
2. `supabase.auth.signUp({ email, password, options: { data: { nickname } } })`
3. DB 트리거가 `profiles` 행을 자동 생성(닉네임 중복이면 가입 실패 안내)
4. 이메일 인증: 개발 중엔 **끔**, 공개 전에는 **커스텀 SMTP 설정 후 켬**
5. 로그인 상태는 supabase-js가 세션(JWT + refresh token)으로 관리 → `onAuthStateChange`로 `ProfileContext`에 연결
6. 비밀번호 재설정: `resetPasswordForEmail`(메일 필요)

### 2-3. 이 프로젝트에서 꼭 챙길 기술 포인트
- **HashRouter 충돌:** 기본(implicit) 방식은 토큰을 URL의 `#` 뒤에 붙여서 `#/ranking` 같은 라우팅과 충돌해요. → **PKCE 방식(`flowType: 'pkce'`)** 으로 `?code=` 쿼리로 받도록 설정
- **배포 주소가 2곳:** GitHub Pages(`/my-first-website/my-bakery-review/`)와 Vercel. 대시보드의 **Site URL / Redirect URL 허용 목록**에 로컬(`localhost:5173`), Pages, Vercel 주소를 모두 등록
- **프론트에는 `anon` 키만 사용:** 이 키는 공개되어도 되도록 설계된 키이고, **보호는 RLS가 담당**해요. `service_role` 키는 절대 프론트·git에 넣지 않아요.
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`.env`는 이미 git 제외)
- 현재 로그인 화면의 "임시 프로필" 안내 문구는 Supabase 모드에서 바꿔요.

---

## 3. 데이터 저장 구조

### 3-1. 원칙
현재 앱의 핵심 설계를 유지해요: **EXP · 레벨 · 퀘스트 · 배지 · 도감은 별도로 저장하지 않고 리뷰에서 매번 계산**합니다. 장부가 따로 없어서 중복 지급·불일치가 생기지 않고, 리뷰를 지우면 EXP도 회수돼요.
→ **저장할 진짜 데이터는 `profiles`, `reviews`, `posts`(+선택: 댓글, 좋아요)와 사진 파일뿐**이에요.

### 3-2. 테이블

```
auth.users               (Supabase 관리: 이메일, 비밀번호 해시 — 우리는 읽지 않음)
profiles                 사용자 공개 정보
  id uuid PK → auth.users(id) on delete cascade
  nickname text  (2~12자, lower(nickname) 유니크)
  created_at timestamptz

reviews                  모험 일지(리뷰)
  id uuid PK
  user_id uuid → profiles(id) on delete cascade
  bakery_id text           (카카오 장소 ID 또는 샘플 ID, 항상 문자열)
  bakery_source text       ('kakao' | 'sample')
  bakery_name text         (작성 당시 이름 스냅샷)
  district_id text null    (퀘스트 계산용 스냅샷)
  rating numeric(2,1)      (0.5~5, 0.5 단위 check)
  content text             (1~500자 check)
  photo_path text null     (Storage 경로)
  created_at, updated_at
  UNIQUE (user_id, bakery_id)      ← 지금의 "한 빵집 1리뷰" 규칙

posts                    커뮤니티 게시글
  id uuid PK, user_id → profiles, category_id text
  title text (1~80자), content text (1~2000자), photo_path null
  created_at, updated_at

(선택, 6단계) comments(post_id, user_id, parent_id, content, ...)
(선택, 6단계) post_likes(post_id, user_id, PK(post_id,user_id))
```

현재 로컬 저장 모양(`id, userId, bakeryId, bakerySource, bakeryName, districtId, rating, content, photo, createdAt, updatedAt`)과 1:1로 대응돼서 이전이 쉬워요. `clientRequestId`(더블 클릭 방지)는 `UNIQUE (user_id, bakery_id)`가 같은 역할을 해요.

### 3-3. 경험치 · 레벨 · 배지 · 도감을 어디서 계산하나
| 항목 | 계산 위치 | 이유 |
|---|---|---|
| **내** EXP·레벨·퀘스트·배지·도감 | 클라이언트(지금의 `utils/gameState.js` 그대로) | 내 리뷰만 불러오면 됨 |
| **전체 순위**(실제 랭킹) | DB 뷰/함수 `leaderboard` | 모든 사용자 리뷰 집계가 필요 |
| 작성자 레벨 표시(카드) | 같은 뷰의 `user_stats` | 리뷰 전체를 내려받지 않기 위해 |

- 규칙 숫자(리뷰 30, 사진 10, 퀘스트 20/30/50, 레벨 기준 0/60/180/400/800)가 **JS와 SQL 두 곳**에 생겨요 → 규칙을 `constants/gameRules.js`와 SQL 함수에 둘 다 두고, **같은 입력으로 두 결과가 같은지 비교하는 테스트**를 넣어 불일치를 막아요.
- 배지·도감은 **계산값**이라 "한 번 얻은 배지는 리뷰를 지워도 유지"가 필요하면 별도 테이블이 필요해요. 지금은 현행 정책(지우면 회수)을 유지하고, 변경 여부는 결정 사항(9장)에 올려요.
- "빵집 데이터가 늘어도 기존 발견 기록 유지": 발견은 **리뷰의 `bakery_id`** 로 정해져서, 카카오 목록이 바뀌어도 유지돼요(이미 같은 구조).

### 3-4. 사진 저장소
- 버킷 `review-photos`(공개 읽기), 경로 `"{user_id}/{uuid}.jpg"`
- 업로드 전 브라우저에서 리사이즈(본문 800px, 썸네일 약 240px) 후 업로드 → 무료 플랜에서도 용량·전송량 절약
- DB에는 경로만 저장, 화면에서는 공개 URL 사용

---

## 4. 기존 localStorage 데이터 이전 방법

### 4-1. 지금 로컬에 있는 것
| 키 | 내용 | 이전 |
|---|---|---|
| `my-bakery-review:v1:profiles` | 닉네임 프로필(비밀번호 없음) | 이전하지 않음(새 계정이 대체) |
| `my-bakery-review:v1:reviews` | 리뷰 + 사진(data URL) | **이전 대상** |
| `visited-real-bakery-ids` | "다녀왔어요" 체크 | 1차는 로컬 유지(EXP와 무관). 필요하면 `bakery_visits` 테이블 추가 |
| `real-bakery-photos` | 예전 빵집 사진 | 로컬 유지(읽기 전용) |

### 4-2. 이전 절차 (사용자가 직접, 되돌릴 수 있게)
1. 가입·로그인 후 마이페이지에 "이 브라우저에 저장된 기록 N개를 계정으로 가져올까요?" 안내 표시
2. 로컬 프로필이 여러 개면 **어느 닉네임의 기록을 가져올지 사용자가 선택**
3. 미리보기: 리뷰 개수, 사진 개수, 중복(이미 서버에 같은 빵집 리뷰가 있는 경우) 표시
4. 확인 시 하나씩 처리: 사진 data URL → Blob → Storage 업로드 → `reviews`에 `upsert(user_id, bakery_id)`
5. **같은 작업을 다시 눌러도 안전**(유니크 제약으로 중복 불가). 서버에 이미 있는 리뷰는 **서버 것을 유지**하고 건너뜀
6. 일부 실패하면 실패한 건만 목록으로 보여주고 재시도 가능
7. 성공 기록만 `my-bakery-review:v1:migrated` 키에 남김. **로컬 원본은 삭제하지 않아요**(백업). 삭제는 사용자가 확인 후 선택하는 별도 버튼으로만.
8. EXP·퀘스트·도감·배지는 리뷰에서 다시 계산되므로 **따로 옮길 것이 없어요**.

> 위험 완화: 이전 전에 로컬 데이터를 JSON 파일로 내려받는 "백업 받기" 버튼을 먼저 제공해요.

---

## 5. 사용자별 데이터 접근 권한 및 보안 설정

### 5-1. RLS (Row Level Security) — 모든 테이블에서 켬
| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| profiles | 누구나(닉네임·가입일만. **이메일은 auth 쪽이라 노출 안 됨**) | 본인 행만 수정, 삽입은 트리거만 |
| reviews | 누구나(로그인 없이 목록 열람 가능) | 삽입: `user_id = auth.uid()`만 / 수정·삭제: 본인 것만 |
| posts | 누구나 | 삽입·수정·삭제: 본인 것만 |
| comments, post_likes | 누구나 | 본인 것만 |
| Storage `review-photos` | 공개 읽기 | 자기 폴더(`auth.uid()/…`)에만 업로드·수정·삭제 |

정책 작성 시 `auth.uid()`는 `(select auth.uid())` 형태로 써서 성능 저하를 막아요.

### 5-2. 추가 방어
- **불변 필드 보호:** `user_id`, `bakery_id`, `created_at`은 수정 불가(트리거 또는 컬럼 권한)
- **입력 검증:** 글자 수, 별점 범위, 닉네임 정규식을 **DB check 제약**으로도 강제(프론트 검증만 믿지 않음)
- **스팸 제한:** 사용자당 하루 작성 수 제한 트리거(예: 게시글 20, 리뷰 50)
- **XSS:** React 기본 이스케이프를 유지하고 `dangerouslySetInnerHTML`을 쓰지 않아요
- **키 관리:** `service_role` 키는 프론트·git·대화에 절대 넣지 않음. `anon` 키만 `.env`에
- **계정 삭제:** `on delete cascade`로 계정 삭제 시 프로필·리뷰·게시글이 함께 삭제되게 설계(탈퇴 기능은 Edge Function 필요 → 7단계 후보)
- **개인정보:** 이메일을 수집하게 되므로 가입 화면에 수집 항목·목적·보관 안내 문구 필요(공개 서비스 전)
- **이메일 인증·비밀번호 정책:** 공개 전에 인증 켜기, 비밀번호 8자 이상(대시보드에서 최소 길이 설정)
- **검증 방법:** 계정 2개로 "남의 리뷰 수정/삭제/사진 덮어쓰기"가 **실제로 거부되는지** 테스트 체크리스트로 확인

---

## 6. 로컬 코드 구조 변경안

```
src/lib/supabaseClient.js          (새) 클라이언트 생성, PKCE 설정
src/storage/
  profileRepository.js             → authRepository(Supabase) 로 구현 교체
  reviewRepository.js              → Supabase 구현 (메서드 이름은 그대로)
  photoRepository.js         (새) 업로드/삭제
  postRepository.js          (새)
  localStore.js                    로컬 모드용으로 유지
supabase/migrations/*.sql   (새) 테이블 · RLS · 트리거 · 뷰 (git으로 이력 관리)
```

- **백엔드 스위치:** `VITE_DATA_BACKEND=local | supabase`. 키가 없거나 `local`이면 **지금과 똑같이 동작** → 안전하게 배포·롤백 가능
- **성능 변경 필요:** 현재 `ReviewsContext`는 모든 리뷰를 불러와 화면에서 거르는 방식이에요. 서버에서는 **내 리뷰 / 빵집별 리뷰(페이지) / 랭킹(뷰)** 로 나눠 가져와야 해요.
- 화면 컴포넌트(`ReviewDialog`, `MyPage`, `QuestBoard` 등)는 거의 그대로, **로그인·가입 화면만 개편**(이메일·비밀번호 입력 추가)

---

## 7. 알려진 한계와 위험

| 위험 | 설명 | 완화 |
|---|---|---|
| **EXP 어뷰징** | 서버가 "정말 그 빵집에 갔는지" 알 수 없고, `bakery_id`를 임의로 만들어 리뷰를 쌓을 수 있어요 | 일일 작성 제한, 유효한 장소 ID만 허용하는 검증(Edge Function으로 카카오 장소 조회 → 추후), 신고/삭제 기능 |
| 일시정지 | 무료 플랜은 7일 비활동 시 정지 | keep-alive, 정지 시 대시보드에서 복구 |
| 백업 없음 | 데이터 손실 시 복구 어려움 | 주기적 내보내기 |
| 메일 제한 | 인증 메일이 몇 통 만에 막힐 수 있음 | 커스텀 SMTP, 개발 중에는 인증 끔 |
| 카카오 검색 변동 | 도감 분모(약 75곳)는 검색 결과에 따라 달라짐 | 발견 기록은 리뷰 기준이라 유지됨. 장기적으로 `bakeries` 마스터 테이블 도입 검토 |
| 규칙 중복 | EXP 규칙이 JS와 SQL에 존재 | 동일 결과 비교 테스트 |

---

## 8. 작업 순서 (각 단계 끝에 확인 → 커밋. 다음 단계는 승인 후 진행)

| 단계 | 작업 | 규모 | 확인 방법 |
|---|---|---|---|
| **0. 준비 (사용자)** | Supabase 프로젝트 생성(서울 리전 추천), Site/Redirect URL 등록, URL·anon 키를 `.env`에 입력. **키는 대화에 붙여넣지 않아도 돼요** | 소 | 대시보드 설정 확인 |
| **1. DB 설계 반영** | `supabase/migrations` SQL 작성 → 테이블·RLS·트리거·뷰·Storage 정책 적용 | 중 | 계정 2개 권한 테스트 표 |
| **2. 클라이언트 + 인증** | supabase 클라이언트, 백엔드 스위치, 가입·로그인·로그아웃 화면, 세션 유지 | 중 | 새로고침·다른 브라우저 로그인 |
| **3. 리뷰 + 사진** | `reviewRepository`·`photoRepository` Supabase 구현, EXP·퀘스트·도감 정상 갱신 확인 | 중 | 리뷰 작성 → 다른 기기에서 동일 표시 |
| **4. 데이터 이전 도구** | 백업 받기 + 가져오기 + 중복·실패 처리 | 중 | 샘플 로컬 데이터로 이전·재실행 테스트 |
| **5. 실제 랭킹** | `leaderboard` 뷰, 랭킹·작성자 레벨 표시를 서버 값으로 | 중 | 계정 여러 개로 순위 검증, JS·SQL 계산 일치 테스트 |
| **6. 커뮤니티 글쓰기** | 게시글 작성·수정·삭제·목록·상세, (선택) 댓글·좋아요 서버 저장, 예시 글 처리 | 대 | 다른 사용자 글 열람, 본인 글만 수정·삭제 |
| **7. 마무리·보안** | 일일 제한, SMTP·인증 켜기, keep-alive, 백업 절차, 개인정보 안내, 계정 삭제, 전체 QA | 중 | 보안 체크리스트, 모바일 점검 |
| **그 후** | main 병합·배포 여부는 별도로 결정 | — | — |

---

## 9. 결정이 필요한 사항 (추천안 포함)

1. **로그인 방식:** 이메일+비밀번호(추천) 먼저, 카카오 로그인은 나중에? / 처음부터 카카오 포함?
2. **이메일 인증:** 개발 중 끄고 공개 전 켜기(추천) / 처음부터 켜기(SMTP 서비스 필요)
3. **배지 정책:** 리뷰를 지우면 배지·EXP 회수(현행, 추천) / 한 번 얻으면 유지(별도 테이블 필요)
4. **예시 데이터:** 실제 데이터가 충분해지기 전까지 "예시" 표시로 함께 노출(추천) / 서버 전환과 함께 제거
5. **커뮤니티 범위(6단계):** 글 작성·수정·삭제만 먼저(추천) / 댓글·좋아요 서버 저장까지 한 번에
6. **"다녀왔어요" 체크:** 로컬 유지(추천) / 서버 테이블로 이전
7. **리전:** 한국 사용자 중심이면 서울(`ap-northeast-2`) 추천

## 10. 참고한 자료
요금과 한도는 변동될 수 있어 아래 자료와 공식 문서를 함께 확인해야 해요(일부 수치가 자료마다 달라요).
- [Supabase Pricing: 2026 Guide to Plans, Limits, and Real-World Costs](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)
- [Supabase Pricing in 2026 (makerkit)](https://makerkit.dev/blog/md/saas/supabase-pricing)
- [Supabase Pricing: Free Tier Limits, Pro Costs & Egress (activepieces)](https://www.activepieces.com/blog/supabase-pricing-free-tier-limits-pro-costs-egress.md)
- [Supabase Free Plan 2026 (costbench)](https://costbench.com/software/database-as-service/supabase/free-plan/)
- [Supabase email rate limit (axonbuild)](https://axonbuild.com/blog/supabase-email-rate-limit/)
- [Supabase Custom SMTP guide (sendlayer)](https://sendlayer.com/blog/supabase-custom-smtp-and-email-configuration-guide/)
- 공식: https://supabase.com/pricing · https://supabase.com/docs
