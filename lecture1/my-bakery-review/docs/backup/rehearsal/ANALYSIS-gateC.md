# 관문 C 첫 실행 — 실패 원인 분석과 수정안

작성일: 2026-10-15. 이 문서는 **분석과 수정안만** 담아요.
서버 시작 · SQL 실행 · DB 변경 · 임시 파일 삭제 · 운영 Supabase 접속 · main 병합 · push · 배포는 하지 않았고,
`gateC.ps1` · `20-report.sql` 등 시험 코드도 **아직 수정하지 않았어요**(수정안은 4장에 코드로만 적어요).

> **백업 · 복구 시스템은 아직 검증 완료 상태가 아니에요.** 상황 B(Q01~Q15, T11)와 비밀 점검(T12)은 한 번도 실행되지 않았고,
> 실패 12개 중 일부는 원인이 확정되지 않았어요. 합격 기준과 기대값은 바꾸지 않았어요.

> **후속 (2026-10-15, 사용자 승인 후):** 이 분석의 수정안(4장)을 코드·문서에 반영했어요 — 4-1 · 4-2 전체, 4-3(a) 권한 비교 확장, 4-3(b) **안 1**(텍스트 비교 T06 · T08c는 그대로 두고 동작 시험 T06b 추가). 아래 본문은 *분석 당시* 기록이라 그대로 두었어요("코드를 수정하지 않았어요"라는 문장은 그 시점의 사실). 변경 내용은 `RETEST-PLAN.md` 5장, `README.md`(★ 표시), `../restore-procedure.md`, `../workflow-change-review.md` 에 있어요. **개정본은 아직 실행하지 않았고, 서버 시작 · SQL 실행 · 재시험은 승인되지 않았어요.**

## 0. 분석에 쓴 자료 (읽기만 함)
`results.txt`, `report-source.txt` · `report-r1.txt` · `report-r1b-before-repair.txt` · `report-r1b-after-repair.txt`,
덤프 파일 3개의 문자열(파일을 읽기만 함, pg_restore 실행 안 함), 첫 실행 출력, `gateC.ps1` · `20-report.sql` · 마이그레이션 0001 · 0009 소스.
추가로 PowerShell 문법 동작 1건을 DB와 무관한 한 줄 코드로 확인했어요(아래 T08b).

## 1. 항목별 판정

범례: **확정** = 파일에서 직접 확인됨 / **가설** = 정황은 있으나 직접 확인 못 함

### 1-1. T06 · T08c — 제약 정의 텍스트 차이 → **표현만 다름 (확정)**, 단 "스키마가 같다"는 증명은 별도 필요
- 원본: `CHECK ((((rating >= 0.5) AND (rating <= (5)::numeric)) AND ((rating * (2)::numeric) = floor(...))))` ← `AND`가 2겹
- 복원본(r1 · r1b 둘 다): `CHECK (((rating >= 0.5) AND (rating <= (5)::numeric) AND ((rating * (2)::numeric) = floor(...))))` ← `AND`가 1겹
- 두 식은 `(A AND B) AND C` 와 `A AND B AND C` 라서 **논리적으로 같아요**(AND는 결합법칙). `validated=true`도 양쪽 같아요.
- 이유(확정): 마이그레이션 0001 123행은 `rating between 0.5 and 5 and (rating*2) = floor(rating*2)`. `BETWEEN`은 분석 단계에서 `(A AND B)`로 풀려서 `AND`가 2겹이 되고,
  pg_dump가 그 문장을 괄호째로 내보내서 다시 읽으면 `AND`가 1겹으로 합쳐져요. 해당 제약은 이 1건뿐이에요(T06 · T08c 모두 같은 1줄).
- **한계(가설)**: 논리 동일은 식을 보고 판단한 것이지, 복원본에 값을 넣어 보고 확인한 것은 아니에요. 아래 4-3의 동작 확인을 추가하면 확정돼요.
- 결론: **실제 스키마 불일치는 아님.** 다만 시험의 "텍스트 완전 일치" 기준은 이 1줄 때문에 앞으로도 계속 실패해요 → 기준을 바꿀지는 **사용자 결정 필요**(4-3).

### 1-2. T08b — GRANT 불일치 → **덤프 누락 아님, 표현만 다름 (확정)**, 역할 · 복원 순서 문제 아님
- 원본과 복원본(r1b, 권한 포함 덤프)의 6.acl 구역은 **정확히 1줄**만 달라요: `table public.admins` (원본에만 있음). 나머지 63줄은 모두 같아요.
- 권한 포함 덤프에는 `GRANT` 76개 · `REVOKE` 14개가 들어 있고, `reviews` 등의 표 권한도 정상이에요. `public.admins`에 대한 GRANT/REVOKE는 0개예요.
- 이유(확정): 마이그레이션 0009 26행 `revoke all on public.admins from anon, authenticated;` 가 실행되면 원본 표의 권한 칸이 "소유자(postgres)만" 이라는 **명시적 값**으로 저장돼요.
  이 값은 PostgreSQL 기본값(권한 칸이 비어 있음 = 소유자만)과 의미가 같아서 pg_dump가 아무것도 내보내지 않고, 복원본은 비어 있는 상태가 돼요.
  보고서(`20-report.sql` 77~81행)는 `relacl is not null`인 표만 보여서 **비어 있는 쪽은 아예 줄이 없어요.**
- 실제 효과: anon · authenticated는 양쪽 모두 접근 불가, 소유자만 접근 가능 → **권한 차이 없음.**
- 역할이 없어서 GRANT가 안 들어간 것도 아니에요(r1b에 역할 3개가 있었고 나머지 권한은 복원됨). 복원 순서 영향도 확인되지 않았어요.
- **T08b의 상세 메시지가 비어 있던 이유(확정)**: 차이가 정확히 1줄이면 `Diff-Lines`의 결과가 배열이 아닌 객체 1개로 풀려서 `.Count`가 비어 버려요
  (PowerShell 5.1에서 직접 확인: 1개 → `Count=[]`, `PSCustomObject` / 2개 → `Count=[2]`, `Object[]`). 그 결과 `-eq 0`은 거짓이라 **실패로 판정(안전한 방향)**되지만 상세는 안 찍혀요. 시험 코드 결함이에요.
- **T07.grant(73줄)와의 관계**: 이쪽은 `--no-privileges` 때문에 GRANT가 통째로 빠진 것이 맞아요(확정). T08b가 검증한 "권한 포함 덤프"는 한 줄(위 admins)을 뺀 나머지가 모두 같으므로, 수정안 방향(권한 포함)은 유효해 보여요.

### 1-3. T10k — 결과가 빈 값 → **시험 코드 결함이 원인일 가능성이 높음(가설)**, 데이터 문제 여부는 **미확인**
- 확정된 사실: 결과 칸이 빈 값이라는 것은 `PsqlScalar`가 `$null`을 돌려줬다는 뜻이고, 그건 `psql`이 **0이 아닌 종료 코드**로 끝났을 때만 나와요
  (`count(*)`는 NULL이 안 되므로 연결 결과가 빈 값일 수 없어요). 오류 메시지는 `PsqlScalar`가 버려서 남아 있지 않아요.
- 정황: T10k 쿼리는 이 스크립트에서 **한글 문자열을 명령줄 인자(`-c`)로 넘기는 유일한 호출**이에요. 구조가 같은 다른 쿼리(T10e · T10f · T10j 등)는 한글이 없고 모두 정상 동작했어요.
  한글 시드 파일은 `-f`(UTF-8 파일)로 넣어서 문제가 없었어요 → 인자 인코딩 문제로 의심하지만 **오류 메시지가 없어 확정하지 못했어요.**
- 데이터 쪽: T10d(탈퇴자 소유 행 0)와 T10a(제외 목록: 댓글 1 · 좋아요 2)는 통과했어요. 하지만 T10d는 `user_id = 탈퇴자` 조건이라
  **"탈퇴자 글에 다른 사람이 단 댓글 · 누른 좋아요"는 T10d가 확인하지 않아요.** 그래서 T10k가 대신 검증해야 했고, 지금은 **검증되지 않은 상태**예요(통과로 간주하지 않아요).
- 고아 행(글 없는 댓글 · 좋아요)은 외래키가 막아야 하고 T06이 외래키 복원을 확인했지만(T06 실패는 위 AND 1줄뿐), 이것도 T10k의 직접 확인은 아니에요.

### 1-4. 상황 B 스테이징 복원 오류(INFRA, T05a, T08a) → **원인 확정**
- 정확한 메시지: `pg_restore: error: could not execute query: ERROR:  schema "public" already exists` 와 `pg_restore: warning: errors ignored on restore: 1`.
  (T05a · T08a의 "오류 2개"는 **오류 1개 + 요약 경고 1줄**이에요. 데이터 오류가 2개라는 뜻이 아니에요.)
- 원인(확정): `public.dump` · `public-with-privileges.dump` 둘 다 `CREATE SCHEMA public;` 와 `COMMENT ON SCHEMA public IS 'standard public schema';` 를 포함해요(덤프 파일에서 직접 확인).
  새 DB에는 이미 기본 `public` 스키마가 있어서 이 한 줄만 실패해요. `auth-users.dump`에는 스키마 문장이 없어요.
- 발생 지점: 공개 데이터 복원 호출 4곳 모두 — R1(`gateC.ps1` 364행, T05a), R1b(402행, T08a), R4 스테이징(525행, 시험 중단). R2는 `--data-only`라 해당 없음.
- 영향: 이 오류는 **무시되고 나머지는 계속 복원돼요.** 실제로 T05b(모든 표 행 체크섬 일치) · T05c · T05d · T07.etc가 통과했어요. 그러나 시험 규칙(복원 오류 0개)과 `INFRA` 중단 규칙 때문에 실패 처리됐고, 상황 B 시험이 시작되지 못했어요.
- 이건 시험 도구 문제가 아니라 **복구 절차의 결함**이에요: 실제 Supabase 새 프로젝트에도 `public`이 이미 있으므로 같은 오류가 나요.

## 2. 확정 / 가설 / 미확인 정리

| 구분 | 항목 |
|---|---|
| **확정(문제 맞음)** | ① 복구 절차: 덤프의 `CREATE SCHEMA public` 충돌(T05a · T08a · INFRA) ② `--no-privileges`로 GRANT 소실(T07.grant) ③ auth 트리거 · storage 정책 · photos 버킷은 백업에 없음(T07.trigger · storage · bucket) ④ 사진 객체 미백업(T07.object, 의도된 한계) ⑤ 마이그레이션을 먼저 적용하면 프로필 자동 생성 + 데이터 복원 충돌(T09a · T09b · T10b) |
| **확정(문제 아님, 표현 차이)** | ⑥ T06 · T08c의 AND 괄호 차이 ⑦ T08b의 `admins` 표 권한(NULL 대 소유자 명시) |
| **확정(시험 코드 결함)** | ⑧ 차이가 1줄일 때 `.Count`가 비어 상세가 빠지고 판정 로직이 흔들림(`Diff-Lines`/`Sample` 사용처 전체) ⑨ `PsqlScalar`가 `psql` 오류 메시지를 버림 ⑩ 20-report.sql이 권한 칸이 비어 있는 표를 건너뜀(비교의 사각지대) |
| **가설** | ⑪ T10k 실패 원인 = 한글 명령줄 인자(정황만, 오류 메시지 없음) ⑫ T06 논리 동일(식 비교로 판단, 값 시험은 아직) |
| **미확인** | ⑬ T10k 본래 질문(탈퇴자 글의 댓글 · 좋아요 미복구) — 실제 데이터는 확인 못 함 ⑭ 상황 B 전체(Q01~Q15, T11a~c) ⑮ T12 비밀 · Git 점검(첫 실행 안에서) — 단, 같은 항목을 직접 점검한 결과는 이상 없음 ⑯ 사진 · 신고(탈퇴 회원) 설계 공백 · 운영 DB 전체 손실 시 탈퇴 계정 재생성 위험 |

## 3. 백업 · 복원 설계 수정안 (우선순위순, 합격 기준은 그대로)

1. **[필수] 공개 데이터 복원 시 `SCHEMA public` 항목만 제외** — 새 DB의 기존 `public`을 지우지 않고 충돌만 피해요.
   `pg_restore -l 덤프 > 목록` → `SCHEMA - public` 줄만 제거 → `pg_restore -L 필터한목록`. 스키마 권한(`ACL - SCHEMA public`)과 코멘트 항목은 유지해요.
   (`--clean --if-exists`는 기존 `public`을 통째로 지워서 Supabase 기본 설정을 잃으므로 쓰지 않아요.) 시험의 "복원 오류 0개" 기준은 그대로 유지해요.
2. **[필수] 복원 순서 고정** — 빈 DB → 계정(auth) 데이터 → (public 스키마 복원 = 표/함수/정책) → auth · storage 재적용 → 마이그레이션 중 storage 부분(0003 · 0008 · 0010).
   마이그레이션 전체를 먼저 적용하면 프로필 자동 생성 + `NOT_SIGNED_IN` 충돌이 나요(T09a · T09b로 확인).
3. **[필수] 권한 처리** — 공개 덤프에서 `--no-privileges`를 빼서 GRANT를 함께 백업해요. T08b의 비교로 나머지 63줄이 일치함을 봤으므로 방향은 맞아요.
   대상 프로젝트에 `anon` · `authenticated` · `service_role` 역할이 있어야 한다는 전제를 복구 절차에 적어요(실제 Supabase에는 있음).
4. **[필수] auth 트리거 · storage 정책 · photos 버킷 재적용 단계 확정** — `50-reapply-outside-public.sql`(트리거 정의가 0001과 동일함은 T08d로 확인됨) + 0003/0008/0010.
5. **[권장] 상황 A 절차를 문서에 고정** — 사용자 트리거 끄기 → INSERT만 → 다시 켜기(T10c~T10j로 검증됨, 단 T10k는 미확인).
6. **[미해결 유지]** 사진(Storage) 백업 미구현, 탈퇴 회원 신고 기록 설계 공백, 운영 DB 전체 손실 시 탈퇴 계정 재생성 위험(격리 방식은 설계만, 상황 B 결과 후 재결정).
7. **T07.\*의 성격**: T07.trigger · storage · bucket · object · grant는 "**현재 워크플로(`--no-privileges`, 공개 스키마만)**의 백업에 그것들이 들어 있는가"를 묻는 시험이라, 위 수정안을 적용해도 이 시험의 대상(r1)은 **계속 ❌로 남아요.**
   기준을 바꾸지 않고 두며, 수정안이 맞는지는 **R1b 계열(T08a~T08d)**로 확인해요. 새 워크플로를 위한 시험을 추가하는 것은 허용되지만 T07의 기대값을 바꾸지는 않아요(사용자 승인 필요).

## 4. 시험 코드 수정안 (적용 전 — 사용자 승인 후 적용)

### 4-1. 스키마 충돌 회피 (`gateC.ps1` 364 · 402 · 525행의 공개 데이터 복원 3곳) — 설계 3-1의 시험 반영
```powershell
function Restore-PublicDump([string]$Db, [string]$DumpPath, [string[]]$Extra) {
  $list = Invoke-Tool 'pg_restore' @('-l', $DumpPath) -NoConn
  if ($list.Code -ne 0) { Fail-Infra "덤프 목록 읽기 실패($DumpPath)" }
  $keep = @($list.Out | Where-Object { $_ -notmatch '^\d+; \d+ \d+ SCHEMA - public ' })
  if ($keep.Count -ne $list.Out.Count - 1) { Fail-Infra "SCHEMA public 항목이 정확히 1개가 아니에요 — 목록 필터를 확인하세요" }
  $lf = "$files\restore-" + [IO.Path]::GetFileNameWithoutExtension($DumpPath) + '.list'
  Write-SqlSafe $lf ($keep -join "`n")
  Invoke-Tool 'pg_restore' (@('--no-owner') + $Extra + @('-L', $lf, '-d', $Db, $DumpPath))
}
```
- 안전장치: 제외 항목이 **정확히 1개**가 아니면 시험을 중단해요(필터가 엉뚱한 것을 지우지 않게).
- 확인할 것(실행 전 가설): 목록 줄 형식이 `N; 2615 2200 SCHEMA - public owner`인지는 `pg_restore -l` 실행으로 확인해야 해요. 이 분석에서는 실행하지 않았어요.
- `bakery_stage`(525행)는 `$Extra=@('--no-privileges')`를 유지해요. 스테이징은 상황 B 격리 시험용이라 기존 조건을 바꾸지 않아요.

### 4-2. 시험 코드 결함 3건
```powershell
# (a) Diff-Lines: 항상 배열로 돌려주기 (T08b 상세 누락 · 판정 흔들림 방지)
return ,@(Compare-Object $fa $fb)     # 쉼표 한 개로 배열 풀림 방지, 호출부는 $x = @(Diff-Lines ...)
# 호출부 전체(T05b~d, T06, T07.*, T08b~c, T11 등)에 @() 로 감싸요.

# (b) PsqlScalar: 실패 이유를 남기기 (T10k 같은 빈 값 방지)
function PsqlScalar([string]$Db, [string]$Sql) {
  $r = Psql $Db @('-At', '-c', $Sql)
  if ($r.Code -ne 0) { return "ERR(code=$($r.Code)): " + (($r.Out | Select-Object -Last 1) -replace '\s+', ' ') }
  return (($r.Out -join "`n").Trim())
}
# 각 판정은 "기대 문자열과 정확히 같을 때만 pass" 이므로 ERR 문자열은 자동으로 fail + 이유가 상세에 찍혀요.

# (c) T10k: 한글을 명령줄에 싣지 않고 UTF-8 파일(-f)로 실행 — 다른 한글 SQL과 같은 방식
$k = "select (select count(*) from public.comments where content like '가짜 댓글 2%') || '/' || ..."   # 기존 문장 그대로, 기대값 0/0/0/0 그대로
Write-SqlSafe "$files\t10k.sql" ("\pset format unaligned`n\pset tuples_only on`n" + $k + ';')
$r = PsqlFile 'bakery_rehearsal' "$files\t10k.sql" '' -Quiet
$wrongLink = (($r.Out -join "`n").Trim())
```
- (c)는 질문과 기대값을 바꾸지 않아요. 실행 방식만 바꿔요. 다시 실행하면 가설 ⑪이 맞는지(오류 → 정상 출력)도 같이 확인돼요.

### 4-3. 비교 방식 수정 2건 — **기준에 닿는 변경이라 승인이 필요해요**
**(a) 권한 비교 사각지대 제거 (`20-report.sql` 77~81행)** — 기준을 더 엄격하게 하는 방향
```sql
select '6.acl', 'table ' || item, string_agg(g, ',' order by g)
  from (select n.nspname || '.' || c.relname as item,
               (case a.grantee when 0 then 'PUBLIC' else a.grantee::regrole::text end) || ':' || a.privilege_type as g
          from pg_class c join pg_namespace n on n.oid = c.relnamespace,
               aclexplode(coalesce(c.relacl, acldefault(case when c.relkind = 'S' then 's' else 'r' end, c.relowner))) a
         where n.nspname in ('public', 'storage', 'quarantine') and c.relkind in ('r', 'v', 'm', 'p', 'S')) s
 group by item
```
- 의미: 권한 칸이 비어 있는 표도 "기본 권한(소유자만)"으로 풀어서 양쪽에 같은 줄이 생겨요 → `admins` 차이가 사라지는 것이 아니라 **같은 의미로 비교돼요.**
  원본에 anon이 몰래 SELECT를 가진 경우처럼 실제로 다른 권한은 그대로 잡혀요(이 변경은 기존에 안 보이던 표까지 비교 대상으로 넓혀요).

**(b) T06 · T08c의 AND 괄호 차이** — 선택지 두 가지 중 사용자가 결정해 주세요.
- **안 1(추천): 텍스트 비교는 그대로 두고, 제약의 동작을 추가로 확인하는 시험(T06b)을 새로 추가.** 임시 표에 같은 제약을 걸어 0 · 0.4 · 0.5 · 0.7 · 1 · 4.5 · 5 · 5.1 값을 양쪽 DB에서 넣어 보고 통과/거부 결과를 비교해요(롤백, 데이터 변경 없음).
  이 경우 T06 · T08c의 텍스트 비교는 이 1줄 때문에 **계속 ❌로 남고**, "표현 차이만 있고 동작은 같음"이 T06b로 증명돼요. 기준은 낮추지 않아요.
- 안 2: 보고서의 제약 정의를 `AND` 연쇄를 풀어 정규화한 뒤 비교. 시험은 통과하지만 "텍스트 일치" 기준이 "정규화 후 일치"로 **바뀌는 것**이라 승인이 필요하고, 정규화 규칙이 틀리면 진짜 차이를 가릴 수 있어요.

## 5. 수정 후 재시험 범위

**결론: 전체 재시험을 권해요.** 이유: ① `gateC.ps1`이 한 번에 처음부터 끝까지 도는 구조이고(최대 9분 마감, 가짜 데이터만), 복원 방식(4-1)이 R1 · R1b · R4의 공통 기반이라 부분 재실행은 구조상 어렵고 일부만 믿기도 어려워요.
② 상황 B와 T12는 한 번도 실행된 적이 없어요. ③ 첫 실행 결과(`results.txt` 등)는 덮어쓰이기 전에 `results-run1.txt` 같은 이름으로 **보관**해 두면 비교가 가능해요(삭제 아님).

재실행 시 결과가 바뀔 것으로 예상하는 항목(예상이지 합격 선언이 아니에요):

| 항목 | 예상 | 근거 |
|---|---|---|
| T05a · T08a · INFRA | 통과 가능 | 4-1 적용 시 오류 1개 제거 (**다른 오류가 없는지는 실행해야 알아요**) |
| T08b | 통과 가능(4-3a 승인 시) / 미승인이면 ❌ + 상세에 `admins` 1줄이 찍힘 | 1-2 |
| T06 · T08c | ❌ 유지(4-3b 안 1) 또는 통과(안 2) | 1-1 |
| T07.trigger · storage · bucket · object · grant | ❌ 유지 | 설계 3-7. 기준 변경 없음 |
| T10k | 통과하면 이 한 항목은 확정, ERR로 실패하면 이유가 상세에 남음 | 4-2 (b)(c) |
| T09a · T09b · T10b | 관찰 유지 | 순서 충돌 재현 시험이라 바뀌지 않아야 정상 |
| 상황 B(Q01~Q15, T11a~c) · T12 | **처음 결과가 나옴** | 지금까지 미실행 |
| `Q15b` · `T07.object` | ❌ 유지(알려진 공백) | 사진 · 신고 복원 설계 미결정 |

## 6. 사용자 결정이 필요한 것
1. 4-1, 4-2(시험 코드 결함 수정)를 적용해도 되는지.
2. 4-3(a) 권한 비교 확장 승인 여부, 4-3(b) 안 1 / 안 2 선택.
3. 설계 3-1 ~ 3-4(복구 절차 · 권한 포함 백업)를 README와 워크플로 초안에 반영해도 되는지.
4. 반영 후 **서버 재시작 + 전체 재실행** 승인(임시 키는 새로 만들지, 기존 3개를 계속 쓸지 포함).
5. 보관 중인 산출물 정리 시점(지금까지는 삭제하지 않았어요).

변경하지 않은 것: 방침 · 약관 문구(백업은 계속 예정형), main · push · 배포, 보관처(GitHub 비공개 저장소는 잠정 후보), 사진 백업 · 탈퇴 회원 신고 기록 · 탈퇴 계정 재생성 위험(모두 미해결).
