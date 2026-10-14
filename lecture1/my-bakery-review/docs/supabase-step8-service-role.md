# 8단계 · 빵집 등록 실패의 원인(service_role 권한)과 수정

> 상태: 원인 확정(서버 로그) + 수정 마이그레이션 `0007` 작성 + 자동 검증 완료 / **0007 적용과 함수 재배포, 실제 저장 확인은 사용자 작업 필요**

## 1. 원인 (확정)

Edge Functions → register-bakery → Logs에서 확인된 오류:

```
code 42501 — Grant the required privileges to the current role with:
GRANT SELECT ON public.bakeries TO service_role;
```

- 빵집 확인 서버 함수(`register-bakery`)는 **서버 비밀 키**로 DB에 접속하고, 이때 쓰이는 DB 역할이 **`service_role`**이에요.
- 마이그레이션 0001~0006 어디에도 `service_role`이 한 번도 나오지 않아요.
  - 0002는 `anon` / `authenticated`의 권한을 **모두 거둔 뒤 필요한 것만 다시 부여**하는 방식이에요.
  - `service_role`은 “Supabase가 새 표에 자동으로 권한을 줄 것”이라고 기대하고 아무것도 주지 않았는데, **이 프로젝트에서는 그 자동 권한이 없었어요.** (왜 없는지는 제가 서버 설정을 볼 수 없어서 확정하지 못해요. 같은 코드가 4단계 때는 동작했다면, 그 뒤에 프로젝트/권한 설정이 달라졌을 수 있어요.)
- 그래서 함수가 `bakeries`를 조회하는 순간(`select id … where id = …`) 막혔고, 새 빵집의 첫 일지는 반드시 이 함수를 거치므로 **저장이 계속 실패**했어요.

### 왜 “Failed to fetch(응답 없음)”로 보였나
저장소의 최신 `index.ts`는 예상 못한 오류를 잡아서 **읽을 수 있는 500 응답**으로 돌려줘요. 그런데 화면에는 응답 자체가 없는 연결 오류로 보였다는 건, **서버에 배포된 함수가 저장소의 최신 코드와 다른(이전) 버전일 가능성이 높다**는 뜻이에요 (추정). 그래서 이번에 함수 코드를 보완했고, **재배포를 권장**해요 (아래 4-3).

## 2. 이번에 바꾼 것

| 파일 | 내용 |
|---|---|
| `supabase/migrations/0007_service_role_grants.sql` (새 파일) | `service_role`에 **필요한 최소 권한만** 부여 |
| `supabase/functions/register-bakery/index.ts` | ① 실패한 **단계**를 서버 로그(Logs)에 남김 ② DB 권한 오류(42501)를 `DB_PERMISSION`으로 구분해 응답 (내용은 숨김) |
| `src/storage/supabaseShared.js` | `DB_PERMISSION` 응답을 “마이그레이션 0007을 적용해야 해요” 안내로 표시 |
| `supabase/audit-grants.sql` (새 파일) | 실제 서버의 권한을 읽기 전용으로 점검하는 SQL |

기존 마이그레이션(0001~0006)은 **수정하지 않았어요.**

### 0007이 주는 권한 (이게 전부예요)
| 대상 | 권한 | 이유 |
|---|---|---|
| `public` 스키마 | USAGE | 표에 접근하려면 필요 (이미 있으면 그대로) |
| `bakeries` 표 | SELECT | 이미 등록된 빵집인지 조회 |
| `bakeries`의 6개 칸 `id, name, district_id, address, lat, lng` | INSERT, UPDATE | 새 빵집 등록 (`insert … on conflict (id) do update`) |

**주지 않는 것**: DELETE, TRUNCATE, `registered_at` 칸 수정, 그리고 `reviews` / `profiles` / `posts` 등 **다른 모든 표**.

### 보안은 그대로예요
- **RLS 정책은 하나도 바꾸지 않았어요** (적용 전후 정책 목록을 비교해서 같음을 확인).
- `anon` / `authenticated`의 권한도 그대로예요 → 사용자는 여전히 빵집을 **읽기만** 하고, 직접 등록할 수 없어요. 빵집 등록은 “카카오로 실제 빵집인지 확인하는 서버 함수”만 할 수 있어요.
- `service_role` 키는 서버 함수 안에서만 쓰이고 브라우저에는 나가지 않아요.

## 3. 다른 표에서도 같은 문제가 생길까? (점검 결과)

- **서버 함수가 `service_role`로 DB 표에 접근하는 곳은 `bakeries` 하나뿐이에요.** (`auth.getUser`는 인증 서버 API라 표 권한과 무관) → 같은 문제가 날 수 있는 표는 없어요.
- 사용자 쪽(`anon` / `authenticated`)은 0002 / 0004 / 0005 / 0006이 **명시적으로 GRANT**하고 있어요. 자동화 테스트(`service-role.test.mjs`)가 앱이 쓰는 **모든 표 · 뷰 · 함수 · 칸**의 필요한 권한이 빠짐없이 있는지, 그리고 사용자에게 주면 안 되는 칸(EXP, 작성자, 날짜, 빵집 등록, 설정)은 막혀 있는지 확인해요.
- **앞으로의 규칙**: 새 표/뷰/함수를 만들 때는 Supabase의 자동 권한에 기대지 말고, 필요한 권한을 마이그레이션에 **직접 GRANT**해요 (이번 문제의 교훈이에요).
- 실제 서버의 상태는 `supabase/audit-grants.sql`로 직접 확인할 수 있어요 (아래 5장).

## 4. 적용 방법 (초보자용)

### 4-1. 0007 실행 (필수)
1. Supabase 대시보드 → **SQL Editor** → **New query**
2. `lecture1/my-bakery-review/supabase/migrations/0007_service_role_grants.sql` 전체를 복사해서 붙여넣기
3. **Run** → `Success. No rows returned`가 나오면 성공 (여러 번 실행해도 안전해요)
4. 확인용으로 새 쿼리에서 아래를 실행해요. 결과가 모두 `true` / `true` / `true` / **`false`** 여야 해요.
   ```sql
   select
     has_table_privilege('service_role', 'public.bakeries', 'select') as 읽기,
     has_column_privilege('service_role', 'public.bakeries', 'name', 'insert') as 등록,
     has_column_privilege('service_role', 'public.bakeries', 'name', 'update') as 갱신,
     has_table_privilege('service_role', 'public.bakeries', 'delete') as 삭제_false여야함;
   ```

### 4-2. 앱에서 다시 저장해 보기
이미 개발 서버가 켜져 있으니 새로고침 후, **같은 일지를 다시 저장**해요. (실패했던 요청은 아무것도 저장하지 않았고, 자동 재시도도 없어서 중복 걱정은 없어요.)

기대 결과
- 일지가 저장되고 EXP 미리보기대로 지급돼요 (첫 일지라면 일지 30 + 첫 일지 퀘스트 20 = **+50 EXP**).
- 대시보드 **Table Editor → bakeries**에 방금 빵집이 한 줄 생겨요 (이름 · 지역 · 좌표는 카카오가 알려준 값).
- **reviews**에 내 일지가 생기고 `exp_review`가 `true`예요. 마이페이지 / 헤더의 EXP · 레벨 · 도감이 올라가요.
- 같은 빵집에 한 번 더 쓰려고 하면 “이미 이 빵집에 기록을 남겼어요”가 나와요 (EXP 중복 지급 없음).

### 4-3. 함수 재배포 (권장)
서버에 배포된 함수가 이전 버전일 가능성이 있고, 새 버전은 실패 단계를 로그에 남겨요.
1. 대시보드 → **Edge Functions → register-bakery → Code**(편집기)
2. `lecture1/my-bakery-review/supabase/functions/register-bakery/index.ts` 전체를 복사해서 **편집기 내용을 통째로 교체**
3. **Deploy**
4. 설정은 그대로 둬요: **Verify JWT는 켜져 있어도 꺼져 있어도 안전**해요 (이 함수는 스스로도 로그인을 검사해요). 시크릿 `KAKAO_REST_API_KEY`도 이미 있으니 그대로예요.

이후 문제가 생기면 **Logs**에 이런 줄이 남아요: `[register-bakery] 실패 단계=lookup-bakery PostgrestError code=42501: …` (단계: `auth` · `read-body` · `lookup-bakery` · `kakao` · `save-bakery`). 응답(브라우저)에는 내부 내용이 나가지 않아요.

## 5. 다른 표/함수의 권한을 서버에서 직접 점검하기 (선택, 읽기 전용)
1. SQL Editor에 `supabase/audit-grants.sql`의 쿼리를 **하나씩** 붙여넣어 실행해요 (아무것도 바꾸지 않아요).
2. 확인할 것
   - ①번 표: `anon 쓰기` 열은 전부 `false`, `service_role 삭제` 열은 전부 `false`, `service_role 쓰기`는 `bakeries`만 `true`
   - ②번: 결과 0줄 (RLS가 꺼진 표 없음)
   - ③번: 함수 6개가 `anon` / `로그인`에 실행 가능 (`service_role`은 신경 쓰지 않아도 돼요)
   - ④번: `bakeries`의 6개 칸 INSERT / UPDATE만 12줄
3. 이상한 줄이 있으면 결과를 그대로 복사해서 알려 주세요.

## 6. 자동 검증

| 시험 | 결과 |
|---|---|
| `service-role.test.mjs` (진짜 Postgres) — 적용 전 **실제 오류(42501) 재현** → 적용 후 조회 · 등록 · 같은 ID 재등록 성공, 삭제 · 다른 표 · `registered_at` 거부, RLS · 사용자 권한 불변, 빵집 등록 → 일지 → EXP 50 지급, 앱 권한 누락 점검 | 33개 통과 |
| `register-bakery.test.mjs` — 권한 오류 구분(DB_PERMISSION), 서버 로그 단계, 응답에 내부 내용 없음, 로그가 고장나도 응답 정상 | 57개 통과 |
| `review-save-errors.test.mjs` — `DB_PERMISSION` 안내 포함 | 92개 통과 |
| 기존 서버 규칙 · 보안 · 랭킹 · 글자 수 · EXP 일치 테스트 | 모두 통과 (테스트 환경에 `service_role` 역할만 추가) |
| 일부러 과한 권한(`grant all` 등)을 주도록 바꿔 보면 테스트가 실패하는 것도 확인 | ✔ |
