# Supabase 2단계 · 프로젝트 생성과 환경변수 설정 가이드

## ⚡ 먼저 보는 요약 (파일명 · 명령어 · 위치)

| 항목 | 내용 |
|---|---|
| 프로젝트 폴더 | `C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review` (아래 모든 명령은 **이 폴더에서** 실행) |
| `.env` 위치 | **위 폴더 바로 안** (`package.json`과 같은 곳): `C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review\.env` — 이미 있고 카카오 키가 들어 있어요. 숨김 파일처럼 보일 수 있어요. |
| 양식 파일 | 같은 폴더의 `env.example` (복사해서 쓰는 게 아니라 **참고용**, 진짜 키 금지) |
| SQL 파일 (이 순서대로) | ① `supabase\migrations\0001_schema.sql` → ② `supabase\migrations\0002_rls.sql` → ③ `supabase\migrations\0003_storage.sql` |
| 연결 점검 명령 | `node supabase/check-connection.mjs` |
| 개발 서버 | `npm run dev` → 주소 `http://localhost:5173/my-first-website/my-bakery-review/` (5173이 사용 중이면 자동으로 **5174**) |
| ⚠️ 쓰지 마세요 | `npm run build` — 빌드 결과가 저장소 루트의 **배포용 `my-bakery-review/` 폴더**를 덮어써요(배포는 아직 안 하기로 했어요) |

### PowerShell 복붙용
```powershell
# 1) 프로젝트 폴더로 이동
cd "C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review"

# 2) .env 열기 (맨 아래에 Supabase 두 줄 추가 후 저장)
notepad .env

# 3) SQL을 클립보드로 복사 → Supabase SQL Editor에 Ctrl+V → Run (파일마다 새 쿼리로, 순서 지키기)
Get-Content supabase\migrations\0001_schema.sql -Raw | Set-Clipboard
Get-Content supabase\migrations\0002_rls.sql    -Raw | Set-Clipboard
Get-Content supabase\migrations\0003_storage.sql -Raw | Set-Clipboard

# 4) 연결 점검 (키는 출력되지 않아요)
node supabase/check-connection.mjs

# 5) 개발 서버
npm run dev
```
`.env`에 추가할 두 줄(값은 Supabase 대시보드 **Project Settings → API Keys / Data API**에서):
```
VITE_SUPABASE_URL=https://프로젝트ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_로_시작하는_공개_키
```

### 정상 연결 확인 방법 (3가지)
1. **`node supabase/check-connection.mjs`가 ❌ 없이 "통과"** — 기대 출력 예: `✅ 서버 연결 · 키 인정`, `✅ 이메일 인증 필수`, `✅ 테이블 …` 7개, `✅ 하루 EXP 상한 설정 — 100`, `✅ 뷰 …` 2개, `✅ 비로그인 … 차단됨` 4개
2. **대시보드 Table Editor**에 `profiles · bakeries · reviews · posts · comments · post_likes · bakery_visits · game_settings` 8개 표가 있고 모두 **RLS enabled**, `game_settings`에 `review_exp 30 / photo_exp 10 / daily_exp_cap 100` 3행
3. **`npm run dev`로 앱을 열어도 지금과 똑같이 동작**(아직 `VITE_DATA_BACKEND`를 안 넣었으니 로컬 모드). 로컬 기록·카카오 지도·RPG 디자인이 그대로면 정상이에요.

> 아래는 각 단계의 자세한 설명이에요. 대시보드 메뉴 이름이 다르면 비슷한 메뉴를 찾아 주세요.

> 이 단계는 **사용자님이 Supabase 대시보드에서 직접** 하는 작업이에요(계정 · 비밀번호가 필요해서 제가 대신할 수 없어요).
> 끝나면 `node supabase/check-connection.mjs` 결과만 알려 주세요. **키 · 비밀번호 · 토큰은 대화에 붙여넣지 않아도 돼요.**
> 대시보드 화면의 메뉴 이름은 업데이트로 조금씩 달라질 수 있어요. 이름이 다르면 비슷한 메뉴를 찾거나 화면 캡처를 보여 주세요.

## 0. 먼저 알아둘 것 (개발 포트)

카카오 지도 키는 `http://localhost:5173`만 등록돼 있어요. 그런데 5173은 지금 다른 프로젝트(포트폴리오)의 개발 서버가 쓰고 있어요.
- 방법 A: 포트폴리오 개발 서버를 끄고 이 프로젝트를 5173에서 실행 (그러면 카카오 지도가 그대로 동작)
- 방법 B: [카카오 개발자 콘솔](https://developers.kakao.com/console/app) → 앱 → 플랫폼 → Web에 `http://localhost:5174`도 추가
- Supabase 쪽 Redirect URL에도 실제로 쓰는 개발 주소를 등록해야 해요(아래 3-3).

## 1. 프로젝트 만들기

1. [supabase.com](https://supabase.com) 로그인 → **New project**
2. 이름: `bakery-review` (아무거나 가능)
3. **Database password**: 길고 무작위로 생성해서 **비밀번호 관리자에 보관**. 앱에는 필요 없어요(대화에 쓰지 마세요).
4. **Region**: **Northeast Asia (Seoul)** 선택. 목록에 없으면 가장 가까운 **Tokyo**를 고르고 알려 주세요.
5. Plan: **Free**
6. 생성 완료까지 1~2분 기다려요.

## 2. 키와 주소를 `.env`에 넣기

1. 대시보드 **Project Settings → API Keys**(또는 상단 **Connect** 버튼)
2. **Publishable key** (`sb_publishable_…`)를 복사 — **Secret key(`sb_secret_…`)와 `service_role`은 절대 복사하지 않아요.**
3. 프로젝트 URL(`https://○○○.supabase.co`)도 같은 화면(Data API / General)에 있어요.
4. 프로젝트 폴더의 `.env`(이미 카카오 키가 있는 파일) **맨 아래에 추가**:
   ```
   VITE_SUPABASE_URL=https://○○○.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_○○○
   ```
   `VITE_DATA_BACKEND`는 **아직 추가하지 않아요**(3단계에서 `supabase`로 바꿔요. 지금은 기본값 `local`).
5. `.env`는 git에 올라가지 않아요(이미 `.gitignore`에 있음). 양식은 `env.example` 참고.
6. 실수로 secret 키를 넣었다면: 점검 스크립트가 알려 주고, 대시보드에서 그 키를 **재발급**해야 해요.

## 3. 인증 설정 (Authentication)

### 3-1. 이메일 가입과 인증 필수
- **Sign In / Providers → Email**: Enable ✅
- **Confirm email: 켜기** ✅ (정책: 인증 완료 후에만 로그인·활동)
- 비밀번호 최소 길이: **8자 이상**으로 설정 (Password settings)
- (선택) "Leaked password protection"이 보이면 켜 보세요. 무료 플랜에서는 막혀 있을 수 있어요.

### 3-2. 메일 서버(SMTP) — 인증 필수라서 사실상 **필요**
기본 제공 메일 서버는 **시간당 발송 수가 아주 적어요**(자료상 약 2통). 가입자가 몇 명만 몰려도 막혀요. 커스텀 SMTP는 무료 플랜에서도 설정할 수 있어요.

| 서비스 | 무료 구간(자료 기준) | 참고 |
|---|---|---|
| **Brevo** | 하루 300통 정도 | 발신 이메일 주소 인증 필요. 도메인이 없어도 시작하기 쉬움 → **추천** |
| Resend | 월 3,000통 · 하루 100통 정도 | 자기 도메인 인증이 필요한 경우가 많아 도메인이 없으면 불편 |

출처(모두 2차 자료이니 가입 전 각 서비스의 요금 페이지에서 한 번 더 확인): [Supabase Auth SMTP 비교](https://codenote.net/en/posts/supabase-auth-custom-smtp-comparison/), [Brevo 안내](https://www.brevo.com/blog/supabase-send-email/), [SMTP 설정 가이드](https://sendlayer.com/blog/supabase-custom-smtp-and-email-configuration-guide/)

설정 위치: **Authentication → Emails → SMTP Settings → Enable custom SMTP** → 서비스가 알려 주는 Host / Port(587, STARTTLS 권장) / Username / Password / 발신 주소 입력.
그다음 **Authentication → Rate Limits**에서 시간당 이메일 수를 서비스 한도에 맞춰 적당히(예: 30) 올려요.
> 아직 SMTP를 고르지 못했다면 건너뛰어도 돼요. 대신 3단계 테스트에서 **본인 이메일 1~2개만** 가입 확인할 수 있어요(한도 내).

### 3-3. 주소 설정 (URL Configuration)
- **Site URL**: 개발 중에는 실제로 쓰는 개발 주소, 예) `http://localhost:5173/my-first-website/my-bakery-review/`
- **Redirect URLs**(허용 목록)에 모두 추가:
  - `http://localhost:5173/my-first-website/my-bakery-review/**`
  - `http://localhost:5174/my-first-website/my-bakery-review/**` (5174를 쓸 경우)
  - 배포 주소 — GitHub Pages: `https://yrkim2605-wq.github.io/my-first-website/my-bakery-review/**`
  - Vercel을 쓴다면 그 주소도 (아직 없으면 나중에 추가)
- 메일 링크가 엉뚱한 주소로 가면 이 설정이 원인이에요.

## 4. 데이터베이스 만들기 (SQL 적용)

1. 대시보드 **SQL Editor → New query**
2. `supabase/migrations/0001_schema.sql` 전체를 붙여넣고 **Run** → 성공 확인
3. 새 쿼리로 `0002_rls.sql` 전체 → **Run**
4. 새 쿼리로 `0003_storage.sql` 전체 → **Run** (사진 버킷)
5. 오류가 나면 **오류 문구만** 알려 주세요(비밀 값은 SQL에 없어요). 같은 파일을 두 번 실행하면 "already exists" 오류가 나는 게 정상이에요 — 처음부터 다시 해야 하면 알려 주세요.
6. **Table Editor**에서 `profiles`, `bakeries`, `reviews`, `posts`, `comments`, `post_likes`, `bakery_visits`, `game_settings`가 보이고, 각각 **RLS enabled** 표시인지 확인

> 이 SQL은 PGlite(진짜 Postgres)로 62개 항목을 검증했어요. 단, Auth · Storage는 실제 프로젝트에서 처음 돌아가는 거라 다음 점검에서 확인해요.

## 5. 점검하기

```
node supabase/check-connection.mjs
```
- 키는 출력하지 않아요. 확인 항목: 주소 형식 · **공개 키인지** · 이메일 인증 켜짐 · 테이블 7개/뷰 · **로그아웃 상태에서 쓰기/비공개 읽기가 막히는지**
- 결과(✅/❌ 목록)를 그대로 보여 주세요. ❌가 있으면 어디를 고칠지 알려 드릴게요.
- 이 점검은 DB를 바꾸지 않아요(막혀야 하는 쓰기를 시도하는 것뿐이에요).

## 6. 나중에 필요한 것 (4단계)

- **카카오 REST API 키**: 빵집 검증 Edge Function이 서버에서 카카오 로컬 API를 부를 때 써요. JavaScript 키와 **다른 키**예요(같은 앱의 앱 키 화면에서 확인). 4단계에서 안내하고, **Supabase 함수 비밀값에만** 저장해요(프런트·`.env`에는 넣지 않아요).

## 체크리스트

- [ ] 프로젝트 생성(서울 또는 도쿄) · DB 비밀번호 보관
- [ ] `.env`에 URL + publishable 키 추가(secret 키 아님)
- [ ] Confirm email 켜짐, 비밀번호 8자 이상
- [ ] (권장) 커스텀 SMTP 설정 + Rate Limits 조정
- [ ] Site URL · Redirect URLs 등록
- [ ] SQL 0001 → 0002 → 0003 적용, 표마다 RLS enabled
- [ ] `node supabase/check-connection.mjs` 전부 ✅
