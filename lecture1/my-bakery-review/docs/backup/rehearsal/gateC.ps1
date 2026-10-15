# 관문 C 실행기 (3차 개정: 첫 실행 분석 반영 — ANALYSIS-gateC.md): 가짜 데이터 복구 시험 (docs/backup/gate-c-plan.md · rehearsal/README.md)
#   ⚠️ 1차 실행(2026-10-15)은 끝났고 결과는 results-run1.txt 로 보존돼 있어요. 3차 개정본은 아직 한 번도 실행하지 않았어요. 실행은 사용자 승인 뒤에만 해요.
#   · 재시험(-Run 2, 기본값)은 1차 산출물(rehearsal-files · rehearsal-keys · bakery_* DB)을 건드리지 않고 별도 폴더(…-run2)와 별도 DB(…_run2)를 새로 만들어요. 새 임시 age 키 3개도 새로 만들어요.
#   · 1차 산출물 정리는 -Run 1 -Mode Cleanup (목록) / -ConfirmDelete (별도 승인 후)
#   · 접속 대상은 127.0.0.1:54329 (로컬 시험 서버) 고정: 명령줄 -h/-p/-U 를 직접 넣고, 접속을 바꿀 수 있는 환경변수(PGHOSTADDR · PGSERVICE · DATABASE_URL …)는 지우고 확인해요.
#   · 서버는 try/finally 로 항상 pg_ctl stop -m fast -w 를 시도하고, 종료가 확인되지 않으면 "성공"으로 보고하지 않고 수동 확인을 안내해요.
#   · 모든 외부 프로그램 호출에는 제한 시간이 있고, 전체 제한 시간(9분)을 넘으면 남은 시험을 건너뛰고 종료 단계로 가요.
#   · 인프라 오류(서버/스텁/마이그레이션/데이터 입력/덤프/암호화/명부/복원 준비)는 즉시 중단해요. 비교 시험의 실패는 ❌ 로 기록하고 다음 시나리오로 가요(성공으로 바꾸지 않아요).
#   · 모든 산출물은 C:\bakery-secure\pg 안. 비밀키 · 복호화된 파일 · 덤프는 Git 저장소 · OneDrive 밖이에요.
#
# 사용법 (일반 PowerShell, 관리자 권한 아님. 10분을 넘길 수 있는 도구 환경이면 백그라운드로 실행해요):
#   & ([scriptblock]::Create((Get-Content -Raw <이 파일> -Encoding UTF8)))                # 시험 실행
#   & ([scriptblock]::Create((Get-Content -Raw <이 파일> -Encoding UTF8))) -Mode Cleanup  # 서버 종료 확인 + 정리 목록
#   ... -Mode Cleanup -ConfirmDelete                                                      # 시험 DB · 파일 삭제
#   -Run 1 이면 1차(접미사 없음), -Run 2 이면 재시험(…-run2 폴더 · …_run2 DB). 다른 번호는 허용하지 않아요.
param(
  [ValidateSet('Run', 'Cleanup')][string]$Mode = 'Run',
  [ValidateSet(1, 2)][int]$Run = 2,
  [switch]$ConfirmDelete
)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

$root = 'C:\bakery-secure\pg'; $bin = "$root\edb\bin"; $data = "$root\data"; $log = "$root\logs\pg.log"
$dirSfx = $(if ($Run -eq 1) { '' } else { "-run$Run" }); $dbSfx = $(if ($Run -eq 1) { '' } else { "_run$Run" })    # 1차 산출물과 섞이지 않게 재시험은 폴더 · DB 이름을 따로 써요
$files = "$root\rehearsal-files$dirSfx"; $keys = "$root\rehearsal-keys$dirSfx"; $snap = "$root\snapshots"
$oldKeys = "$root\rehearsal-keys"           # 1차 임시 키 폴더 (재시험은 읽기만 하고 절대 바꾸지 않아요. 새 키가 1차 키와 다른지 비교하는 데만 써요)
$repo = 'C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review'
$sqlDir = "$repo\docs\backup\rehearsal"; $migDir = "$repo\supabase\migrations"
$ageDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\FiloSottile.age_Microsoft.Winget.Source_8wekyb3d8bbwe\age"
$tarExe = (Get-Command tar.exe -ErrorAction SilentlyContinue).Source
$filesFwd = $files.Replace('\', '/')
$U = @{ u1 = '00000000-0000-4000-8000-000000000001'; u2 = '00000000-0000-4000-8000-000000000002'; u3 = '00000000-0000-4000-8000-000000000003'
        u4 = '00000000-0000-4000-8000-000000000004'; u5 = '00000000-0000-4000-8000-000000000005'; u6 = '00000000-0000-4000-8000-000000000006'
        u7 = '00000000-0000-4000-8000-000000000007' }
$dbSrc = "bakery_rehearsal$dbSfx"; $dbR1 = "bakery_restore_r1$dbSfx"; $dbR1b = "bakery_restore_r1b$dbSfx"; $dbR2 = "bakery_restore_r2$dbSfx"; $dbR4 = "bakery_restore_r4$dbSfx"; $dbStage = "bakery_stage$dbSfx"
$restoreDbs = $dbR1, $dbR1b, $dbR2, $dbR4, $dbStage
$EXPECTED_Q_RESULTS = 55     # 31-quarantine-tests.sql 의 RESULT 줄 수. 시험을 추가/삭제하면 같이 고쳐요 (다르면 누락으로 보고 실패 처리)
$results = New-Object System.Collections.Generic.List[object]
$script:abort = $null
$script:stopFailed = $false
$script:inFinally = $false
$script:deadline = (Get-Date).AddMinutes(9)

# ───────────────────────── 기본 도우미 ─────────────────────────
function Step([string]$t) { Write-Output ''; Write-Output "== $t ==" }
function Add-Result([string]$id, [string]$kind, [string]$name, [string]$detail = '') {
  $results.Add([pscustomobject]@{ Id = $id; Kind = $kind; Name = $name; Detail = $detail })   # Kind: pass | fail | info
  $icon = switch ($kind) { 'pass' { '✅' } 'fail' { '❌' } default { 'ℹ️ ' } }
  Write-Output ("  {0} {1} {2}{3}" -f $icon, $id, $name, $(if ($detail) { " — $detail" } else { '' }))
}
function Fail-Infra([string]$what, [string]$detail = '') {      # 인프라 오류: 기록하고 즉시 중단 (다음 단계로 넘어가지 않아요)
  Add-Result 'INFRA' 'fail' $what $detail
  $script:abort = "$what — 이후 시험을 진행하지 않아요"
  throw $script:abort
}
function Require-Ok($r, [string]$what) { if ($r.Code -ne 0) { Fail-Infra $what (($r.Out | Select-Object -Last 2) -join ' ') } }
function Write-Utf8([string]$path, [string]$text) { [IO.File]::WriteAllText($path, $text, (New-Object Text.UTF8Encoding($false))) }
function Get-PgProcs { @(Get-Process -Name postgres -ErrorAction SilentlyContinue) }

# 시험 SQL 정적 금지 목록: 다른 DB로 연결(\connect · dblink · postgres_fdw), 셸 실행(\! · copy program), 외부 주소, 확장 · 서버 생성
$sqlForbidden = '(?im)^\s*\\(connect|c|!|i|ir|o|out|g|gx|gexec|gset|setenv|cd)\b|copy\s[^;]*\bprogram\b|dblink|postgres_fdw|create\s+(server|extension|foreign|user\s+mapping)|supabase\.(co|com|net|in)|https?://|\.env\b|sb_secret|sb_publishable|postgres(ql)?://'
$migForbidden = '(?im)^\s*\\(connect|c|!|i|ir|o|out|g|gx|gexec|gset|setenv|cd)\b|copy\s[^;]*\bprogram\b|dblink|postgres_fdw|create\s+(server|foreign|user\s+mapping)'
function Assert-SqlSafe([string]$name, [string]$text, [string]$pattern = $sqlForbidden) {
  $m = [regex]::Match($text, $pattern)
  if ($m.Success) { Fail-Infra "금지된 SQL 표현 발견($name)" "'$($m.Value.Trim())'" }
}
function Write-SqlSafe([string]$path, [string]$text) { Assert-SqlSafe (Split-Path $path -Leaf) $text; Write-Utf8 $path $text }

# ───────────────────────── 접속 고정 ─────────────────────────
function Clear-PgEnv {
  Get-ChildItem Env: | Where-Object { $_.Name -match '^PG' -or $_.Name -match '^(DATABASE_URL|SUPABASE)' -or $_.Name -eq 'PSQL_HISTORY' } | ForEach-Object { Remove-Item "Env:$($_.Name)" -ErrorAction SilentlyContinue }
}
function Use-LocalPgEnv {
  Clear-PgEnv      # PGHOSTADDR · PGSERVICE · PGSERVICEFILE · PGPASSFILE · PGOPTIONS 등 접속을 바꿀 수 있는 것을 모두 제거한 뒤 필요한 것만 설정
  $env:PGHOST = '127.0.0.1'; $env:PGPORT = '54329'; $env:PGUSER = 'postgres'; $env:PGCLIENTENCODING = 'UTF8'; $env:PGCONNECT_TIMEOUT = '10'
  $env:PGPASSWORD = [IO.File]::ReadAllText("$root\secrets\pg-test-pw.txt"); $env:PSQL_HISTORY = "$root\logs\psql_history"
}
function Assert-LocalOnly {
  $allowed = 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGCLIENTENCODING', 'PGCONNECT_TIMEOUT'
  $extra = @(Get-ChildItem Env: | Where-Object { ($_.Name -match '^PG' -and $allowed -notcontains $_.Name.ToUpper()) -or $_.Name -match '^(DATABASE_URL|SUPABASE)' })
  if ($env:PGHOST -ne '127.0.0.1' -or $env:PGPORT -ne '54329' -or $env:PGUSER -ne 'postgres') { throw '접속 대상이 127.0.0.1:54329(postgres)가 아니에요. 중단합니다.' }
  if ($extra.Count) { throw ('접속을 바꿀 수 있는 환경변수가 있어요: ' + (($extra | ForEach-Object Name) -join ', ') + ' — 중단합니다.') }
}
function Assert-DbName([string]$d) { if ($d -notmatch '^[a-z][a-z0-9_]*$') { throw "허용되지 않은 DB 이름(접속 문자열 금지): $d" } }
function Conn-Args { @('-h', '127.0.0.1', '-p', '54329', '-U', 'postgres') }     # 환경변수에 기대지 않고 명령줄에도 직접 고정

# ───────────────────────── 외부 프로그램 실행 (제한 시간 + 전체 마감) ─────────────────────────
function Quote-Arg([string]$a) {
  if ($a -eq '') { return '""' }
  if ($a -notmatch '[\s"]') { return $a }
  $s = $a -replace '(\\*)"', '$1$1\"'
  $s = $s -replace '(\\+)$', '$1$1'
  return '"' + $s + '"'
}
function Run-Native([string]$Exe, [string[]]$ExeArgs, [int]$TimeoutSec = 180) {
  $t = $TimeoutSec
  if (-not $script:inFinally) {
    $remain = [int](($script:deadline - (Get-Date)).TotalSeconds)
    if ($remain -le 0) { $script:abort = '전체 제한 시간(9분) 초과 — 남은 시험을 건너뛰고 서버를 종료해요'; throw $script:abort }
    $t = [Math]::Max(5, [Math]::Min($TimeoutSec, $remain))
  }
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $Exe; $psi.Arguments = (($ExeArgs | ForEach-Object { Quote-Arg $_ }) -join ' ')
  $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
  $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = [Text.Encoding]::UTF8; $psi.StandardErrorEncoding = [Text.Encoding]::UTF8
  $p = [System.Diagnostics.Process]::Start($psi)
  $so = $p.StandardOutput.ReadToEndAsync(); $se = $p.StandardError.ReadToEndAsync()
  if (-not $p.WaitForExit($t * 1000)) {
    try { $p.Kill() } catch { }
    return [pscustomobject]@{ Code = -1; Out = @("TIMEOUT(${t}s): $([IO.Path]::GetFileName($Exe))"); TimedOut = $true }
  }
  $p.WaitForExit()
  $text = $so.Result + "`n" + $se.Result
  [pscustomobject]@{ Code = $p.ExitCode; Out = @($text -split "`r?`n" | Where-Object { $_ -ne '' }); TimedOut = $false }
}

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
  try {
    $r = Run-PgCtl @('-D', $data, 'stop', '-m', 'fast', '-w', '-t', '60') 75
    Write-Output ("pg_ctl stop 결과: exited={0} code={1}" -f $r.exited, $r.code)
    if (-not $r.exited -or $r.code -ne 0) { $script:stopFailed = $true }
  } catch { Write-Output "pg_ctl stop 호출 중 예외: $($_.Exception.Message)"; $script:stopFailed = $true }
}
function Confirm-Stopped {      # 종료를 "확인"해요: 종료 명령이 성공했다고 믿지 않고 상태를 다시 봐요
  Start-Sleep -Seconds 1
  $procs = (Get-PgProcs).Count; $port = [bool](Get-NetTCPConnection -State Listen -LocalPort 54329 -ErrorAction SilentlyContinue); $pidFile = Test-Path "$data\postmaster.pid"
  Write-Output ("종료 확인: postgres 프로세스 {0} / 54329 리스닝 {1} / postmaster.pid {2}" -f $procs, $port, $pidFile)
  if ($procs -gt 0 -or $port -or $pidFile) { $script:stopFailed = $true }
  if ($script:stopFailed) {
    Write-Output ''
    Write-Output '🛑🛑 서버가 정상 종료됐다고 확인하지 못했어요 — 수동 확인이 필요해요. 이 실행은 결과와 상관없이 "성공"이 아니에요.'
    Write-Output "   1) 상태 확인: & '$bin\pg_ctl.exe' -D '$data' status"
    Write-Output "   2) 정상 종료:  & '$bin\pg_ctl.exe' -D '$data' stop -m fast -w"
    Write-Output '   3) 프로세스를 임의로 강제 종료하거나 postmaster.pid를 지우지 마세요 (먼저 사용자에게 알려요).'
  }
}

# ───────────────────────── DB 도구 ─────────────────────────
function Psql([string]$Db, [string[]]$PsqlArgs, [string]$OutFile = '', [bool]$StopOnError = $true, [int]$TimeoutSec = 180) {
  Assert-LocalOnly; Assert-DbName $Db
  $a = (Conn-Args) + @('-X', '-w', '-d', $Db) + $(if ($StopOnError) { @('-v', 'ON_ERROR_STOP=1') } else { @() }) + $PsqlArgs
  if ($OutFile) { $a += @('-o', $OutFile) }
  Run-Native "$bin\psql.exe" $a $TimeoutSec
}
function PsqlFile([string]$Db, [string]$File, [string]$OutFile = '', [switch]$Quiet) { Psql $Db (@('-f', $File) + $(if ($Quiet) { @('-At') } else { @() })) $OutFile }
# 값을 돌려주는 짧은 쿼리. 실패하면 $null 이 아니라 "ERR(code=…): 이유" 문자열을 돌려줘서 빈 값으로 사라지지 않게 해요 (1차 T10k의 빈 값 문제).
#   "ERR(" 로 시작하는 값은 어떤 기대값과도 같지 않으므로 판정은 자동으로 실패가 되고, 이유는 상세에 그대로 찍혀요. 두 값이 "서로 같은지"만 보는 곳은 Is-Err 로 따로 막아요.
function Is-Err($v) { return ($v -is [string]) -and $v.StartsWith('ERR(') }
function Err-Text($r) {
  $lines = @($r.Out | Where-Object { $_ -match '(?i)\b(error|fatal|panic)\b|오류' } | Select-Object -First 2)
  if ($lines.Count -eq 0) { $lines = @($r.Out | Select-Object -Last 1) }
  return (($lines -join ' / ') -replace '\s+', ' ')
}
function PsqlScalar([string]$Db, [string]$Sql) { $r = Psql $Db @('-At', '-c', $Sql); if ($r.Code -ne 0) { return "ERR(code=$($r.Code)): $(Err-Text $r)" }; return (($r.Out -join "`n").Trim()) }
# 한글이 든 SQL은 명령줄 인자(-c) 대신 UTF-8 파일(-f)로 실행해요 (인자로 넘기면 문자 변환에 기대게 돼요).
function PsqlScalarFile([string]$Db, [string]$Name, [string]$Sql) {
  $path = "$files\$Name"; Write-SqlSafe $path $Sql
  $r = PsqlFile $Db $path ''  -Quiet
  if ($r.Code -ne 0) { return "ERR(code=$($r.Code)): $(Err-Text $r)" }
  return (($r.Out -join "`n").Trim())
}
# 역할별 접근 동작(21)과 제약 동작(22)처럼 줄 여러 개를 돌려주는 SQL 파일. 실패하면 $null 대신 이유를 담은 객체를 돌려줘요.
function Get-Lines([string]$Db, [string]$SqlFile, [string]$Prefix) {
  $r = PsqlFile $Db "$sqlDir\$SqlFile" '' -Quiet
  if ($r.Code -ne 0) { return [pscustomobject]@{ Ok = $false; Lines = @(); Why = "ERR(code=$($r.Code)): $(Err-Text $r)" } }
  $ln = @($r.Out | Where-Object { $_ -like "$Prefix|*" } | Sort-Object)
  return [pscustomobject]@{ Ok = $true; Lines = $ln; Why = '' }
}
function Invoke-Tool([string]$Name, [string[]]$ToolArgs, [switch]$NoConn) {
  Assert-LocalOnly
  for ($i = 0; $i -lt $ToolArgs.Count; $i++) { if ($ToolArgs[$i] -eq '-d') { Assert-DbName $ToolArgs[$i + 1] } }
  $a = $(if ($NoConn) { @() } else { Conn-Args }) + $ToolArgs
  Run-Native "$bin\$Name.exe" $a 300
}
function New-Db([string]$name) {
  Assert-DbName $name
  $r = Psql 'postgres' @('-c', "create database $name encoding 'UTF8' template template0 locale 'C'")
  if ($r.Code -ne 0) { Fail-Infra "DB 생성 실패: $name" (($r.Out | Select-Object -Last 2) -join ' ') }
}
function Apply-Migrations([string]$db, [string[]]$names) {
  $bad = @(); foreach ($n in $names) { $r = PsqlFile $db "$migDir\$n" '' -Quiet; if ($r.Code -ne 0) { $bad += "$n :: $(($r.Out | Select-Object -Last 2) -join ' ')" } }
  return $bad
}
function Restore-Errors($r) { @($r.Out | Where-Object { $_ -match '^pg_restore: (error|warning):' }) }
# public 덤프를 복원할 때 덤프 안의 "CREATE SCHEMA public" 항목만 빼고 복원해요 (1차 실패 원인: 새 DB에 이미 있는 public 과 충돌).
#   · pg_restore -l 로 목록을 만들고 → "SCHEMA - public" 항목이 정확히 1개인지 확인 → 그 줄만 지운 목록으로 pg_restore -L.
#   · 정확히 1개가 아니면(0개 · 2개 이상) 아무것도 복원하지 않고 인프라 오류로 즉시 중단해요(필터가 엉뚱한 항목을 지우지 않게).
#   · 스키마 권한(ACL - SCHEMA public) · 스키마 설명(COMMENT - SCHEMA public) 항목은 그대로 두고 복원해요. --clean 은 쓰지 않아요(기존 public 을 지우므로).
#   · 복원 오류 0개라는 합격 기준은 그대로예요 (이 함수는 오류를 숨기지 않아요).
function Restore-PublicDump([string]$Db, [string]$DumpPath, [string[]]$Extra = @()) {
  $list = Invoke-Tool 'pg_restore' @('-l', $DumpPath) -NoConn
  if ($list.Code -ne 0 -or $list.TimedOut) { Fail-Infra "덤프 목록(pg_restore -l) 읽기 실패: $(Split-Path $DumpPath -Leaf)" (Err-Text $list) }
  $entries = @($list.Out | Where-Object { $_ -match '^\d+; ' })
  $hit = @($entries | Where-Object { $_ -match '^\d+; \d+ \d+ SCHEMA - public(\s|$)' })
  if ($hit.Count -ne 1) { Fail-Infra "덤프 목록에서 'SCHEMA - public' 항목이 정확히 1개가 아니에요($($hit.Count)개) — 필터를 믿을 수 없어 복원하지 않아요: $(Split-Path $DumpPath -Leaf)" (($hit | Select-Object -First 3) -join ' | ') }
  $keep = @($list.Out | Where-Object { $_ -ne $hit[0] })
  if ($keep.Count -ne $list.Out.Count - 1) { Fail-Infra "목록 필터 결과가 예상과 달라요(원래 $($list.Out.Count)줄 → $($keep.Count)줄, 기대 -1)" }
  $lf = "$files\restore-$([IO.Path]::GetFileNameWithoutExtension($DumpPath))-$Db.list"
  Write-Utf8 $lf ($keep -join "`n")
  # Add-Result 는 화면에 글자를 쓰는데, 함수 안에서 쓰면 그 글자가 반환값(pg_restore 결과)에 섞여요 → Out-Null 로 막아요 (결과 목록에는 정상 기록돼요).
  Add-Result 'T05a0' 'info' "복원 목록에서 SCHEMA public 항목 1개만 제외 ($(Split-Path $DumpPath -Leaf) → $Db)" "전체 항목 $($entries.Count)개 중 제외 1개: $($hit[0] -replace '\s+', ' ')" | Out-Null
  return (Invoke-Tool 'pg_restore' (@('--no-owner') + $Extra + @('-L', $lf, '-d', $Db, $DumpPath)))
}
function Get-Report([string]$db, [string]$name) {
  $out = "$files\report-$name.txt"; $r = PsqlFile $db "$sqlDir\20-report.sql" $out
  if ($r.Code -ne 0) { Fail-Infra "보고서 생성 실패($db)" (($r.Out | Select-Object -Last 2) -join ' ') }
  $lines = @(Get-Content $out -Encoding UTF8 | Where-Object { $_ })
  if ($lines.Count -lt 50) { Fail-Infra "보고서가 너무 짧아요(${db}: $($lines.Count)줄) — 비교할 수 없어요" }
  return $lines
}
# 두 보고서의 같은 구역을 비교. 원본 쪽 해당 구역이 비어 있으면 "차이 없음"이 아니라 실패로 취급해요(빈 비교를 통과시키지 않아요).
function Diff-Lines($a, $b, [scriptblock]$Filter = { $true }, [switch]$AllowEmptySource) {
  $fa = @($a | Where-Object $Filter); $fb = @($b | Where-Object $Filter)
  if ($fa.Count -eq 0 -and -not $AllowEmptySource) { return @([pscustomobject]@{ InputObject = '(비교할 원본 줄이 0개 — 보고서 구역이 비었거나 필터가 잘못돼서 비교하지 못했어요)'; SideIndicator = '!!' }) }
  if ($fa.Count -eq 0 -and $fb.Count -eq 0) { return @() }
  return @(Safe-Compare $fa $fb)
}
# 호출하는 쪽은 반드시 $x = @(Diff-Lines …) 로 감싸요: 차이가 정확히 1줄이면 함수 결과가 배열이 아니라 객체 1개로 풀려서 .Count 가 비어요 (1차 T08b 상세가 빈 이유).
# Compare-Object 는 한쪽이 빈 배열이면 오류가 나서, 빈 쪽을 직접 처리해요.
function Safe-Compare($a, $b) {
  $a = @($a); $b = @($b)
  if ($a.Count -eq 0 -and $b.Count -eq 0) { return @() }
  if ($a.Count -eq 0) { return @($b | ForEach-Object { [pscustomobject]@{ InputObject = $_; SideIndicator = '=>' } }) }
  if ($b.Count -eq 0) { return @($a | ForEach-Object { [pscustomobject]@{ InputObject = $_; SideIndicator = '<=' } }) }
  return @(Compare-Object $a $b)
}
# T06b: 복원본에서도 reviews.rating 검사 제약이 같은 값을 받아들이고 거부하는지 (원본 · 기대값 둘 다와 비교). 텍스트 비교 T06 · T08c 의 결과는 바꾸지 않아요.
function Judge-T06b([string]$Id, [string]$Db, [string]$Label) {
  $x = Get-Lines $Db '22-constraint-behavior.sql' 'T06B'
  if (-not $x.Ok) { Add-Result $Id 'fail' "${Label}: 제약 동작 시험 실행 실패" $x.Why; return }
  $dOracle = @(Safe-Compare $x.Lines $t06Oracle)
  $dSrc = $(if ($t06Src.Ok) { @(Safe-Compare $x.Lines $t06Src.Lines) } else { @([pscustomobject]@{ InputObject = "(원본 기준값 없음: $($t06Src.Why))"; SideIndicator = '!!' }) })
  Add-Result $Id $(if ($x.Lines.Count -eq 11 -and $dOracle.Count -eq 0 -and $dSrc.Count -eq 0) { 'pass' } else { 'fail' }) "${Label}: reviews.rating 검사 제약이 원본 · 기대값과 똑같이 동작함 (텍스트 표현이 달라도 허용/거부가 같은지)" $(if ($x.Lines.Count -ne 11) { "결과 $($x.Lines.Count)줄 (기대 11): " + (($x.Lines | Select-Object -First 3) -join ' ; ') } elseif ($dOracle.Count) { '기대값과 다름: ' + (Sample $dOracle 4) } elseif ($dSrc.Count) { '원본과 다름: ' + (Sample $dSrc 4) } else { '11개 값의 허용/거부가 원본 · 기대값과 같음' })
}
# 역할별 실제 접근: (A) 보고서 12.access (has_*_privilege 결과) (B) 동작 시험 21 (역할을 바꿔 실제로 읽어 보기). 둘 다 원본과 다르면 ❌ — "의미가 같다"는 이유로 차이를 넘기지 않아요.
function Judge-Access([string]$IdReport, [string]$IdProbe, [string[]]$Rep, [string]$Db, [string]$Label) {
  $dA = @(Diff-Lines $repSource $Rep { $_ -match '^12\.access\|' })
  Add-Result $IdReport $(if ($dA.Count -eq 0) { 'pass' } else { 'fail' }) "${Label}: 역할(anon · authenticated · service_role)별 실제 접근 권한(표 · 열 · 함수 · public 스키마)이 원본과 같음" $(if ($dA.Count) { "다른 줄 $($dA.Count)개: " + (Sample $dA 3) } else { '' })
  $y = Get-Lines $Db '21-access-probe.sql' 'probe'
  if (-not $y.Ok) { Add-Result $IdProbe 'fail' "${Label}: 역할별 읽기 동작 시험 실행 실패" $y.Why; return }
  $dB = $(if ($acSrc.Ok -and $acSrc.Lines.Count -ge 9) { @(Safe-Compare $acSrc.Lines $y.Lines) } else { @([pscustomobject]@{ InputObject = "(원본 기준값 없음: $($acSrc.Why))"; SideIndicator = '!!' }) })
  Add-Result $IdProbe $(if ($dB.Count -eq 0 -and $y.Lines.Count -ge 9) { 'pass' } else { 'fail' }) "${Label}: 역할별로 실제로 읽어 본 결과(권한 + 행 단위 보안 정책)가 원본과 같음" $(if ($dB.Count) { "다른 줄 $($dB.Count)개: " + (Sample $dB 3) } elseif ($y.Lines.Count -lt 9) { "결과 $($y.Lines.Count)줄뿐" } else { "probe $($y.Lines.Count)줄 모두 일치" })
}
function Sample([object[]]$lines, [int]$n = 4) {
  $parts = foreach ($l in ($lines | Select-Object -First $n)) {
    $t = ($l.InputObject -replace '\s+', ' ')
    if ($t.Length -gt 110) { $t = $t.Substring(0, 110) }
    "$t [$($l.SideIndicator)]"
  }
  return ($parts -join ' ; ')
}
function Test-UserOnlyAcl([string]$path) {
  $others = @((Get-Acl $path).Access | Where-Object { $_.IdentityReference.Value -notmatch ('\\' + [regex]::Escape($env:USERNAME) + '$') -and $_.IdentityReference.Value -ne 'CREATOR OWNER' })
  return ($others.Count -eq 0)
}

# 설계 수정안 (실패한 시험마다 보여줘요)
$remedy = @{
  'T07.trigger' = 'public 덤프에 auth.users 트리거가 없어요 → 복구 절차에 50-reapply-outside-public.sql(트리거 재적용) 단계를 넣고, 계정 복원 뒤 · 앱 열기 전에 실행해요.'
  'T07.storage' = 'storage.objects 정책이 덤프에 없어요 → 복구 절차에 마이그레이션 0003 · 0008 · 0010(저장소 정책) 재적용 단계를 넣어요.'
  'T07.bucket'  = 'photos 버킷 행이 덤프에 없어요 → 0003 재적용(버킷 행 포함)으로 만들어요.'
  'T07.object'  = '사진 파일 기록(storage.objects)은 백업 대상이 아니에요(사진 백업 미구현, README 5장). 복구 후 사진이 없는 일지가 생기는 것은 설계상 알려진 한계예요 — 사진 백업 설계 전에는 이 항목이 항상 ❌로 남아요.'
  'T07.grant'   = '--no-privileges 때문에 GRANT가 빠져요 → public 덤프에서 --no-privileges를 빼고(대상 프로젝트에 anon/authenticated/service_role 역할이 있어야 함) 복원 뒤 권한 비교로 확인해요. 새 방식은 R1b 계열(T08b · T08e · T08f)이 검증해요. 이 시험(T07.*)의 기준은 바꾸지 않아서 현재 워크플로(R1) 기준으로는 계속 ❌예요.'
  'T07.access'  = 'T07.grant 와 같은 원인(--no-privileges)으로 역할별 실제 접근이 달라져요. 권한 포함 백업(R1b)의 T08e로 확인해요.'
  'T07.probe'   = 'T07.grant 와 같은 원인으로 역할별 읽기 결과가 달라져요. 권한 포함 백업(R1b)의 T08f로 확인해요.'
  'T06'         = '텍스트 표현만 달라요(AND 괄호). 동작은 T06b · T06b-r1b 가 따로 확인해요. 이 시험의 텍스트 기준은 바꾸지 않아서 마이그레이션 0001의 BETWEEN 때문에 ❌로 남을 수 있어요(설계 문서 참고).'
  'Q15b'        = '격리 방식에서 신고(reports)가 공개 쪽으로 자동 복원되지 않아요 → 운영자의 열린 신고가 사라져요. 설계 결정 필요: 신고 대상 작성자가 확인했을 때 해당 신고만 복원할지, 운영자가 격리 표를 직접 검토할지.'
}

# ───────────────────────── 정리 모드 ─────────────────────────
if ($Mode -eq 'Cleanup') {
  $script:inFinally = $true
  try {
    Step '정리 대상 목록'
    foreach ($p in $files, $keys) { Write-Output ("  폴더: {0} -> {1}" -f $p, $(if (Test-Path $p) { "있음 ($((Get-ChildItem $p -Recurse -File -Force | Measure-Object).Count)개 파일)" } else { '없음' })) }
    Write-Output ("  이번 정리 대상: 실행 번호 -Run {0} (1차 = 접미사 없음, 재시험 = -run2 / _run2). 다른 실행의 폴더 · DB는 건드리지 않아요." -f $Run)
    Write-Output ("  시험 DB(삭제 후보): {0}, {1}" -f $dbSrc, ($restoreDbs -join ', '))
    if ($Run -eq 1) { Write-Output "  ($dbSrc 은 삭제 후 빈 DB로 다시 만들어요 / anon · authenticated · service_role 역할은 남겨요 — README의 수동 삭제 방법 참고)" }
    else { Write-Output "  ($dbSrc 은 재시험이 만든 것이라 삭제만 하고 다시 만들지 않아요 / 역할 3개는 1차와 공유라 남겨요)" }
    Write-Output '  (삭제는 일반 파일 삭제예요. SSD에서는 복구 불가능한 완전 삭제를 보장하지 않아요. 내용은 전부 가짜 데이터예요)'
    if (-not $ConfirmDelete) { Write-Output '※ -ConfirmDelete 를 붙이면 실제로 삭제해요. 지금은 목록만 보여줬어요.'; return }
    foreach ($p in $files, $keys) { if (-not $p.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "삭제 경로가 $root 밖이에요: $p" } }
    Step '삭제 실행 (-ConfirmDelete)'
    if ((Get-PgProcs).Count -eq 0) { $r = Run-PgCtl @('-D', $data, '-l', $log, '-w', '-t', '60', 'start') 80; Write-Output ("서버 시작 code=$($r.code)") }
    Use-LocalPgEnv; Assert-LocalOnly
    foreach ($d in $restoreDbs) { $x = Psql 'postgres' @('-c', "drop database if exists $d with (force)"); Write-Output ("  DB {0}: code={1}" -f $d, $x.Code) }
    Assert-DbName $dbSrc
    $x = Psql 'postgres' @('-c', "drop database if exists $dbSrc with (force)")
    if ($Run -eq 1) { $y = Psql 'postgres' @('-c', "create database $dbSrc encoding 'UTF8' template template0 locale 'C'"); Write-Output ("  {0} 초기화: drop code={1}, create code={2}" -f $dbSrc, $x.Code, $y.Code) }
    else { Write-Output ("  DB {0}: drop code={1}" -f $dbSrc, $x.Code) }
    foreach ($p in $files, $keys) { if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force; Write-Output "  삭제: $p" } }
  } catch { Write-Output "정리 중 예외: $($_.Exception.Message)" }
  finally { Clear-PgEnv; Stop-PgSafe; Confirm-Stopped }
  return
}

# ───────────────────────── 시험 실행 ─────────────────────────
try {
  Step 'C0) 사전 점검'
  $rec = @{}; Get-Content "$snap\zip-file-hashes.txt" -Encoding UTF8 | ForEach-Object { $p = $_ -split ' \| '; if ($p.Count -eq 3) { $rec[$p[0].ToLower()] = $p[2] } }
  $hashOk = $true; foreach ($n in 'postgres', 'pg_ctl', 'psql', 'pg_dump', 'pg_restore') { if ($rec["bin\$n.exe"] -ne (Get-FileHash "$bin\$n.exe" -Algorithm SHA256).Hash.ToLower()) { $hashOk = $false } }
  $elev = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  $envHits = @(Get-ChildItem Env: | Where-Object { $_.Name -match '^(PG|DATABASE_URL|SUPABASE|POSTGRES)' }).Count
  $migs = @(Get-ChildItem $migDir -Filter '*.sql' | Sort-Object Name | ForEach-Object Name)
  $needSql = '00-auth-stub.sql', '10-fake-seed.sql', '20-report.sql', '30-quarantine-functions.sql', '31-quarantine-tests.sql', '50-reapply-outside-public.sql', '21-access-probe.sql', '22-constraint-behavior.sql'
  $checks = @(
    @('실행 파일 해시 동일', $hashOk),
    @('관리자(올린 권한) 세션 아님', (-not $elev)),
    @('PG*/DATABASE_URL/SUPABASE* 환경변수 0개 (시작 전)', ($envHits -eq 0)),
    @('54329 포트 비어 있음 / postgres 프로세스 없음 / postmaster.pid 없음', ((-not [bool](Get-NetTCPConnection -LocalPort 54329 -ErrorAction SilentlyContinue)) -and ((Get-PgProcs).Count -eq 0) -and -not (Test-Path "$data\postmaster.pid"))),
    @('age / age-keygen / tar 있음', ((Test-Path "$ageDir\age.exe") -and (Test-Path "$ageDir\age-keygen.exe") -and [bool]$tarExe)),
    @('마이그레이션 10개 + 시험용 SQL 8개 있음', (($migs.Count -eq 10) -and (@($needSql | Where-Object { -not (Test-Path "$sqlDir\$_") }).Count -eq 0))),
    @("이번 실행(-Run $Run)의 산출물 폴더가 아직 없음 ($(Split-Path $files -Leaf) · $(Split-Path $keys -Leaf))", (-not (Test-Path $files) -and -not (Test-Path $keys))),
    @('재시험은 1차 산출물 폴더와 다른 폴더를 씀(1차 파일 · 키를 덮어쓰지 않음)', (($Run -eq 1) -or (($files -ne "$root\rehearsal-files") -and ($keys -ne $oldKeys)))),
    @('산출물 폴더가 Git 저장소 · OneDrive 밖, C:\bakery-secure\pg 안', ((-not ($files + $keys).Contains('my-first-website-main')) -and (-not $files.StartsWith($env:OneDrive, [StringComparison]::OrdinalIgnoreCase)) -and $files.StartsWith($root + '\') -and $keys.StartsWith($root + '\'))),
    @('비밀번호 파일 · 데이터 폴더 접근이 현재 사용자뿐', ((Test-UserOnlyAcl "$root\secrets") -and (Test-UserOnlyAcl $data) -and (Test-UserOnlyAcl $root)))
  )
  $failed = 0; foreach ($c in $checks) { Write-Output ('  {0,-66} {1}' -f $c[0], $c[1]); if (-not $c[1]) { $failed++ } }
  if ($failed) { Fail-Infra '사전 점검 실패' }
  foreach ($f in $needSql) { Assert-SqlSafe $f (Get-Content -Raw -LiteralPath "$sqlDir\$f" -Encoding UTF8) }
  foreach ($m in $migs) { Assert-SqlSafe $m (Get-Content -Raw -LiteralPath "$migDir\$m" -Encoding UTF8) $migForbidden }
  Write-Output '  시험 SQL · 마이그레이션 정적 금지 표현 검사 통과 (\connect · dblink · postgres_fdw · copy program · 외부 주소 · 서버/확장 생성 없음)'
  $lan = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notmatch '^169\.254' } | Select-Object -First 1).IPAddress
  New-Item -ItemType Directory -Path $files, $keys -Force | Out-Null
  if (-not ((Test-UserOnlyAcl $files) -and (Test-UserOnlyAcl $keys))) { Fail-Infra '산출물 · 키 폴더 접근 권한이 현재 사용자 전용이 아니에요' }
  & ([scriptblock]::Create((Get-Content -Raw -LiteralPath "$repo\docs\backup\snapshot.ps1" -Encoding UTF8))) -Out "$snap\before-gateC$dbSfx.txt"

  Step "C0-2) 서버 시작 ($(Get-Date -Format 'HH:mm:ss'), 서비스 등록 없음) + 바인딩 · 외부 차단 확인"
  $r = Run-PgCtl @('-D', $data, '-l', $log, '-w', '-t', '60', 'start') 80
  Write-Output ("  pg_ctl start: exited={0} code={1} / 프로세스 {2}개" -f $r.exited, $r.code, (Get-PgProcs).Count)
  if (-not $r.exited -or $r.code -ne 0) { Fail-Infra '서버 시작 실패' }
  $ui = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'consent' -or $_.MainWindowTitle -match 'User Account Control|사용자 계정 컨트롤|Security Alert|보안 경고|방화벽|Firewall' })
  if ($ui.Count) { Fail-Infra 'UAC 또는 방화벽 관련 창 감지' }
  $pids = (Get-PgProcs) | ForEach-Object { $_.Id }
  $listen = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $pids -contains $_.OwningProcess })
  $bad = @($listen | Where-Object { $_.LocalAddress -ne '127.0.0.1' -or $_.LocalPort -ne 54329 })
  Write-Output ("  리스닝: " + (($listen | ForEach-Object { "$($_.LocalAddress):$($_.LocalPort)" }) -join ', ') + " / 다른 주소 {0}개" -f $bad.Count)
  $okLocal = Test-Tcp '127.0.0.1' 54329; $okExt = Test-Tcp $lan 54329; $okV6 = Test-Tcp '::1' 54329
  Write-Output ("  연결: 127.0.0.1={0}(True), {1}={2}(False), ::1={3}(False)" -f $okLocal, $lan, $okExt, $okV6)
  if ($listen.Count -ne 1 -or $bad.Count -gt 0 -or -not $okLocal -or $okExt -or $okV6) { Fail-Infra '리스닝 주소/외부 차단 확인 실패' }
  Use-LocalPgEnv; Assert-LocalOnly
  $existing = PsqlScalar 'postgres' "select string_agg(datname, ',' order by datname) from pg_database where datname like 'bakery\_%'"
  Write-Output "  현재 bakery_* DB: $existing"
  if (Is-Err $existing) { Fail-Infra 'DB 목록을 읽지 못했어요' $existing }
  if ($Run -eq 1) {
    if ($existing -ne $dbSrc) { Fail-Infra "예상 밖의 DB 상태($existing) — 정리 후 다시 해요" }
  } else {
    # 재시험: 1차 DB(접미사 없는 bakery_*)는 그대로 두고, 이번 실행 이름(…_run2)이 하나도 없어야 해요. 있으면 이전 재시험 흔적이라 덮어쓰지 않고 중단해요.
    $mine = @(($existing -split ',') | Where-Object { $_ -like "*$dbSfx" })
    if ($mine.Count -ne 0) { Fail-Infra "이번 실행 이름의 DB가 이미 있어요($($mine -join ', ')) — 먼저 -Run $Run -Mode Cleanup 으로 정리해요" }
    New-Db $dbSrc         # 재시험용 빈 원본 DB를 새로 만들어요 (1차 bakery_rehearsal 은 건드리지 않아요)
  }
  $objs = PsqlScalar $dbSrc "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname not in ('pg_catalog','information_schema','pg_toast')"
  if ($objs -ne '0') { Fail-Infra "$dbSrc 이 비어 있지 않아요($objs)" }

  # ── C1 원본 준비 ──
  Step 'C1) 원본 DB 준비: 가짜 Supabase 기본 환경 + 마이그레이션 10개 + 가짜 데이터'
  $r = PsqlFile $dbSrc "$sqlDir\00-auth-stub.sql" '' -Quiet
  Add-Result 'T01a' $(if ($r.Code -eq 0) { 'pass' } else { 'fail' }) '가짜 auth · storage 기본 환경 적용' $(if ($r.Code -ne 0) { ($r.Out | Select-Object -Last 2) -join ' ' } else { '' })
  Require-Ok $r '가짜 환경 적용 실패'
  $badMig = @(Apply-Migrations $dbSrc $migs)
  Add-Result 'T01b' $(if ($badMig.Count -eq 0) { 'pass' } else { 'fail' }) '마이그레이션 0001~0010이 오류 없이 적용' $(if ($badMig.Count) { $badMig -join ' | ' } else { "$($migs.Count)개 파일" })
  if ($badMig.Count) { Fail-Infra '마이그레이션 적용 실패' ($badMig -join ' | ') }
  $seed = PsqlFile $dbSrc "$sqlDir\10-fake-seed.sql" '' -Quiet
  $got = @{}; foreach ($l in $seed.Out) { if ($l -match '^SEED\|([^|]+)\|(\d+)$') { $got[$Matches[1]] = [int]$Matches[2] } }
  $want = [ordered]@{ 'auth.users' = 6; 'auth.identities' = 6; 'profiles(트리거로 자동 생성)' = 6; 'bakeries' = 3; 'reviews' = 7; 'bakery_visits' = 2; 'posts' = 3; 'comments' = 3; 'post_likes' = 3; 'reports' = 2; 'admins' = 1; 'storage.objects' = 1; 'auth.sessions' = 2; 'auth.refresh_tokens' = 2; 'auth.one_time_tokens' = 1; 'auth.audit_log_entries' = 2 }
  $wrong = @($want.Keys | Where-Object { $got[$_] -ne $want[$_] } | ForEach-Object { "$_=$($got[$_])(기대 $($want[$_]))" })
  Add-Result 'T02' $(if ($seed.Code -eq 0 -and $wrong.Count -eq 0) { 'pass' } else { 'fail' }) '가짜 데이터 입력 + 프로필 자동 생성 트리거 동작 + 기대 건수 일치' $(if ($wrong.Count) { $wrong -join ', ' } elseif ($seed.Code -ne 0) { ($seed.Out | Select-Object -Last 2) -join ' ' } else { '16개 항목 모두 일치' })
  if ($seed.Code -ne 0 -or $wrong.Count) { Fail-Infra '가짜 데이터 입력 실패' }
  $repSource = Get-Report $dbSrc 'source'
  # 동작 기준값: 원본 DB에서 (1) reviews.rating 검사 제약 동작(22) (2) 역할별 실제 읽기 결과(21). 만들지 못하면 건너뛰지 않고 해당 시험을 ❌로 기록해요.
  $t06Src = Get-Lines $dbSrc '22-constraint-behavior.sql' 'T06B'
  $acSrc = Get-Lines $dbSrc '21-access-probe.sql' 'probe'
  $t06Oracle = @('T06B|0|rejected', 'T06B|0.4|rejected', 'T06B|0.5|accepted', 'T06B|0.7|rejected', 'T06B|1|accepted', 'T06B|1.5|accepted', 'T06B|4.5|accepted', 'T06B|4.9|rejected', 'T06B|5|accepted', 'T06B|5.5|rejected', 'T06B|9.9|rejected') | Sort-Object
  Add-Result 'T06b0' $(if ($t06Src.Ok -and @(Safe-Compare $t06Src.Lines $t06Oracle).Count -eq 0) { 'pass' } else { 'fail' }) '원본 DB에서 reviews.rating 제약이 기대대로 동작함 (0.5 단위로 0.5~5만 허용: 0 · 0.4 · 0.7 · 4.9 · 5.5 · 9.9 거부, 0.5 · 1 · 1.5 · 4.5 · 5 허용)' $(if (-not $t06Src.Ok) { $t06Src.Why } else { Sample (Safe-Compare $t06Src.Lines $t06Oracle) 4 })
  $adminDenied = @($acSrc.Lines | Where-Object { $_ -eq 'probe|anon|select admins|denied' -or $_ -eq 'probe|authenticated|select admins|denied' }).Count
  Add-Result 'T02b' $(if ($acSrc.Ok -and $acSrc.Lines.Count -ge 9 -and $adminDenied -eq 2) { 'pass' } else { 'fail' }) '원본 DB의 역할별 읽기 동작 기준값이 만들어짐: 역할 3개 × public 표 · 보기, 그리고 admins 표는 anon · authenticated 모두 거부 (0009 설계)' $(if (-not $acSrc.Ok) { $acSrc.Why } else { "probe 줄 $($acSrc.Lines.Count)개, admins 거부 $adminDenied/2" })

  # ── C4 백업 (워크플로와 같은 명령) ──
  Step 'C4) 백업: 워크플로(backup-db.yml.draft)와 같은 pg_dump 2개 + 권한 포함 변형 1개'
  $pub = "$files\public.dump"; $auth = "$files\auth-users.dump"; $pubPriv = "$files\public-with-privileges.dump"
  $d1 = Invoke-Tool 'pg_dump' @('--format=custom', '--no-owner', '--no-privileges', '--schema=public', '-d', $dbSrc, '--file', $pub)
  $d2 = Invoke-Tool 'pg_dump' @('--format=custom', '--no-owner', '--no-privileges', '--data-only', '--table=auth.users', '--table=auth.identities', '-d', $dbSrc, '--file', $auth)
  $d3 = Invoke-Tool 'pg_dump' @('--format=custom', '--no-owner', '--schema=public', '-d', $dbSrc, '--file', $pubPriv)
  Add-Result 'T03a' $(if ($d1.Code -eq 0 -and $d2.Code -eq 0 -and $d3.Code -eq 0) { 'pass' } else { 'fail' }) 'pg_dump 3개 실행 성공' (($d1.Code, $d2.Code, $d3.Code) -join '/')
  if ($d1.Code -ne 0 -or $d2.Code -ne 0 -or $d3.Code -ne 0 -or -not (Test-Path $pub) -or -not (Test-Path $auth) -or -not (Test-Path $pubPriv)) { Fail-Infra '백업(pg_dump) 실패 — 이후 시험을 진행하지 않아요' }
  $lp = Invoke-Tool 'pg_restore' @('--list', $pub) -NoConn; $la = Invoke-Tool 'pg_restore' @('--list', $auth) -NoConn
  $pubEntries = @($lp.Out | Where-Object { $_ -match '^\d+;' }).Count; $authData = @($la.Out | Where-Object { $_ -match 'TABLE DATA' }).Count
  Add-Result 'T03b' $(if ($lp.Code -eq 0 -and $la.Code -eq 0 -and $pubEntries -gt 20 -and $authData -eq 2) { 'pass' } else { 'fail' }) '덤프 목록 검사(워크플로 조건): public 항목 > 20, 계정 덤프의 TABLE DATA = 2' "public=$pubEntries, auth TABLE DATA=$authData"
  $excl = @(($lp.Out + $la.Out) | Where-Object { $_ -match 'sessions|refresh_tokens|one_time_tokens|audit_log_entries' })
  Add-Result 'T03c' $(if ($lp.Code -eq 0 -and $la.Code -eq 0 -and $excl.Count -eq 0) { 'pass' } else { 'fail' }) '세션 · 토큰 · 감사 로그 표가 두 덤프 어디에도 없음' $(if ($excl.Count) { ($excl | Select-Object -First 3) -join ' | ' } else { '' })
  $tr = Run-Native $tarExe @('-cf', "$files\bundle.tar", '-C', $files, 'public.dump', 'auth-users.dump') 60

  # ── 임시 age 키 3개 (운영 키가 아니에요) + 암호화 · 복호화 ──
  Step 'C4-2) 임시 age 키 3개 생성(운영 키와 완전히 분리) → 받는 사람 2명으로 암호화 → 복호화 시험'
  foreach ($n in 1, 2, 3) { $kg = Run-Native "$ageDir\age-keygen.exe" @('-o', "$keys\rehearsal-key-$n.txt") 30; if ($kg.Code -ne 0 -or -not (Test-Path "$keys\rehearsal-key-$n.txt")) { Fail-Infra "임시 키 $n 생성 실패" } }
  $pk = @{}; foreach ($n in 1, 2) { $y = Run-Native "$ageDir\age-keygen.exe" @('-y', "$keys\rehearsal-key-$n.txt") 30; $pk[$n] = ($y.Out | Where-Object { $_ -match '^age1' } | Select-Object -First 1); if (-not $pk[$n]) { Fail-Infra "공개키 $n 읽기 실패" } }
  if (-not (Test-UserOnlyAcl $keys)) { Fail-Infra '임시 키 폴더가 현재 사용자 전용이 아니에요' }
  Write-Output '  임시 키 폴더 접근: 현재 사용자 전용 확인 (키 내용은 출력하지 않아요)'
  if ($Run -ne 1) {      # 재시험은 반드시 "새" 임시 키를 써요. 1차 키 파일은 읽기만 하고 그대로 둬요(공개키만 비교, 비밀키는 출력하지 않아요).
    $oldPk = @(); if (Test-Path $oldKeys) { foreach ($kf in @(Get-ChildItem $oldKeys -Filter 'rehearsal-key-*.txt' -File)) { $yy = Run-Native "$ageDir\age-keygen.exe" @('-y', $kf.FullName) 30; $oldPk += @($yy.Out | Where-Object { $_ -match '^age1' } | Select-Object -First 1) } }
    $newPk = @(); foreach ($n in 1, 2, 3) { $yy = Run-Native "$ageDir\age-keygen.exe" @('-y', "$keys\rehearsal-key-$n.txt") 30; $newPk += @($yy.Out | Where-Object { $_ -match '^age1' } | Select-Object -First 1) }
    $overlap = @($newPk | Where-Object { $oldPk -contains $_ })
    Add-Result 'T04e' $(if ($newPk.Count -eq 3 -and $oldPk.Count -ge 1 -and $overlap.Count -eq 0) { 'pass' } else { 'fail' }) '재시험의 임시 키 3개가 1차 임시 키와 겹치지 않는 새 키임 (1차 키 파일은 읽기만 하고 그대로 둠)' "새 키 $($newPk.Count)개 / 1차 키 $($oldPk.Count)개 확인 / 겹침 $($overlap.Count)개"
  }
  $en = Run-Native "$ageDir\age.exe" @('-r', $pk[1], '-r', $pk[2], '-o', "$files\bakery-db-test.tar.age", "$files\bundle.tar") 60
  if ($tr.Code -ne 0 -or $en.Code -ne 0 -or -not (Test-Path "$files\bakery-db-test.tar.age")) { Add-Result 'T04a' 'fail' 'tar 묶음 + age 암호화' "tar=$($tr.Code), age=$($en.Code)"; Fail-Infra 'tar 또는 암호화 실패' }
  $cipher = [Text.Encoding]::GetEncoding(28591).GetString([IO.File]::ReadAllBytes("$files\bakery-db-test.tar.age"))
  Add-Result 'T04a' $(if (-not $cipher.Contains('example.invalid') -and -not $cipher.Contains('FAKE')) { 'pass' } else { 'fail' }) 'tar 묶음 + age 암호화 성공, 암호문에 가짜 평문이 보이지 않음' "tar=$($tr.Code), age=$($en.Code)"
  $h0 = (Get-FileHash "$files\bundle.tar" -Algorithm SHA256).Hash
  $dc = @{}; foreach ($n in 1, 2, 3) { $dc[$n] = Run-Native "$ageDir\age.exe" @('-d', '-i', "$keys\rehearsal-key-$n.txt", '-o', "$files\out$n.tar", "$files\bakery-db-test.tar.age") 60 }
  $m1 = (Test-Path "$files\out1.tar") -and ((Get-FileHash "$files\out1.tar" -Algorithm SHA256).Hash -eq $h0)
  $m2 = (Test-Path "$files\out2.tar") -and ((Get-FileHash "$files\out2.tar" -Algorithm SHA256).Hash -eq $h0)
  Add-Result 'T04b' $(if ($dc[1].Code -eq 0 -and $dc[2].Code -eq 0 -and $m1 -and $m2) { 'pass' } else { 'fail' }) '키1만 · 키2만으로 각각 복호화되고 원본 tar와 해시 동일' "키1 code=$($dc[1].Code) 일치=$m1 / 키2 code=$($dc[2].Code) 일치=$m2"
  Add-Result 'T04c' $(if ($dc[3].Code -ne 0 -and -not $dc[3].TimedOut -and -not (Test-Path "$files\out3.tar")) { 'pass' } else { 'fail' }) '무관한 키3은 복호화가 거부됨' "code=$($dc[3].Code)"
  if (-not ($dc[1].Code -eq 0 -and $m1)) { Fail-Infra '복호화 실패 — 이후 복원 시험을 진행하지 않아요' }
  New-Item -ItemType Directory -Path "$files\from-age" -Force | Out-Null
  $ux = Run-Native $tarExe @('-xf', "$files\out1.tar", '-C', "$files\from-age") 60
  $sameDump = ($ux.Code -eq 0) -and (Test-Path "$files\from-age\public.dump") -and (Test-Path "$files\from-age\auth-users.dump") -and ((Get-FileHash "$files\from-age\public.dump" -Algorithm SHA256).Hash -eq (Get-FileHash $pub -Algorithm SHA256).Hash) -and ((Get-FileHash "$files\from-age\auth-users.dump" -Algorithm SHA256).Hash -eq (Get-FileHash $auth -Algorithm SHA256).Hash)
  Add-Result 'T04d' $(if ($sameDump) { 'pass' } else { 'fail' }) '복호화 → tar 풀기로 나온 두 덤프가 원본 덤프와 동일 (이후 복원은 이 파일로 해요)'
  if (-not $sameDump) { Fail-Infra '복호화한 덤프가 원본과 달라서 이후 복원 시험을 진행하지 않아요' }
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
  Write-SqlSafe "$files\c6-after-backup.sql" $after
  $c6 = PsqlFile $dbSrc "$files\c6-after-backup.sql" '' -Quiet
  Require-Ok $c6 '탈퇴 · 손실 흉내 SQL 실패'
  $w = PsqlScalar $dbSrc "select (select count(*) from auth.users where id = '$($U.u6)') || '/' || (select count(*) from public.profiles where id = '$($U.u6)') || '/' || (select count(*) from public.reviews where user_id = '$($U.u6)') || '/' || (select count(*) from public.reports where target_user_id = '$($U.u6)') || '/' || (select count(*) from public.reports where reporter_id is null)"
  Add-Result 'T05f' $(if ($w -eq '0/0/0/1/1') { 'pass' } else { 'fail' }) '탈퇴 흉내 확인: 계정 · 프로필 · 일지는 연쇄 삭제, 신고 기록은 남고 신고자 연결만 끊김(0009)' "계정/프로필/일지/대상신고/신고자null = $w (기대 0/0/0/1/1)"
  if ($w -ne '0/0/0/1/1') { Fail-Infra '탈퇴 흉내 결과가 예상과 달라요 — 이후 상황 A 시험이 의미 없어요' }
  $reportsBefore = PsqlScalar $dbSrc 'select count(*) from public.reports'
  $ro = Psql $dbSrc @('-At', '-c', 'select id from auth.users order by id') "$files\roster.csv"
  $rosterLines = @(Get-Content "$files\roster.csv" -ErrorAction SilentlyContinue | Where-Object { $_ })
  if ($ro.Code -ne 0 -or $rosterLines.Count -ne 6 -or ($rosterLines -contains $U.u6)) { Fail-Infra '명부(roster) 생성 실패 또는 예상과 다름' "줄 수=$($rosterLines.Count) (기대 6, 탈퇴자 미포함)" }
  $repProd = Get-Report $dbSrc 'prod-after'

  # ── R1 복원 (워크플로 그대로, 빈 새 DB) ──
  Step 'R1) 복원: 빈 새 DB에 "가짜 Supabase 기본 환경" → 계정 데이터 → public 덤프 (마이그레이션은 적용하지 않음)'
  New-Db $dbR1
  Require-Ok (PsqlFile $dbR1 "$sqlDir\00-auth-stub.sql" '' -Quiet) 'R1 가짜 환경 적용 실패'
  $ra = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', $dbR1, $authR)
  $rp = Restore-PublicDump $dbR1 $pubR @('--no-privileges')
  $errs = @((Restore-Errors $ra) + (Restore-Errors $rp))
  Add-Result 'T05a' $(if ($errs.Count -eq 0 -and -not $ra.TimedOut -and -not $rp.TimedOut) { 'pass' } else { 'fail' }) 'pg_restore 오류 0개 (계정 → public 순서)' $(if ($errs.Count) { "오류 $($errs.Count)개: " + (($errs | Select-Object -First 3) -join ' | ') } elseif ($ra.TimedOut -or $rp.TimedOut) { '시간 초과' } else { '' })
  $rep1 = Get-Report $dbR1 'r1'
  $dRows = @(Diff-Lines $repSource $rep1 { $_ -match '^1\.rows\|public\.' })
  Add-Result 'T05b' $(if ($dRows.Count -eq 0) { 'pass' } else { 'fail' }) 'public 모든 표의 행 수 · 행 체크섬이 원본과 같음' $(if ($dRows.Count) { Sample $dRows } else { '' })
  $dAuth = @(Diff-Lines $repSource $rep1 { $_ -match '^1\.rows\|auth\.(users|identities)\|' })
  Add-Result 'T05c' $(if ($dAuth.Count -eq 0) { 'pass' } else { 'fail' }) 'auth.users · auth.identities 행 수 · 행 체크섬 일치' $(if ($dAuth.Count) { Sample $dAuth } else { '' })
  $dAcc = @(Diff-Lines $repSource $rep1 { $_ -match '^2\.account\|' })
  Add-Result 'T05d' $(if ($dAcc.Count -eq 0) { 'pass' } else { 'fail' }) '비밀번호 해시 · raw_user_meta_data · 약관 동의 기록(terms_version · terms_agreed_at) · identities.email 생성 칸 보존' $(if ($dAcc.Count) { Sample $dAcc } else { '' })
  $exCounts = @('sessions', 'refresh_tokens', 'one_time_tokens', 'audit_log_entries' | ForEach-Object { $t = $_; @($rep1 | Where-Object { $_ -like "1.rows|auth.$t|*" }) -replace '^1\.rows\|auth\.[^|]+\|', '' })
  Add-Result 'T05e' $(if ($exCounts.Count -eq 4 -and @($exCounts | Where-Object { $_ -notlike '0 /*' }).Count -eq 0) { 'pass' } else { 'fail' }) '백업에 넣지 않기로 한 표(세션 · 토큰 · 감사 로그)가 복원본에서 비어 있음' ("$($exCounts.Count)개 표 확인: " + ($exCounts -join ' ; '))
  $dCon = @(Diff-Lines $repSource $rep1 { $_ -match '^3\.constraint\|' })
  $notVal = @($rep1 | Where-Object { $_ -match '^3\.constraint\|' -and $_ -match 'validated=false' })
  Add-Result 'T06' $(if ($dCon.Count -eq 0 -and $notVal.Count -eq 0) { 'pass' } else { 'fail' }) '외래키 · 검사 제약조건이 모두 복원되고 검증됨(validated=true)' $(if ($dCon.Count) { Sample $dCon } elseif ($notVal.Count) { "검증 안 된 제약 $($notVal.Count)개" } else { '' })
  Judge-T06b 'T06b' $dbR1 '복원본(R1)'       # T06 의 텍스트 비교 결과는 위에 그대로 기록돼 있어요 (통과로 바꾸지 않아요). 이건 "동작이 같은가"를 따로 보는 시험이에요.

  # 백업에 포함되지 않을 것으로 의심되는 4가지 — 각각 독립적으로 판정
  $srcTrig = @($repSource | Where-Object { $_ -like '4.trigger|auth.users on_auth_user_created|*' }).Count; $r1Trig = @($rep1 | Where-Object { $_ -like '4.trigger|auth.users on_auth_user_created|*' }).Count
  Add-Result 'T07.trigger' $(if ($srcTrig -eq 1 -and $r1Trig -eq 1) { 'pass' } else { 'fail' }) '프로필 자동 생성 트리거(auth.users)가 백업에 포함되는가' "원본 ${srcTrig}개 / 복원본 ${r1Trig}개"
  $srcSp = @($repSource | Where-Object { $_ -like '5.policy|storage.objects *' }).Count; $r1Sp = @($rep1 | Where-Object { $_ -like '5.policy|storage.objects *' }).Count
  Add-Result 'T07.storage' $(if ($srcSp -gt 0 -and $srcSp -eq $r1Sp) { 'pass' } else { 'fail' }) 'storage.objects 정책이 백업에 포함되는가' "원본 ${srcSp}개 / 복원본 ${r1Sp}개"
  $srcB = @($repSource | Where-Object { $_ -like '10.bucket|photos|*' }).Count; $r1B = @($rep1 | Where-Object { $_ -like '10.bucket|photos|*' }).Count
  Add-Result 'T07.bucket' $(if ($srcB -eq 1 -and $r1B -eq 1) { 'pass' } else { 'fail' }) 'photos 버킷 정보가 백업에 포함되는가' "원본 ${srcB}개 / 복원본 ${r1B}개"
  $srcObj = (@($repSource | Where-Object { $_ -like '1.rows|storage.objects|*' }) -replace '^1\.rows\|storage\.objects\|', '') -join ''; $r1Obj = (@($rep1 | Where-Object { $_ -like '1.rows|storage.objects|*' }) -replace '^1\.rows\|storage\.objects\|', '') -join ''
  Add-Result 'T07.object' $(if ($srcObj -and $srcObj -ne '0 / d41d8cd98f00b204e9800998ecf8427e' -and $srcObj -eq $r1Obj) { 'pass' } else { 'fail' }) 'Storage 객체(사진 파일 기록 storage.objects)가 백업에 포함되는가 — 사진 백업은 미구현(의도된 한계)' "원본 [$srcObj] / 복원본 [$r1Obj]"
  $photoRefs = PsqlScalar $dbR1 'select count(*) from public.reviews where photo_path is not null'
  Add-Result 'T07.photo' 'info' '복원본에 사진 경로가 있는 일지가 있는데 사진 파일 기록은 없음 → 앱에서 깨진 이미지가 어떻게 보이는지는 별도 확인 필요' "사진 경로가 있는 일지 ${photoRefs}개 / 복원본 storage.objects 0개 예상"
  $acl = { $_ -match '^6\.acl\|(table|column|function) public\.' }
  $dAcl = @(Diff-Lines $repSource $rep1 $acl)
  Add-Result 'T07.grant' $(if ($dAcl.Count -eq 0) { 'pass' } else { 'fail' }) 'GRANT 권한(표 · 열 · 함수)이 백업에 포함되는가 (--no-privileges 워크플로 기준)' $(if ($dAcl.Count) { "다른 줄 $($dAcl.Count)개: " + (Sample $dAcl 3) } else { '' })
  Judge-Access 'T07.access' 'T07.probe' $rep1 $dbR1 '--no-privileges 복원본(R1)'      # 1차 워크플로의 알려진 공백이라 ❌가 예상돼요(기준은 그대로)
  $dOther = @(Diff-Lines $repSource $rep1 { $_ -match '^(5\.policy\|(public\.|RLS public\.)|7\.function|8\.view|9\.index)' })
  Add-Result 'T07.etc' $(if ($dOther.Count -eq 0) { 'pass' } else { 'fail' }) '그 밖의 public 구조(정책 · RLS 켜짐 · 함수 · 보기 · 인덱스)는 원본과 같음' $(if ($dOther.Count) { Sample $dOther } else { '' })

  # ── R1b 권한 포함 덤프 + 재적용 = 설계 수정안 검증 ──
  Step 'R1b) 설계 수정안 검증: 권한 포함 덤프 복원 + public 밖 객체 재적용(트리거 · storage 정책 · 버킷)'
  New-Db $dbR1b
  Require-Ok (PsqlFile $dbR1b "$sqlDir\00-auth-stub.sql" '' -Quiet) 'R1b 가짜 환경 적용 실패'
  $xa = Invoke-Tool 'pg_restore' @('--no-owner', '--data-only', '-d', $dbR1b, $authR)
  $xp = Restore-PublicDump $dbR1b $pubPriv @()
  $xerr = @((Restore-Errors $xa) + (Restore-Errors $xp))
  Add-Result 'T08a' $(if ($xerr.Count -eq 0 -and -not $xa.TimedOut -and -not $xp.TimedOut) { 'pass' } else { 'fail' }) '권한 포함 덤프 복원 오류 0개' $(if ($xerr.Count) { "오류 $($xerr.Count)개: " + (($xerr | Select-Object -First 3) -join ' | ') } else { '' })
  $rep1b0 = Get-Report $dbR1b 'r1b-before-repair'
  $dAclB = @(Diff-Lines $repSource $rep1b0 $acl)
  Add-Result 'T08b' $(if ($dAclB.Count -eq 0) { 'pass' } else { 'fail' }) '권한 포함 덤프는 public 표 · 열 · 함수의 유효 권한(명시적 GRANT + PostgreSQL 기본 권한을 풀어서 본 실제 권한)이 원본과 같음' $(if ($dAclB.Count) { "다른 줄 $($dAclB.Count)개: " + (Sample $dAclB 3) } else { '' })
  # 같은 의미지만 저장 방식(명시적/기본)만 다른 권한: 판정에는 쓰지 않는 참고 정보예요. 실제 접근이 다르면 위 T08b · T08e · T08f 가 ❌로 잡아요.
  $srcMode = @{}; foreach ($l in @($repSource | Where-Object { $_ -like '6.aclsrc|*' })) { $p = $l -split '\|', 3; $srcMode[$p[1]] = $p[2] }
  $reprDiff = @(); foreach ($l in @($rep1b0 | Where-Object { $_ -like '6.aclsrc|*' })) { $p = $l -split '\|', 3; if ($srcMode.ContainsKey($p[1]) -and $srcMode[$p[1]] -ne $p[2]) { $reprDiff += "$($p[1]) [원본 $($srcMode[$p[1]]) → 복원본 $($p[2])]" } }
  Add-Result 'T08b2' 'info' '권한 저장 방식(명시적/기본)만 다른 항목 — 참고용 (1차에서 admins 가 이런 경우였어요)' $(if ($reprDiff.Count) { "$($reprDiff.Count)개: " + ($reprDiff -join ' ; ') } else { '없음' })
  $fix = @(); $q0 = PsqlFile $dbR1b "$sqlDir\50-reapply-outside-public.sql" '' -Quiet; if ($q0.Code -ne 0) { $fix += "50-reapply :: $(($q0.Out | Select-Object -Last 1))" }
  foreach ($m in '0003_storage.sql', '0008_storage_select_own.sql', '0010_storage_admin.sql') { $q = PsqlFile $dbR1b "$migDir\$m" '' -Quiet; if ($q.Code -ne 0) { $fix += "$m :: $(($q.Out | Select-Object -Last 1))" } }
  $rep1b = Get-Report $dbR1b 'r1b-after-repair'
  $expectedGone = { $_ -notmatch '^1\.rows\|(auth\.(sessions|refresh_tokens|one_time_tokens|audit_log_entries)|storage\.objects)\|' -and $_ -notmatch '^6\.aclsrc\|' }     # 6.aclsrc(저장 방식 표시)는 판정에서 빼요 → T08b2 가 참고용으로 따로 보여줘요. 유효 권한(6.acl)과 실제 접근(12.access)은 그대로 엄격하게 비교해요.
  $dFull = @(Diff-Lines $repSource $rep1b $expectedGone)
  Add-Result 'T08c' $(if ($fix.Count -eq 0 -and $dFull.Count -eq 0) { 'pass' } else { 'fail' }) '수리 후 전체 보고서가 원본과 일치 (백업에 안 넣기로 한 세션 · 토큰 · 감사 로그 · 사진 파일 기록만 다름)' $(if ($fix.Count) { $fix -join ' | ' } elseif ($dFull.Count) { "다른 줄 $($dFull.Count)개: " + (Sample $dFull 4) } else { '' })
  Judge-T06b 'T06b-r1b' $dbR1b '권한 포함 복원본(R1b, 수리 후)'
  Judge-Access 'T08e' 'T08f' $rep1b $dbR1b '권한 포함 복원본(R1b, 수리 후)'
  $defA = @($repSource | Where-Object { $_ -like '4.trigger|auth.users on_auth_user_created|*' }); $defB = @($rep1b | Where-Object { $_ -like '4.trigger|auth.users on_auth_user_created|*' })
  Add-Result 'T08d' $(if ($defA.Count -eq 1 -and $defB.Count -eq 1 -and $defA[0] -eq $defB[0]) { 'pass' } else { 'fail' }) '50-reapply-outside-public.sql 의 트리거 정의가 마이그레이션 0001의 정의와 동일'

  # ── R2 순서 충돌 재현 ──
  Step 'R2) 충돌 재현: 마이그레이션(트리거 포함)을 먼저 적용한 DB에 계정 → public 데이터를 복원하면?'
  New-Db $dbR2
  Require-Ok (PsqlFile $dbR2 "$sqlDir\00-auth-stub.sql" '' -Quiet) 'R2 가짜 환경 적용 실패'
  $b2 = @(Apply-Migrations $dbR2 $migs)
  $ya = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', $dbR2, $authR)
  $autoProfiles = PsqlScalar $dbR2 'select count(*) from public.profiles'
  Add-Result 'T09a' 'info' '트리거가 있는 DB에 계정을 복원하면 프로필이 자동 생성되는가' "프로필 ${autoProfiles}개 자동 생성(원본 계정 6개), 계정 복원 오류 $((Restore-Errors $ya).Count)개, 마이그레이션 실패 $($b2.Count)개"
  $yp = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', $dbR2, $pubR)
  $yerrs = Restore-Errors $yp
  $cnt2 = PsqlScalar $dbR2 "select (select count(*) from public.profiles) || '/' || (select count(*) from public.reviews) || '/' || (select count(*) from public.posts)"
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
  Write-SqlSafe "$files\a-export.sql" $exp
  $ex = PsqlFile $dbR1 "$files\a-export.sql" '' -Quiet
  $exclLines = @($ex.Out | Where-Object { $_ -like 'EXCL|*' })
  $exclOk = ($exclLines -contains 'EXCL|reviews|1') -and ($exclLines -contains 'EXCL|posts|1') -and ($exclLines -contains 'EXCL|comments|1') -and ($exclLines -contains 'EXCL|post_likes|2')
  Add-Result 'T10a' $(if ($ex.Code -eq 0 -and $exclOk) { 'pass' } else { 'fail' }) '스테이징(백업 복원본)에서 명부 기준으로 가져올 행만 내보내기 — 제외된 탈퇴자 관련 행: 일지 1 · 글 1 · 댓글 1(탈퇴자 글에 단 댓글) · 좋아요 2(탈퇴자의 좋아요 + 탈퇴자 글에 누른 좋아요)' ($exclLines -join ' ; ')
  if ($ex.Code -ne 0 -or -not (Test-Path "$files\a-reviews.csv") -or -not (Test-Path "$files\a-likes.csv")) { Fail-Infra '상황 A 내보내기 실패 — 이후 시험을 진행하지 않아요' }
  # (1) 트리거를 켠 채로 넣어보기 — 실패해야 해요(작성자 덮어쓰기). 되돌려서 운영 DB는 그대로
  $neg = @'
begin;
create temp table t_reviews (like public.reviews);
\copy t_reviews from '{{F}}/a-reviews.csv' with (format csv)
do $$ begin insert into public.reviews select * from t_reviews; raise notice 'NEG|INSERT_OK'; exception when others then raise notice 'NEG|INSERT_FAILED:%', sqlstate; end $$;
rollback;
'@.Replace('{{F}}', $filesFwd)
  Write-SqlSafe "$files\a-negative.sql" $neg
  $ng = PsqlFile $dbSrc "$files\a-negative.sql" '' -Quiet
  $negLine = ($ng.Out | Where-Object { $_ -match 'NEG\|' } | Select-Object -First 1)
  $afterNeg = PsqlScalar $dbSrc "select count(*) from public.reviews where user_id = '$($U.u2)'"
  Add-Result 'T10b' 'info' '트리거를 켠 채로 INSERT 하면? (user_id가 auth.uid()로 덮어써져 실패하는 것이 예상) — 실제 운영 절차에서 트리거를 꺼야 하는 이유' "$($negLine -replace '\s+', ' ') / 롤백 후 u2 일지 $afterNeg (0이어야 해요)"
  if ($afterNeg -ne '0') { Fail-Infra '트리거 켠 채 시험이 롤백되지 않았어요(운영 DB 시험본이 바뀜)' }
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
  Write-SqlSafe "$files\a-import.sql" $imp
  $im = PsqlFile $dbSrc "$files\a-import.sql" '' -Quiet
  Add-Result 'T10c' $(if ($im.Code -eq 0) { 'pass' } else { 'fail' }) '운영 DB(시험용)에 INSERT만 실행 (사용자 트리거만 잠시 끄고 다시 켬, 트랜잭션 한 번)' $(if ($im.Code -ne 0) { ($im.Out | Select-Object -Last 2) -join ' ' } else { '' })
  $chkA = PsqlScalar $dbSrc "select (select count(*) from auth.users where id = '$($U.u6)') + (select count(*) from public.profiles where id = '$($U.u6)') + (select count(*) from public.reviews where user_id = '$($U.u6)') + (select count(*) from public.posts where user_id = '$($U.u6)') + (select count(*) from public.comments where user_id = '$($U.u6)') + (select count(*) from public.post_likes where user_id = '$($U.u6)') + (select count(*) from public.bakery_visits where user_id = '$($U.u6)')"
  Add-Result 'T10d' $(if ($chkA -eq '0') { 'pass' } else { 'fail' }) '가짜 탈퇴자의 계정 · 프로필 · 일지 · 글 · 댓글 · 좋아요 · 방문이 가져와지지 않음(되살아나지 않음)' "탈퇴자 행 합계=$chkA"
  $restoredA = PsqlScalar $dbSrc "select (select count(*) from public.reviews where user_id = '$($U.u2)') || '/' || (select count(*) from public.posts where user_id = '$($U.u2)') || '/' || (select count(*) from public.comments where post_id in (select id from public.posts where user_id = '$($U.u2)')) || '/' || (select count(*) from public.post_likes where user_id = '$($U.u3)')"
  Add-Result 'T10e' $(if ($restoredA -eq '2/1/2/1') { 'pass' } else { 'fail' }) '잃어버린 u2의 일지 2 · 글 1 · 그 글의 댓글 2(댓글+답글) · u3의 좋아요 1이 복구됨' "u2 일지/글/댓글, u3 좋아요 = $restoredA (기대 2/1/2/1)"
  # T10k (1차: psql 오류로 빈 값). 한글 조건이 든 SQL은 명령줄(-c)이 아니라 UTF-8 파일(-f)로 실행하고, 실패하면 오류 이유가 상세에 그대로 찍혀요. 질문과 기대값(0/0/0/0)은 그대로예요.
  $korCountSql = "select (select count(*) from public.comments where content like '가짜 댓글 2%') || '/' || (select count(*) from public.post_likes l join public.posts p on p.id = l.post_id where p.title like '가짜 글 제목 3%');"
  $wrongLinkSql = "select (select count(*) from public.comments where content like '가짜 댓글 2%') || '/' || (select count(*) from public.post_likes l join public.posts p on p.id = l.post_id where p.title like '가짜 글 제목 3%') || '/' || (select count(*) from public.comments c where not exists (select 1 from public.posts p where p.id = c.post_id)) || '/' || (select count(*) from public.post_likes l where not exists (select 1 from public.posts p where p.id = l.post_id));"
  # 사전 확인(헛돌지 않는지): 백업 복원본(R1)에는 탈퇴자 글이 살아 있으므로 한글 조건으로 센 값이 아이디 조건으로 센 값과 같고 둘 다 1 이상이어야 해요 → 0 이 나온 이유가 "조건이 아무것도 못 찾아서"가 아님을 보장해요.
  $korStage = PsqlScalarFile $dbR1 't10k-probe-kor.sql' $korCountSql
  $idStage = PsqlScalar $dbR1 "select (select count(*) from public.comments c join public.posts p on p.id = c.post_id where p.user_id = '$($U.u6)') || '/' || (select count(*) from public.post_likes l join public.posts p on p.id = l.post_id where p.user_id = '$($U.u6)')"
  $probeOk = (-not (Is-Err $korStage)) -and (-not (Is-Err $idStage)) -and ($korStage -eq $idStage) -and ($korStage -match '^[1-9]\d*/[1-9]\d*$')
  Add-Result 'T10k0' $(if ($probeOk) { 'pass' } else { 'fail' }) 'T10k의 한글 조건이 실제로 탈퇴자 글의 댓글 · 좋아요를 찾아냄 (백업 복원본에서 한글 조건 = 아이디 조건, 둘 다 1 이상)' "한글 조건 $korStage / 아이디 조건 $idStage"
  $wrongLink = PsqlScalarFile $dbSrc 't10k.sql' $wrongLinkSql
  Add-Result 'T10k' $(if ($probeOk -and $wrongLink -eq '0/0/0/0') { 'pass' } else { 'fail' }) '잘못된 연결 복구 없음: 탈퇴자 글에 단 댓글 0 · 탈퇴자 글에 누른 좋아요 0 · 글 없는 댓글(고아) 0 · 글 없는 좋아요 0' "$wrongLink (기대 0/0/0/0)$(if (-not $probeOk) { ' — T10k0 실패로 이 결과를 믿을 수 없어요' })"
  $reportsAfter = PsqlScalar $dbSrc 'select count(*) from public.reports'
  $reportKinds = PsqlScalar $dbSrc "select (select count(*) from public.reports where target_user_id = '$($U.u6)') || '/' || (select count(*) from public.reports where reporter_id is null)"
  Add-Result 'T10j' $(if ($reportsBefore -and -not (Is-Err $reportsBefore) -and -not (Is-Err $reportsAfter) -and $reportsAfter -eq $reportsBefore -and $reportKinds -eq '1/1') { 'pass' } else { 'fail' }) '신고(reports)가 유실되거나 중복 · 잘못 복구되지 않음: 가져오기 전후 같음, 탈퇴자 글 신고 1 · 신고자 연결 끊긴 신고 1 유지' "전 $reportsBefore / 후 $reportsAfter, 대상탈퇴자/신고자null = $reportKinds"
  $usersNow = PsqlScalar $dbSrc 'select (select count(*) from auth.users) || '' / '' || (select count(*) from public.profiles)'
  Add-Result 'T10f' $(if ($usersNow -eq '6 / 6') { 'pass' } else { 'fail' }) '회원 수가 늘지 않음(계정은 건드리지 않음): 계정 / 프로필' "$usersNow (u1~u5 + 백업 이후 가입한 u7 = 6)"
  $mdProd = PsqlScalar $dbSrc "select md5(string_agg(id::text || created_at::text || exp_review::text || exp_photo::text, ',' order by id)) from public.reviews where user_id = '$($U.u2)'"
  $mdStage = PsqlScalar $dbR1 "select md5(string_agg(id::text || created_at::text || exp_review::text || exp_photo::text, ',' order by id)) from public.reviews where user_id = '$($U.u2)'"
  Add-Result 'T10g' $(if ($mdProd -and -not (Is-Err $mdProd) -and -not (Is-Err $mdStage) -and $mdProd -eq $mdStage) { 'pass' } else { 'fail' }) '가져온 일지의 원래 작성 날짜 · EXP 칸이 백업과 같음(트리거를 끈 덕분)'
  $dup = PsqlScalar $dbSrc "select count(*) from (select user_id, bakery_id from public.reviews group by 1,2 having count(*) > 1) s"
  Add-Result 'T10h' $(if ($dup -eq '0') { 'pass' } else { 'fail' }) '중복 행이 생기지 않음(같은 사용자 · 같은 빵집 일지 중복 0)' "중복=$dup"
  $trigState = PsqlScalar $dbSrc "select string_agg(distinct tgenabled::text, ',') from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not t.tgisinternal"
  Add-Result 'T10i' $(if ($trigState -eq 'O') { 'pass' } else { 'fail' }) '가져온 뒤 사용자 트리거가 모두 다시 켜져 있음(tgenabled=O)' "상태=$trigState"

  # ── R4 상황 B ──
  Step 'R4) 상황 B: 운영 DB 전체 손실 — 격리(quarantine) 프로토타입 (설계 검증, 구현 아님)'
  New-Db $dbStage
  Require-Ok (PsqlFile $dbStage "$sqlDir\00-auth-stub.sql" '' -Quiet) 'stage 가짜 환경 적용 실패'
  $sa = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', $dbStage, $authR)
  $sp = Restore-PublicDump $dbStage $pubR @('--no-privileges')
  $serr = @((Restore-Errors $sa) + (Restore-Errors $sp))
  if ($serr.Count) { Fail-Infra '스테이징 복원 오류 — 상황 B 시험 준비 실패' (($serr | Select-Object -First 2) -join ' | ') }
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
  Write-SqlSafe "$files\b-move.sql" $mv
  $mvr = PsqlFile $dbStage "$files\b-move.sql" '' -Quiet
  $qd = Invoke-Tool 'pg_dump' @('--format=custom', '--no-owner', '--no-privileges', '--schema=quarantine', '-d', $dbStage, '--file', "$files\quarantine.dump")
  Add-Result 'T11a' $(if ($mvr.Code -eq 0 -and $qd.Code -eq 0) { 'pass' } else { 'fail' }) '스테이징에서 사용자 소유 표 7개를 quarantine 스키마로 옮기고 그 스키마만 덤프' "move=$($mvr.Code), dump=$($qd.Code)"
  if ($mvr.Code -ne 0 -or $qd.Code -ne 0 -or -not (Test-Path "$files\quarantine.dump")) { Fail-Infra '격리 덤프 준비 실패 — 상황 B 시험을 진행하지 않아요' }
  New-Db $dbR4
  Require-Ok (PsqlFile $dbR4 "$sqlDir\00-auth-stub.sql" '' -Quiet) 'R4 가짜 환경 적용 실패'
  $ga = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-d', $dbR4, $authR)
  $mg = @(Apply-Migrations $dbR4 $migs)          # 계정이 이미 들어 있어서 트리거가 새로 만들어져도 발동하지 않아요
  $gb = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '--data-only', '-t', 'bakeries', '-d', $dbR4, $pubR)
  $gq = Invoke-Tool 'pg_restore' @('--no-owner', '--no-privileges', '-d', $dbR4, "$files\quarantine.dump")
  $gerr = @((Restore-Errors $ga) + (Restore-Errors $gb) + (Restore-Errors $gq))
  $profilesAuto = PsqlScalar $dbR4 'select count(*) from public.profiles'
  $t11b = ($mg.Count -eq 0 -and $gerr.Count -eq 0 -and $profilesAuto -eq '0')
  Add-Result 'T11b' $(if ($t11b) { 'pass' } else { 'fail' }) '계정 먼저 → 마이그레이션 → 격리 데이터 순서로 복원: 오류 0개, 프로필 자동 생성 충돌 없음(공개 프로필 0개)' "마이그레이션 실패 $($mg.Count), 복원 오류 $($gerr.Count), 공개 프로필 $profilesAuto"
  if (-not $t11b) { Fail-Infra '상황 B 복원 준비 실패 — 격리 함수 · 시험을 진행하지 않아요' }
  $qf = PsqlFile $dbR4 "$sqlDir\30-quarantine-functions.sql" '' -Quiet
  Add-Result 'T11c' $(if ($qf.Code -eq 0) { 'pass' } else { 'fail' }) '격리 함수(restore_status · confirm_restore · flush_dependents · purge_unconfirmed)와 권한 회수 적용' $(if ($qf.Code -ne 0) { ($qf.Out | Select-Object -Last 2) -join ' ' } else { '' })
  if ($qf.Code -ne 0) { Fail-Infra '격리 함수 적용 실패 — 격리 시험을 진행하지 않아요' }
  $qt = PsqlFile $dbR4 "$sqlDir\31-quarantine-tests.sql" '' -Quiet
  $qres = @($qt.Out | Where-Object { $_ -match '^RESULT\|' })
  foreach ($l in $qres) { $p = $l -split '\|', 4; Add-Result $p[1] $(if ($p[2] -eq 'true') { 'pass' } else { 'fail' }) ($p[3]) }
  if ($qt.Code -ne 0 -or $qres.Count -ne $EXPECTED_Q_RESULTS) { Add-Result 'T11d' 'fail' "격리 시험 SQL 실행/결과 개수 (기대 ${EXPECTED_Q_RESULTS}개)" ("code=$($qt.Code), 결과 $($qres.Count)개 — " + (($qt.Out | Where-Object { $_ -notmatch '^RESULT\|' } | Select-Object -Last 3) -join ' ')) }

  # ── 마무리 점검 ──
  Step 'C8) 비밀 · Git 안전 점검'
  $pw = [IO.File]::ReadAllText("$root\secrets\pg-test-pw.txt"); $enc = [Text.Encoding]::GetEncoding(28591)
  $scan = @(Get-ChildItem $files -Recurse -File | ForEach-Object FullName) + @($log) + @(Get-ChildItem $snap -File | ForEach-Object FullName)
  $leak = @($scan | Where-Object { (Test-Path $_) -and ((Get-Item $_).Length -lt 100MB) -and $enc.GetString([IO.File]::ReadAllBytes($_)).Contains($pw) })
  Remove-Variable pw -ErrorAction SilentlyContinue
  Add-Result 'T12a' $(if ($leak.Count -eq 0) { 'pass' } else { 'fail' }) '산출물 · 로그 · 스냅샷에 서버 비밀번호 평문이 없음' $(if ($leak.Count) { ($leak | ForEach-Object { Split-Path $_ -Leaf }) -join ', ' } else { '' })
  $secretInOut = @($scan | Where-Object { (Test-Path $_) -and ((Get-Item $_).Length -lt 100MB) -and ($enc.GetString([IO.File]::ReadAllBytes($_)) -match 'AGE-SECRET-KEY-1[QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L]{58}') })
  Add-Result 'T12d' $(if ($secretInOut.Count -eq 0) { 'pass' } else { 'fail' }) '임시 비밀키 문자열이 산출물 · 로그 · 스냅샷 · 결과에 평문으로 나타나지 않음 (키 파일 자체 제외)' $(if ($secretInOut.Count) { ($secretInOut | ForEach-Object { Split-Path $_ -Leaf }) -join ', ' } else { '' })
  Push-Location $repo; $gs = @(git status --porcelain 2>$null | Where-Object { $_ -match '\.(dump|age|tar)$|rehearsal-(keys|files)|AGE-SECRET|key.*\.txt' }); Pop-Location
  $keyInRepo = @(Get-ChildItem "$repo\docs" -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern 'AGE-SECRET-KEY-1[QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L]{58}' -ErrorAction SilentlyContinue)
  Add-Result 'T12b' $(if ($gs.Count -eq 0 -and $keyInRepo.Count -eq 0) { 'pass' } else { 'fail' }) 'Git 저장소에 비밀키 · 덤프 · 암호문 · 복호화 파일이 없음' "git 변경 중 해당 파일 $($gs.Count)개, 문서 안 실제 비밀키 모양 문자열 $($keyInRepo.Count)개"
  $outside = @(Get-ChildItem $files, $keys -Recurse -File -Force | Where-Object { -not $_.FullName.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase) -or $_.FullName.StartsWith($env:OneDrive, [StringComparison]::OrdinalIgnoreCase) })
  Add-Result 'T12c' $(if ($outside.Count -eq 0) { 'pass' } else { 'fail' }) '생성 파일이 모두 C:\bakery-secure\pg 안(OneDrive 밖)에 있음'
}
catch {
  if (-not $script:abort) { $script:abort = "예외: $($_.Exception.Message)" }
  Write-Output ''; Write-Output "!!! 중단: $($script:abort) — 추가 작업 없이 서버를 종료하고 보고합니다 !!!"
}
finally {
  $script:inFinally = $true
  Step "C9) 정상 종료 ($(Get-Date -Format 'HH:mm:ss'))"
  try { Clear-PgEnv } catch { }
  try { Stop-PgSafe } catch { Write-Output "종료 단계 예외: $($_.Exception.Message)"; $script:stopFailed = $true }
  try { Confirm-Stopped } catch { Write-Output "종료 확인 예외: $($_.Exception.Message)"; $script:stopFailed = $true }
  try { if (Test-Path $snap) { & ([scriptblock]::Create((Get-Content -Raw -LiteralPath "$repo\docs\backup\snapshot.ps1" -Encoding UTF8))) -Out "$snap\after-gateC$dbSfx.txt" } } catch { Write-Output "종료 후 스냅샷 예외: $($_.Exception.Message)" }

  Step '결과 요약'
  foreach ($r in $results) {
    $icon = switch ($r.Kind) { 'pass' { '✅' } 'fail' { '❌' } default { 'ℹ️ ' } }
    Write-Output ("{0} {1,-12} {2}" -f $icon, $r.Id, $r.Name)
  }
  $nf = @($results | Where-Object Kind -eq 'fail').Count; $np = @($results | Where-Object Kind -eq 'pass').Count; $ni = @($results | Where-Object Kind -eq 'info').Count
  Write-Output ''
  Write-Output ("통과 {0} · 실패 {1} · 관찰 {2}{3}{4}" -f $np, $nf, $ni, $(if ($script:abort) { " · 중단됨($($script:abort))" } else { '' }), $(if ($script:stopFailed) { ' · 🛑서버 종료 미확인' } else { '' }))
  if ($nf -gt 0) {
    Write-Output ''; Write-Output '--- 실패한 시험과 설계 수정안 (실패를 성공으로 처리하지 않아요) ---'
    foreach ($r in ($results | Where-Object Kind -eq 'fail')) {
      Write-Output ("❌ {0} {1}" -f $r.Id, $r.Name); if ($r.Detail) { Write-Output ("   원인/상세: {0}" -f $r.Detail) }
      $remKey = $remedy.Keys | Where-Object { $r.Id -like "$_*" } | Select-Object -First 1
      if ($remKey) { Write-Output ("   수정안: {0}" -f $remedy[$remKey]) } else { Write-Output '   수정안: 원인을 확인한 뒤 백업 설계 · 복구 절차 문서에 반영해요(자동 판단 불가).' }
    }
  }
  Write-Output ''
  if ($script:stopFailed) { Write-Output '🛑 서버 종료를 확인하지 못해서 이 실행은 시험 결과와 상관없이 "성공"으로 보고하지 않아요. 위의 수동 확인 안내를 따라 주세요.' }
  elseif ($script:abort) { Write-Output '※ 시험이 중단됐어요. 완료된 시험만 위에 기록했고, "복구 가능"이라고 판단하지 않아요.' }
  elseif ($nf -gt 0) { Write-Output '※ 실패한 시험이 있어서 "복구 가능"이라고 판단하지 않아요.' }
  else { Write-Output '※ 로컬 시험이 모두 통과했어요. 그래도 "계정까지 완전히 복구된다"는 뜻이 아니에요 (README의 Supabase 전용 확인 항목 참고).' }
  try { if (Test-Path $files) { $results | ForEach-Object { "{0}|{1}|{2}|{3}" -f $_.Id, $_.Kind, $_.Name, $_.Detail } | Set-Content -Path "$files\results.txt" -Encoding UTF8 } } catch { }
}
