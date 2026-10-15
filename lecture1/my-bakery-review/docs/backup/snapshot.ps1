param([Parameter(Mandatory = $true)][string]$Out)
# 읽기 전용 시스템 스냅샷 (아무것도 바꾸지 않아요). 설치 전 · 후 · 제거 후에 같은 항목을 비교해요.
$ErrorActionPreference = 'Continue'
$lines = New-Object System.Collections.Generic.List[string]
$notes = New-Object System.Collections.Generic.List[string]

function Add-Section([string]$Title, [scriptblock]$Block) {
  $lines.Add("## $Title")
  try {
    $items = @(& $Block)
    foreach ($i in ($items | ForEach-Object { [string]$_ } | Sort-Object)) { $lines.Add($i) }
    $lines.Add("(count=$($items.Count))")
  } catch {
    $lines.Add("(읽을 수 없음: $($_.Exception.Message))")
    $notes.Add("$Title : 읽지 못함")
  }
  $lines.Add('')
}

Add-Section 'services (name | state | startMode | path)' {
  Get-CimInstance Win32_Service | ForEach-Object { '{0} | {1} | {2} | {3}' -f $_.Name, $_.State, $_.StartMode, $_.PathName }
}
Add-Section 'local users (name | enabled)' { Get-LocalUser | ForEach-Object { '{0} | enabled={1}' -f $_.Name, $_.Enabled } }
Add-Section 'local groups' { Get-LocalGroup | ForEach-Object { $_.Name } }
Add-Section 'Administrators members' { Get-LocalGroupMember -Group 'Administrators' | ForEach-Object { $_.Name } }
Add-Section 'firewall rules (name | enabled | direction | action | displayName)' {
  Get-NetFirewallRule | ForEach-Object { '{0} | {1} | {2} | {3} | {4}' -f $_.Name, $_.Enabled, $_.Direction, $_.Action, $_.DisplayName }
}
foreach ($p in 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall', 'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall') {
  Add-Section "registry uninstall entries: $p" {
    Get-ChildItem $p -ErrorAction Stop | ForEach-Object { '{0} | {1}' -f $_.PSChildName, (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).DisplayName }
  }
}
foreach ($p in 'HKLM:\SOFTWARE\PostgreSQL', 'HKLM:\SOFTWARE\WOW6432Node\PostgreSQL', 'HKCU:\SOFTWARE\PostgreSQL', 'HKLM:\SOFTWARE\EnterpriseDB') {
  Add-Section "registry key: $p" {
    if (Test-Path $p) { 'EXISTS'; Get-ChildItem $p -Recurse -ErrorAction SilentlyContinue | ForEach-Object { $_.Name } } else { 'absent' }
  }
}
Add-Section 'registry: services key names (HKLM\SYSTEM\CurrentControlSet\Services)' { Get-ChildItem 'HKLM:\SYSTEM\CurrentControlSet\Services' | ForEach-Object { $_.PSChildName } }
Add-Section 'PATH (machine)' { [Environment]::GetEnvironmentVariable('Path', 'Machine') -split ';' | Where-Object { $_ } }
Add-Section 'PATH (user)' { [Environment]::GetEnvironmentVariable('Path', 'User') -split ';' | Where-Object { $_ } }
Add-Section 'listening TCP ports (address:port)' {
  Get-NetTCPConnection -State Listen | ForEach-Object { '{0}:{1}' -f $_.LocalAddress, $_.LocalPort }
}
Add-Section 'scheduled tasks (path+name)' { Get-ScheduledTask | ForEach-Object { $_.TaskPath + $_.TaskName } }
Add-Section 'processes matching postgres|pg_|initdb|postgresql' {
  Get-Process | Where-Object { $_.ProcessName -match 'postgres|pg_|initdb|^postgresql' } | ForEach-Object { '{0} (pid {1})' -f $_.ProcessName, $_.Id }
}
Add-Section 'well-known folders' {
  foreach ($d in 'C:\Program Files\PostgreSQL', 'C:\Program Files (x86)\PostgreSQL', 'C:\ProgramData\PostgreSQL', 'C:\ProgramData\Microsoft\Windows\Start Menu\Programs\PostgreSQL 17', "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\PostgreSQL 17", "$env:APPDATA\postgresql") {
    '{0} | {1}' -f $d, $(if (Test-Path $d) { 'EXISTS' } else { 'absent' })
  }
}
Add-Section 'C:\bakery-secure top-level (name | type | size MB)' {
  Get-ChildItem 'C:\bakery-secure' -Force -Recurse -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
    '{0} | {1} | {2}' -f $_.FullName.Substring(3), $(if ($_.PSIsContainer) { 'dir' } else { 'file' }), $(if ($_.PSIsContainer) { '-' } else { [math]::Round($_.Length / 1MB, 1) })
  }
}
Add-Section 'is current process elevated' { ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) }

$lines.Add('## 읽지 못한 항목'); foreach ($n in $notes) { $lines.Add($n) }; $lines.Add("(count=$($notes.Count))")
$dir = Split-Path $Out -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
[IO.File]::WriteAllLines($Out, $lines, (New-Object Text.UTF8Encoding($false)))
"saved: $Out  lines=$($lines.Count)  unreadable=$($notes.Count)"
