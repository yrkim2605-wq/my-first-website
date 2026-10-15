# 임시 PostgreSQL 17 설치 계획 (가짜 데이터 복구 시험용) — 승인 대기

> **이 문서는 계획이에요. 아직 아무것도 내려받거나 설치하지 않았어요.** 설치와 시험은 따로 승인받아요.
> 실제 Supabase 회원 데이터는 쓰지 않아요 (가짜 데이터만). 네트워크로는 PostgreSQL 파일 하나만 내려받아요.

## 1. 방식 선택: 설치 프로그램 대신 "압축 파일(zip) 휴대용"

| 방식 | 관리자 권한 | 서비스 등록 · 레지스트리 | 삭제 | 판단 |
|---|---|---|---|---|
| EDB 설치 프로그램 (`winget install PostgreSQL.PostgreSQL.17`) | **필요** | Windows 서비스 · 레지스트리 · 시작 메뉴 변경 | 제거 프로그램 | ❌ 관리자 권한이 필요해서 제외 |
| **EDB 바이너리 zip** (권장) | **불필요** (현재 세션도 관리자 아님을 확인) | 없음 | 폴더 삭제 | ✅ |
| Docker | 필요 | — | — | 설치돼 있지 않아요 |
| PGlite(WASM) | 불필요 | — | — | ❌ 워크플로와 같은 `pg_dump`/`pg_restore` 클라이언트를 시험할 수 없어서 제외 |

## 2. 확인한 사실과 확인하지 못한 것
- 출처: EDB의 "Download PostgreSQL Binaries" 페이지(PostgreSQL 공식 사이트가 안내하는 곳)에 **17.11 Windows x86-64** 항목이 있고 링크는 `https://sbp.enterprisedb.com/getfile.jsp?fileid=1260616` 이에요.
- ⚠️ **페이지에 체크섬(SHA256)이 없고 파일 형식(zip)도 명시되지 않았어요.** 내려받은 뒤 `Expand-Archive`가 되는지로 형식을 확인하고, 아래 3단계의 **디지털 서명 검사**로 출처를 확인해요. 서명이 없거나 서명자가 EDB가 아니면 실행하지 않고 중단해요. (EDB 바이너리가 서명되어 있는지는 **아직 모르는 상태**예요.)
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
