# 20-report.sql 단독 실행 검증 기록 (2026-10-15)

**범위:** 로컬 임시 서버(127.0.0.1:54329)의 가짜 데이터 DB `bakery_rehearsal_run2` 에서 `20-report.sql` **하나만** 실행했어요. 읽기 전용 보고서예요. 21·22번 SQL과 전체 재시험은 실행하지 않았고, **21·22는 아직 실행 검증되지 않았어요.** 실제 Supabase에는 접속하지 않았어요.

**계기:** 2차 재시험이 `20-report.sql` 의 `function acldefault(text, oid) does not exist` 오류로 중단됐어요(표 권한 부분의 `case … end` 가 `text` 로 평가됨). `acldefault` 호출 3곳의 첫 인자를 `"char"` 로 명시 변환해서 고쳤어요(커밋 `45e06e8`).

## 결과
| 항목 | 값 |
|---|---|
| psql 종료 코드 / 표준 오류 | 0 / 0줄 |
| 출력 | 625줄, 52,050 바이트, 구역 13개 |
| 구역별 줄 수 | 1.rows 18 · 2.account 5 · 3.constraint 40 · 4.trigger 12 · 5.policy 42 · 6.acl 65 · 6.aclsrc 41 · 7.function 17 · 8.view 18 · 9.index 18 · 10.bucket 1 · 11.schema 3 · 12.access 345 (column 256 · function 51 · table 35 · schema 3) |
| 핵심 줄 | `6.acl` 의 `admins` 표에 소유자 권한이 풀려서 나옴(1차에는 이 줄이 복원본에서 빠졌음) / `6.aclsrc` 는 `explicit` / `12.access` 에 `anon` 의 `admins` 접근 줄 없음(거부 설계와 일치) / `authenticated` 의 `reviews` 는 `DELETE,SELECT` / `reviews_rating_check` 는 1차 원본과 같은 중첩 AND 형태 |
| 1차 원본 보고서와 비교 | 구역 1·2·3·4·5·7~11 을 비교하면 다른 줄은 `1.rows` 체크섬 30줄뿐(174줄 대 174줄). 시험을 새로 돌려 데이터 생성 시각이 달라진 영향이라 예상된 차이 |
| 서버 | 정상 종료 확인(프로세스 0 · 리스닝 없음 · `postmaster.pid` 없음 · 서비스 0) |

## 보존 (Git에는 요약만, 전체 625줄은 넣지 않아요)
| 항목 | 값 |
|---|---|
| 보존 위치 | `C:\bakery-secure\pg\rehearsal-evidence\report-source-run2-standalone.txt` (OneDrive · Git 밖, 현재 사용자 전용) |
| SHA-256 | `DDFB0ECD1215202CC41D0A429BB3535142FC9A8FBAB7E3C60767A795056284C3` (원본과 사본 일치) |
| 민감 정보 점검 | 이메일(`@`) 0 · `example.invalid` 0 · `FAKE_HASH` 0 · UUID 모양 0 · 비밀키 모양 0 · 서버 비밀번호 평문 없음. `password` 단어는 `2.account\|encrypted_password(체크섬)\|<md5 32자>` 한 줄(항목 이름과 가짜 데이터 체크섬)뿐 |

## 이번 검증으로 알게 된 것 / 아직 모르는 것
- 알게 된 것: 수정된 `20-report.sql` 은 오류 없이 끝까지 실행되고, 13개 구역이 모두 출력돼요.
- 아직 모르는 것: 복원본(R1 · R1b)에서의 보고서, `21-access-probe.sql` · `22-constraint-behavior.sql` 의 실제 실행, 백업 · 암호화 · 복원, 상황 B, T12 — **모두 전체 재시험에서 처음 확인돼요.**
- 검증 스크립트 정리: 종료 확인에서 읽기 전용 자동 변수 `$pid` 와 이름이 충돌하는 문제(종료는 정상인데 한 줄이 틀리게 출력됨)를 `$pidFileExists` 로 고쳐 `report-only.ps1` 로 저장했어요. 정적 검사로 읽기 전용/자동 변수에 대입하는 코드가 `gateC.ps1` · `snapshot.ps1` · `report-only.ps1` 에 없음을 확인했어요(문제 있던 옛 버전은 검사기가 잡아내요).
