# 20-report.sql 단독 실행 검증 (가짜 데이터, 로컬 127.0.0.1:54329 전용). 서버 시작 → 보고서 1개 실행 → 구역별 줄 수 확인 → 서버 종료와 종료 확인.
#   · 2026-10-15 단독 검증에 쓴 스크립트의 정리본이에요. 수정: 종료 확인의 변수명 $pid(읽기 전용 자동 변수 PID와 충돌)를 $pidFileExists 로 바꿨어요.
#   · 승인된 때에만 실행해요. 실행: & ([scriptblock]::Create((Get-Content -Raw <이 파일> -Encoding UTF8)))
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Continue'
$root = 'C:\bakery-secure\pg'; $bin = "$root\edb\bin"; $data = "$root\data"; $log = "$root\logs\pg.log"
$sql = 'C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review\docs\backup\rehearsal\20-report.sql'
$outFile = "$root\rehearsal-files-run2\report-source-standalone.txt"
$db = 'bakery_rehearsal_run2'
$stopFailed = $false
function Procs { @(Get-Process -Name postgres -ErrorAction SilentlyContinue) }
try {
  if ((Procs).Count -ne 0 -or (Test-Path "$data\postmaster.pid") -or (Get-NetTCPConnection -LocalPort 54329 -ErrorAction SilentlyContinue)) { throw '서버가 이미 실행 중이거나 흔적이 있어요 — 중단' }
  Get-ChildItem Env: | Where-Object { $_.Name -match '^PG|^(DATABASE_URL|SUPABASE)' } | ForEach-Object { Remove-Item "Env:$($_.Name)" -ErrorAction SilentlyContinue }
  $p = Start-Process -FilePath "$bin\pg_ctl.exe" -ArgumentList @('-D', $data, '-l', $log, '-w', '-t', '60', 'start') -WindowStyle Hidden -PassThru
  if (-not $p.WaitForExit(80000)) { throw 'pg_ctl start 시간 초과' }
  "pg_ctl start code=$($p.ExitCode) / 프로세스 $((Procs).Count)개"
  $pids = (Procs) | ForEach-Object { $_.Id }
  $listen = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $pids -contains $_.OwningProcess })
  "리스닝: " + (($listen | ForEach-Object { "$($_.LocalAddress):$($_.LocalPort)" }) -join ', ')
  if ($listen.Count -ne 1 -or $listen[0].LocalAddress -ne '127.0.0.1' -or $listen[0].LocalPort -ne 54329) { throw '리스닝 주소가 127.0.0.1:54329 하나가 아니에요 — 중단' }
  $env:PGPASSWORD = [IO.File]::ReadAllText("$root\secrets\pg-test-pw.txt"); $env:PGCLIENTENCODING = 'UTF8'; $env:PGCONNECT_TIMEOUT = '10'
  $args2 = @('-h', '127.0.0.1', '-p', '54329', '-U', 'postgres', '-X', '-w', '-d', $db, '-v', 'ON_ERROR_STOP=1', '-f', $sql, '-o', $outFile)
  $psi = New-Object System.Diagnostics.ProcessStartInfo; $psi.FileName = "$bin\psql.exe"; $psi.Arguments = (($args2 | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' ')
  $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true; $psi.RedirectStandardError = $true; $psi.RedirectStandardOutput = $true
  $q = [System.Diagnostics.Process]::Start($psi); $se = $q.StandardError.ReadToEndAsync(); $so = $q.StandardOutput.ReadToEndAsync()
  if (-not $q.WaitForExit(120000)) { try { $q.Kill() } catch { }; throw 'psql 시간 초과(120초)' }
  $q.WaitForExit()
  "psql 종료 코드: $($q.ExitCode)"
  $err = ($se.Result -split "`r?`n" | Where-Object { $_ }) ; "stderr 줄 수: $($err.Count)"; $err | Select-Object -First 5 | ForEach-Object { "  $_" }
  $lines = @(Get-Content $outFile -Encoding UTF8 | Where-Object { $_ })
  "출력 줄 수: $($lines.Count)"
  "--- 구역별 줄 수 ---"
  $lines | ForEach-Object { ($_ -split '\|')[0] } | Group-Object | Sort-Object { [int](($_.Name -replace '[^0-9.]','' -split '\.')[0]) }, Name | ForEach-Object { "  {0}: {1}" -f $_.Name, $_.Count }
  "--- 핵심 줄 확인 ---"
  foreach ($pat in '^6\.acl\|table public\.admins\|', '^6\.aclsrc\|table public\.admins\|', '^6\.acl\|schema public\|', '^12\.access\|anon table public\.admins', '^12\.access\|authenticated table public\.reviews\|', '^3\.constraint\|public\.reviews reviews_rating_check') {
    $m = @($lines | Where-Object { $_ -match $pat }); "  [$pat] $($m.Count)줄: " + ($(if ($m.Count) { $m[0].Substring(0, [Math]::Min(170, $m[0].Length)) } else { '(없음)' }))
  }
  $pw = $env:PGPASSWORD; $leak = (Get-Content $outFile -Raw -Encoding UTF8).Contains($pw); "서버 비밀번호가 보고서에 있음: $leak"
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
catch { "!!! 중단: $($_.Exception.Message)" }
finally {
  Get-ChildItem Env: | Where-Object { $_.Name -match '^PG' } | ForEach-Object { Remove-Item "Env:$($_.Name)" -ErrorAction SilentlyContinue }
  if ((Procs).Count -gt 0 -or (Test-Path "$data\postmaster.pid")) {
    $s = Start-Process -FilePath "$bin\pg_ctl.exe" -ArgumentList @('-D', $data, 'stop', '-m', 'fast', '-w', '-t', '60') -WindowStyle Hidden -PassThru
    if (-not $s.WaitForExit(75000) -or $s.ExitCode -ne 0) { $stopFailed = $true }
    "pg_ctl stop code=$($s.ExitCode)"
  }
  Start-Sleep -Seconds 1
  $n = (Procs).Count; $port = [bool](Get-NetTCPConnection -State Listen -LocalPort 54329 -ErrorAction SilentlyContinue); $pidFileExists = Test-Path "$data\postmaster.pid"
  "종료 확인: postgres 프로세스 $n / 54329 리스닝 $port / postmaster.pid $pidFileExists"
  if ($n -gt 0 -or $port -or $pidFileExists -or $stopFailed) { '🛑 서버 종료를 확인하지 못했어요 — 수동 확인 필요' } else { '서버 정상 종료 확인됨' }
}
