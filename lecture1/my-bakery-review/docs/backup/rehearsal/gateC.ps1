# 관문 C 실행기: 가짜 데이터 복구 시험 (docs/backup/gate-c-plan.md · rehearsal/README.md)
#   ⚠️ C-prep 단계에서 "작성만" 했어요. 아직 한 번도 실행하지 않았어요. 실행은 사용자 승인 뒤에만 해요.
#   · 접속 대상은 127.0.0.1:54329 (로컬 시험 서버) 고정. 실제 Supabase · 운영 데이터에는 접속하지 않아요.
#   · 서버는 try/finally 로 항상 pg_ctl stop -m fast -w 로 정상 종료해요. 오류가 나면 추가 작업 없이 종료하고 보고해요.
#   · 모든 산출물은 C:\bakery-secure\pg 안. 비밀키 · 복호화된 파일 · 덤프는 Git 저장소 밖이에요.
#   · 실패한 시험은 성공으로 바꾸지 않아요. 결과는 ✅(통과) ❌(실패) ℹ️(관찰)로 표시하고, 실패마다 설계 수정안을 같이 보여줘요.
#
# 사용법 (현재 일반 PowerShell 창, 관리자 권한 아님):
#   & ([scriptblock]::Create((Get-Content -Raw <이 파일> -Encoding UTF8)))                # 시험 실행
#   & ([scriptblock]::Create((Get-Content -Raw <이 파일> -Encoding UTF8))) -Mode Cleanup  # 정리 목록만 보기
#   ... -Mode Cleanup -ConfirmDelete                                                      # 시험 DB · 파일 삭제
param(
  [ValidateSet('Run', 'Cleanup')][string]$Mode = 'Run',
  [switch]$ConfirmDelete
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

$root = 'C:\bakery-secure\pg'; $bin = "$root\edb\bin"; $data = "$root\data"; $log = "$root\logs\pg.log"
$files = "$root\rehearsal-files"; $keys = "$root\rehearsal-keys"; $snap = "$root\snapshots"
$repo = 'C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review'
$sqlDir = "$repo\docs\backup\rehearsal"; $migDir = "$repo\supabase\migrations"
$ageDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\FiloSottile.age_Microsoft.Winget.Source_8wekyb3d8bbwe\age"
$filesFwd = $files.Replace('\', '/')
$U = @{ u1 = '00000000-0000-4000-8000-000000000001'; u2 = '00000000-0000-4000-8000-000000000002'; u3 = '00000000-0000-4000-8000-000000000003'
        u4 = '00000000-0000-4000-8000-000000000004'; u5 = '00000000-0000-4000-8000-000000000005'; u6 = '00000000-0000-4000-8000-000000000006'
        u7 = '00000000-0000-4000-8000-000000000007' }
$restoreDbs = 'bakery_restore_r1', 'bakery_restore_r1b', 'bakery_restore_r2', 'bakery_restore_r4', 'bakery_stage'
$results = New-Object System.Collections.Generic.List[object]
$script:abort = $null

# ───────────────────────── 도우미 ─────────────────────────
function Step([string]$t) { Write-Output ''; Write-Output "== $t ==" }
function Add-Result([string]$id, [string]$kind, [string]$name, [string]$detail = '') {
  $results.Add([pscustomobject]@{ Id = $id; Kind = $kind; Name = $name; Detail = $detail })   # Kind: pass | fail | info
  $icon = switch ($kind) { 'pass' { '✅' } 'fail' { '❌' } default { 'ℹ️ ' } }
  Write-Output ("  {0} {1} {2}{3}" -f $icon, $id, $name, $(if ($detail) { " — $detail" } else { '' }))
}
function Write-Utf8([string]$path, [string]$text) { [IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding($false))) }
function Get-PgProcs { @(Get-Process -Name postgres -ErrorAction SilentlyContinue) }
function Test-Tcp([string]$addr, [int]$port, [int]$ms = 3000) {
  $ip = [Net.IPAddress]::Parse($addr); $c = New-Object Net.Sockets.TcpClient($ip.AddressFamily)
  try { $iar = $c.BeginConnect($ip, $port, $null, $null); if ($iar.AsyncWaitHandle.WaitOne($ms) -and $c.Connected) { $c.EndConnect($iar); return $true }; return $false }
  catch { return $false } finally { $c.Close() }
}
function Run-PgCtl([string[]]$ctlArgs, [int]$waitSec) {
  $p = Start-Process -FilePath "$bin\pg_ctl.exe" -ArgumentList $ctlArgs -WindowStyle Hidden -PassThru
  if (-not $p.WaitForExit($waitSec * 1000)) { return @{ exited = $false; code = $null } }
  return @{ exited = $true; code = $p.ExitCode }
}
function Stop-PgSafe {
  if ((Get-PgProcs).Count -eq 0 -and -not (Test-Path "$data\postmaster.pid")) { Write-Output '(서버가 실행 중이 아니에요)'; return }
  Write-Output "pg_ctl stop -m fast -w -t 60 ($(Get-Date -Format 'HH:mm:ss'))"
  $r = Run-PgCtl @('-D', $data, 'stop', '-m', 'fast', '-w', '-t', '60') 75
  Write-Output ("pg_ctl stop 결과: exited={0} code={1}" -f $r.exited, $r.code)
}
function Use-LocalPgEnv {
  $env:PGHOST = '127.0.0.1'; $env:PGPORT = '54329'; $env:PGUSER = 'postgres'; $env:PGCLIENTENCODING = 'UTF8'
  $env:PGPASSWORD = [IO.File]::ReadAllText("$root\secrets\pg-test-pw.txt"); $env:PSQL_HISTORY = "$root\logs\psql_history"
}
function Assert-LocalOnly { if ($env:PGHOST -ne '127.0.0.1' -or $env:PGPORT -ne '54329') { throw '접속 대상이 127.0.0.1:54329가 아니에요. 중단합니다.' } }
function Clear-PgEnv { Remove-Item Env:PGPASSWORD, Env:PGHOST, Env:PGPORT, Env:PGUSER, Env:PGCLIENTENCODING, Env:PSQL_HISTORY -ErrorAction SilentlyContinue }

function Psql([string]$Db, [string[]]$PsqlArgs, [string]$OutFile = '', [bool]$StopOnError = $true) {
  Assert-LocalOnly
  $a = @('-X', '-w', '-d', $Db) + $(if ($StopOnError) { @('-v', 'ON_ERROR_STOP=1') } else { @() }) + $PsqlArgs
  if ($OutFile) { $a += @('-o', $OutFile) }
  $out = & "$bin\psql.exe" @a 2>&1
  [pscustomobject]@{ Code = $LASTEXITCODE; Out = @($out | ForEach-Object { "$_" }) }
}
function PsqlFile([string]$Db, [string]$File, [string]$OutFile = '', [switch]$Quiet) { Psql $Db (@('-f', $File) + $(if ($Quiet) { @('-At') } else { @() })) $OutFile }
function PsqlScalar([string]$Db, [string]$Sql) { $r = Psql $Db @('-At', '-c', $Sql); if ($r.Code -ne 0) { return $null }; return (($r.Out -join "`n").Trim()) }
function Invoke-Tool([string]$Name, [string[]]$ToolArgs) {
  Assert-LocalOnly
  $out = & "$bin\$Name.exe" @ToolArgs 2>&1
  [pscustomobject]@{ Code = $LASTEXITCODE; Out = @($out | ForEach-Object { "$_" }) }
}
function New-Db([string]$name) {
  $r = Psql 'postgres' @('-c', "create database $name encoding 'UTF8' template template0 locale 'C'")
  if ($r.Code -ne 0) { throw "DB 생성 실패: $name :: $($r.Out -join ' ')" }
}
function Apply-Migrations([string]$db, [string[]]$names) {
  $bad = @(); foreach ($n in $names) { $r = PsqlFile $db "$migDir\$n" '' -Quiet; if ($r.Code -ne 0) { $bad += "$n :: $(($r.Out | Select-Object -Last 2) -join ' ')" } }
  return $bad
}
function Restore-Errors($r) { @($r.Out | Where-Object { $_ -match '^pg_restore: (error|warning):' }) }
function Get-Report([string]$db, [string]$name) {
  $out = "$files\report-$name.txt"; $r = PsqlFile $db "$sqlDir\20-report.sql" $out
  if ($r.Code -ne 0) { throw "보고서 생성 실패($db): $($r.Out -join ' ')" }
  return @(Get-Content $out -Encoding UTF8 | Where-Object { $_ })
}
function Diff-Lines($a, $b, [scriptblock]$Filter = { $true }) {
  $fa = @($a | Where-Object $Filter); $fb = @($b | Where-Object $Filter)
  if ($fa.Count -eq 0 -and $fb.Count -eq 0) { return @() }
  return @(Compare-Object $fa $fb)
}
function Sample([object[]]$lines, [int]$n = 4) {
  $parts = foreach ($l in ($lines | Select-Object -First $n)) {
    $t = ($l.InputObject -replace '\s+', ' ')
    if ($t.Length -gt 110) { $t = $t.Substring(0, 110) }
    "$t [$($l.SideIndicator)]"
  }
  return ($parts -join ' ; ')
}

# 설계 수정안 (실패한 시험마다 보여줘요)
$remedy = @{
  'T07.trigger'   = 'public 덤프에 auth.users 트리거가 없어요 → 복구 절차에 50-reapply-outside-public.sql(트리거 재적용) 단계를 넣고, 계정 복원 뒤 · 앱 열기 전에 실행해요.'
  'T07.storage'   = 'storage.objects 정책이 덤프에 없어요 → 복구 절차에 마이그레이션 0003 · 0008 · 0010(저장소 정책) 재적용 단계를 넣어요.'
  'T07.bucket'    = 'photos 버킷 행이 덤프에 없어요 → 0003 재적용(버킷 행 포함)으로 만들어요. 사진 파일은 백업에 없다는 점도 함께 안내해요.'
  'T07.grant'     = '--no-privileges 때문에 GRANT가 빠져요 → public 덤프에서 --no-privileges를 빼고(대상 프로젝트에 anon/authenticated/service_role 역할이 있어야 함) 복원 뒤 권한 비교로 확인해요. 또는 권한만 따로 재적용하는 SQL을 만들어요.'
}

# ───────────────────────── 정리 모드 ─────────────────────────
if ($Mode -eq 'Cleanup') {
  try {
    Step '정리 대상 목록'
    foreach ($p in $files, $keys) { Write-Output ("  폴더: {0} -> {1}" -f $p, $(if (Test-Path $p) { "있음 ($((Get-ChildItem $p -Recurse -File -Force | Measure-Object).Count)개 파일)" } else { '없음' })) }
    Write-Output ("  시험 DB(삭제 후보): {0}" -f ($restoreDbs -join ', '))
    Write-Output '  (bakery_rehearsal 은 삭제 후 빈 DB로 다시 만들어요 / anon · authenticated · service_role 역할은 남겨요 — README의 수동 삭제 방법 참고)'
    if (-not $ConfirmDelete) { Write-Output '※ -ConfirmDelete 를 붙이면 실제로 삭제해요. 지금은 목록만 보여줬어요.'; return }
    Step '삭제 실행 (-ConfirmDelete)'
    if ((Get-PgProcs).Count -eq 0) { $r = Run-PgCtl @('-D', $data, '-l', $log, '-w', '-t', '60', 'start') 80; Write-Output ("서버 시작 code=$($r.code)") }
    Use-LocalPgEnv; Assert-LocalOnly
    foreach ($d in $restoreDbs) { $x = Psql 'postgres' @('-c', "drop database if exists $d with (force)"); Write-Output ("  DB {0}: code={1}" -f $d, $x.Code) }
    $x = Psql 'postgres' @('-c', 'drop database if exists bakery_rehearsal with (force)'); $y = Psql 'postgres' @('-c', "create database bakery_rehearsal encoding 'UTF8' template template0 locale 'C'")
    Write-Output ("  bakery_rehearsal 초기화: drop code={0}, create code={1}" -f $x.Code, $y.Code)
    foreach ($p in $files, $keys) { if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force; Write-Output "  삭제: $p" } }
  } finally { Clear-PgEnv; Stop-PgSafe }
  return
}

# ───────────────────────── 시험 실행 ─────────────────────────
try {
  Step 'C0) 사전 점검'
  $rec = @{}; Get-Content "$snap\zip-file-hashes.txt" -Encoding UTF8 | ForEach-Object { $p = $_ -split ' \| '; if ($p.Count -eq 3) { $rec[$p[0].ToLower()] = $p[2] } }
  $hashOk = $true; foreach ($n in 'postgres', 'pg_ctl', 'psql', 'pg_dump', 'pg_restore') { if ($rec["bin\$n.exe"] -ne (Get-FileHash "$bin\$n.exe" -Algorithm SHA256).Hash.ToLower()) { $hashOk = $false } }
  $elev = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  $envHits = @(Get-ChildItem Env: | Where-Object { $_.Name -match '^(PG|DATABASE_URL|SUPABASE|POSTGRES)' }).Count
  $migs = Get-ChildItem $migDir -Filter '*.sql' | Sort-Object Name | ForEach-Object Name
  $needSql = '00-auth-stub.sql', '10-fake-seed.sql', '20-report.sql', '30-quarantine-functions.sql', '31-quarantine-tests.sql', '50-reapply-outside-public.sql'
  $checks = @(
    @('실행 파일 해시 동일', $hashOk),
    @('관리자(올린 권한) 세션 아님', (-not $elev)),
    @('PG*/DATABASE_URL/SUPABASE* 환경변수 0개', ($envHits -eq 0)),
    @('54329 포트 비어 있음 / postgres 프로세스 없음 / postmaster.pid 없음', ((-not [bool](Get-NetTCPConnection -LocalPort 54329 -ErrorAction SilentlyContinue)) -and ((Get-PgProcs).Count -eq 0) -and -not (Test-Path "$data\postmaster.pid"))),
    @('age / age-keygen 있음', ((Test-Path "$ageDir\age.exe") -and (Test-Path "$ageDir\age-keygen.exe"))),
    @('마이그레이션 10개 + 시험용 SQL 6개 있음', (($migs.Count -eq 10) -and (@($needSql | Where-Object { -not (Test-Path "$sqlDir\$_") }).Count -eq 0))),
    @('이전 실행 흔적 없음(rehearsal-files · rehearsal-keys)', (-not (Test-Path $files) -and -not (Test-Path $keys))),
    @('산출물 폴더가 Git 저장소 · OneDrive 밖', (-not ($files + $keys).Contains('my-first-website-main') -and -not $files.StartsWith($env:OneDrive, [StringComparison]::OrdinalIgnoreCase)))
  )
  $failed = 0; foreach ($c in $checks) { Write-Output ('  {0,-62} {1}' -f $c[0], $c[1]); if (-not $c[1]) { $failed++ } }
  if ($failed) { $script:abort = '사전 점검 실패'; throw $script:abort }
  $lan = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notmatch '^169\.254' } | Select-Object -First 1).IPAddress
  New-Item -ItemType Directory -Path $files, $keys -Force | Out-Null
  & ([scriptblock]::Create((Get-Content -Raw -LiteralPath "$repo\docs\backup\snapshot.ps1" -Encoding UTF8))) -Out "$snap\before-gateC.txt"

  Step "C0-2) 서버 시작 ($(Get-Date -Format 'HH:mm:ss'), 서비스 등록 없음) + 바인딩 · 외부 차단 확인"
  $r = Run-PgCtl @('-D', $data, '-l', $log, '-w', '-t', '60', 'start') 80
  Write-Output ("  pg_ctl start: exited={0} code={1} / 프로세스 {2}개" -f $r.exited, $r.code, (Get-PgProcs).Count)
  if (-not $r.exited -or $r.code -ne 0) { $script:abort = '서버 시작 실패'; throw $script:abort }
  $ui = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'consent' -or $_.MainWindowTitle -match 'User Account Control|사용자 계정 컨트롤|Security Alert|보안 경고|방화벽|Firewall' })
  if ($ui.Count) { $script:abort = 'UAC 또는 방화벽 관련 창 감지'; throw $script:abort }
  $pids = (Get-PgProcs) | ForEach-Object { $_.Id }
  $listen = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $pids -contains $_.OwningProcess })
  $bad = @($listen | Where-Object { $_.LocalAddress -ne '127.0.0.1' -or $_.LocalPort -ne 54329 })
  Write-Output ("  리스닝: " + (($listen | ForEach-Object { "$($_.LocalAddress):$($_.LocalPort)" }) -join ', ') + " / 다른 주소 {0}개" -f $bad.Count)
  $okLocal = Test-Tcp '127.0.0.1' 54329; $okExt = Test-Tcp $lan 54329; $okV6 = Test-Tcp '::1' 54329
  Write-Output ("  연결: 127.0.0.1={0}(True), {1}={2}(False), ::1={3}(False)" -f $okLocal, $lan, $okExt, $okV6)
  if ($listen.Count -ne 1 -or $bad.Count -gt 0 -or -not $okLocal -or $okExt -or $okV6) { $script:abort = '리스닝 주소/외부 차단 확인 실패'; throw $script:abort }
  Use-LocalPgEnv; Assert-LocalOnly
  $existing = PsqlScalar 'postgres' "select string_agg(datname, ',') from pg_database where datname like 'bakery_%'"
  Write-Output "  현재 bakery_* DB: $existing"
  if ($existing -ne 'bakery_rehearsal') { $script:abort = "예상 밖의 DB 상태($existing) — 정리 후 다시 해요"; throw $script:abort }
  $objs = PsqlScalar 'bakery_rehearsal' "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname not in ('pg_catalog','information_schema','pg_toast')"
  if ($objs -ne '0') { $script:abort = "bakery_rehearsal 이 비어 있지 않아요($objs)"; throw $script:abort }

  # ── C1 원본 준비 ──
  Step 'C1) 원본 DB 준비: 가짜 Supabase 기본 환경 + 마이그레이션 10개 + 가짜 데이터'
  $r = PsqlFile 'bakery_rehearsal' "$sqlDir\00-auth-stub.sql" '' -Quiet
  Add-Result 'T01a' $(if ($r.Code -eq 0) { 'pass' } else { 'fail' }) '가짜 auth · storage 기본 환경 적용' $(if ($r.Code -ne 0) { ($r.Out | Select-Object -Last 2) -join ' ' } else { '' })
  $badMig = Apply-Migrations 'bakery_rehearsal' $migs
  Add-Result 'T01b' $(if ($badMig.Count -eq 0) { 'pass' } else { 'fail' }) '마이그레이션 0001~0010이 오류 없이 적용' $(if ($badMig.Count) { $badMig -join ' | ' } else { "$($migs.Count)개 파일" })
  if ($badMig.Count -or $r.Code -ne 0) { $script:abort = '원본 준비 실패 — 이후 시험을 진행하지 않아요'; throw $script:abort }
  $seed = PsqlFile 'bakery_rehearsal' "$sqlDir\10-fake-seed.sql" '' -Quiet
  $got = @{}; foreach ($l in $seed.Out) { if ($l -match '^SEED\|([^|]+)\|(\d+)$') { $got[$Matches[1]] = [int]$Matches[2] } }
  $want = [ordered]@{ 'auth.users' = 6; 'auth.identities' = 6; 'profiles(트리거로 자동 생성)' = 6; 'bakeries' = 3; 'reviews' = 7; 'bakery_visits' = 2; 'posts' = 3; 'comments' = 3; 'post_likes' = 2; 'reports' = 2; 'admins' = 1; 'storage.objects' = 1; 'auth.sessions' = 2; 'auth.refresh_tokens' = 2; 'auth.one_time_tokens' = 1; 'auth.audit_log_entries' = 2 }
  $wrong = @($want.Keys | Where-Object { $got[$_] -ne $want[$_] } | ForEach-Object { "$_=$($got[$_])(기대 $($want[$_]))" })
  Add-Result 'T02' $(if ($seed.Code -eq 0 -and $wrong.Count -eq 0) { 'pass' } else { 'fail' }) '가짜 데이터 입력 + 프로필 자동 생성 트리거 동작 + 기대 건수 일치' $(if ($wrong.Count) { $wrong -join ', ' } elseif ($seed.Code -ne 0) { ($seed.Out | Select-Object -Last 2) -join ' ' } else { '16개 항목 모두 일치' })
  if ($seed.Code -ne 0 -or $wrong.Count) { $script:abort = '가짜 데이터 입력 실패 — 이후 시험을 진행하지 않아요'; throw $script:abort }
  $repSource = Get-Report 'bakery_rehearsal' 'source'

  # ── C4 백업 (워크플로와 같은 명령) ──
  Step 'C4) 백업: 워크플로(backup-db.yml.draft)와 같은 pg_dump 2개 + 권한 포함 변형 1개'
  $pub = "$files\public.dump"; $auth = "$files\auth-users.dump"; $pubPriv = "$files\public-with-privileges.dump"
  $d1 = Invoke-Tool 'pg_dump' @('--format=custom', '--no-owner', '--no-privileges', '--schema=public', '-d', 'bakery_rehearsal', '--file', $pub)
  $d2 = Invoke-Tool 'pg_dump' @('--format=custom', '--no-owner', '--no-privileges', '--data-only', '--table=auth.users', '--table=auth.identities', '-d', 'bakery_rehearsal', '--file', $auth)
  $d3 = Invoke-Tool 'pg_dump' @('--format=custom', '--no-owner', '--schema=public', '-d', 'bakery_rehearsal', '--file', $pubPriv)
  Add-Result 'T03a' $(if ($d1.Code -eq 0 -and $d2.Code -eq 0 -and $d3.Code -eq 0) { 'pass' } else { 'fail' }) 'pg_dump 3개 실행 성공' (($d1.Code, $d2.Code, $d3.Code) -join '/')
  $lp = Invoke-Tool 'pg_restore' @('--list', $pub); $la = Invoke-Tool 'pg_restore' @('--list', $auth)
  $pubEntries = @($lp.Out | Where-Object { $_ -match '^\d+;' }).Count; $authData = @($la.Out | Where-Object { $_ -match 'TABLE DATA' }).Count
  Add-Result 'T03b' $(if ($pubEntries -gt 20 -and $authData -eq 2) { 'pass' } else { 'fail' }) '덤프 목록 검사(워크플로 조건): public 항목 > 20, 계정 덤프의 TABLE DATA = 2' "public=$pubEntries, auth TABLE DATA=$authData"
  $excl = @($lp.Out + $la.Out | Where-Object { $_ -match 'sessions|refresh_tokens|one_time_tokens|audit_log_entries' })
  Add-Result 'T03c' $(if ($excl.Count -eq 0) { 'pass' } else { 'fail' }) '세션 · 토큰 · 감사 로그 표가 두 덤프 어디에도 없음' $(if ($excl.Count) { ($excl | Select-Object -First 3) -join ' | ' } else { '' })
  Push-Location $files; $null = & tar -cf bundle.tar public.dump auth-users.dump 2>&1; $tarCode = $LASTEXITCODE; Pop-Location

  # ── 임시 age 키 3개 (운영 키가 아니에요) + 암호화 · 복호화 ──
  Step 'C4-2) 임시 age 키 3개 생성(운영 키와 완전히 분리) → 받는 사람 2명으로 암호화 → 복호화 시험'
  foreach ($n in 1, 2, 3) { $null = & "$ageDir\age-keygen.exe" -o "$keys\rehearsal-key-$n.txt" 2>&1 }
  $pk1 = (& "$ageDir\age-keygen.exe" -y "$keys\rehearsal-key-1.txt"); $pk2 = (& "$ageDir\age-keygen.exe" -y "$keys\rehearsal-key-2.txt")
  $keyAcl = (icacls $keys) | Where-Object { $_ -and $_ -notmatch '^Successfully' } | Select-Object -First 2
  Write-Output ('  키 폴더 접근 권한: ' + ($keyAcl -join ' '))
  $null = & "$ageDir\age.exe" -r $pk1 -r $pk2 -o "$files\bakery-db-test.tar.age" "$files\bundle.tar" 2>&1; $encCode = $LASTEXITCODE
  $cipher = [Text.Encoding]::GetEncoding(28591).GetString([IO.File]::ReadAllBytes("$files\bakery-db-test.tar.age"))
  Add-Result 'T04a' $(if ($tarCode -eq 0 -and $encCode -eq 0 -and -not $cipher.Contains('example.invalid') -and -not $cipher.Contains('FAKE')) { 'pass' } else { 'fail' }) 'tar 묶음 + age 암호화 성공, 암호문에 가짜 평문이 보이지 않음' "tar=$tarCode, age=$encCode"
  $h0 = (Get-FileHash "$files\bundle.tar" -Algorithm SHA256).Hash
  $null = & "$ageDir\age.exe" -d -i "$keys\rehearsal-key-1.txt" -o "$files\out1.tar" "$files\bakery-db-test.tar.age" 2>&1; $c1 = $LASTEXITCODE
  $null = & "$ageDir\age.exe" -d -i "$keys\rehearsal-key-2.txt" -o "$files\out2.tar" "$files\bakery-db-test.tar.age" 2>&1; $c2 = $LASTEXITCODE
  $null = & "$ageDir\age.exe" -d -i "$keys\rehearsal-key-3.txt" -o "$files\out3.tar" "$files\bakery-db-test.tar.age" 2>&1; $c3 = $LASTEXITCODE
  $m1 = (Test-Path "$files\out1.tar") -and ((Get-FileHash "$files\out1.tar" -Algorithm SHA256).Hash -eq $h0)
  $m2 = (Test-Path "$files\out2.tar") -and ((Get-FileHash "$files\out2.tar" -Algorithm SHA256).Hash -eq $h0)
  Add-Result 'T04b' $(if ($c1 -eq 0 -and $c2 -eq 0 -and $m1 -and $m2) { 'pass' } else { 'fail' }) '키1만 · 키2만으로 각각 복호화되고 원본 tar와 해시 동일' "키1 code=$c1 일치=$m1 / 키2 code=$c2 일치=$m2"
  Add-Result 'T04c' $(if ($c3 -ne 0 -and -not (Test-Path "$files\out3.tar")) { 'pass' } else { 'fail' }) '무관한 키3은 복호화가 거부됨' "code=$c3"
  New-Item -ItemType Directory -Path "$files\from-age" -Force | Out-Null
  Push-Location "$files\from-age"; $null = & tar -xf "$files\out1.tar" 2>&1; Pop-Location
  $sameDump = ((Get-FileHash "$files\from-age\public.dump" -Algorithm SHA256).Hash -eq (Get-FileHash $pub -Algorithm SHA256).Hash) -and ((Get-FileHash "$files\from-age\auth-users.dump" -Algorithm SHA256).Hash -eq (Get-FileHash $auth -Algorithm SHA256).Hash)
  Add-Result 'T04d' $(if ($sameDump) { 'pass' } else { 'fail' }) '복호화 → tar 풀기로 나온 두 덤프가 원본 덤프와 동일 (이후 복원은 이 파일로 해요)'
  if (-not $sameDump) { $script:abort = '복호화한 덤프가 원본과 달라서 이후 복원 시험을 진행하지 않아요'; throw $script:abort }
  $pubR = "$files\from-age\public.dump"; $authR = "$files\from-age\auth-users.dump"

  # ── C6 "백업 이후" 변화 흉내 ──
  Step 'C6) 백업 이후의 변화를 원본에 흉내: 가짜 회원 탈퇴 · 신규 가입 · 일부 데이터 손실'
  $after = @'
\set ON_ERROR_STOP on
delete from auth.users where id = '00000000-0000-4000-8000-000000000006';
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'fake-7@example.invalid', 'FAKE_HASH_do_not_use_0007', now(), '{"nickname":"가짜신규7","terms_version":"2026-10-draft1"}', now(), now());
delete from public.reviews where user_id = '00000000-0000-4000-8000-000000000002';
delete from public.posts where user_id = '00000000-0000-4000-8000-000000000002';
'@
  Write-Utf8 "$files\c6-after-backup.sql" $after
  $c6 = PsqlFile 'bakery_rehearsal' "$files\c6-after-backup.sql" '' -Quiet
  $w = PsqlScalar 'bakery_rehearsal' "select (select count(*) from auth.users where id = '$($U.u6)') || '/' || (select count(*) from public.profiles where id = '$($U.u6)') || '/' || (select count(*) from public.reviews where user_id = '$($U.u6)') || '/' || (select count(*) from public.reports where target_user_id = '$($U.u6)') || '/' || (select count(*) from public.reports where reporter_id is null)"
  Add-Result 'T05f' $(if ($c6.Code -eq 0 -and $w -eq '0/0/0/1/1') { 'pass' } else { 'fail' }) '탈퇴 흉내 확인: 계정 · 프로필 · 일지는 연쇄 삭제, 신고 기록은 남고 신고자 연결만 끊김(0009)' "계정/프로필/일지/대상신고/신고자null = $w (기대 0/0/0/1/1)"
  $null = Psql 'bakery_rehearsal' @('-At', '-c', 'select id from auth.users order by id') "$files\roster.csv"
  $repProd = Get-Report 'bakery_rehearsal' 'prod-after'

  # ── R1 복원 (워크플로 그대로, 빈 새 DB) ──
  Step 'R1) 복원: 빈 새 DB에 "가짜 Supabase 기본 환경" → 계정 데이터 → public 덤프 (마이그레이션은 적용하지 않음)'
  New-Db 'bakery_restore_r1'
  $null = PsqlFile 'bakery_restore_r1' "$sqlDir\00-auth-stub.sql" '' -Quiet
  $ra = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', 'bakery_restore_r1', $authR)
  $rp = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '-d', 'bakery_restore_r1', $pubR)
  $errs = @((Restore-Errors $ra) + (Restore-Errors $rp))
  Add-Result 'T05a' $(if ($errs.Count -eq 0) { 'pass' } else { 'fail' }) 'pg_restore 오류 0개 (계정 → public 순서)' $(if ($errs.Count) { "오류 $($errs.Count)개: " + (($errs | Select-Object -First 3) -join ' | ') } else { '' })
  $rep1 = Get-Report 'bakery_restore_r1' 'r1'
  $dRows = Diff-Lines $repSource $rep1 { $_ -match '^1\.rows\|public\.' }
  Add-Result 'T05b' $(if ($dRows.Count -eq 0) { 'pass' } else { 'fail' }) 'public 모든 표의 행 수 · 행 체크섬이 원본과 같음' $(if ($dRows.Count) { Sample $dRows } else { '' })
  $dAuth = Diff-Lines $repSource $rep1 { $_ -match '^1\.rows\|auth\.(users|identities)\|' }
  Add-Result 'T05c' $(if ($dAuth.Count -eq 0) { 'pass' } else { 'fail' }) 'auth.users · auth.identities 행 수 · 행 체크섬 일치' $(if ($dAuth.Count) { Sample $dAuth } else { '' })
  $dAcc = Diff-Lines $repSource $rep1 { $_ -match '^2\.account\|' }
  Add-Result 'T05d' $(if ($dAcc.Count -eq 0) { 'pass' } else { 'fail' }) '비밀번호 해시 · raw_user_meta_data · 약관 동의 기록(terms_version · terms_agreed_at) · identities.email 생성 칸 보존' $(if ($dAcc.Count) { Sample $dAcc } else { '' })
  $exCounts = @('sessions', 'refresh_tokens', 'one_time_tokens', 'audit_log_entries' | ForEach-Object { $t = $_; ($rep1 | Where-Object { $_ -like "1.rows|auth.$t|*" }) -replace '^1\.rows\|auth\.[^|]+\|', '' })
  Add-Result 'T05e' $(if (@($exCounts | Where-Object { $_ -notlike '0 /*' }).Count -eq 0) { 'pass' } else { 'fail' }) '백업에 넣지 않기로 한 표(세션 · 토큰 · 감사 로그)가 복원본에서 비어 있음' ($exCounts -join ' ; ')
  $dCon = Diff-Lines $repSource $rep1 { $_ -match '^3\.constraint\|' }
  $notVal = @($rep1 | Where-Object { $_ -match '^3\.constraint\|' -and $_ -match 'validated=false' })
  Add-Result 'T06' $(if ($dCon.Count -eq 0 -and $notVal.Count -eq 0) { 'pass' } else { 'fail' }) '외래키 · 검사 제약조건이 모두 복원되고 검증됨(validated=true)' $(if ($dCon.Count) { Sample $dCon } elseif ($notVal.Count) { "검증 안 된 제약 $($notVal.Count)개" } else { '' })

  # 4가지 가설 (각각 따로)
  $srcTrig = @($repSource | Where-Object { $_ -like '4.trigger|auth.users on_auth_user_created|*' }).Count; $r1Trig = @($rep1 | Where-Object { $_ -like '4.trigger|auth.users on_auth_user_created|*' }).Count
  Add-Result 'T07.trigger' $(if ($srcTrig -eq 1 -and $r1Trig -eq 1) { 'pass' } else { 'fail' }) '프로필 자동 생성 트리거(auth.users)가 백업에 포함되는가' "원본 $srcTrig개 / 복원본 $r1Trig개"
  $srcSp = @($repSource | Where-Object { $_ -like '5.policy|storage.objects *' }).Count; $r1Sp = @($rep1 | Where-Object { $_ -like '5.policy|storage.objects *' }).Count
  Add-Result 'T07.storage' $(if ($srcSp -gt 0 -and $srcSp -eq $r1Sp) { 'pass' } else { 'fail' }) 'storage.objects 정책이 백업에 포함되는가' "원본 $srcSp개 / 복원본 $r1Sp개"
  $srcB = @($repSource | Where-Object { $_ -like '10.bucket|photos|*' }).Count; $r1B = @($rep1 | Where-Object { $_ -like '10.bucket|photos|*' }).Count
  Add-Result 'T07.bucket' $(if ($srcB -eq 1 -and $r1B -eq 1) { 'pass' } else { 'fail' }) 'photos 버킷 정보가 백업에 포함되는가' "원본 $srcB개 / 복원본 $r1B개"
  $acl = { $_ -match '^6\.acl\|(table|column|function) public\.' }
  $dAcl = Diff-Lines $repSource $rep1 $acl
  Add-Result 'T07.grant' $(if ($dAcl.Count -eq 0) { 'pass' } else { 'fail' }) 'GRANT 권한(표 · 열 · 함수)이 백업에 포함되는가 (--no-privileges 워크플로 기준)' $(if ($dAcl.Count) { "다른 줄 $($dAcl.Count)개: " + (Sample $dAcl 3) } else { '' })
  $dOther = Diff-Lines $repSource $rep1 { $_ -match '^(5\.policy\|(public\.|RLS public\.)|7\.function|8\.view|9\.index)' }
  Add-Result 'T07.etc' $(if ($dOther.Count -eq 0) { 'pass' } else { 'fail' }) '그 밖의 public 구조(정책 · RLS 켜짐 · 함수 · 보기 · 인덱스)는 원본과 같음' $(if ($dOther.Count) { Sample $dOther } else { '' })

  # ── R1b 권한 포함 덤프 + 재적용 = 설계 수정안 검증 ──
  Step 'R1b) 설계 수정안 검증: 권한 포함 덤프 복원 + public 밖 객체 재적용(트리거 · storage 정책 · 버킷)'
  New-Db 'bakery_restore_r1b'
  $null = PsqlFile 'bakery_restore_r1b' "$sqlDir\00-auth-stub.sql" '' -Quiet
  $xa = Invoke-Tool 'pg_restore' @('--no-owner', '--data-only', '-d', 'bakery_restore_r1b', $authR)
  $xp = Invoke-Tool 'pg_restore' @('--no-owner', '-d', 'bakery_restore_r1b', $pubPriv)
  $xerr = @((Restore-Errors $xa) + (Restore-Errors $xp))
  Add-Result 'T08a' $(if ($xerr.Count -eq 0) { 'pass' } else { 'fail' }) '권한 포함 덤프 복원 오류 0개' $(if ($xerr.Count) { "오류 $($xerr.Count)개: " + (($xerr | Select-Object -First 3) -join ' | ') } else { '' })
  $rep1b0 = Get-Report 'bakery_restore_r1b' 'r1b-before-repair'
  $dAclB = Diff-Lines $repSource $rep1b0 $acl
  Add-Result 'T08b' $(if ($dAclB.Count -eq 0) { 'pass' } else { 'fail' }) '권한 포함 덤프는 public 표 · 열 · 함수의 GRANT가 원본과 같음' $(if ($dAclB.Count) { "다른 줄 $($dAclB.Count)개: " + (Sample $dAclB 3) } else { '' })
  $fix = @(); $null = PsqlFile 'bakery_restore_r1b' "$sqlDir\50-reapply-outside-public.sql" '' -Quiet
  foreach ($m in '0003_storage.sql', '0008_storage_select_own.sql', '0010_storage_admin.sql') { $q = PsqlFile 'bakery_restore_r1b' "$migDir\$m" '' -Quiet; if ($q.Code -ne 0) { $fix += "$m :: $(($q.Out | Select-Object -Last 1))" } }
  $rep1b = Get-Report 'bakery_restore_r1b' 'r1b-after-repair'
  $expectedGone = { $_ -notmatch '^1\.rows\|(auth\.(sessions|refresh_tokens|one_time_tokens|audit_log_entries)|storage\.objects)\|' }
  $dFull = Diff-Lines $repSource $rep1b $expectedGone
  Add-Result 'T08c' $(if ($fix.Count -eq 0 -and $dFull.Count -eq 0) { 'pass' } else { 'fail' }) '수리 후 전체 보고서가 원본과 일치 (백업에 넣지 않기로 한 세션 · 토큰 · 감사 로그 · 사진 파일 기록만 다름)' $(if ($fix.Count) { $fix -join ' | ' } elseif ($dFull.Count) { "다른 줄 $($dFull.Count)개: " + (Sample $dFull 4) } else { '' })
  $defA = ($repSource | Where-Object { $_ -like '4.trigger|auth.users on_auth_user_created|*' }); $defB = ($rep1b | Where-Object { $_ -like '4.trigger|auth.users on_auth_user_created|*' })
  Add-Result 'T08d' $(if ($defA -and $defA -eq $defB) { 'pass' } else { 'fail' }) '50-reapply-outside-public.sql 의 트리거 정의가 마이그레이션 0001의 정의와 동일'

  # ── R2 순서 충돌 재현 ──
  Step 'R2) 충돌 재현: 마이그레이션(트리거 포함)을 먼저 적용한 DB에 계정 → public 데이터를 복원하면?'
  New-Db 'bakery_restore_r2'
  $null = PsqlFile 'bakery_restore_r2' "$sqlDir\00-auth-stub.sql" '' -Quiet
  $b2 = Apply-Migrations 'bakery_restore_r2' $migs
  $ya = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', 'bakery_restore_r2', $authR)
  $autoProfiles = PsqlScalar 'bakery_restore_r2' 'select count(*) from public.profiles'
  Add-Result 'T09a' 'info' '트리거가 있는 DB에 계정을 복원하면 프로필이 자동 생성되는가' "프로필 $autoProfiles개 자동 생성(원본 계정 6개), 계정 복원 오류 $((Restore-Errors $ya).Count)개, 마이그레이션 실패 $($b2.Count)개"
  $yp = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', 'bakery_restore_r2', $pubR)
  $yerrs = Restore-Errors $yp
  $cnt2 = PsqlScalar 'bakery_restore_r2' "select (select count(*) from public.profiles) || '/' || (select count(*) from public.reviews) || '/' || (select count(*) from public.posts)"
  Add-Result 'T09b' 'info' '이 순서로 public 데이터를 복원하면 충돌 · 오류가 나는가 (README 9장·재확인 설계의 설명이 맞는지)' "pg_restore 오류 $($yerrs.Count)개, 복원 후 프로필/일지/글 = $cnt2 (원본 6/7/3). 첫 오류: $((($yerrs | Select-Object -First 1) -replace '\s+', ' '))"

  # ── R3 상황 A ──
  Step 'R3) 상황 A: 운영 DB가 살아 있을 때 — "지금 살아 있는 계정(명부)" 기준으로만 가져오기'
  $exp = @'
\set ON_ERROR_STOP on
create temp table roster(id uuid primary key);
\copy roster from '{{F}}/roster.csv' with (format csv)
\copy (select r.* from public.reviews r join roster on roster.id = r.user_id) to '{{F}}/a-reviews.csv' with (format csv)
\copy (select p.* from public.posts p join roster on roster.id = p.user_id) to '{{F}}/a-posts.csv' with (format csv)
\copy (select v.* from public.bakery_visits v join roster on roster.id = v.user_id) to '{{F}}/a-visits.csv' with (format csv)
\copy (select c.* from public.comments c join roster on roster.id = c.user_id where c.post_id in (select p.id from public.posts p join roster rr on rr.id = p.user_id)) to '{{F}}/a-comments.csv' with (format csv)
\copy (select l.* from public.post_likes l join roster on roster.id = l.user_id where l.post_id in (select p.id from public.posts p join roster rr on rr.id = p.user_id)) to '{{F}}/a-likes.csv' with (format csv)
select 'EXCL|reviews|' || count(*) from public.reviews r where not exists (select 1 from roster where roster.id = r.user_id);
select 'EXCL|posts|' || count(*) from public.posts p where not exists (select 1 from roster where roster.id = p.user_id);
select 'EXCL|comments|' || count(*) from public.comments c where not exists (select 1 from roster where roster.id = c.user_id) or c.post_id not in (select p.id from public.posts p join roster rr on rr.id = p.user_id);
select 'EXCL|post_likes|' || count(*) from public.post_likes l where not exists (select 1 from roster where roster.id = l.user_id) or l.post_id not in (select p.id from public.posts p join roster rr on rr.id = p.user_id);
'@.Replace('{{F}}', $filesFwd)
  Write-Utf8 "$files\a-export.sql" $exp
  $ex = PsqlFile 'bakery_restore_r1' "$files\a-export.sql" '' -Quiet
  Add-Result 'T10a' $(if ($ex.Code -eq 0) { 'pass' } else { 'fail' }) '스테이징(백업 복원본)에서 명부 기준으로 가져올 행만 내보내기' $(($ex.Out | Where-Object { $_ -like 'EXCL|*' }) -join ' ; ')
  # (1) 트리거를 켠 채로 넣어보기 — 실패해야 해요(작성자 덮어쓰기). 되돌려서 운영 DB는 그대로
  $neg = @'
begin;
create temp table t_reviews (like public.reviews);
\copy t_reviews from '{{F}}/a-reviews.csv' with (format csv)
do $$ begin insert into public.reviews select * from t_reviews; raise notice 'NEG|INSERT_OK'; exception when others then raise notice 'NEG|INSERT_FAILED:%', sqlstate; end $$;
rollback;
'@.Replace('{{F}}', $filesFwd)
  Write-Utf8 "$files\a-negative.sql" $neg
  $ng = PsqlFile 'bakery_rehearsal' "$files\a-negative.sql" '' -Quiet
  $negLine = ($ng.Out | Where-Object { $_ -match 'NEG\|' } | Select-Object -First 1)
  Add-Result 'T10b' 'info' '트리거를 켠 채로 INSERT 하면? (user_id가 auth.uid()로 덮어써져 실패하는 것이 예상) — 실제 운영 절차에서 트리거를 꺼야 하는 이유' "$($negLine -replace '\s+', ' ')"
  # (2) 사용자 트리거를 끄고(표 소유자 권한) INSERT만
  $imp = @'
\set ON_ERROR_STOP on
begin;
alter table public.reviews disable trigger user;
alter table public.posts disable trigger user;
alter table public.comments disable trigger user;
alter table public.post_likes disable trigger user;
alter table public.bakery_visits disable trigger user;
create temp table t_reviews (like public.reviews);
create temp table t_posts (like public.posts);
create temp table t_visits (like public.bakery_visits);
create temp table t_comments (like public.comments);
create temp table t_likes (like public.post_likes);
\copy t_reviews from '{{F}}/a-reviews.csv' with (format csv)
\copy t_posts from '{{F}}/a-posts.csv' with (format csv)
\copy t_visits from '{{F}}/a-visits.csv' with (format csv)
\copy t_comments from '{{F}}/a-comments.csv' with (format csv)
\copy t_likes from '{{F}}/a-likes.csv' with (format csv)
insert into public.reviews select * from t_reviews on conflict do nothing;
insert into public.posts select * from t_posts on conflict do nothing;
insert into public.bakery_visits select * from t_visits on conflict do nothing;
insert into public.comments select * from t_comments where parent_id is null on conflict do nothing;
insert into public.comments select * from t_comments where parent_id is not null on conflict do nothing;
insert into public.post_likes select * from t_likes on conflict do nothing;
alter table public.reviews enable trigger user;
alter table public.posts enable trigger user;
alter table public.comments enable trigger user;
alter table public.post_likes enable trigger user;
alter table public.bakery_visits enable trigger user;
commit;
'@.Replace('{{F}}', $filesFwd)
  Write-Utf8 "$files\a-import.sql" $imp
  $im = PsqlFile 'bakery_rehearsal' "$files\a-import.sql" '' -Quiet
  Add-Result 'T10c' $(if ($im.Code -eq 0) { 'pass' } else { 'fail' }) '운영 DB(시험용)에 INSERT만 실행 (사용자 트리거만 잠시 끄고 다시 켬, 트랜잭션 한 번)' $(if ($im.Code -ne 0) { ($im.Out | Select-Object -Last 2) -join ' ' } else { '' })
  $chkA = PsqlScalar 'bakery_rehearsal' "select (select count(*) from auth.users where id = '$($U.u6)') + (select count(*) from public.profiles where id = '$($U.u6)') + (select count(*) from public.reviews where user_id = '$($U.u6)') + (select count(*) from public.posts where user_id = '$($U.u6)') + (select count(*) from public.comments where user_id = '$($U.u6)') + (select count(*) from public.post_likes where user_id = '$($U.u6)') + (select count(*) from public.bakery_visits where user_id = '$($U.u6)')"
  Add-Result 'T10d' $(if ($chkA -eq '0') { 'pass' } else { 'fail' }) '가짜 탈퇴자의 계정 · 프로필 · 일지 · 글 · 댓글 · 좋아요 · 방문이 가져와지지 않음(되살아나지 않음)' "탈퇴자 행 합계=$chkA"
  $restoredA = PsqlScalar 'bakery_rehearsal' "select (select count(*) from public.reviews where user_id = '$($U.u2)') || '/' || (select count(*) from public.posts where user_id = '$($U.u2)') || '/' || (select count(*) from public.comments where post_id in (select id from public.posts where user_id = '$($U.u2)')) || '/' || (select count(*) from public.post_likes where user_id = '$($U.u3)')"
  Add-Result 'T10e' $(if ($restoredA -eq '2/1/2/1') { 'pass' } else { 'fail' }) '잃어버린 u2의 일지 2 · 글 1 · 그 글의 댓글 2(댓글+답글) · u3의 좋아요 1이 복구됨' "u2 일지/글/댓글, u3 좋아요 = $restoredA (기대 2/1/2/1)"
  $usersNow = PsqlScalar 'bakery_rehearsal' 'select (select count(*) from auth.users) || '' / '' || (select count(*) from public.profiles)'
  Add-Result 'T10f' $(if ($usersNow -eq '6 / 6') { 'pass' } else { 'fail' }) '회원 수가 늘지 않음(계정은 건드리지 않음): 계정 / 프로필' "$usersNow (u1~u5 + 백업 이후 가입한 u7 = 6)"
  $mdProd = PsqlScalar 'bakery_rehearsal' "select md5(string_agg(id::text || created_at::text || exp_review::text || exp_photo::text, ',' order by id)) from public.reviews where user_id = '$($U.u2)'"
  $mdStage = PsqlScalar 'bakery_restore_r1' "select md5(string_agg(id::text || created_at::text || exp_review::text || exp_photo::text, ',' order by id)) from public.reviews where user_id = '$($U.u2)'"
  Add-Result 'T10g' $(if ($mdProd -and $mdProd -eq $mdStage) { 'pass' } else { 'fail' }) '가져온 일지의 원래 작성 날짜 · EXP 칸이 백업과 같음(트리거를 끈 덕분)'
  $dup = PsqlScalar 'bakery_rehearsal' "select count(*) from (select user_id, bakery_id from public.reviews group by 1,2 having count(*) > 1) s"
  Add-Result 'T10h' $(if ($dup -eq '0') { 'pass' } else { 'fail' }) '중복 행이 생기지 않음(같은 사용자 · 같은 빵집 일지 중복 0)' "중복=$dup"
  $trigState = PsqlScalar 'bakery_rehearsal' "select string_agg(distinct tgenabled::text, ',') from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not t.tgisinternal"
  Add-Result 'T10i' $(if ($trigState -eq 'O') { 'pass' } else { 'fail' }) '가져온 뒤 사용자 트리거가 모두 다시 켜져 있음(tgenabled=O)' "상태=$trigState"

  # ── R4 상황 B ──
  Step 'R4) 상황 B: 운영 DB 전체 손실 — 격리(quarantine) 프로토타입 (설계 검증, 구현 아님)'
  New-Db 'bakery_stage'
  $null = PsqlFile 'bakery_stage' "$sqlDir\00-auth-stub.sql" '' -Quiet
  $null = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', 'bakery_stage', $authR)
  $sp = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '-d', 'bakery_stage', $pubR)
  $mv = @'
\set ON_ERROR_STOP on
create schema quarantine;
alter table public.profiles set schema quarantine;
alter table public.reviews set schema quarantine;
alter table public.posts set schema quarantine;
alter table public.comments set schema quarantine;
alter table public.post_likes set schema quarantine;
alter table public.bakery_visits set schema quarantine;
alter table public.reports set schema quarantine;
'@
  Write-Utf8 "$files\b-move.sql" $mv
  $mvr = PsqlFile 'bakery_stage' "$files\b-move.sql" '' -Quiet
  $qd = Invoke-Tool 'pg_dump' @('--format=custom', '--no-owner', '--no-privileges', '--schema=quarantine', '-d', 'bakery_stage', '--file', "$files\quarantine.dump")
  Add-Result 'T11a' $(if ($mvr.Code -eq 0 -and $qd.Code -eq 0) { 'pass' } else { 'fail' }) '스테이징에서 사용자 소유 표 7개를 quarantine 스키마로 옮기고 그 스키마만 덤프' "move=$($mvr.Code), dump=$($qd.Code)"
  New-Db 'bakery_restore_r4'
  $null = PsqlFile 'bakery_restore_r4' "$sqlDir\00-auth-stub.sql" '' -Quiet
  $ga = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', 'bakery_restore_r4', $authR)
  $mg = Apply-Migrations 'bakery_restore_r4' $migs          # 계정이 이미 들어 있어서 트리거가 새로 만들어져도 발동하지 않아요
  $gb = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-t', 'bakeries', '-d', 'bakery_restore_r4', $pubR)
  $gq = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '-d', 'bakery_restore_r4', "$files\quarantine.dump")
  $gerr = @((Restore-Errors $ga) + (Restore-Errors $gb) + (Restore-Errors $gq))
  $profilesAuto = PsqlScalar 'bakery_restore_r4' 'select count(*) from public.profiles'
  Add-Result 'T11b' $(if ($mg.Count -eq 0 -and $gerr.Count -eq 0 -and $profilesAuto -eq '0') { 'pass' } else { 'fail' }) '계정 먼저 → 마이그레이션 → 격리 데이터 순서로 복원: 오류 0개, 프로필 자동 생성 충돌 없음(공개 프로필 0개)' "마이그레이션 실패 $($mg.Count), 복원 오류 $($gerr.Count), 공개 프로필 $profilesAuto"
  $qf = PsqlFile 'bakery_restore_r4' "$sqlDir\30-quarantine-functions.sql" '' -Quiet
  Add-Result 'T11c' $(if ($qf.Code -eq 0) { 'pass' } else { 'fail' }) '격리 함수(restore_status · confirm_restore · flush_dependents · purge_unconfirmed)와 권한 회수 적용' $(if ($qf.Code -ne 0) { ($qf.Out | Select-Object -Last 2) -join ' ' } else { '' })
  if ($qf.Code -eq 0) {
    $qt = PsqlFile 'bakery_restore_r4' "$sqlDir\31-quarantine-tests.sql" '' -Quiet
    $qres = @($qt.Out | Where-Object { $_ -match '^RESULT\|' })
    foreach ($l in $qres) { $p = $l -split '\|', 4; Add-Result $p[1] $(if ($p[2] -eq 'true') { 'pass' } else { 'fail' }) ($p[3]) }
    if ($qt.Code -ne 0 -or $qres.Count -eq 0) { Add-Result 'T11d' 'fail' '격리 시험 SQL 실행' (($qt.Out | Select-Object -Last 3) -join ' ') }
  }

  # ── 마무리 점검 ──
  Step 'C8) 비밀 · Git 안전 점검'
  $pw = [IO.File]::ReadAllText("$root\secrets\pg-test-pw.txt"); $enc = [Text.Encoding]::GetEncoding(28591)
  $scan = @(Get-ChildItem $files -Recurse -File | ForEach-Object FullName) + @($log) + @(Get-ChildItem $snap -File | ForEach-Object FullName)
  $leak = @($scan | Where-Object { (Test-Path $_) -and ((Get-Item $_).Length -lt 100MB) -and $enc.GetString([IO.File]::ReadAllBytes($_)).Contains($pw) })
  Remove-Variable pw -ErrorAction SilentlyContinue
  Add-Result 'T12a' $(if ($leak.Count -eq 0) { 'pass' } else { 'fail' }) '산출물 · 로그 · 스냅샷에 서버 비밀번호 평문이 없음' $(if ($leak.Count) { ($leak | ForEach-Object { Split-Path $_ -Leaf }) -join ', ' } else { '' })
  Push-Location $repo; $gs = @(git status --porcelain 2>$null | Where-Object { $_ -match '\.(dump|age|tar)$|rehearsal-(keys|files)|AGE-SECRET|key.*\.txt' }); Pop-Location
  $keyInRepo = @(Get-ChildItem "$repo\docs" -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern 'AGE-SECRET-KEY-1[QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L]{58}' -ErrorAction SilentlyContinue)
  Add-Result 'T12b' $(if ($gs.Count -eq 0 -and $keyInRepo.Count -eq 0) { 'pass' } else { 'fail' }) 'Git 저장소에 비밀키 · 덤프 · 암호문 · 복호화 파일이 없음' "git 변경 중 해당 파일 $($gs.Count)개, 문서 안 실제 비밀키 모양 문자열 $($keyInRepo.Count)개"
  $outside = @(Get-ChildItem $files, $keys -Recurse -File -Force | Where-Object { -not $_.FullName.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase) })
  Add-Result 'T12c' $(if ($outside.Count -eq 0) { 'pass' } else { 'fail' }) '생성 파일이 모두 C:\bakery-secure\pg 안에 있음'
}
catch {
  if (-not $script:abort) { $script:abort = "예외: $($_.Exception.Message)" }
  Write-Output ''; Write-Output "!!! 중단: $($script:abort) — 추가 작업 없이 서버를 종료하고 보고합니다 !!!"
}
finally {
  Step "C9) 정상 종료 ($(Get-Date -Format 'HH:mm:ss'))"
  Clear-PgEnv
  Stop-PgSafe
  Start-Sleep -Seconds 1
  Write-Output ("postgres 프로세스: {0} / 54329 리스닝: {1} / postmaster.pid: {2}" -f (Get-PgProcs).Count, [bool](Get-NetTCPConnection -State Listen -LocalPort 54329 -ErrorAction SilentlyContinue), (Test-Path "$data\postmaster.pid"))
  if (Test-Path $snap) { & ([scriptblock]::Create((Get-Content -Raw -LiteralPath "$repo\docs\backup\snapshot.ps1" -Encoding UTF8))) -Out "$snap\after-gateC.txt" }

  Step '결과 요약'
  foreach ($r in $results) {
    $icon = switch ($r.Kind) { 'pass' { '✅' } 'fail' { '❌' } default { 'ℹ️ ' } }
    Write-Output ("{0} {1,-12} {2}" -f $icon, $r.Id, $r.Name)
  }
  $nf = @($results | Where-Object Kind -eq 'fail').Count; $np = @($results | Where-Object Kind -eq 'pass').Count; $ni = @($results | Where-Object Kind -eq 'info').Count
  Write-Output ''
  Write-Output ("통과 {0} · 실패 {1} · 관찰 {2}{3}" -f $np, $nf, $ni, $(if ($script:abort) { " · 중단됨($($script:abort))" } else { '' }))
  if ($nf -gt 0) {
    Write-Output ''; Write-Output '--- 실패한 시험과 설계 수정안 (실패를 성공으로 처리하지 않아요) ---'
    foreach ($r in ($results | Where-Object Kind -eq 'fail')) {
      Write-Output ("❌ {0} {1}" -f $r.Id, $r.Name); if ($r.Detail) { Write-Output ("   원인/상세: {0}" -f $r.Detail) }
      if ($remedy.ContainsKey($r.Id)) { Write-Output ("   수정안: {0}" -f $remedy[$r.Id]) } else { Write-Output '   수정안: 원인을 확인한 뒤 백업 설계 · 복구 절차 문서에 반영해요(자동 판단 불가).' }
    }
  }
  Write-Output ''
  Write-Output $(if ($nf -eq 0 -and -not $script:abort) { '※ 로컬 시험이 모두 통과했어요. 그래도 "계정까지 완전히 복구된다"는 뜻이 아니에요 (README의 Supabase 전용 확인 항목 참고).' } else { '※ 실패 또는 중단이 있어서 "복구 가능"이라고 판단하지 않아요.' })
  try { $results | ForEach-Object { "{0}|{1}|{2}|{3}" -f $_.Id, $_.Kind, $_.Name, $_.Detail } | Set-Content -Path "$files\results.txt" -Encoding UTF8 } catch { }
}
