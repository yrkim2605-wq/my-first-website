# 가짜 데이터 복구 시험용 임시 로컬 PostgreSQL 서버 실행 계획 (승인 대기 — 아직 아무것도 실행하지 않았어요)

> 작성: 2026-10-15. 대상: `C:\bakery-secure\pg\edb`에 추출한 PostgreSQL 17.11 (서명된 EDB 설치 프로그램에서 나온 파일, 기존 zip과 해시 동일 — `rehearsal-log.md` 2단계).
> 이 문서는 **계획**이에요. `initdb`, `pg_ctl`, `psql` 등은 아직 한 번도 실행하지 않았어요. 단계마다 사용자 승인을 받고 진행해요.

## 0. 사용자 조건과 이 계획의 대응

| # | 조건 | 이 계획에서 지키는 방법 |
|---|---|---|
| 1 | 실제 Supabase 프로젝트 · 운영 데이터에 절대 접속하지 않음 | ① 모든 명령에 접속 대상을 `127.0.0.1:54329`로 **고정**하고 다른 호스트를 쓰면 거부하는 확인 함수를 둠 ② 실행 전 `PG*`/`DATABASE_URL`/`SUPABASE*` 환경변수 0개, `pgpass.conf`·`.pgpass`·`.pg_service.conf` 없음을 **이미 확인함**(2026-10-15) ③ `.env` 등 Supabase 접속 정보 파일을 읽지 않음 ④ 서버 비밀번호는 시험 전용 임의 값 |
| 2 | 가짜 데이터만, 모든 작업은 `C:\bakery-secure\pg` 안 | 데이터 폴더 `pg\data`, 로그 `pg\logs`, 비밀번호 파일 `pg\secrets`, `psql` 기록 파일도 `pg\logs`로 지정(`PSQL_HISTORY`). 가짜 데이터(`…@example.invalid`)만 사용 |
| 3 | Windows 서비스로 등록하지 않음 | `pg_ctl register`를 쓰지 않고 `pg_ctl start`로 **사용자 세션의 일반 프로세스**로만 실행. 서비스 · 레지스트리 · 계정을 만들지 않음 |
| 4 | `127.0.0.1:54329`에만 바인딩, 외부 차단 | `listen_addresses='127.0.0.1'`, `port=54329`, `pg_hba.conf`를 `127.0.0.1/32` 한 줄로 축소. 시작 후 **리스닝 주소가 `127.0.0.1`뿐인지**, 이 PC의 다른 주소(`192.168.219.103`)로는 연결이 거부되는지 확인 |
| 5 | 실행 전에 명령어 · 예상 변경 설명 | 아래 2~4장 |
| 6 | 종료 후 프로세스 · 포트 해제 확인 | 5장 |
| 7 | 기존 zip · 압축 해제 폴더 삭제 금지 | 이 계획은 `pg\download\pg17.zip`과 `pg\pgsql\`을 **사용하지도 건드리지도 않음** |
| 8 | main 병합 · push · 배포 금지 | 하지 않음 |

## 1. 준비 사항과 이미 확인한 것 (읽기 전용 점검, 2026-10-15)

- **관리자 세션이 아니에요 = 정상.** Windows의 PostgreSQL은 관리자 권한(올린 토큰)으로 실행되면 거부해요. 일반 PowerShell에서 실행해야 하고, **UAC 창이 뜨면 즉시 중단**해요 (이번 서버 실행에는 관리자 권한이 필요 없어요).
- 54329 · 5432 포트 미사용, `pg\data` · `pg\logs` · `pg\secrets` 폴더 아직 없음, C: 여유 311GB.
- 핵심 6개 실행 파일의 SHA256이 기록과 동일 (실행 직전에 다시 확인).
- 방화벽은 3개 프로필 모두 켜짐, 기본 인바운드 `NotConfigured` (허용 규칙을 우리가 만들지 않아요).
- 이 PC의 IPv4: `192.168.219.103`(Wi-Fi), `127.0.0.1`. 외부 접속 차단 시험에 `192.168.219.103:54329`를 써요.
- 추출 폴더의 `installer\` · `scripts\` 안 파일(`createuser.exe`, `initcluster.ps1`, `vcredist_*.exe` 등)은 **쓰지 않아요.** `bin\`의 도구만 직접 실행해요.

## 2. 공통 설정 (현재 PowerShell 창에서만 유효, 영구 변경 없음)

```powershell
$root = 'C:\bakery-secure\pg'
$bin  = "$root\edb\bin"
$data = "$root\data"

# 접속 대상 고정 + 접속 정보 파일이 새로 생기지 않게 (이 창에서만)
function Use-LocalPgEnv {
  $env:PGHOST = '127.0.0.1'; $env:PGPORT = '54329'; $env:PGUSER = 'postgres'
  $env:PGPASSWORD = (Get-Content "$root\secrets\pg-test-pw.txt" -Raw)
  $env:PSQL_HISTORY = "$root\logs\psql_history"
}
function Assert-LocalOnly {
  if ($env:PGHOST -ne '127.0.0.1' -or $env:PGPORT -ne '54329') { throw '접속 대상이 127.0.0.1:54329가 아니에요. 중단합니다.' }
}
```
- `Assert-LocalOnly`는 `psql`/`pg_dump`/`pg_restore`를 부르기 전에 항상 호출해요. 명령에 `-h`, `-p`, 접속 URL을 직접 쓰지 않고 위 환경변수만 써요.
- PATH는 바꾸지 않고 `$bin\psql.exe`처럼 전체 경로로 실행해요.

## 3. 관문 A — 준비 + `initdb` + 설정 (서버는 시작하지 않아요)

### 3-1. 실행 직전 점검 (읽기 전용)
해시 6개 재확인, 관리자 아님, 포트 비어 있음 확인 → 시스템 스냅샷 `C:\bakery-secure\pg\snapshots\before-server.txt` 저장.

### 3-2. 명령과 예상 변경
```powershell
# (a) 폴더 + 시험 전용 임의 비밀번호 24자 (가짜 데이터용 서버, 내 계정만 접근하는 폴더 안에 저장)
New-Item -ItemType Directory -Path "$root\logs","$root\secrets" -Force | Out-Null
$chars = (48..57) + (65..90) + (97..122) | ForEach-Object { [char]$_ }
$pw = -join (1..24 | ForEach-Object { $chars | Get-Random })
[IO.File]::WriteAllText("$root\secrets\pg-test-pw.txt", $pw, (New-Object Text.UTF8Encoding($false)))

# (b) 데이터 클러스터 만들기 (이 단계에서 서버는 시작되지 않아요)
& "$bin\initdb.exe" -D $data -U postgres --pwfile="$root\secrets\pg-test-pw.txt" -A scram-sha-256 -E UTF8 --locale=C

# (c) 설정: 127.0.0.1:54329 에만 바인딩
Copy-Item "$data\pg_hba.conf" "$data\pg_hba.conf.initdb-original"
Set-Content -Path "$data\pg_hba.conf" -Encoding ASCII -Value 'host all all 127.0.0.1/32 scram-sha-256'
Add-Content -Path "$data\postgresql.conf" -Encoding ASCII -Value @(
  '', '# --- bakery rehearsal (fake data only) ---',
  "listen_addresses = '127.0.0.1'", 'port = 54329', 'max_connections = 20', 'shared_buffers = 32MB',
  'log_connections = on', 'log_disconnections = on', "log_line_prefix = '%m [%p] %u@%d '"
)
```
- `-E UTF8 --locale=C`: 한국어 OS 로케일(`Korean_Korea`)과 UTF8이 충돌하는 오류를 피하려고 `C` 로케일을 써요. 한계: Supabase의 기본 정렬 규칙(`en_US.UTF-8` 계열)과 다르므로 **정렬 · 대소문자 관련 동작은 완전히 같지 않아요** (복구 시험의 행 수 · 외래키 · 트리거 확인에는 영향이 작아요).
- `-A scram-sha-256`: 비밀번호 방식으로 인증(암호 없는 `trust` 사용 안 함).

| 예상 변경 | 내용 |
|---|---|
| 새 폴더 · 파일 | `pg\data\` (약 40~50MB로 예상, 수백~천 개 파일), `pg\logs\`, `pg\secrets\pg-test-pw.txt`, `pg\data\pg_hba.conf.initdb-original` |
| 시스템 변경 | **없을 것으로 예상**: 서비스 · 레지스트리 · 계정 · 방화벽 · PATH · 시작 메뉴 변경 없음 (`initdb`는 서버를 시작하지 않고 데이터 폴더만 만들어요) |
| 화면 | 콘솔에 `initdb` 진행 메시지와 마지막에 `Success. You can now start the database server…` (명령 안내 문구가 뜰 수 있는데 그대로 따라 하지 않아요) |
| 중단 조건 | UAC · 관리자 요구, "administrative permissions" 거부 메시지, 로케일/인코딩 오류, `C:\bakery-secure\pg` 밖에 파일이 생기려는 징후 |

관문 A 후: 스냅샷 `after-initdb.txt` 비교 보고. **서버는 아직 실행하지 않아요.**

## 4. 관문 B — 서버 시작, 접속 확인, 시험 DB 만들기 (별도 승인)

### 4-1. 명령과 예상 변경
```powershell
# (a) 시작: 서비스 등록 없음 (pg_ctl register 사용 안 함)
& "$bin\pg_ctl.exe" -D $data -l "$root\logs\pg.log" -w -t 60 start

# (b) 바인딩 확인 — 리스닝 주소가 127.0.0.1 뿐이어야 해요 (0.0.0.0 · :: 가 보이면 즉시 중지)
Get-NetTCPConnection -State Listen -LocalPort 54329 | Select-Object LocalAddress, LocalPort, OwningProcess
Test-NetConnection -ComputerName 192.168.219.103 -Port 54329 -WarningAction SilentlyContinue | Select-Object ComputerName, TcpTestSucceeded   # False 여야 해요
Test-NetConnection -ComputerName ::1 -Port 54329 -WarningAction SilentlyContinue | Select-Object ComputerName, TcpTestSucceeded            # False 여야 해요

# (c) 접속 확인 + 시험 DB (가짜 데이터용)
Use-LocalPgEnv; Assert-LocalOnly
& "$bin\psql.exe" -X -d postgres -c "select version(), current_setting('listen_addresses') as listen, current_setting('port') as port;"
& "$bin\psql.exe" -X -d postgres -c "CREATE DATABASE bakery_rehearsal ENCODING 'UTF8' TEMPLATE template0 LOCALE 'C';"
```
| 예상 변경 | 내용 |
|---|---|
| 프로세스 | `postgres.exe` 여러 개(메인 + 백그라운드 일꾼, 약 5~8개). 일반 사용자 프로세스예요. 서비스 아님 |
| 파일 | `pg\data\postmaster.pid`, 로그 `pg\logs\pg.log`(접속 · 종료 기록), 데이터 폴더 내부 파일 증가, `pg\logs\psql_history` |
| 네트워크 | **리스닝은 `127.0.0.1:54329`만.** 외부(`192.168.219.103`)에서는 거부 |
| 시스템 변경 | 서비스 · 레지스트리 · 계정 · PATH 변경 없음 예상. Windows는 서버가 쓰는 임시 공유 메모리를 만들 수 있고 종료하면 사라져요 |
| 방화벽 창 | 보통 뜨지 않아요(루프백에만 바인딩). **뜨면 "취소"(허용 안 함)** 를 누르고 알려 주세요. 허용 규칙을 만들지 않아요 |
| 중단 조건 | 리스닝 주소가 `127.0.0.1` 이외, 외부 주소 연결이 성공함, UAC · 관리자 요구, `pg_ctl`이 응답하지 않음(60초), 예상 밖 오류 → **즉시 `pg_ctl stop`으로 종료**하고 보고 |
- 도구 호출이 `pg_ctl start`에서 멈출 가능성(자식 프로세스가 출력 핸들을 잡는 경우)이 있어요. 그러면 `Start-Process -WindowStyle Hidden`으로 시작하는 방식으로 바꾸기 전에 알려요(❓ 실행해 봐야 알 수 있음).

관문 B는 **시험 DB를 만들고 멈춰요.** 서버는 켜 둔 상태로 보고하고, 가짜 데이터 · 스키마 · 덤프 · 복원은 관문 C에서 별도 승인을 받아요.

## 5. 종료와 확인 (관문 B 끝에서 또는 사용자가 원할 때 즉시)

```powershell
& "$bin\pg_ctl.exe" -D $data stop -m fast -w -t 60
# 확인
Get-Process -Name postgres -ErrorAction SilentlyContinue | Measure-Object | Select-Object Count        # 0
Get-NetTCPConnection -State Listen -LocalPort 54329 -ErrorAction SilentlyContinue                     # 결과 없음
Test-Path "$data\postmaster.pid"                                                                      # False
Get-Content "$root\logs\pg.log" -Tail 8                                                               # 종료 기록 확인
# 환경변수 정리 (현재 창)
Remove-Item Env:PGPASSWORD, Env:PGHOST, Env:PGPORT, Env:PGUSER, Env:PSQL_HISTORY -ErrorAction SilentlyContinue
```
- 종료 뒤 스냅샷 `after-stop.txt`로 시작 전 `before-server.txt`와 비교해요 (서비스 · 계정 · 방화벽 · 레지스트리 · PATH · 열린 포트 · 프로세스). 차이가 `C:\bakery-secure\pg` 안의 파일뿐이어야 해요.
- `-m fast`가 실패하면 상태를 보고하고 사용자 확인 후에 더 강한 종료(`immediate`)를 써요. 임의로 프로세스를 강제 종료하지 않아요.

## 6. 관문 C 예고 — 가짜 데이터 복구 시험 (이번 승인 범위 밖, 별도 계획 · 승인)
`supabase/tests/supabase_stub.sql`을 실제 모양에 가깝게 늘린 가짜 `auth` 스키마 + `supabase/migrations/*.sql` 적용 → 가짜 데이터(`fake-1@example.invalid`, 가짜 탈퇴자 포함) → 워크플로와 같은 두 덤프 → 임시 키 2개 암호화 · 복호화 → 새 DB 복원 → README 8-1의 확인 항목. 그때 필요한 SQL · 명령은 따로 보여드리고 승인받아요.

## 7. 끝난 뒤 정리 (별도 승인 — 지금은 하지 않아요)
- 서버 종료 확인 후 사용자가 원하면 `pg\data`, `pg\logs`, `pg\secrets`(비밀번호 파일) 삭제
- 중복 파일 `pg\download\pg17.zip` · `pg\pgsql\` 삭제 여부는 사용자가 따로 결정 (이번 계획에서는 **삭제하지 않아요**)

## 8. 한계와 아직 모르는 것
- 이 서버는 **진짜 Supabase가 아니에요.** 인증 서버(GoTrue) · REST(PostgREST) · 역할 구성이 없어서, 복원된 계정의 실제 로그인과 Data API 노출 스키마 동작은 확인할 수 없어요 (README 8-2).
- 로케일 `C`와 서버 버전(17.11)이 Supabase 프로젝트와 다를 수 있어요.
- `pg_ctl start`가 이 도구 환경에서 어떻게 동작하는지, Windows 방화벽 창이 뜨는지는 실행해 봐야 알아요.
- 설치 프로그램이 `bin\`의 도구를 서비스 계정 가정으로 구성했을 가능성은 낮지만, `initdb`가 실패하면 원인을 보고하고 `installer\` 쪽 도우미로 우회하지 않아요.
