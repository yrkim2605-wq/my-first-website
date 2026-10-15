# 관문 C 재시험 계획 (-Run 2) — 아직 실행하지 않았어요

> 이 문서는 계획이에요. **서버 시작 · SQL 실행 · 전체 재시험은 아직 승인되지 않았어요.** 승인 전까지 아무것도 실행하지 않아요.
> 합격 기준과 기대값은 1차와 같고, 낮추거나 바꾸지 않았어요(바뀐 것: 비교 방식 — `ANALYSIS-gateC.md` 4장에서 승인된 항목만).

## 1. 1차 결과 보존 상태 (삭제 없음)
| 항목 | 위치 |
|---|---|
| 1차 결과 | `C:\bakery-secure\pg\rehearsal-files\results-run1.txt` (원본 `results.txt` 와 SHA-256 동일), 저장소 복사본 `docs/backup/rehearsal/results-run1.txt` |
| 1차 실행 화면 출력 | `C:\bakery-secure\pg\rehearsal-files\console-run1.txt` (원본 출력과 SHA-256 동일) |
| 1차 보고서 · 덤프 · 암호문 | `rehearsal-files\` 그대로 |
| 1차 임시 age 키 3개 | `C:\bakery-secure\pg\rehearsal-keys\` 그대로 (재시험은 읽기만 해서 공개키 비교에 쓰고, 바꾸지 않아요) |
| 1차 시험 DB | `bakery_rehearsal`(가짜 데이터 + 상황 A 반영), `bakery_restore_r1`, `r1b`, `r2`, `bakery_stage` 그대로 |

## 2. 재시험이 쓰는 새 자원 (1차와 섞이지 않음)
- 폴더: `C:\bakery-secure\pg\rehearsal-files-run2`, `rehearsal-keys-run2` (실행 전에 없어야 하고 있으면 중단)
- DB: `bakery_rehearsal_run2`, `bakery_restore_r1_run2`, `…_r1b_run2`, `…_r2_run2`, `…_r4_run2`, `bakery_stage_run2` (이름이 이미 있으면 중단)
- **새 임시 age 키 3개**를 `rehearsal-keys-run2` 에 새로 만들고, 1차 키와 겹치지 않는지 T04e로 확인해요(공개키만 비교, 비밀키는 출력하지 않아요).
- 스냅샷: `before-gateC_run2.txt`, `after-gateC_run2.txt`

## 3. 실행 방법 (승인 후에만)
```powershell
& ([scriptblock]::Create((Get-Content -Raw "C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review\docs\backup\rehearsal\gateC.ps1" -Encoding UTF8)))    # -Run 2 가 기본값
```
- 서버: 127.0.0.1:54329 에서만 듣는 임시 서버. 시작하고 끝에 종료를 확인해요(프로세스 · 리스닝 · pid · 서비스).
- 전체 제한 시간 9분. 1차는 중간에 중단돼서 전체 소요 시간을 알 수 없고, 새 시험이 늘었어요. 시간이 부족하면 남은 시험을 건너뛰고 "중단됨"으로 기록해요(성공으로 보고하지 않아요).
- 예상 밖 UAC · 방화벽 · 권한 요청, 서버 종료 미확인이 생기면 즉시 멈추고 보고해요.

## 4. 전체 재시험이 필요한 이유 / 부분 재실행이 어려운 이유
1. 복원 방식(`Restore-PublicDump`)이 R1, R1b, 상황 B 스테이징의 공통 기반이라 한 곳만 따로 확인하기 어려워요.
2. 상황 B(Q01~Q15, T11)와 T12는 한 번도 실행되지 않았어요.
3. 실행기가 한 번에 처음부터 끝까지 도는 구조예요(키 생성 → 백업 → 복원 → 비교).

## 5. 재시험에서 달라지는 시험 (1차 대비)
| ID | 내용 | 1차 | 재시험 예상 (예상일 뿐 합격 선언이 아니에요) |
|---|---|---|---|
| T04e | 새 키 3개가 1차 키와 겹치지 않음 (**신규**) | — | 통과해야 해요 |
| T05a0 | `SCHEMA public` 항목 1개만 제외 (정보, 정확히 1개가 아니면 중단) (**신규**) | — | 정보로 기록 |
| T05a · T08a · INFRA | 복원 오류 0개 | ❌ (public 충돌) | 통과 가능. 다른 오류는 실행해야 알아요 |
| T02b · T06b0 | 원본에서 역할별 읽기 기준값(admins는 anon · authenticated 거부) · 제약 동작 기대값 (**신규**) | — | 통과해야 해요. 실패하면 새 시험 SQL 자체를 의심해야 해요 |
| T06 · T08c | 제약 정의 **텍스트** 비교 (기준 변경 없음) | ❌ (AND 괄호) | **계속 ❌ 가능** (통과로 바꾸지 않아요) |
| T06b · T06b-r1b | 제약의 **동작** 비교: 11개 값의 허용/거부가 원본 · 기대값과 같음 (**신규**) | — | 통과하면 "표현만 다름"이 동작으로 확인돼요 |
| T07.trigger · storage · bucket · object · grant | 현재 워크플로(R1)의 백업에 포함되는가 (기준 변경 없음) | ❌ | **계속 ❌** (수정안은 R1b 계열이 검증) |
| T07.access · T07.probe | R1의 역할별 실제 접근 (**신규**) | — | ❌ 예상 (`--no-privileges`) |
| T08b | 권한 포함 덤프의 **유효 권한**이 원본과 같음 | ❌ (admins 1줄, 상세 누락) | 통과 가능 (비교 방식 승인됨). 실제 접근이 다르면 ❌ |
| T08b2 | 저장 방식(명시적/기본)만 다른 항목 (정보) (**신규**) | — | admins가 보일 수 있어요 |
| T08e · T08f | R1b의 역할별 실제 접근 · 역할별 읽기 결과 (**신규**) | — | 통과해야 해요 |
| T10k0 · T10k | 한글 조건이 실제로 행을 찾는지 · 잘못된 연결 0/0/0/0 | ❌ (빈 값) | 이유가 보이게 됨. 통과하면 가설(한글 인자)이 맞은 것 |
| T09a · T09b · T10b | 순서 충돌 재현 (관찰) | 관찰 | 같아야 정상 |
| Q01~Q15, T11a~c, T12a~d | 상황 B 격리 프로토타입 · 비밀 점검 | **미실행** | 처음 결과 |
| Q15b · T07.object | 알려진 공백 | ❌ | ❌ 유지 |

## 6. 재시험 뒤 계획 (실행 후 보고 항목)
통과/실패/관찰 · 새 실패의 원인 · 서버 종료 확인 · 시스템 변경 비교(before/after) · 비밀 · Git 노출 점검 · 산출물 보관 상태(삭제하지 않고 보고) · 정리 계획(`-Run 2 -Mode Cleanup` 목록 → 별도 승인 후 `-ConfirmDelete`).
