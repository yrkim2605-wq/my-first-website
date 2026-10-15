# 관문 C 시험 파일 안내 (C-prep 산출물 — 작성만 했고 아직 한 번도 실행하지 않았어요)

> 계획: `../gate-c-plan.md` / 선행 결과: `../rehearsal-log.md` 3~4단계.
> **실행(C-run)은 사용자 승인 뒤에만 해요.** 이 파일들은 서버 시작 · SQL 실행 · 백업 생성 · 복원을 하지 않은 상태로 작성하고 정적 검사(문법)만 했어요.
> 실제 Supabase 프로젝트 · 운영 데이터에는 접속하지 않아요. 모든 데이터는 가짜(`…@example.invalid`, `FAKE_HASH_…`, 문서용 IP `203.0.113.x`)예요.

## 1. 파일 목록

| 파일 | 역할 | 서버 필요 |
|---|---|---|
| `00-auth-stub.sql` | 가짜 Supabase 기본 환경: `auth`(실제 모양에 가깝게 늘린 `users` · `identities`(생성 칸 `email` 포함) + 일부러 만든 `sessions` · `refresh_tokens` · `one_time_tokens` · `audit_log_entries`) · `storage` · 역할 3개 · `auth.uid()` | 예 |
| `10-fake-seed.sql` | 가짜 데이터: 계정 6명(운영자 1명 + 나중에 탈퇴할 `fake-withdrawn`) · 빵집 3 · 일지 7 · 글 3 · 댓글 3 · 좋아요 2 · 신고 2 · 방문 2 · 사진 기록 1 · 가짜 세션/토큰/로그 | 예 |
| `20-report.sql` | DB 하나의 "내용 + 구조 + 권한" 보고서(읽기 전용). 원본과 복원본에 똑같이 돌려 줄 단위로 비교 | 예 |
| `30-quarantine-functions.sql` | 상황 B 격리(`quarantine`) **프로토타입** 함수 4개 + 권한 회수. 구현 승인된 기능이 아님 | 예 |
| `31-quarantine-tests.sql` | 격리 프로토타입 시험 Q01~Q12 | 예 |
| `50-reapply-outside-public.sql` | `public` 덤프에 안 들어오는 `auth.users` 트리거를 다시 만드는 수리 단계(storage는 마이그레이션 0003 · 0008 · 0010을 그대로 재적용) | 예 |
| `gateC.ps1` | 실행기. 서버 시작 → 시험 전체 → `finally`로 항상 정상 종료 → 결과 표 · 설계 수정안 출력 | 시작/종료 포함 |
| `.gitignore` | 덤프 · 암호문 · tar · 키 · 결과 파일이 실수로 Git에 들어가지 않게 막음 | — |

## 2. 실행 방법 (승인 후, 일반 PowerShell — 관리자 권한 아님)

```powershell
$f = 'C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review\docs\backup\rehearsal\gateC.ps1'
& ([scriptblock]::Create((Get-Content -Raw -LiteralPath $f -Encoding UTF8)))                          # 시험 실행 (서버 시작 → 시험 → 정상 종료)
& ([scriptblock]::Create((Get-Content -Raw -LiteralPath $f -Encoding UTF8))) -Mode Cleanup            # 정리 대상 목록만 보기 (삭제 안 함)
& ([scriptblock]::Create((Get-Content -Raw -LiteralPath $f -Encoding UTF8))) -Mode Cleanup -ConfirmDelete   # 시험 DB · 파일 삭제 (별도 승인 후)
```
- 실행기는 시작 전 점검(해시 · 비관리자 · 환경변수 · 포트 · 이전 흔적 없음 · 산출물 위치)이 하나라도 실패하면 **서버를 시작하지 않고** 멈춰요.
- 서버를 시작한 뒤에는 관문 B와 같은 검사(리스닝 `127.0.0.1:54329`만, 외부 주소 · `::1` 연결 거부, UAC · 방화벽 창 없음)를 통과해야 시험으로 넘어가요.
- 모든 psql/pg_dump/pg_restore 호출 전에 접속 대상이 `127.0.0.1:54329`인지 확인해요(`Assert-LocalOnly`). SQL 파일 어디에도 Supabase 주소 · 비밀키가 없어요.

## 3. 시험 목록, 합격 기준, 사용하는 핵심 명령

표기: ✅ 합격 / ❌ 실패 / ℹ️ 관찰(합격·실패 없이 기록). **실패는 성공으로 바꾸지 않아요.**

| ID | 확인하는 것 | 합격 기준 | 핵심 명령 / 방법 |
|---|---|---|---|
| T01a·b | 가짜 환경과 마이그레이션 10개 적용 | 오류 0개 | `psql -f 00-auth-stub.sql`, `psql -f supabase/migrations/0001~0010` |
| T02 | 가짜 데이터 입력, 프로필 자동 생성 트리거 동작 | 16개 건수가 기대값과 일치(`auth.users` 6, 프로필 6, 일지 7, 글 3, 댓글 3 …) | `psql -f 10-fake-seed.sql` |
| T03a·b·c | **워크플로와 같은 명령**의 백업 | `pg_dump` 3개 성공, `public` 목록 항목 > 20, 계정 덤프의 `TABLE DATA` = 2, 세션 · 토큰 · 감사 로그 표가 두 덤프에 **없음** | `pg_dump -Fc --no-owner --no-privileges --schema=public` / `pg_dump -Fc --no-owner --no-privileges --data-only --table=auth.users --table=auth.identities` / (변형) 권한 포함 `public` 덤프, `pg_restore --list` |
| T04a·b·c·d | 임시 age 키 3개(운영 키 아님)로 암호화·복호화 | 암호문에 평문 없음, 키1만 · 키2만으로 복호화되고 원본 tar와 해시 동일, 키3 거부, 복호화한 덤프 = 원본 덤프 | `age-keygen -o`, `age -r 키1 -r 키2 -o`, `age -d -i`, `tar` |
| T05f | 탈퇴 흉내 | 계정 · 프로필 · 일지 연쇄 삭제, 신고 기록은 남고 신고자 연결만 끊김 | `10`·`c6-after-backup.sql` |
| T05a | R1 복원 오류 | `pg_restore` 오류 0개 (계정 → public 순서) | `pg_restore --no-owner --no-privileges --data-only` 후 전체 복원 |
| T05b·c | **public 표 · 외래키 대상 · 계정 표** 보존 | 표별 행 수 + 행 체크섬이 원본과 같음 | `20-report.sql` 비교 |
| T05d | **비밀번호 해시 · `raw_user_meta_data` · 약관 동의 기록 · 생성 칸** 보존 | `encrypted_password` 체크섬, 메타데이터 체크섬, `terms_version` 분포, `terms_agreed_at` 개수, `identities.email` 체크섬 모두 일치 | 보고서 `2.account` |
| T05e | 백업에서 뺀 표가 비어 있음 | 세션 · 토큰 · 감사 로그 복원본 행 수 0 | 보고서 `1.rows` |
| T06 | **외래키** | 제약조건 정의 일치 + 모두 `validated=true` | 보고서 `3.constraint` |
| **T07.trigger** | **프로필 생성 트리거**가 백업에 포함되나 | 원본과 복원본 모두 `auth.users on_auth_user_created` 1개 | 보고서 `4.trigger` |
| **T07.storage** | **`storage.objects` 정책**이 포함되나 | 정책 수가 원본과 같음 | 보고서 `5.policy` |
| **T07.bucket** | **photos 버킷 정보**가 포함되나 | `storage.buckets`에 photos 1개 | 보고서 `10.bucket` |
| **T07.grant** | **GRANT 권한**(표 · 열 · 함수)이 포함되나 | 원본과 같음 | 보고서 `6.acl` |
| T07.etc | 그 밖의 public 구조 | 정책 · RLS · 함수 · 보기 · 인덱스 동일 | 보고서 `5·7·8·9` |
| T08a·b | **설계 수정안 ①**: 권한 포함 덤프 | 복원 오류 0개, GRANT가 원본과 같음 | `pg_dump`에서 `--no-privileges` 제외 |
| T08c·d | **설계 수정안 ②**: public 밖 객체 재적용 | 수리 후 전체 보고서가 원본과 일치(백업에 안 넣기로 한 세션 · 토큰 · 로그 · 사진 파일 기록만 다름), 트리거 정의가 0001과 동일 | `50-reapply-outside-public.sql` + 마이그레이션 0003 · 0008 · 0010 |
| T09a·b ℹ️ | **트리거 충돌 재현**: 마이그레이션을 먼저 적용한 DB에 계정 → public 복원 | 관찰 기록(프로필 자동 생성 수, 복원 오류 수) | `pg_restore --data-only` |
| T10a~i | **상황 A**: 살아 있는 계정(명부)만 가져오기 | 탈퇴자 행 0, 잃은 데이터 복구(u2 일지 2 · 글 1 · 댓글 2 · u3 좋아요 1), 회원 수 증가 없음, 원래 날짜 · EXP 칸 유지, 중복 0, 트리거 재활성 | 명부 CSV → 스테이징에서 `\copy` 내보내기 → 운영 DB에서 `disable trigger user` + `INSERT … ON CONFLICT DO NOTHING` |
| T10b ℹ️ | 트리거를 켠 채 INSERT 하면 | 관찰 기록(작성자 덮어쓰기로 실패해야 함) | 트랜잭션 롤백 |
| T11a·b·c | **상황 B** 준비: 격리 스키마 | 오류 0개, 공개 프로필 0개(자동 생성 충돌 없음) | `alter table … set schema quarantine`, `pg_dump --schema=quarantine`, 계정 → 마이그레이션 → 격리 데이터 순서 |
| Q01~Q03 | 외부 역할이 격리 표 · 함수에 접근하면 거부 | `anon`/`authenticated`/`service_role` 모두 `DENIED` | `set local role …` |
| Q04~Q06 | 확인 전에는 공개 쪽에 사용자 데이터 · 랭킹 반영 없음, 대기 사용자 상태 `pending` | 0건 / `pending` | 가짜 로그인(`request.jwt.claim.sub`) |
| Q07~Q11 | 본인 확인 시 내 행만 이동, 원래 날짜 유지, 교차 의존(남의 글에 단 댓글) 처리 | 이동 건수 일치, 아직 확인 안 한 사람 데이터는 공개 안 됨 | `confirm_restore()` |
| Q12 | 정리 | 확인 안 한 계정만 삭제, 확인한 계정 · 데이터 유지, 탈퇴자 행이 격리에 남지 않음 | `quarantine.purge_unconfirmed()` |
| T12a·b·c | **비밀 · Git 안전** | 서버 비밀번호 평문이 산출물 · 로그 · 스냅샷에 없음, Git에 덤프 · 암호문 · tar · 키 없음(실제 비밀키 모양 문자열 0), 생성 파일이 모두 `C:\bakery-secure\pg` 안 | 내용 검색, `git status --porcelain` |

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
