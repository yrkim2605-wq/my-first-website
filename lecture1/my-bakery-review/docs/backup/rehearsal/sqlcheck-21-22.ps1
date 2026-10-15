# 21-access-probe.sql · 22-constraint-behavior.sql 단독 검증 (가짜 데이터, 로컬 127.0.0.1:54329 전용, 별도 시험 DB bakery_sqlcheck)
#   · 시험 DB bakery_sqlcheck 를 새로 만들어 가짜 환경(00) + 마이그레이션 10개 + 가짜 데이터(10)를 넣고, 21 · 22 를 실행해 결과를 검증해요.
#   · 1차 DB(bakery_rehearsal 등) · 보존 파일 · 2차 전체 재시험 이름(…_run2 / …-run2)은 건드리지 않아요. 산출물은 C:\bakery-secure\pg\sqlcheck-files (새 폴더, 없어야 시작).
#   · 부정 시험(일부러 권한을 빼거나 제약을 바꿔 보기)은 bakery_sqlcheck 안에서만 하고, 끝에 원래대로 돌려요.
#   · 승인된 때에만 실행해요. 서버는 시작하고 항상 정상 종료를 확인해요. 시험 DB · 파일은 삭제하지 않아요.
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Continue'
$root = 'C:\bakery-secure\pg'; $bin = "$root\edb\bin"; $data = "$root\data"; $log = "$root\logs\pg.log"
$repo = 'C:\Users\USER\OneDrive\Desktop\my-first-website-main\lecture1\my-bakery-review'
$sqlDir = "$repo\docs\backup\rehearsal"; $migDir = "$repo\supabase\migrations"
$work = "$root\sqlcheck-files"; $db = 'bakery_sqlcheck'
$res = New-Object System.Collections.Generic.List[object]
function Rec([string]$id, [bool]$ok, [string]$name, [string]$detail = '') { $res.Add([pscustomobject]@{ Id = $id; Ok = $ok; Name = $name; Detail = $detail }); "  {0} {1} {2}{3}" -f $(if ($ok) { '✅' } else { '❌' }), $id, $name, $(if ($detail) { " — $detail" } else { '' }) }
function Procs { @(Get-Process -Name postgres -ErrorAction SilentlyContinue) }
function Quote-Arg([string]$a) { if ($a -eq '') { return '""' }; if ($a -notmatch '[\s"]') { return $a }; $s = $a -replace '(\\*)"', '$1$1\"'; $s = $s -replace '(\\+)$', '$1$1'; return '"' + $s + '"' }
function RunPsql([string]$Db, [string[]]$More, [int]$TimeoutSec = 90) {
  if ($Db -notmatch '^[a-z][a-z0-9_]*$') { throw "허용되지 않은 DB 이름: $Db" }
  if ($Db -match '_run\d+$' -or $Db -in 'bakery_rehearsal', 'bakery_restore_r1', 'bakery_restore_r1b', 'bakery_restore_r2', 'bakery_stage', 'bakery_restore_r4') { throw "이 스크립트가 건드리면 안 되는 DB예요: $Db" }
  if ($env:PGHOST -ne '127.0.0.1' -or $env:PGPORT -ne '54329') { throw '접속 대상이 127.0.0.1:54329 가 아니에요' }
  $a = @('-h', '127.0.0.1', '-p', '54329', '-U', 'postgres', '-X', '-w', '-d', $Db, '-v', 'ON_ERROR_STOP=1') + $More
  $psi = New-Object System.Diagnostics.ProcessStartInfo; $psi.FileName = "$bin\psql.exe"; $psi.Arguments = (($a | ForEach-Object { Quote-Arg $_ }) -join ' ')
  $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = [Text.Encoding]::UTF8; $psi.StandardErrorEncoding = [Text.Encoding]::UTF8
  $p = [System.Diagnostics.Process]::Start($psi); $so = $p.StandardOutput.ReadToEndAsync(); $se = $p.StandardError.ReadToEndAsync()
  if (-not $p.WaitForExit($TimeoutSec * 1000)) { try { $p.Kill() } catch { }; return [pscustomobject]@{ Code = -1; Out = @(); Err = @("TIMEOUT ${TimeoutSec}s") } }
  $p.WaitForExit()
  [pscustomobject]@{ Code = $p.ExitCode; Out = @($so.Result -split "`r?`n" | Where-Object { $_ -ne '' }); Err = @($se.Result -split "`r?`n" | Where-Object { $_ -ne '' }) }
}
function PsqlFile([string]$Db, [string]$File) { RunPsql $Db @('-At', '-f', $File) }
# 1차 DB(bakery_rehearsal)에는 읽기 전용 한 문장(reviews 행 수 세기)만 보내요. 다른 문장 · 다른 DB는 거부해요.
function Read1([string]$Text) {
  if ($Text -ne 'select count(*) from public.reviews') { throw '1차 DB에는 허용된 읽기 문장만 보낼 수 있어요' }
  $a = @('-h', '127.0.0.1', '-p', '54329', '-U', 'postgres', '-X', '-w', '-At', '-d', 'bakery_rehearsal', '-c', $Text)
  $o = & "$bin\psql.exe" @a 2>&1; if ($LASTEXITCODE -ne 0) { return "ERR(code=$LASTEXITCODE)" }; return (($o | ForEach-Object { "$_" }) -join '').Trim()
}
function Sql([string]$Db, [string]$Text) { RunPsql $Db @('-At', '-c', $Text) }
function One([string]$Db, [string]$Text) { $r = Sql $Db $Text; if ($r.Code -ne 0) { return "ERR(code=$($r.Code)): $($r.Err -join ' ')" }; return ($r.Out -join "`n").Trim() }
function Safe-Compare($a, $b) {
  $a = @($a); $b = @($b)
  if ($a.Count -eq 0 -and $b.Count -eq 0) { return @() }
  if ($a.Count -eq 0) { return @($b | ForEach-Object { [pscustomobject]@{ InputObject = $_; SideIndicator = '=>' } }) }
  if ($b.Count -eq 0) { return @($a | ForEach-Object { [pscustomobject]@{ InputObject = $_; SideIndicator = '<=' } }) }
  return @(Compare-Object $a $b)
}
function Short($s, [int]$n = 150) { $t = ($s -replace '\s+', ' '); if ($t.Length -gt $n) { $t.Substring(0, $n) } else { $t } }
$probe21 = "$sqlDir\21-access-probe.sql"; $beh22 = "$sqlDir\22-constraint-behavior.sql"
$t06Oracle = @('T06B|0|rejected', 'T06B|0.4|rejected', 'T06B|0.5|accepted', 'T06B|0.7|rejected', 'T06B|1|accepted', 'T06B|1.5|accepted', 'T06B|4.5|accepted', 'T06B|4.9|rejected', 'T06B|5|accepted', 'T06B|5.5|rejected', 'T06B|9.9|rejected') | Sort-Object
function Get21 { $r = PsqlFile $db $probe21; [pscustomobject]@{ Code = $r.Code; Err = $r.Err; Lines = @($r.Out | Where-Object { $_ -like 'probe|*' } | Sort-Object) } }
function Get22 { $r = PsqlFile $db $beh22; [pscustomobject]@{ Code = $r.Code; Err = $r.Err; Lines = @($r.Out | Where-Object { $_ -like 'T06B|*' } | Sort-Object) } }
$aborted = $null
try {
  "== 0) 시작 전 확인 =="
  if (Test-Path $work) { throw "$work 가 이미 있어요 — 덮어쓰지 않고 중단" }
  foreach ($n in "$root\rehearsal-files-run2", "$root\rehearsal-keys-run2") { if (Test-Path $n) { throw "2차 폴더가 있어요(건드리지 않음): $n" } }
  if ((Procs).Count -ne 0 -or (Test-Path "$data\postmaster.pid") -or (Get-NetTCPConnection -LocalPort 54329 -ErrorAction SilentlyContinue)) { throw '서버가 이미 실행 중이거나 흔적이 있어요 — 중단' }
  $migs = @(Get-ChildItem $migDir -Filter '*.sql' | Sort-Object Name | ForEach-Object Name); if ($migs.Count -ne 10) { throw "마이그레이션이 10개가 아니에요($($migs.Count))" }
  $forb = '(?im)^\s*\\(connect|c|!|i|ir|o|out|g|gx|gexec|gset|setenv|cd)\b|copy\s[^;]*\bprogram\b|dblink|postgres_fdw|create\s+(server|extension|foreign|user\s+mapping)|supabase\.(co|com|net|in)|https?://|\.env\b|sb_secret|sb_publishable|postgres(ql)?://'
  foreach ($f in '00-auth-stub.sql', '10-fake-seed.sql', '20-report.sql', '21-access-probe.sql', '22-constraint-behavior.sql') { if ([regex]::IsMatch((Get-Content -Raw -LiteralPath "$sqlDir\$f" -Encoding UTF8), $forb)) { throw "금지 표현 발견: $f" } }
  New-Item -ItemType Directory -Path $work | Out-Null
  "산출물 폴더: $work (새로 만듦)"

  "== 1) 서버 시작 (로컬 전용) =="
  Get-ChildItem Env: | Where-Object { $_.Name -match '^PG|^(DATABASE_URL|SUPABASE)' } | ForEach-Object { Remove-Item "Env:$($_.Name)" -ErrorAction SilentlyContinue }
  $p = Start-Process -FilePath "$bin\pg_ctl.exe" -ArgumentList @('-D', $data, '-l', $log, '-w', '-t', '60', 'start') -WindowStyle Hidden -PassThru
  if (-not $p.WaitForExit(80000) -or $p.ExitCode -ne 0) { throw 'pg_ctl start 실패' }
  $pids = (Procs) | ForEach-Object { $_.Id }
  $listen = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $pids -contains $_.OwningProcess })
  "리스닝: " + (($listen | ForEach-Object { "$($_.LocalAddress):$($_.LocalPort)" }) -join ', ')
  if ($listen.Count -ne 1 -or $listen[0].LocalAddress -ne '127.0.0.1' -or $listen[0].LocalPort -ne 54329) { throw '리스닝 주소가 127.0.0.1:54329 하나가 아니에요 — 중단' }
  $env:PGHOST = '127.0.0.1'; $env:PGPORT = '54329'; $env:PGUSER = 'postgres'; $env:PGCLIENTENCODING = 'UTF8'; $env:PGCONNECT_TIMEOUT = '10'
  $env:PGPASSWORD = [IO.File]::ReadAllText("$root\secrets\pg-test-pw.txt")
  $dbs = (One 'postgres' "select string_agg(datname, ',' order by datname) from pg_database")
  "현재 DB: $dbs"
  $want = 'bakery_rehearsal,bakery_restore_r1,bakery_restore_r1b,bakery_restore_r2,bakery_stage,postgres,template0,template1'
  if ($dbs -ne $want) { throw "DB 목록이 예상과 달라요 — 중단 (예상: $want)" }
  $before1 = Read1 'select count(*) from public.reviews'
  "1차 원본 DB reviews 행 수(기록): $before1"
  $c = Sql 'postgres' "create database $db encoding 'UTF8' template template0 locale 'C'"
  if ($c.Code -ne 0) { throw "시험 DB 생성 실패: $($c.Err -join ' ')" }

  "== 2) 시험 DB 준비: 가짜 환경 + 마이그레이션 10개 + 가짜 데이터 =="
  $r = PsqlFile $db "$sqlDir\00-auth-stub.sql"; Rec 'S1' ($r.Code -eq 0) '가짜 auth · storage 기본 환경(역할 3개 포함)' $(if ($r.Code) { Short ($r.Err -join ' ') })
  $badMig = @(); foreach ($m in $migs) { $r = PsqlFile $db "$migDir\$m"; if ($r.Code -ne 0) { $badMig += "$m :: $(Short ($r.Err -join ' ') 100)" } }
  Rec 'S2' ($badMig.Count -eq 0) '마이그레이션 10개 적용' $(if ($badMig.Count) { $badMig -join ' | ' } else { '오류 없음' })
  $seed = PsqlFile $db "$sqlDir\10-fake-seed.sql"; $got = @{}; foreach ($l in $seed.Out) { if ($l -match '^SEED\|([^|]+)\|(\d+)$') { $got[$Matches[1]] = [int]$Matches[2] } }
  $wantSeed = [ordered]@{ 'auth.users' = 6; 'profiles(트리거로 자동 생성)' = 6; 'bakeries' = 3; 'reviews' = 7; 'posts' = 3; 'comments' = 3; 'post_likes' = 3; 'reports' = 2; 'admins' = 1 }
  $wrong = @($wantSeed.Keys | Where-Object { $got[$_] -ne $wantSeed[$_] } | ForEach-Object { "$_=$($got[$_])(기대 $($wantSeed[$_]))" })
  Rec 'S3' ($seed.Code -eq 0 -and $wrong.Count -eq 0) '가짜 데이터 입력 + 기대 건수' $(if ($wrong.Count) { $wrong -join ', ' } elseif ($seed.Code) { Short ($seed.Err -join ' ') } else { '일치' })
  if ($badMig.Count -or $seed.Code -ne 0) { throw '시험 DB 준비 실패 — 이후 검증을 진행하지 않아요' }
  $rep0 = PsqlFile $db "$sqlDir\20-report.sql"; if ($rep0.Code -ne 0) { throw "20-report.sql 실패: $($rep0.Err -join ' ')" }
  Set-Content "$work\report-before.txt" -Value $rep0.Out -Encoding UTF8
  $revBefore = One $db 'select count(*) from public.reviews'

  "== 3) 21-access-probe.sql 단독 검증 =="
  $a1 = Get21
  Rec 'P1' ($a1.Code -eq 0 -and $a1.Err.Count -eq 0) '종료 코드 0, 표준 오류 없음' "code=$($a1.Code), stderr $($a1.Err.Count)줄 $(Short ($a1.Err -join ' ') 100)"
  $rels = @(Sql $db "select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','v','m','p') order by 1").Out
  $roles = 'anon', 'authenticated', 'service_role'
  $expectKeys = @(foreach ($ro in $roles) { foreach ($t in $rels) { "probe|$ro|select $t|" } })
  $gotKeys = @($a1.Lines | ForEach-Object { ($_ -split '\|')[0..2] -join '|' } | ForEach-Object { "$_|" })
  Rec 'P2' ($rels.Count -ge 8 -and $a1.Lines.Count -eq $expectKeys.Count -and @(Safe-Compare $gotKeys $expectKeys).Count -eq 0) "역할 3개 × public 표·보기 전부 한 줄씩 출력 (기대 $($expectKeys.Count)줄)" "표·보기 $($rels.Count)개, 출력 $($a1.Lines.Count)줄"
  $badFmt = @($a1.Lines | Where-Object { $_ -notmatch '^probe\|(anon|authenticated|service_role)\|select [a-z_]+\|(rows=\d+|denied)$' })
  Rec 'P3' ($badFmt.Count -eq 0) '모든 줄이 rows=<숫자> 또는 denied (error:코드 없음)' $(if ($badFmt.Count) { Short ($badFmt -join ' ; ') 200 } else { '' })
  $adm = @($a1.Lines | Where-Object { $_ -in 'probe|anon|select admins|denied', 'probe|authenticated|select admins|denied' }).Count
  Rec 'P4' ($adm -eq 2) 'admins 표는 anon · authenticated 모두 거부 (0009 설계)' "$adm/2"
  # 권한 카탈로그와 교차 확인: SELECT 권한이 없으면 denied, 있으면 rows=
  $mis = One $db "select string_agg(r.rolname || ':' || c.relname, ',') from pg_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace where r.rolname in ('anon','authenticated','service_role') and n.nspname='public' and c.relkind in ('r','v','m','p') and has_table_privilege(r.oid, c.oid, 'SELECT') = false"
  $deniedByCat = @($(if ($mis -and -not $mis.StartsWith('ERR')) { $mis -split ',' } else { @() })) | Sort-Object
  $deniedByProbe = @($a1.Lines | Where-Object { $_ -like '*|denied' } | ForEach-Object { $s = $_ -split '\|'; "$($s[1]):$(($s[2] -replace '^select ', ''))" }) | Sort-Object
  $dd = @(Safe-Compare $deniedByCat $deniedByProbe)
  Rec 'P5' ($dd.Count -eq 0) '거부된 (역할:표) 목록이 권한 카탈로그(has_table_privilege SELECT=false)와 일치' "거부 $($deniedByProbe.Count)개, 불일치 $($dd.Count)개 $(Short (($dd | ForEach-Object { $_.InputObject }) -join ',') 120)"
  # 행 수 교차 확인: postgres(소유자)가 직접 센 값과 service_role 이 읽은 값 (RLS 우회 역할이면 같아야 함)
  $own = @{}; foreach ($t in $rels) { $own[$t] = One $db "select count(*) from public.$t" }
  $svc = @($a1.Lines | Where-Object { $_ -like 'probe|service_role|*' } | ForEach-Object { $s = $_ -split '\|'; [pscustomobject]@{ T = ($s[2] -replace '^select ', ''); V = $s[3] } })
  $svcDiff = @($svc | Where-Object { $_.V -ne "rows=$($own[$_.T])" })
  $bypass = One $db "select rolbypassrls from pg_roles where rolname='service_role'"
  Rec 'P6' ($svcDiff.Count -eq 0 -or $bypass -ne 't') 'service_role 이 읽은 행 수가 소유자가 센 값과 같음 (RLS 우회 역할일 때)' "rolbypassrls=$bypass, 다른 표 $($svcDiff.Count)개 $(Short (($svcDiff | ForEach-Object { $_.T + ':' + $_.V + '≠' + $own[$_.T] }) -join ',') 150)"
  $anonRows = @($a1.Lines | Where-Object { $_ -like 'probe|anon|*|rows=*' }).Count
  "  (참고) anon 이 읽은 표 $anonRows개, authenticated $(@($a1.Lines | Where-Object { $_ -like 'probe|authenticated|*|rows=*' }).Count)개 / 샘플: $(Short ((@($a1.Lines | Where-Object { $_ -like 'probe|anon|*' }) | Select-Object -First 5) -join ' ; ') 220)"
  $a1b = Get21
  Rec 'P7' ($a1b.Code -eq 0 -and @(Safe-Compare $a1.Lines $a1b.Lines).Count -eq 0) '두 번 실행해도 결과가 똑같음 (결정적)'
  Set-Content "$work\probe-baseline.txt" -Value $a1.Lines -Encoding UTF8

  "== 4) 22-constraint-behavior.sql 단독 검증 =="
  $b1 = Get22
  Rec 'B1' ($b1.Code -eq 0 -and $b1.Err.Count -eq 0) '종료 코드 0, 표준 오류 없음' "code=$($b1.Code), stderr $($b1.Err.Count)줄 $(Short ($b1.Err -join ' ') 100)"
  $dOr = @(Safe-Compare $b1.Lines $t06Oracle)
  Rec 'B2' ($b1.Lines.Count -eq 11 -and $dOr.Count -eq 0) '11개 값의 허용/거부가 기대값과 정확히 일치 (0.5 · 1 · 1.5 · 4.5 · 5 허용 / 0 · 0.4 · 0.7 · 4.9 · 5.5 · 9.9 거부)' "$($b1.Lines.Count)줄, 차이 $($dOr.Count)개 $(Short (($dOr | ForEach-Object { $_.InputObject }) -join ' ; ') 160)"
  $revAfter22 = One $db 'select count(*) from public.reviews'
  Rec 'B3' ($revAfter22 -eq $revBefore -and $revBefore -eq '7') '실행 전후 public.reviews 행 수 불변 (7행)' "전 $revBefore / 후 $revAfter22"
  $rep1 = PsqlFile $db "$sqlDir\20-report.sql"; Set-Content "$work\report-after-21-22.txt" -Value $rep1.Out -Encoding UTF8
  $dRep = @(Safe-Compare $rep0.Out $rep1.Out)
  Rec 'B4' ($rep1.Code -eq 0 -and $dRep.Count -eq 0) '21 · 22 를 실행한 뒤 20번 보고서 전체(행 체크섬 · 구조 · 권한)가 실행 전과 똑같음 → 데이터 · 구조 · 권한 변경 없음' "다른 줄 $($dRep.Count)개"
  $tmp = One $db "select count(*) from pg_class where relname in ('t06b_probe') or (relnamespace::regnamespace::text like 'pg_temp%' and relkind in ('r','v'))"
  Rec 'B5' ($tmp -eq '0') '임시 표 · 함수가 다른 세션에 남아 있지 않음 (새 세션에서 임시 표 0개)' "남은 임시 표 $tmp"
  $b1b = Get22
  Rec 'B6' ($b1b.Code -eq 0 -and @(Safe-Compare $b1.Lines $b1b.Lines).Count -eq 0) '두 번 실행해도 결과가 똑같음 (결정적)'

  "== 5) 부정 시험 (bakery_sqlcheck 안에서만, 끝에 원래대로 복구) — 검증기가 실제 차이를 잡아내는가 =="
  # 5-1) 권한: anon 의 bakeries SELECT 를 뺀다 → 21 결과가 바뀌어야 함, 다시 주면 기준선과 같아져야 함
  $anonBake = $a1.Lines | Where-Object { $_ -like 'probe|anon|select bakeries|*' }
  $n1 = Sql $db 'revoke select on public.bakeries from anon'
  $a2 = Get21; $d2 = @(Safe-Compare $a1.Lines $a2.Lines)
  Rec 'N1' ($n1.Code -eq 0 -and $d2.Count -ge 1 -and (($d2 | ForEach-Object { $_.InputObject }) -join ' ') -match 'probe\|anon\|select bakeries\|denied') '일부러 anon 의 bakeries SELECT 를 빼면 21 이 차이를 잡아냄(실제 접근 차이 = 실패 신호)' "기준선 $anonBake → 변경 후 차이 $($d2.Count)줄: $(Short (($d2 | ForEach-Object { $_.SideIndicator + $_.InputObject }) -join ' ; ') 200)"
  # 20번 보고서의 유효 권한/실제 접근 구역도 같은 차이를 잡는지
  $repN = PsqlFile $db "$sqlDir\20-report.sql"; $dRepN = @(Safe-Compare ($rep0.Out | Where-Object { $_ -match '^(6\.acl|12\.access)\|' }) ($repN.Out | Where-Object { $_ -match '^(6\.acl|12\.access)\|' }))
  Rec 'N2' ($dRepN.Count -ge 1) '같은 변경을 20번 보고서의 6.acl · 12.access 구역도 잡아냄' "다른 줄 $($dRepN.Count)개"
  $n1b = Sql $db 'grant select on public.bakeries to anon'
  $a3 = Get21
  Rec 'N3' ($n1b.Code -eq 0 -and @(Safe-Compare $a1.Lines $a3.Lines).Count -eq 0) '권한을 되돌리면 21 결과가 기준선과 다시 똑같아짐' "차이 $(@(Safe-Compare $a1.Lines $a3.Lines).Count)줄"
  # 5-2) 제약: 동작이 다른 제약으로 바꾸면 22 가 기대값과 달라져야 함
  $origDef = One $db "select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.reviews'::regclass and conname='reviews_rating_check'"
  Set-Content "$work\constraint-original.txt" -Value $origDef -Encoding UTF8
  $x1 = Sql $db 'alter table public.reviews drop constraint reviews_rating_check; alter table public.reviews add constraint reviews_rating_check check (rating between 0 and 5)'
  $b2 = Get22; $d22 = @(Safe-Compare $b2.Lines $t06Oracle)
  Rec 'N4' ($x1.Code -eq 0 -and $d22.Count -ge 1) '동작이 다른 제약(0~5, 0.5 단위 규칙 없음)으로 일부러 바꾸면 22 가 기대값과 달라짐' "차이 $($d22.Count)줄: $(Short (($d22 | ForEach-Object { $_.InputObject }) -join ' ; ') 160)"
  # 5-3) 표현만 다른 같은 제약(AND 평탄화) → 22 결과는 같고 텍스트는 달라야 함 (T06b 의 전제)
  $x2 = Sql $db 'alter table public.reviews drop constraint reviews_rating_check; alter table public.reviews add constraint reviews_rating_check check (rating >= 0.5 and rating <= 5 and (rating * 2) = floor(rating * 2))'
  $flatDef = One $db "select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.reviews'::regclass and conname='reviews_rating_check'"
  $b3 = Get22
  Rec 'N5' ($x2.Code -eq 0 -and $flatDef -ne $origDef -and @(Safe-Compare $b3.Lines $t06Oracle).Count -eq 0) '표현만 다른 같은 제약(AND 한 겹)은 22 결과가 기대값과 같고 정의 텍스트는 원본과 다름 (T06 텍스트 ❌ + T06b ✅ 가 나올 수 있는 이유)' "원본: $(Short $origDef 110) / 평탄화: $(Short $flatDef 110)"
  # 5-4) 원래대로: 원본 정의문 그대로 복구
  $x3 = Sql $db "alter table public.reviews drop constraint reviews_rating_check; alter table public.reviews add constraint reviews_rating_check $origDef"
  $backDef = One $db "select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.reviews'::regclass and conname='reviews_rating_check'"
  $b4 = Get22
  Rec 'N6' ($x3.Code -eq 0 -and $backDef -eq $origDef -and @(Safe-Compare $b4.Lines $t06Oracle).Count -eq 0) '원본 제약 정의문으로 복구하면 텍스트도 원본과 같고 22 결과도 기대값과 같음' "복구 정의 일치 $($backDef -eq $origDef)"
  $rep2 = PsqlFile $db "$sqlDir\20-report.sql"; Set-Content "$work\report-final.txt" -Value $rep2.Out -Encoding UTF8
  $dFin = @(Safe-Compare $rep0.Out $rep2.Out)
  Rec 'N7' ($dFin.Count -eq 0) '부정 시험을 모두 되돌린 뒤 20번 보고서 전체가 시작 때와 똑같음' "다른 줄 $($dFin.Count)개 $(Short (($dFin | Select-Object -First 3 | ForEach-Object { $_.InputObject }) -join ' ; ') 200)"

  "== 6) 1차 DB 불변 확인 =="
  $after1 = Read1 'select count(*) from public.reviews'
  Rec 'X1' ($after1 -eq $before1) '1차 원본 DB(bakery_rehearsal)의 reviews 행 수가 그대로' "전 $before1 / 후 $after1"
  $dbsAfter = One 'postgres' "select string_agg(datname, ',' order by datname) from pg_database"
  $wantAfter = @(($want -split ',') + 'bakery_sqlcheck'); Rec 'X2' (($dbsAfter -split ',').Count -eq $wantAfter.Count -and @(Safe-Compare ($dbsAfter -split ',') $wantAfter).Count -eq 0) 'DB 목록: 1차 DB 5개 그대로 + 새 시험 DB bakery_sqlcheck 1개뿐(_run2 없음)' $dbsAfter
}
catch { $aborted = $_.Exception.Message; "!!! 중단: $aborted" }
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Get-ChildItem Env: | Where-Object { $_.Name -match '^PG' } | ForEach-Object { Remove-Item "Env:$($_.Name)" -ErrorAction SilentlyContinue }
  if ((Procs).Count -gt 0 -or (Test-Path "$data\postmaster.pid")) {
    $s = Start-Process -FilePath "$bin\pg_ctl.exe" -ArgumentList @('-D', $data, 'stop', '-m', 'fast', '-w', '-t', '60') -WindowStyle Hidden -PassThru
    if (-not $s.WaitForExit(75000)) { 'pg_ctl stop 시간 초과' } else { "pg_ctl stop code=$($s.ExitCode)" }
  }
  Start-Sleep -Seconds 1
  $n = (Procs).Count; $port = [bool](Get-NetTCPConnection -State Listen -LocalPort 54329 -ErrorAction SilentlyContinue); $pidFileExists = Test-Path "$data\postmaster.pid"
  "서버 종료 확인: postgres 프로세스 $n / 54329 리스닝 $port / postmaster.pid $pidFileExists"
  if ($n -gt 0 -or $port -or $pidFileExists) { '🛑 서버 종료를 확인하지 못했어요 — 수동 확인 필요' }
  "== 요약 =="
  $ok = @($res | Where-Object Ok).Count; $ng = @($res | Where-Object { -not $_.Ok }).Count
  "통과 $ok · 실패 $ng$(if ($aborted) { " · 중단됨($aborted)" })"
  $res | Where-Object { -not $_.Ok } | ForEach-Object { "❌ $($_.Id) $($_.Name) — $($_.Detail)" }
}
