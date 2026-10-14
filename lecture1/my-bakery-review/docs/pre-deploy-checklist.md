# main 병합 · 배포 전 체크리스트

> **병합과 배포는 사용자가 별도로 승인하기 전까지 하지 않아요.** 이 문서는 승인 전에 빠뜨리는 게 없도록 모아 둔 목록이에요.
> 현재 브랜치 `rpg-redesign`은 main보다 앞서 있어요 (main은 Supabase 5단계 시점에서 멈춰 있고, 운영은 로컬 모드예요).

> 2026-10-14 최종 품질 점검 결과는 `docs/pre-deploy-qa-report.md`에 있어요 (정상 / 수정함 / 미검증 구분).

## 1. 서버(Supabase) — 사용자가 직접 확인 · 적용

| 항목 | 상태 | 비고 |
|---|---|---|
| 마이그레이션 0001~0005 | ✅ 적용됨 | |
| 0006 리뷰 글자 수 서버 검사 | ✅ 적용됨 | 사용자 확인 (`check-live.mjs`가 글자 수 함수 존재 확인) |
| 0007 service_role 최소 권한 (빵집 등록) | ✅ 적용됨 | 리뷰 저장 성공으로 확인 |
| **0008 사진 저장소 내 폴더 읽기 정책** | ✅ 적용됨 | 사용자 확인: pg_policies에 photos_insert_own · update_own · delete_own · select_own 4개 (2026-10-14). 실제 사진 정리 동작은 아래 4장에서 확인 |
| `register-bakery` 함수 최신 코드 재배포 | ✅ 완료 | 실패 단계 로그 + DB 권한 오류 구분 포함. Verify JWT는 켜져 있어도 꺼져 있어도 안전 |
| Edge Function 시크릿 `KAKAO_REST_API_KEY` | ✅ 있음 | |
| 이메일 인증 필수 (Confirm email) | ✅ 켜짐 | `check-connection.mjs`로 확인 |

## 2. 운영 빌드 설정 (GitHub Actions) — 지금은 **로컬 모드**

운영 빌드는 `VITE_KAKAO_JS_KEY`만 주입해서 **계정 모드(Supabase)가 꺼진 채** 배포돼요 (`.github/workflows/deploy.yml`의 my-bakery-review 단계). 계정 모드를 켜려면 아래가 모두 필요해요.

1. 빌드 단계에 환경변수 추가: `VITE_DATA_BACKEND=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (공개용 publishable 키만. 비밀 키 `sb_secret_…`는 절대 넣지 않아요)
2. Supabase → Authentication → URL Configuration의 **Redirect URLs / Site URL**에 배포 주소 `https://yrkim2605-wq.github.io/my-first-website/my-bakery-review/` 등록 (이메일 인증 링크가 돌아올 곳)
3. 카카오 개발자 콘솔의 JavaScript 키 **허용 도메인**에 배포 도메인이 등록돼 있는지 (지도)
4. 배포 직전에 되돌릴 지점 만들기: `git tag main-before-account-mode main` (문제가 생기면 이 태그로 되돌려요)

> 계정 모드를 켜지 않고 병합만 하는 것도 가능해요 (코드만 올라가고 운영 화면은 예전 로컬 모드 그대로).

## 3. 자동 점검 — 병합 직전에 모두 통과해야 해요

```
npx eslint .
npx vite build --outDir <임시 폴더>        # 배포 폴더(my-bakery-review/)를 덮어쓰지 않도록 임시 폴더로
node supabase/tests/<각 시험>.test.mjs       # 저장소 · 화면 시험 (community-*, review-*, ranking-*, local-import*, touch-targets …)
PGLITE_DIR=<pglite 폴더> node supabase/tests/<각 시험>.test.mjs   # 진짜 Postgres 시험 (rls, ranking, bakery-rating, service-role, storage-policy, community-paging, review-content, exp-parity)
node supabase/check-connection.mjs            # 서버 연결 · 설정 · 비로그인 쓰기 차단 (읽기 전용)
node supabase/check-live.mjs                  # 마이그레이션 적용 · 데이터 반영 · 랭킹 · 빵집 별점 집계 일치 (읽기 전용)
```

## 4. 브라우저에서 직접 확인 (배포 전 필수)

- [ ] **빵집 평균 별점이 리뷰에 반영되는지** — 별점을 남기거나 고친 뒤 빵집 상세 · 홈 카드 · 지도 카드에 같은 평균(소수점 첫째 자리)이 나오고, 리뷰 0개 빵집은 “아직 별점이 없어요”인지 (`docs/supabase-step9-bakery-rating.md` 4장) ← **별도 버그로 추적 중, 수정 · 확인 완료. 배포 전에 한 번 더 확인해요**
- [ ] 리뷰 저장 → EXP · 레벨 · 도감 · 랭킹 반영 (새 빵집 첫 리뷰 포함)
- [ ] 로컬 기록 가져오기 (`docs/supabase-step9-local-import.md` 4장)
- [ ] 커뮤니티: 글쓰기 · 수정 · 삭제 · 댓글 · 좋아요 · **더 보기(20개씩)** · **사진 첨부** (`docs/supabase-step9-community-photo.md` 6장)
- [ ] 이메일 가입 → 인증 메일 → 로그인 → 로그아웃
- [ ] PC · 태블릿 · 모바일 폭 (헤더, 홈, 상세, 마이페이지, 커뮤니티, 랭킹)
- [ ] 계정 2개로 서로의 글 · 일지 · 사진을 고치거나 지울 수 없는지

## 5. 알려진 한계 (배포를 막지는 않아요)

- 다른 사용자의 새 리뷰/글은 상세를 열거나 새로고침할 때 반영돼요 (실시간 푸시 아님)
- 글 목록 쪽 넘기기 중에 다른 사람이 글을 지우면 경계의 글 1개가 건너뛰어질 수 있어요 (새로고침하면 바로잡혀요)
- 랭킹은 요청할 때마다 서버가 집계해요 (수천 명 규모가 되면 캐시 검토)
- 로컬 기록 가져오기는 작성 날짜가 서버 저장 날짜로 기록돼요
