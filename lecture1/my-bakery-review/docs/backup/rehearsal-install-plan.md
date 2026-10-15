# 임시 PostgreSQL 17 설치 계획 (가짜 데이터 복구 시험용) — 승인 대기

> ## ⛔ 현재 상태 (2026-10-15): 다운로드 · 해시 확인까지 하고 **디지털 서명 검사에서 중단했어요**
> - 출처: PostgreSQL 공식 사이트가 안내하는 EDB 바이너리 페이지 → `sbp.enterprisedb.com/getfile.jsp?fileid=1260616` → (302) → `https://get.enterprisedb.com/postgresql/postgresql-17.11-5-windows-x64-binaries.zip` (EDB 도메인, 381,531,864바이트)
> - 무결성: EDB가 같은 위치에 공개한 `.sha256` · `.md5` 파일과 **SHA256 `80379b2c…df8f82f`, MD5 `db63250c…fce`가 모두 일치**, 크기도 일치. (체크섬이 같은 서버에 있어서 "다운로드가 깨지지 않았다"는 증명이지, "서버가 뚫리지 않았다"는 증명은 아니에요)
> - 서명: 압축을 푼 `postgres` · `initdb` · `pg_ctl` · `psql` · `pg_dump` · `pg_restore` **6개 모두 `NotSigned`(서명 없음)**. exe 38개 중 37개가 서명 없음, dll 29개(샘플)도 모두 서명 없음.
> - 사전에 합의한 중단 조건(서명이 없으면 실행하지 않음)에 해당해서 **아무 파일도 실행하지 않았어요** (`initdb` · `postgres --version`도 실행 안 함). 데이터 폴더도 만들지 않았어요.
> - 남아 있는 것: `C:\bakery-secure\pg\download\pg17.zip`(381MB), `C:\bakery-secure\pg\pgsql\`(압축 푼 폴더, 약 1.3GB). 사용자 결정 전까지 그대로 둬요(삭제는 아래 6장 방법).
> - 사용자 결정(2026-10-15): 서명 없는 zip을 그대로 쓰지 않고, **공식 배포처의 서명된 설치 프로그램이나 신뢰할 수 있는 다른 방법을 먼저 조사**. 설치 · 실행 금지, 기존 다운로드 파일도 승인 전 실행 금지.
>
> ### 2차 조사 결과 (설치 · 실행은 하지 않았어요)
> - EDB의 **서명된 설치 프로그램**이 같은 서버에 있어요: `https://get.enterprisedb.com/postgresql/postgresql-17.11-5-windows-x64.exe` (413,001,200바이트). 공개된 `.sha256` · `.md5`와 일치(SHA256 `612c7f54…329072`), `C:\bakery-secure\pg\download\`에 저장했어요 (**실행하지 않음**).
> - Authenticode 서명 **`Valid`** — 서명자 `CN=EnterpriseDB Corporation, O=EnterpriseDB Corporation, L=Wilmington, S=Delaware, C=US`, 발급 DigiCert, 인증서 유효기간 2026-01-30 ~ 2029-02-01, 타임스탬프 포함, 지문 `7BEDD126…06C70`.
> - ⚠️ 이 파일의 매니페스트는 **`requireAdministrator`** 예요 (파일 안에서 읽었어요). 실행하면 `--extract-only`여도 관리자 권한(UAC) 요청이 뜰 것으로 예상돼요 (실행하지 않아서 직접 확인하지는 못했어요).
> - `tar`로 내용 목록을 읽을 수 없고(`Unrecognized archive format`) 7-Zip도 없어서, **실행 없이 설치 프로그램 안의 파일을 꺼내 서명 없는 zip과 비교하는 것은 불가능**해요.
> - 그래서 서명 없는 zip의 내용이 서명된 설치 프로그램의 내용과 같다는 것은 **아직 증명하지 못했어요.**
> - 경로 후보는 문서 끝 **8장**에 정리했어요 (모두 승인 대기).

> **이 문서는 계획이에요.** 위 상태 블록처럼 내려받기 · 압축 풀기 · 서명 검사까지만 했고, **설치(실행 · 데이터 폴더 생성 · 서버 시작)는 하지 않았어요.** 복구 시험은 따로 승인받아요.
> 실제 Supabase 회원 데이터는 쓰지 않아요 (가짜 데이터만). 네트워크로는 PostgreSQL 파일 하나만 내려받았어요.
> 사용자 조건 (2026-10-15): 관리자 권한 없이, `C:\bakery-secure\pg` 에서만, `127.0.0.1`로만 접속, 가짜 데이터만. 예상과 다른 권한 요청 · 검증 실패 · 오류가 나면 중단하고 먼저 알려요.

## 1. 방식 선택: 설치 프로그램 대신 "압축 파일(zip) 휴대용"

| 방식 | 관리자 권한 | 서비스 등록 · 레지스트리 | 삭제 | 판단 |
|---|---|---|---|---|
| EDB 설치 프로그램 (`winget install PostgreSQL.PostgreSQL.17`) | **필요** | Windows 서비스 · 레지스트리 · 시작 메뉴 변경 | 제거 프로그램 | ❌ 관리자 권한이 필요해서 제외 |
| **EDB 바이너리 zip** (권장) | **불필요** (현재 세션도 관리자 아님을 확인) | 없음 | 폴더 삭제 | ✅ |
| Docker | 필요 | — | — | 설치돼 있지 않아요 |
| PGlite(WASM) | 불필요 | — | — | ❌ 워크플로와 같은 `pg_dump`/`pg_restore` 클라이언트를 시험할 수 없어서 제외 |

## 2. 확인한 사실과 확인하지 못한 것
- 출처: EDB의 "Download PostgreSQL Binaries" 페이지(PostgreSQL 공식 사이트가 안내하는 곳)에 **17.11 Windows x86-64** 항목이 있고 링크는 `https://sbp.enterprisedb.com/getfile.jsp?fileid=1260616` 이에요.
- (이전 계획 시점의 가정) 체크섬이 없다고 봤지만, 실제로는 EDB 서버에 `.sha256` · `.md5` 파일이 공개돼 있었어요 (위 상태 블록). 파일 형식은 zip이 맞았고, 서명은 없었어요.
- EDB 안내: "특별한 이유가 없으면 설치 프로그램을 쓰라"고 적혀 있어요 (고급 사용자용). 우리 목적(서비스 등록 없는 임시 시험)에는 맞다고 판단해요.
- 이 PC 점검 결과: `vcruntime140.dll`, `vcruntime140_1.dll`, `msvcp140.dll` 모두 있음 (필요한 Visual C++ 런타임 설치됨), 포트 54329 · 5432 사용 중 아님, `postgres` 프로세스 없음, 관리자 세션 아님, C: 여유 약 315GB.

## 3. 저장 경로 (모두 OneDrive 밖, 내 계정만 접근)
```
C:\bakery-secure\                 (이미 있음, 내 계정만 접근, 비어 있음)
└── pg\
    ├── download\pg17.zip         내려받은 파일 (설치 후 삭제)
    ├── pgsql\                    압축 푼 PostgreSQL (bin\ 안에 initdb, pg_ctl, psql, pg_dump, pg_restore)
    ├── data\                     시험용 데이터 폴더 (가짜 데이터만)
    ├── pw.txt                    시험용 DB 비밀번호 (임의 생성, 시험 직후 삭제)
    └── pg.log                    서버 로그
```
- PATH · 레지스트리 · 서비스를 **바꾸지 않아요.** 명령은 전체 경로로 실행하고, PATH는 현재 PowerShell 창에서만 임시로 써요.
- 용량: 압축 해제 후 수백 MB로 예상 (내려받은 뒤 정확히 확인).

## 4. 설치 명령어 (승인 후 한 단계씩 실행하고 결과를 보여 드려요)
```powershell
# 0) 작업 폴더 (OneDrive 밖)
$root = 'C:\bakery-secure\pg'
New-Item -ItemType Directory -Path "$root\download" -Force | Out-Null

# 1) 내려받기 (HTTPS) + 해시 기록
Invoke-WebRequest -Uri 'https://sbp.enterprisedb.com/getfile.jsp?fileid=1260616' -OutFile "$root\download\pg17.zip" -UseBasicParsing
Get-FileHash "$root\download\pg17.zip" -Algorithm SHA256        # 값을 기록해 둬요 (EDB가 체크섬을 안 줘서 비교는 못 해요)

# 2) 압축 풀기 (zip이 아니면 여기서 오류 → 중단)
Expand-Archive -Path "$root\download\pg17.zip" -DestinationPath $root

# 3) 디지털 서명 검사 — 서명자가 EDB이고 Valid가 아니면 중단
$bin = "$root\pgsql\bin"
'postgres','initdb','pg_ctl','psql','pg_dump','pg_restore' | ForEach-Object {
  $s = Get-AuthenticodeSignature "$bin\$_.exe"; "{0,-11} {1,-10} {2}" -f $_, $s.Status, $s.SignerCertificate.Subject
}
& "$bin\postgres.exe" --version

# 4) 시험용 비밀번호(임의) + 데이터 폴더 만들기
$pw = [Convert]::ToBase64String((1..18 | ForEach-Object { Get-Random -Maximum 256 }))
[IO.File]::WriteAllText("$root\pw.txt", $pw)
& "$bin\initdb.exe" -D "$root\data" -U postgres -A scram-sha-256 --pwfile="$root\pw.txt" -E UTF8 --locale=C

# 5) 시작 (내 컴퓨터 안에서만 접속 가능: 127.0.0.1, 포트 54329)
& "$bin\pg_ctl.exe" -D "$root\data" -l "$root\pg.log" -o "-p 54329 -c listen_addresses=127.0.0.1" start

# 6) 접속 확인 + 시험 DB 만들기
$env:PGPASSWORD = $pw
& "$bin\psql.exe" -h 127.0.0.1 -p 54329 -U postgres -d postgres -c "select version();" -c "create database bakery_rehearsal;"
```
- 방화벽 창이 뜨면 **허용하지 않아요 (취소)**. 127.0.0.1만 쓰므로 필요 없어요. 관리자 권한을 요구하는 창이 뜨면 거기서 중단해요.
- PowerShell 5.1에서 외부 프로그램의 경고(stderr)가 스크립트를 멈추지 않게, 종료 코드(`$LASTEXITCODE`)로 성공을 판단해요.

## 5. 시험 내용 (설치 후, 별도 승인)
- 가짜 `auth` 환경: 저장소의 `supabase/tests/supabase_stub.sql`은 `auth.users`가 4개 칸뿐이고 `auth.identities`가 없어요 → 시험용으로 **실제 모양에 가깝게 칸을 늘린 가짜 스키마**(비밀번호 해시 칸, 로그인 방식 표 등)를 따로 만들어요.
- `supabase/migrations/*.sql`을 적용해 `public` 구조를 만들고, 누가 봐도 가짜인 데이터(`fake-1@example.invalid`, `가짜테스트1` …)를 넣어요.
- 워크플로와 같은 두 덤프를 만들어 `age`(임시 키 2개)로 암호화 → 복호화 → 새 DB에 복원 (README 8-1).
- 확인 항목: 행 수 · 프로필 자동 생성 트리거 충돌 · 외래키 순서 · 비밀번호 해시와 약관 기록 보존 · **가짜 탈퇴자 걸러내기**(README 9장 A 절차).
- 한계: 진짜 인증 서버(GoTrue)가 아니라서 **복원된 계정으로 실제 로그인이 되는지는 확인할 수 없어요** (README 8-2에서 별도로 다뤄요).
- 결과는 `docs/backup/rehearsal-log.md`에 숫자와 결과만 기록해요.

## 6. 끝낸 뒤 삭제 방법
```powershell
$root = 'C:\bakery-secure\pg'; $bin = "$root\pgsql\bin"
& "$bin\pg_ctl.exe" -D "$root\data" stop -m fast          # 1) 서버 종료
Get-Process postgres -ErrorAction SilentlyContinue         # 2) 남은 프로세스가 없는지 확인 (없어야 해요)
Remove-Item -LiteralPath $root -Recurse -Force             # 3) 폴더째 삭제: 프로그램, 데이터, 비밀번호 파일, 로그
Test-Path $root                                            # 4) False 확인
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue   # 5) 현재 창의 환경변수 제거
```
- 서비스 · 레지스트리 · PATH를 바꾸지 않았으므로 **되돌릴 것이 없어요.** `C:\bakery-secure` 자체는 이 도구 환경에서 삭제가 막혀서 빈 폴더로 남을 수 있어요 (탐색기에서 직접 지워도 돼요).
- 시험 중 복호화한 파일과 임시 키도 같은 `C:\bakery-secure\pg\` 또는 `C:\bakery-secure\rehearsal\` 아래에만 두고 같이 삭제해요.
- 시험이 끝나기 전에는 실제 운영 키를 만들지 않아요.

## 7. 중단 조건
- 파일이 zip이 아니거나 압축이 풀리지 않을 때
- 디지털 서명이 없거나 `Valid`가 아니거나 서명자가 EDB가 아닐 때 (그 경우 대안: 설치 프로그램 방식은 관리자 권한이 필요하므로 **사용자와 다시 상의**해요)
- 관리자 권한이나 방화벽 허용을 요구받을 때
- 포트가 이미 사용 중일 때 (다른 포트로 바꾸거나 상의)

## 8. 안전한 시험 환경을 만드는 경로 후보 (2026-10-15 조사, 모두 승인 대기)

| 경로 | 관리자 권한 | 검증 수준 | 판단 |
|---|---|---|---|
| ~~P1. 서명된 설치 프로그램을 관리자 권한 없이 실행해 `--extract-only`로 압축만 풀기~~ **사용자가 승인하지 않음 (2026-10-15, 관리자 권한 요청 우회 금지)** | 올리지 않음 (아래 방법) | 설치 프로그램은 EDB 서명 `Valid` + 공개 해시 일치. 꺼낸 파일의 해시를 서명 없는 zip의 파일과 비교 | 제외 (9장 참고) |
| P2. 같은 `--extract-only`를 UAC로 관리자 1회 승인해서 실행 | 필요 | 위와 같음 | "관리자 권한 없이" 조건과 충돌 → 재승인 필요 |
| P3. 서명 없는 zip을 해시 일치만으로 사용 | 불필요 | 무결성만, 출처 증명 없음 | 사용자가 보류함 |
| P4. winget(`PostgreSQL.PostgreSQL.17`) 등으로 전체 설치 | 필요 | 서명 · 해시 확인 | Windows 서비스 · 레지스트리 · 시작 메뉴 변경 → 시험 목적에 과함, 제외 권고 |
| P5. Scoop 등 패키지 관리자 | 불필요 | 같은 EDB zip을 받아서 서명 이점 없음 | 제외 |
| P6. pgAdmin 내장 클라이언트 도구 | 불필요(?) | 설치 프로그램은 서명됨. 내장 PostgreSQL 유틸리티는 서명되지 않았다는 pgAdmin 저장소 PR 기록이 있음(적용 여부 미확인) | 서버(`postgres`)가 없어서 복원 시험 불가 → 제외 |
| P7. Docker / WSL | 활성화에 필요 | — | 설치돼 있지 않음 → 제외 |
| P8. 시험용 Supabase 프로젝트(가짜 데이터)를 서버로 사용 | 불필요 | 관리형 서비스 | 클라이언트(`pg_dump` · `pg_restore`)는 어차피 필요, 외부 프로젝트 생성 승인 필요, Free 프로젝트 2개 제한 → 보류 |

### P1 상세 (실행하지 않았어요 — 승인 후에만)
- **권한을 올리지 않고 실행하는 방법:** 현재 PowerShell 창에서만 `$env:__COMPAT_LAYER = 'RunAsInvoker'` 를 설정하고 설치 프로그램을 실행해요. Windows 호환 계층 기능으로, 매니페스트의 "관리자 필요"를 따르지 않고 **지금 가진 권한 그대로** 실행해요 (권한을 높이는 게 아니라 높이지 않는 것). 다른 창 · 시스템 설정에는 영향이 없어요.
- **명령 초안:** `& 'C:\bakery-secure\pg\download\postgresql-17.11-5-windows-x64.exe' --extract-only 1 --prefix 'C:\bakery-secure\pg\edb' --mode unattended --unattendedmodeui none`
- **EDB 문서가 엇갈려요:** v18 참고 문서는 `--extract-only`에 슈퍼유저 권한이 필요 없다고 하고, 구버전(v11) 안내서는 추출 뒤 생성되는 스크립트가 관리자 권한을 요구한다고 해요. 현재 17.11 설치 프로그램에서 어떻게 동작하는지는 **직접 해 봐야 알 수 있어요.**
- **중단 조건:** UAC 창이 뜨거나, 권한 오류 · 레지스트리/서비스 변경 시도 · 예상 밖 오류가 나면 즉시 중단하고 알려요. 시스템에 설치되는 것(서비스 · 레지스트리 · 시작 메뉴)이 생겼는지도 실행 전후로 비교해서 확인해요.
- **성공하면:** 꺼낸 `postgres.exe` · `initdb.exe` · `pg_dump.exe` · `pg_restore.exe` · `psql.exe`의 SHA256을 서명 없는 zip의 같은 파일과 비교해요. 같으면 zip도 서명된 설치 프로그램과 같은 내용이라는 것이 확인돼요. (꺼낸 파일 자체에는 서명이 없을 수도 있어요 — 서명은 설치 프로그램 파일 전체에 걸려 있어서요. 그래도 "서명된 파일에서 나온 내용"이라는 근거는 생겨요.)
- **그 뒤:** 4장의 `initdb` 이후 절차(127.0.0.1:54329, 가짜 데이터)는 그대로예요. 실행 전에 다시 승인받아요.

### 디스크에 남아 있는 것 (모두 실행하지 않았어요)
| 파일 | 크기 | 상태 |
|---|---|---|
| `C:\bakery-secure\pg\download\pg17.zip` | 381MB | 서명 없는 zip (해시 일치) |
| `C:\bakery-secure\pg\pgsql\` | 약 1.3GB | 위 zip을 압축 푼 폴더 (실행 안 함) |
| `C:\bakery-secure\pg\download\postgresql-17.11-5-windows-x64.exe` | 413MB | EDB 서명 설치 프로그램 (실행 안 함) |

## 9. EDB 설치 프로그램 "정식" 사용 조사 (2026-10-15) — 설치하지 않았어요

> 사용자 결정: **P1(RunAsInvoker)은 승인하지 않아요.** 설치 프로그램의 관리자 권한 요청을 우회하지 않고, EDB 공식 설치 프로그램을 정상적으로 쓰는 방법을 조사했어요. 아래는 조사 결과이고 **아무것도 설치 · 실행하지 않았어요.**
> 출처 구분: ✅ = EDB 문서에 있는 내용, 🔎 = 파일에서 직접 확인, ❓ = 문서에 없어서 확인하지 못했거나 오래된 자료 기준 (설치해 봐야 알 수 있어요).

### 9-1. 관리자 권한
- ✅ "그래픽 설치 마법사로 설치하려면 슈퍼유저 또는 관리자 권한이 필요하다." (EDB 설치 가이드). 일부 Windows에서는 설치 프로그램을 우클릭해 **관리자 권한으로 실행**해야 할 수 있어요.
- ✅ 무인 설치(`--mode unattended`)도 관리자 권한이 필요하다는 EDB 문서가 있어요 (EPAS 문서 기준, PostgreSQL 문서도 같은 취지).
- 🔎 이 설치 프로그램의 매니페스트는 `requireAdministrator`예요. 어떤 옵션으로 실행해도 UAC 승인 요청이 떠요.
- 지금 세션은 관리자가 아니에요. **UAC 승인은 사용자가 직접 해야 하고**, 저는 대신 승인하지 않아요.

### 9-2. 정식으로 쓰는 방법 두 가지
| | F1. 전체 설치 | F2. `--extract-only 1` (UAC 승인 후 압축만 풀기) |
|---|---|---|
| 하는 일 | 서버를 설치하고 Windows 서비스로 등록 | ✅ "설치를 하지 않고 PostgreSQL 바이너리만 꺼낸다" |
| 관리자 권한 | 필요 (UAC) | 필요 (UAC, 🔎 매니페스트). 문서마다 엇갈림(❓) |
| 시스템 변경 | 서비스 · OS 계정 · 레지스트리 · (방화벽?) 등 (아래 9-3) | 적을 것으로 예상(❓): 서비스 · 계정을 만들지 않도록 설계된 옵션. 실제 변경은 실행 전후 스냅샷으로 확인 |
| 이후 사용 | 서비스가 서버를 운영 | 꺼낸 폴더에서 `initdb` · `pg_ctl`로 **직접** 운영 (서비스 없음, 127.0.0.1) |
| 부가 효과 | — | 꺼낸 파일의 해시를 기존 zip과 비교해 zip의 출처를 서명된 설치 프로그램에 연결 가능 |
| 제거 | 제어판 제거 + 수동 정리 (9-5) | 폴더 삭제 |

### 9-3. F1(전체 설치)이 시스템에 만드는 것
| 항목 | 내용 | 근거 |
|---|---|---|
| Windows 서비스 | 서버가 **백그라운드 서비스**로 실행돼요. 서비스 이름은 `--servicename`으로 지정 (기본 이름은 문서에 없음, 보통 `postgresql-x64-17` 형태로 알려졌지만 확인 못 함) | ✅ 서비스로 실행 / ❓ 서비스 생략 옵션은 문서에 없음, 기본 이름 · 시작 유형 |
| 서비스 계정 | 기본 `postgres` 라는 **운영체제 계정**. 이미 있으면 그 계정의 기존 비밀번호를 입력해야 해요. 비밀번호 기본값은 DB 슈퍼유저 비밀번호와 같아요 (`--servicepassword`) | ✅ (새 로컬 사용자 계정이 만들어진다는 점은 문서의 "이미 존재하면" 표현으로 추정, ❓) |
| 포트 | 기본 **5432**, `--serverport`로 변경 (제안: 54329) | ✅ |
| 접속 허용 범위 | 설치 프로그램이 `listen_addresses`를 `*`(모든 인터페이스)로 두는 것으로 **2012년 EDB 글**에 나와요. 현재 동작은 확인 못 함 | ❓ → 설치 후 `postgresql.conf`를 열어 확인하고, `127.0.0.1`로 제한 (서비스 재시작 필요, 관리자) |
| 방화벽 | 설치 프로그램이 Windows 방화벽 규칙을 만드는지 문서에 없음 | ❓ → 설치 후 `Get-NetFirewallRule`로 확인, 있으면 삭제 |
| 설치 · 데이터 위치 | 기본 `C:\Program Files\PostgreSQL\17`, 데이터는 그 아래 `data` (문서 예시는 15 버전이며 17도 같은 형식으로 추정). `--prefix` · `--datadir`로 변경 | ✅ (17 경로는 ❓) |
| 데이터 폴더 권한 | `--enable_acledit 1`은 서비스 계정에 데이터 경로 **전체에 읽기 권한**을 줘요. `C:\bakery-secure` 안에 두면 "내 계정만" 접근 규칙이 넓어져요 | ✅ → **기본 위치(Program Files) 권장**, 시험 파일(덤프 · 키)만 `C:\bakery-secure\rehearsal`에 |
| 구성요소 | server · pgAdmin · stackbuilder · commandlinetools. `--disable-components pgAdmin,stackbuilder`로 줄이기 | ✅ |
| 바로가기 | `--create_shortcuts 0`으로 끄기 | ✅ |
| Visual C++ 런타임 | 기본으로 설치를 시도 (`--install_runtimes 1`). 이 PC는 이미 있어서 `0` 권장 | ✅ / 🔎 런타임 존재 확인 |
| 제어판 등록 | 제거 가능하도록 등록됨 (제거 문서 기준) | ✅ |
| 로그 | `--debuglevel`(0~4), `--debugtrace <파일>` | ✅ |

### 9-4. 설치 명령 초안 (실행하지 않았어요 — 승인과 UAC 승인 후에만)
```powershell
# 시험 전용 임의 비밀번호 ($pw). 명령줄에 남으므로 실제 비밀번호는 절대 쓰지 않아요
& 'C:\bakery-secure\pg\download\postgresql-17.11-5-windows-x64.exe' `
  --mode unattended --unattendedmodeui minimalWithDialogs `
  --superpassword $pw --serverport 54329 --servicename bakery-rehearsal-pg `
  --disable-components pgAdmin,stackbuilder --create_shortcuts 0 --install_runtimes 0 `
  --debuglevel 2 --debugtrace 'C:\bakery-secure\pg\install-debug.log'
```
- `--prefix` · `--datadir`는 지정하지 않아요 → 기본 위치 (9-3 데이터 폴더 권한 이유).
- 로케일은 지정하지 않아 OS 로케일(한국어)이 쓰여요. 시험 DB는 `CREATE DATABASE … ENCODING 'UTF8' TEMPLATE template0`처럼 인코딩을 명시해서 만들어요.
- 설치 직후(관리자): 서비스를 **수동 시작으로 바꾸고 중지**, `listen_addresses = '127.0.0.1'` 확인 · 수정 후 필요할 때만 시작, 방화벽 규칙 확인. 접속은 `127.0.0.1:54329`만.
- 사용자가 관리자 PowerShell에서 직접 실행하는 방식과, 제가 UAC 창을 띄우고 사용자가 승인하는 방식 중 선택해야 해요.

### 9-5. 제거 방법
- ✅ 공식: **제어판 → 프로그램 제거 또는 변경 → PostgreSQL 우클릭 → 제거/변경 → "Entire application"** (또는 구성요소 선택). 설치 폴더에 제거 프로그램이 만들어져요 (파일 이름은 문서에 없음).
- ❓ Windows에서 제거 후 남는 것은 PostgreSQL 문서에 없어요. 관련 EDB 문서(EPAS)는 "클러스터 데이터 파일과 서비스 사용자가 남는다"고 설명해요 → **남는다고 가정하고 수동 정리 계획을 세워요:**
  1. 서비스가 남았으면 `sc.exe delete <서비스 이름>` (관리자)
  2. 데이터 폴더 삭제
  3. `postgres` Windows 계정 삭제 (`net user postgres /delete`, 관리자 — **이 계정을 다른 용도로 쓰지 않는지 먼저 확인**)
  4. 방화벽 규칙 · 시작 메뉴 · 레지스트리 · PATH 잔여 확인
  5. 설치 전 스냅샷과 비교해서 **차이 0**일 때 완료
- 무인 제거 옵션은 EDB 문서에 없어요 (설치 폴더의 제거 프로그램을 어떻게 호출하는지 ❓).

### 9-6. 설치 전 · 후 · 제거 후 스냅샷 (읽기 전용 명령, 같은 항목을 3번 비교)
- 서비스: `Get-Service | Where-Object Name -match 'postgres|bakery-rehearsal'`
- 로컬 사용자: `Get-LocalUser | Select-Object Name, Enabled`
- 설치된 프로그램: 제어판 항목 `PostgreSQL` 유무 (`HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`의 표시 이름)
- 방화벽: `Get-NetFirewallRule -DisplayName '*postgres*'`
- 열린 포트: `Get-NetTCPConnection -State Listen`
- PATH: `[Environment]::GetEnvironmentVariable('Path','Machine')`
- 폴더: `C:\Program Files\PostgreSQL`, 시작 메뉴 항목
- 결과는 `C:\bakery-secure\pg\snapshot-before.txt` 같은 파일에 저장 (개인정보 없음)

### 9-7. 추천과 결정 사항
- **F2(UAC 승인 + `--extract-only`)를 먼저 권해요.** 서비스 · OS 계정 · 방화벽 변경이 없거나 적을 것으로 예상되고, 제거는 폴더 삭제로 끝나고, 서명된 설치 프로그램에서 꺼낸 파일과 기존 zip을 비교해서 출처를 확인할 수 있어요. 단 동작이 문서마다 엇갈려서 실행 전후 스냅샷 비교가 필수예요.
- F1은 서비스 · OS 계정 · 레지스트리가 생기고 제거 후 잔여물 정리가 필요해서, 일회성 시험에는 과하다고 판단해요.
- 결정 필요: ① F1 / F2 / 보류 ② UAC 승인 방식 ③ (F1일 때) 설치 위치.
- 어느 쪽이든 UAC 창은 사용자가 직접 승인하고, 예상과 다른 권한 요청 · 검증 실패 · 오류가 나면 즉시 중단하고 알려요.
