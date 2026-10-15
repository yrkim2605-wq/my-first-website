# 관문 C 시험 파일 안내

> **현재 상태 (2026-10-15):** 1차 실행(C-run)은 끝났어요 — 통과 26 · 실패 12 · 관찰 4, 상황 B에서 중단. 결과: `RESULT-gateC.md`, `results-run1.txt` / 원인 분석: `ANALYSIS-gateC.md`.
> 그 분석을 반영해 시험 코드를 **3차 개정**했고(아래 표의 ★), 개정본은 **아직 한 번도 실행하지 않았어요.** 재시험(`-Run 2`)은 `RETEST-PLAN.md` 에 있고 별도 승인 후에만 해요. 백업 · 복구는 **아직 검증 완료가 아니에요.**
> 계획: `../gate-c-plan.md` / 선행 결과: `../rehearsal-log.md` 3~4단계.
> **실행(C-run)은 사용자 승인 뒤에만 해요.** 이 파일들은 서버 시작 · SQL 실행 · 백업 생성 · 복원을 하지 않은 상태로 작성하고 정적 검사(문법)만 했어요.
> 실제 Supabase 프로젝트 · 운영 데이터에는 접속하지 않아요. 모든 데이터는 가짜(`…@example.invalid`, `FAKE_HASH_…`, 문서용 IP `203.0.113.x`)예요.

## 1. 파일 목록

| 파일 | 역할 | 서버 필요 |
|---|---|---|
| `00-auth-stub.sql` | 가짜 Supabase 기본 환경: `auth`(실제 모양에 가깝게 늘린 `users` · `identities`(생성 칸 `email` 포함) + 일부러 만든 `sessions` · `refresh_tokens` · `one_time_tokens` · `audit_log_entries`) · `storage` · 역할 3개 · `auth.uid()` | 예 |
| `10-fake-seed.sql` | 가짜 데이터: 계정 6명(운영자 1명 + 나중에 탈퇴할 `fake-withdrawn`) · 빵집 3 · 일지 7 · 글 3 · 댓글 3 · 좋아요 3(탈퇴 예정 글에 누른 좋아요 포함) · 신고 2 · 방문 2 · 사진 기록 1 · 가짜 세션/토큰/로그 | 예 |
| `20-report.sql` | DB 하나의 "내용 + 구조 + 권한" 보고서(읽기 전용). 원본과 복원본에 똑같이 돌려 줄 단위로 비교 | 예 |
| ★`21-access-probe.sql` | 역할별 **실제 읽기 동작** 시험: `set local role`로 anon · authenticated · service_role 이 되어 public 표 · 보기를 `select count(*)` 해 보고 `rows=N / denied / error:코드`를 적음(읽기 전용, 임시 함수만 사용) | 예 |
| ★`22-constraint-behavior.sql` | T06b: `reviews_rating_check` 의 진짜 정의문을 임시 표에 걸고 11개 값의 허용/거부를 확인(읽기 전용, 임시 표만 사용) | 예 |
| `30-quarantine-functions.sql` | 상황 B 격리(`quarantine`) **프로토타입** 함수 4개 + 권한 회수. 구현 승인된 기능이 아님 | 예 |
| `31-quarantine-tests.sql` | 격리 프로토타입 시험 Q01~Q12 | 예 |
| `50-reapply-outside-public.sql` | `public` 덤프에 안 들어오는 `auth.users` 트리거를 다시 만드는 수리 단계(storage는 마이그레이션 0003 · 0008 · 0010을 그대로 재적용) | 예 |
| `gateC.ps1` | 실행기. 서버 시작 → 시험 전체 → `finally`로 항상 정상 종료 → 결과 표 · 설계 수정안 출력. ★3차 개정: `-Run 1/2`(재시험은 별도 폴더 · DB · 새 임시 키), `Restore-PublicDump`(SCHEMA public 항목 정확히 1개 확인 후 제외), 결과 배열 `.Count` 수정, `PsqlScalar` 오류 이유 보존, T10k 파일 실행 | 시작/종료 포함 |
| `RESULT-gateC.md` · `ANALYSIS-gateC.md` · `RETEST-PLAN.md` · `results-run1.txt` | 1차 결과 · 원인 분석과 수정안 · 재시험 계획 · 1차 결과 원문(가짜 데이터 값만, 비밀 없음) | — |
| `.gitignore` | 덤프 · 암호문 · tar · 키 · 결과 파일이 실수로 Git에 들어가지 않게 막음 | — |

## 2. 실행 방법 (승인 후, 일반 PowerShell — 관리자 권한 아님)

```powershell
$f = 'C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review\docs\backup\rehearsal\gateC.ps1'
& ([scriptblock]::Create((Get-Content -Raw -LiteralPath $f -Encoding UTF8)))                          # 재시험 실행 (-Run 2 가 기본값: …-run2 폴더 · …_run2 DB · 새 임시 키. 서버 시작 → 시험 → 정상 종료)
& ([scriptblock]::Create((Get-Content -Raw -LiteralPath $f -Encoding UTF8))) -Mode Cleanup            # 재시험 정리 대상 목록만 보기 (삭제 안 함)
& ([scriptblock]::Create((Get-Content -Raw -LiteralPath $f -Encoding UTF8))) -Mode Cleanup -ConfirmDelete   # 재시험 DB · 파일 삭제 (별도 승인 후)
# 1차 산출물(접미사 없는 폴더 · DB)은 -Run 1 일 때만 대상이에요: … -Run 1 -Mode Cleanup  (재시험은 절대 건드리지 않아요. 1차 정리는 별도 승인)
```
- 실행기는 시작 전 점검(해시 · 비관리자 · 환경변수 · 포트 · 이전 흔적 없음 · 산출물 위치)이 하나라도 실패하면 **서버를 시작하지 않고** 멈춰요.
- 서버를 시작한 뒤에는 관문 B와 같은 검사(리스닝 `127.0.0.1:54329`만, 외부 주소 · `::1` 연결 거부, UAC · 방화벽 창 없음)를 통과해야 시험으로 넘어가요.
- 모든 psql/pg_dump/pg_restore 호출 전에 접속 대상이 `127.0.0.1:54329`인지 확인해요(`Assert-LocalOnly`). SQL 파일 어디에도 Supabase 주소 · 비밀키가 없어요.
- **10분을 넘길 수 있는 도구 환경에서는 백그라운드로 실행하고 출력 파일을 읽어요.** 도구가 중간에 강제로 끊으면 `finally`가 못 돌 수 있어서, 실행기는 전체 제한 시간(9분)을 스스로 지키고(넘으면 남은 시험을 건너뛰고 종료), 그래도 서버가 남았으면 다음에 `-Mode Cleanup`이 먼저 종료를 시도하고 확인해요.
- 끝에 **서버 종료를 다시 확인**해요(프로세스 · 포트 · `postmaster.pid`). 확인하지 못하면 결과와 상관없이 "성공"이라고 하지 않고 수동 확인 안내(`pg_ctl status` → `stop -m fast -w`)를 보여줘요. 프로세스를 임의로 강제 종료하거나 `postmaster.pid`를 지우지 않아요.

## 3. 시험 목록, 합격 기준, 사용하는 핵심 명령

표기: ✅ 합격 / ❌ 실패 / ℹ️ 관찰(합격·실패 없이 기록). **실패는 성공으로 바꾸지 않아요.**

| ID | 확인하는 것 | 합격 기준 | 핵심 명령 / 방법 |
|---|---|---|---|
| T01a·b | 가짜 환경과 마이그레이션 10개 적용 | 오류 0개 | `psql -f 00-auth-stub.sql`, `psql -f supabase/migrations/0001~0010` |
| T02 | 가짜 데이터 입력, 프로필 자동 생성 트리거 동작 | 16개 건수가 기대값과 일치(`auth.users` 6, 프로필 6, 일지 7, 글 3, 댓글 3 · 좋아요 3 …) | `psql -f 10-fake-seed.sql` |
| T03a·b·c | **워크플로와 같은 명령**의 백업 | `pg_dump` 3개 성공, `public` 목록 항목 > 20, 계정 덤프의 `TABLE DATA` = 2, 세션 · 토큰 · 감사 로그 표가 두 덤프에 **없음** | `pg_dump -Fc --no-owner --no-privileges --schema=public` / `pg_dump -Fc --no-owner --no-privileges --data-only --table=auth.users --table=auth.identities` / (변형) 권한 포함 `public` 덤프, `pg_restore --list` |
| T04a·b·c·d | 임시 age 키 3개(운영 키 아님)로 암호화·복호화 | 암호문에 평문 없음, 키1만 · 키2만으로 복호화되고 원본 tar와 해시 동일, 키3 거부, 복호화한 덤프 = 원본 덤프 | `age-keygen -o`, `age -r 키1 -r 키2 -o`, `age -d -i`, `tar` |
| T05f | 탈퇴 흉내 | 계정 · 프로필 · 일지 연쇄 삭제, 신고 기록은 남고 신고자 연결만 끊김 | `10`·`c6-after-backup.sql` |
| T05a | R1 복원 오류 | `pg_restore` 오류 0개 (계정 → public 순서). ★3차: 덤프의 `SCHEMA - public` 항목이 **정확히 1개**인지 확인하고 그 항목만 뺀 목록(`-L`)으로 복원, 아니면 중단. 기준(오류 0개)은 그대로 | `pg_restore --no-owner --no-privileges --data-only` 후 `pg_restore -l` → 필터 → `pg_restore -L` |
| T05b·c | **public 표 · 외래키 대상 · 계정 표** 보존 | 표별 행 수 + 행 체크섬이 원본과 같음 | `20-report.sql` 비교 |
| T05d | **비밀번호 해시 · `raw_user_meta_data` · 약관 동의 기록 · 생성 칸** 보존 | `encrypted_password` 체크섬, 메타데이터 체크섬, `terms_version` 분포, `terms_agreed_at` 개수, `identities.email` 체크섬 모두 일치 | 보고서 `2.account` |
| T05e | 백업에서 뺀 표가 비어 있음 | 세션 · 토큰 · 감사 로그 복원본 행 수 0 | 보고서 `1.rows` |
| T06 | **외래키** | 제약조건 정의 **텍스트** 일치 + 모두 `validated=true` (기준 변경 없음. 1차 결과 ❌는 통과로 바꾸지 않아요) | 보고서 `3.constraint` |
| ★T06b · T06b-r1b | **제약 동작** (T06의 보강, 기준 대체 아님) | `reviews_rating_check` 가 11개 값(0 · 0.4 · 0.5 · 0.7 · 1 · 1.5 · 4.5 · 4.9 · 5 · 5.5 · 9.9)의 허용/거부를 원본 · 기대값과 똑같이 함. 기대값: 0.5 · 1 · 1.5 · 4.5 · 5 허용, 나머지 거부 | `22-constraint-behavior.sql` |
| ★T06b0 · T02b | **기준값 확인** | 원본에서 위 기대값이 맞음 / 원본의 역할별 읽기 결과가 만들어지고 `admins` 는 anon · authenticated 모두 거부(0009 설계) | `22` · `21` |
| **T07.trigger** | **프로필 생성 트리거**가 백업에 포함되나 | 원본과 복원본 모두 `auth.users on_auth_user_created` 1개 | 보고서 `4.trigger` |
| **T07.storage** | **`storage.objects` 정책**이 포함되나 | 정책 수가 원본과 같음 | 보고서 `5.policy` |
| **T07.bucket** | **photos 버킷 정보**가 포함되나 | `storage.buckets`에 photos 1개 | 보고서 `10.bucket` |
| **T07.grant** | **GRANT 권한**(표 · 열 · 함수)이 포함되나 | 원본과 같음 | 보고서 `6.acl` |
| **T07.object** | **Storage 객체**(사진 파일 기록 `storage.objects`)가 포함되나 | 원본과 같음 — **사진 백업이 미구현이라 항상 ❌ 로 남는 것이 예상**(의도된 한계, 독립적으로 판정) | 보고서 `1.rows` |
| T07.photo ℹ️ | 복원본에 사진 경로가 있는 일지가 있는데 사진 파일 기록은 없음 | 관찰 기록(앱에서 깨진 이미지가 어떻게 보이는지는 별도 확인 필요) | `reviews.photo_path` 개수 |
| T07.etc | 그 밖의 public 구조 | 정책 · RLS · 함수 · 보기 · 인덱스 동일 | 보고서 `5·7·8·9` |
| ★T07.access · T07.probe | R1(`--no-privileges`)의 **역할별 실제 접근** | 원본과 같음 — **현재 워크플로의 알려진 공백이라 ❌ 예상**(기준 그대로) | 보고서 `12.access`, `21-access-probe.sql` |
| T08a·b | **설계 수정안 ①**: 권한 포함 덤프 | 복원 오류 0개, ★**유효 권한**(비어 있는 권한 칸은 PostgreSQL 기본 권한으로 풀어서)이 원본과 같음 | `pg_dump`에서 `--no-privileges` 제외 / 보고서 `6.acl` |
| ★T08b2 ℹ️ | 저장 방식(명시적/기본)만 다른 권한 | 참고 정보(판정 아님). 실제 접근이 다르면 T08b · T08e · T08f 가 ❌ | 보고서 `6.aclsrc` |
| ★T08e · T08f | R1b(수리 후)의 **역할별 실제 접근** · **역할별 읽기 결과** | 둘 다 원본과 같음. 차이가 하나라도 있으면 ❌ | 보고서 `12.access` · `21-access-probe.sql` |
| T08c·d | **설계 수정안 ②**: public 밖 객체 재적용 | 수리 후 전체 보고서가 원본과 일치(백업에 안 넣기로 한 세션 · 토큰 · 로그 · 사진 파일 기록만 다름), 트리거 정의가 0001과 동일 | `50-reapply-outside-public.sql` + 마이그레이션 0003 · 0008 · 0010 |
| T09a·b ℹ️ | **트리거 충돌 재현**: 마이그레이션을 먼저 적용한 DB에 계정 → public 복원 | 관찰 기록(프로필 자동 생성 수, 복원 오류 수) | `pg_restore --data-only` |
| T10a~k | **상황 A**: 살아 있는 계정(명부)만 가져오기 | 탈퇴자 행 0, 잃은 데이터 복구(u2 일지 2 · 글 1 · 댓글 2 · u3 좋아요 1), 회원 수 증가 없음, 원래 날짜 · EXP 칸 유지, 중복 0, 트리거 재활성, **신고(reports) 유실 · 중복 없음(전후 같음, 탈퇴자 글 신고 1 · 신고자 연결 끊긴 신고 1 유지), 탈퇴자 글에 단 댓글 · 누른 좋아요가 되살아나지 않음, 글 없는 댓글 · 좋아요(고아) 0** | 명부 CSV → 스테이징에서 `\copy` 내보내기 → 운영 DB에서 `disable trigger user` + `INSERT … ON CONFLICT DO NOTHING` |
| ★T10k0 · T10k | **잘못된 연결 복구 없음** (T10k 의 한글 조건은 UTF-8 파일로 실행) | T10k0: 백업 복원본에서 한글 조건으로 센 값 = 아이디 조건으로 센 값, 둘 다 1 이상(조건이 헛돌지 않음). T10k: 탈퇴자 글에 단 댓글 0 · 탈퇴자 글에 누른 좋아요 0 · 고아 댓글 0 · 고아 좋아요 0 → `0/0/0/0` (기대값 그대로). 실행 오류면 `ERR(code=…)` 이유가 상세에 나옴 | `t10k.sql`(UTF-8) |
| ★T04e · T05a0 | 재시험 전용: 새 임시 키가 1차 키와 겹치지 않음 / 복원 목록에서 SCHEMA public 1개만 제외한 기록 | T04e: 겹침 0개(공개키만 비교). T05a0: 정보 기록 | `age-keygen -y` / `pg_restore -l` |
| T10b ℹ️ | 트리거를 켠 채 INSERT 하면 | 관찰 기록(작성자 덮어쓰기로 실패해야 함) | 트랜잭션 롤백 |
| T11a·b·c | **상황 B** 준비: 격리 스키마 | 오류 0개, 공개 프로필 0개(자동 생성 충돌 없음) | `alter table … set schema quarantine`, `pg_dump --schema=quarantine`, 계정 → 마이그레이션 → 격리 데이터 순서 |
| Q01~Q03 | 외부 역할이 격리 표 · 함수에 접근하면 거부 | `anon`/`authenticated`/`service_role` 모두 `DENIED` | `set local role …` |
| Q04~Q06 | 확인 전에는 공개 쪽에 사용자 데이터 · 랭킹 반영 없음, 대기 사용자 상태 `pending` | 0건 / `pending` | 가짜 로그인(`request.jwt.claim.sub`) |
| Q07~Q11 | 본인 확인 시 내 행만 이동, 원래 날짜 유지, 교차 의존(남의 글에 단 댓글 · 좋아요) 처리, 탈퇴자 관련 좋아요는 공개 안 됨 | 이동 건수 일치, 아직 확인 안 한 사람 데이터는 공개 안 됨 | `confirm_restore()` |
| Q13 | **외래키 검사를 끈 채 옮기는 함수의 방어** | 일부러 "없는 빵집"을 가리키는 기록이 있으면 `ORPHAN_AFTER_RESTORE`로 거부, 거부된 사용자는 공개되지 않고 `session_replication_role`이 `origin`으로 돌아옴 | 시험 전용으로 외래키 검사를 끄고 고아 기록 삽입 |
| Q14 | **공개 쪽 고아 행 0** (확인 뒤, 정리 뒤 두 번) | 가리키는 대상이 없는 일지 · 방문 · 글 · 댓글 · 답글 · 좋아요 · 프로필 0 | 직접 검사 SQL |
| Q12 | 정리 | 확인 안 한 계정만 삭제, 확인한 계정 · 데이터 유지, 탈퇴자 행이 격리에 남지 않음 | `quarantine.purge_unconfirmed()` |
| Q15a | 정리 뒤 **탈퇴했을 수 있는 계정에 대한 신고 기록**(내용 앞부분 포함)이 격리에 남지 않음 | 남은 기록 0 | `purge_unconfirmed()`가 신고도 지움 |
| **Q15b** | **알려진 설계 공백:** 신고(reports)가 공개 쪽으로 자동 복원되지 않음 | 운영자의 열린 신고가 복원되면 ✅ — **프로토타입은 일부러 처리하지 않아 ❌ 로 남는 것이 예상**(설계 결정 필요) | 공개 `reports` 개수 |
| T12a~d | **비밀 · Git 안전** | 서버 비밀번호 평문이 산출물 · 로그 · 스냅샷에 없음, Git에 덤프 · 암호문 · tar · 키 없음(실제 비밀키 모양 문자열 0), 임시 비밀키 문자열이 산출물 · 로그 · 스냅샷 · 결과에 평문으로 없음(T12d), 생성 파일이 모두 `C:\bakery-secure\pg` 안(OneDrive 밖) | 내용 검색, `git status --porcelain` |

## 4. 생성 · 삭제되는 파일 (모두 `C:\bakery-secure\pg` 안, Git 저장소 밖)

| 위치 | 내용 | 비고 |
|---|---|---|
| `pg\rehearsal-files\` | 덤프 3개(`public.dump`, `auth-users.dump`, `public-with-privileges.dump`), `bundle.tar`, 암호문 `bakery-db-test.tar.age`, 복호화본 `out1.tar` · `out2.tar`, `from-age\` 풀린 덤프, `quarantine.dump`, `roster.csv`, `a-*.csv`·`a-*.sql`·`b-move.sql`·`c6-after-backup.sql`, `report-*.txt`, `results.txt` | **전부 가짜 데이터.** 그래도 복호화본이므로 시험 후 삭제를 권해요 |
| `pg\rehearsal-keys\` | 임시 age 키 3개 | **운영 키가 아니에요.** 시험 후 삭제 |
| `pg\snapshots\` | `before-gateC.txt`, `after-gateC.txt` | 시스템 변경 비교용, 개인정보 없음 |
| `pg\logs\pg.log` | 접속 · 종료 기록 (이어서 기록됨) | 비밀번호 평문 없음을 검사 |
| 시험 서버 안 | DB `bakery_restore_r1`, `bakery_restore_r1b`, `bakery_restore_r2`, `bakery_restore_r4`, `bakery_stage` 5개, 원본 `bakery_rehearsal`에 마이그레이션 + 가짜 데이터, 클러스터 전체에 역할 3개 | |
| **삭제(별도 승인 후):** `-Mode Cleanup -ConfirmDelete` | 위 두 폴더 삭제 + 5개 DB 삭제 + `bakery_rehearsal`을 삭제 후 빈 DB로 재생성 | 스냅샷 · 로그는 남김 |
| **수동 삭제(역할):** | 모든 시험 DB를 지운 뒤 `postgres` DB에서 `DROP ROLE anon; DROP ROLE authenticated; DROP ROLE service_role;` | 역할이 어떤 DB에서 쓰이고 있으면 실패하니, Cleanup으로 DB를 먼저 정리해요 |

## 5. 실패 · 중단 시 정리 절차

1. 시험 중 오류 · 예상 밖 징후(UAC · 방화벽 창, 리스닝 주소 이상, 외부 연결 성공 등)가 나오면 **실행기가 추가 작업 없이 `pg_ctl stop -m fast -w`로 서버를 종료**하고 `중단됨(사유)`를 결과에 적어요.
2. 종료 확인: 프로세스 0, 54329 리스닝 없음, `postmaster.pid` 없음, 시스템 스냅샷 `after-gateC.txt` ↔ `before-gateC.txt` 비교.
3. 결과 표의 ❌ 항목마다 **원인 · 상세 · 설계 수정안**이 같이 출력돼요(자동 판단이 안 되는 항목은 그렇게 표시).
4. 다시 시험하려면 먼저 `-Mode Cleanup`(목록) → 승인 후 `-ConfirmDelete`. 이전 흔적이 있으면 실행기가 시작 전에 멈춰요.
5. `-ConfirmDelete` 중 오류가 나면 서버를 종료한 상태로 두고 남은 항목을 보고해요(임의로 강제 삭제하지 않아요).

## 6. 이 시험으로는 **확인할 수 없는** 것 — 실제 Supabase 환경에서만 검증 가능 (별도 표시)

| 항목 | 왜 로컬에서는 못 보나 |
|---|---|
| 복원된 계정으로 **실제 로그인**(GoTrue가 복원된 `auth.users`/`auth.identities`를 받아들이는지, 비밀번호 해시 호환, `instance_id`) | 로컬에는 인증 서버가 없어요 |
| `banned_until` 동작, 밴 상태의 비밀번호 재설정 메일 | 인증 서버 · 메일 필요 |
| Data API(PostgREST) **노출 스키마**에 `quarantine`이 들어가지 않는지 | 대시보드 설정 |
| Supabase의 **기본 권한**(default privileges)과 2026년 변경(새 `public` 표는 자동 노출 안 됨): 복원 후 GRANT가 필요한지, `quarantine`에 권한이 자동 부여되는지 | 로컬 기본 권한은 달라요 |
| `postgres` 역할로 **`alter table … disable trigger user`**, **`set session_replication_role = replica`**(슈퍼유저 권한 필요), `auth.users` 삭제가 되는지 | 로컬 `postgres`는 슈퍼유저예요 |
| `storage.objects` 정책을 재적용할 **권한**(소유자가 다름), 실제 Storage 동작 | 로컬은 단순 스텁 |
| Edge Function(`register-bakery` 프로필 없음 거부, `delete-account` 대기 계정 탈퇴) | 함수 변경 · 배포 필요 |
| 서버 버전(17.11), 로케일(`C` ↔ Supabase 기본), 확장, 새 프로젝트 이전 때의 역할 · 소유자 차이 | 환경 차이 |

> **로컬 시험이 모두 통과해도 "계정까지 완전히 복구된다"고 쓰지 않아요.** 이 시험은 "덤프에 무엇이 들어 있고, 어떤 순서로 복원하면 데이터가 맞게 들어가는가"와 "격리 설계가 PostgreSQL 안에서 성립하는가"에 한정돼요.

## 7. C-prep 중 코드를 읽다가 알게 된 위험 (실행 전 가설 — 시험으로 확인해요)

1. `pg_dump --schema=public`은 `auth.users`에 걸린 **프로필 자동 생성 트리거**와 `storage.objects` **정책 · 버킷 행**을 담지 않을 가능성이 높아요 (T07).
2. 워크플로의 `--no-privileges`로 **GRANT가 사라지고**, 이 앱은 `0002`/`0007`/`0009`처럼 **열 단위 GRANT + RLS**로 동작해서 권한이 없으면 복원본이 동작하지 않아요 (T07.grant, T08).
3. 삽입 트리거(`0001`, `0009`)가 `user_id`를 `auth.uid()`로 덮어쓰고 `created_at` · EXP 칸을 다시 계산해서, 백업 행을 그냥 `INSERT`하면 **실패하거나 날짜 · EXP가 바뀌어요.** 상황 A 절차는 `disable trigger user`(표 소유자 권한)를 쓰는 것으로 시험해요 (T10b·c·g) ❓ 진짜 Supabase 권한.
4. 격리 방식은 **교차 의존**이 있어요: 남의 글에 단 댓글 · 좋아요는 글쓴이와 댓글 쓴 사람이 모두 확인해야 공개돼요. 확인 때 격리 쪽 글을 지우면 연쇄 삭제로 대기 중인 댓글이 사라지므로 **복사만 하고 마지막 정리에서 한꺼번에** 지워요 (Q10·Q11).
5. `confirm_restore`가 원래 날짜 · EXP를 유지하려면 `session_replication_role = replica`(슈퍼유저)가 필요해요 ❓ 진짜 Supabase. 안 되면 다른 방법(트리거에 "복원 중" 표시 등)이 필요해요.
6. `reports`는 탈퇴 후에도 `target_user_id`와 `target_snapshot`(신고된 내용 앞 200자)를 남겨요(`0009`). 방침의 "신고 기록 보관"과는 맞지만, 상황 B에서 이 기록의 처리(격리할지)를 설계에서 정해야 해요.

## 8. C-run 전 정적 안전성 검토 결과 (2026-10-15, 서버 · SQL 실행 없이 코드 · 문서만 읽고 고침)

| # | 검토 항목 | 검토 전 발견한 문제 | 고친 내용 |
|---|---|---|---|
| 1 | 접속이 항상 `127.0.0.1:54329`인가, 환경변수 · 설정으로 운영 Supabase로 바뀔 수 있나 | 환경변수는 `PGHOST`/`PGPORT`만 확인 → `PGHOSTADDR`(실제 접속 IP를 바꿈) · `PGSERVICE` · `PGSERVICEFILE` · `PGPASSFILE` · `PGOPTIONS` · `DATABASE_URL` 등은 못 막음. `-d`에 접속 문자열을 넣을 수 있음 | 시작 전 `PG*` 환경변수 0개 확인 + 실행 직전 **접속 관련 환경변수를 모두 지우고** 필요한 것만 설정, 호출마다 **허용 목록 밖의 `PG*`/`DATABASE_URL`/`SUPABASE*`가 있으면 중단**, 모든 호출에 `-h 127.0.0.1 -p 54329 -U postgres`를 명령줄에도 고정, `-d`는 영문 소문자 이름만 허용(접속 문자열 · `postgres://` 거부). **SQL 정적 금지 표현 검사**를 서버 시작 전에 수행: `\connect` · `\!` · `copy … program` · `dblink` · `postgres_fdw` · `create server/extension` · `supabase.co` · `http(s)://` · `postgres://` (런타임에 만드는 SQL도 쓰기 전에 검사) |
| 2 | 어떤 오류에도 서버 종료가 보장되나 | `finally`가 종료 도구 예외에 약함. 외부 프로그램에 **제한 시간이 없어** 멈추면 도구 제한 시간에 걸려 `finally`에 못 갈 수 있음 | 모든 외부 프로그램(`psql`/`pg_dump`/`pg_restore`/`age`/`tar`)을 **제한 시간 + 강제 종료**가 있는 래퍼로 실행, **전체 마감 9분**(넘으면 남은 시험 건너뛰고 종료 단계로), `finally` 각 단계를 예외로부터 보호 |
| 3 | 오류가 났는데 성공으로 표시되거나 무조건 다음 단계로 넘어가지 않나 | 스텁 적용 · 명부 생성 · 스테이징 복원 · 암호화 · 내보내기 실패를 무시하고 진행하는 곳이 있었음. 보고서가 **비면 "차이 없음 = 통과"** 로 처리됨. 격리 시험 결과 줄이 일부 빠져도 알 수 없음 | **인프라 오류(`Fail-Infra`)는 기록하고 즉시 중단**(서버 시작/스텁/마이그레이션/데이터 입력/덤프/암호화·복호화/명부/복원 준비 등). 비교 대상이 비면 **실패**로 처리. 격리 시험은 **결과 줄 수(55)가 다르면 실패**. NULL 결과는 거짓으로 처리 |
| 4 | `session_replication_role = replica` 의 범위 · 원상복구 · 외래키 검증 | 외래키 자동 검사를 끈 채 복사하는데 **검증이 없었음**(없는 빵집을 가리켜도 통과). `flush_dependents`를 단독으로 부르면 트리거가 켜진 채라 위험 | 사용 위치는 `confirm_restore()` 한 곳(SECURITY DEFINER, `SET LOCAL`이라 트랜잭션 안에서만). **복사 뒤 직접 외래키 검증**(일지 · 방문 → 빵집, 글 · 댓글 · 답글 · 좋아요 → 대상) → 하나라도 고아면 `ORPHAN_AFTER_RESTORE` 예외로 **전부 롤백**(설정도 같이 되돌아감). 정상 경로는 끝에서 `origin`으로 복귀. `flush_dependents`는 `replica`가 아니면 거부. 시험 Q13(고아 기록이 있으면 거부) · Q14(확인 뒤 · 정리 뒤 고아 0) 추가 |
| 5 | 임시 비밀키 · 복호화 파일이 Git · OneDrive · 일반 로그에 노출되나 | 키 폴더 · 산출물 폴더의 접근 권한을 시험 전에 확인하지 않음. 임시 키 문자열 노출을 검사하지 않음 | 실행 전 `secrets` · 데이터 · `pg` 폴더와 새로 만든 산출물 · 키 폴더가 **현재 사용자 전용**인지 확인(아니면 중단). 키 내용은 화면에 출력하지 않음. 종료 뒤 **임시 비밀키 모양 문자열**이 산출물 · 로그 · 스냅샷 · 결과에 있는지 검사(T12d), Git · 문서 검사(T12b), 생성 파일이 `C:\bakery-secure\pg` 안 · OneDrive 밖인지 검사(T12c). `.gitignore`로 한 번 더 방어. **한계:** 삭제는 일반 삭제라 SSD에서 완전 삭제를 보장하지 않음(전부 가짜 데이터 · 임시 키) |
| 6 | 탈퇴자 복구 방지 시험이 댓글 · 신고 · 좋아요 등 연결 데이터의 유실 · 잘못된 복구를 확인하나 | 신고 유실 · 중복, 탈퇴자 글에 **다른 사람이 누른 좋아요**의 잘못된 복구를 확인하지 않았음. 상황 B에서 정리 뒤 **탈퇴자 대상 신고의 내용 일부(`target_snapshot`)가 격리에 남음** | 가짜 데이터에 탈퇴자 글에 누른 좋아요 추가. 상황 A: 제외 건수를 정확히 확인(일지 1 · 글 1 · 댓글 1 · 좋아요 2), 신고 전후 같음(T10j), 잘못된 연결 0(T10k). 상황 B: 정리 함수가 탈퇴 가능 계정 대상 신고도 지우도록 수정(Q15a), 좋아요 이동 확인(Q11), **신고가 공개 쪽으로 복원되지 않는 공백은 Q15b로 ❌ 표시**(설계 결정 필요) |
| 7 | auth 트리거 · Storage 객체 · GRANT를 각각 독립적으로 실패 판정하나 | Storage는 정책 · 버킷만 있었고 **객체 기록(`storage.objects`)** 자체는 판정이 없었음 | **T07.trigger · T07.storage · T07.bucket · T07.object · T07.grant** 를 각각 따로 판정(하나가 통과해도 다른 것을 가리지 않음). 사진 객체는 **항상 ❌** 로 남도록 의도 표기. 사진 경로가 있는 일지의 깨진 이미지 가능성은 T07.photo(관찰) |
| 8 | 서버 종료 실패를 성공으로 보고하지 않고 수동 확인을 안내하나 | 종료 명령이 실패해도 요약에 드러나지 않았음 | 종료 뒤 **프로세스 · 포트 · `postmaster.pid`를 다시 확인**, 하나라도 남으면 `🛑 서버 종료 미확인`으로 결과에 표시하고 **어떤 시험 결과여도 성공으로 보고하지 않으며** 수동 확인 명령(`pg_ctl status`/`stop -m fast -w`)을 안내. 프로세스 강제 종료 · `postmaster.pid` 삭제는 사용자 확인 전에는 하지 않음 |

**그 밖에 정적 검사로 잡은 버그:** (a) 한글이 변수 바로 뒤에 붙은 문자열(`$srcTrig개`)이 다른 변수로 읽혀 숫자가 비는 곳 9개 → `${var}`로 수정, (b) `"$db:"`가 드라이브 표기로 읽히는 오류 → 수정, (c) 금지 표현 검사가 SQL **주석**의 단어 `Supabase`에도 걸려 항상 중단되던 문제 → 주소 형태만 검사하도록 수정, (d) 불필요하게 키 파일을 읽는 코드 삭제.

**아직 검증하지 못한 것(정적 검토의 한계):** 실제 SQL 문법과 동작, `psql`/`pg_dump`/`pg_restore` 인자 처리, 래퍼의 출력 인코딩, 시험 기대값(예: 제외 건수, 복구 건수)이 실제로 맞는지는 **실행해 봐야** 알 수 있어요. 실행 중 불일치가 나오면 ❌ 로 기록하고 원인을 보고해요(기대값을 맞추려고 시험을 고치지 않아요).
