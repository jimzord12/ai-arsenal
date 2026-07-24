# Fixture tests for handoff resolve/allocate naming and selection rules.
# Usage: pwsh -NoProfile -File test-resolve.ps1
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$resolve = Join-Path $scriptDir 'resolve.ps1'
$allocate = Join-Path $scriptDir 'allocate.ps1'
$failed = 0

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        Write-Host "FAIL: $Message" -ForegroundColor Red
        $script:failed++
    }
    else {
        Write-Host "PASS: $Message" -ForegroundColor Green
    }
}

function Invoke-Resolve {
    param([string[]]$ScriptArgs)
    $out = & pwsh -NoProfile -File $resolve @ScriptArgs 2>&1
    return @{
        ExitCode = $LASTEXITCODE
        Output   = ($out | Out-String).Trim()
    }
}

function Invoke-Allocate {
    param([string[]]$ScriptArgs)
    $out = & pwsh -NoProfile -File $allocate @ScriptArgs 2>&1
    return @{
        ExitCode = $LASTEXITCODE
        Output   = ($out | Out-String).Trim()
    }
}

$fixture = Join-Path ([System.IO.Path]::GetTempPath()) ("jz-handoff-test-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture -Force | Out-Null

try {
    # Three files sharing enumeration 1 (legacy-style collision of "latest")
    Set-Content -Path (Join-Path $fixture 'hand-01-f1dsn.md') -Value 'a'
    Set-Content -Path (Join-Path $fixture 'hand-01-f4djc.md') -Value 'b'
    Set-Content -Path (Join-Path $fixture 'hand-01-msq6h.md') -Value 'c'
    # One true latest
    Set-Content -Path (Join-Path $fixture 'hand-02-abc12.md') -Value 'latest'
    # Noise that must be ignored
    Set-Content -Path (Join-Path $fixture 'f1dsn-01-handoff.md') -Value 'legacy'
    Set-Content -Path (Join-Path $fixture 'notes.md') -Value 'noise'

    # Default: highest enumeration wins when unique
    $r = Invoke-Resolve @($fixture)
    Assert-True ($r.ExitCode -eq 0) 'default resolve exits 0 with unique max enum'
    $json = $r.Output | ConvertFrom-Json
    Assert-True ($json.id -eq 'abc12') "default id is abc12 (got $($json.id))"
    Assert-True ($json.enumeration -eq 2) "default enumeration is 2 (got $($json.enumeration))"
    Assert-True ($json.enumeration_text -eq '02') "default enumeration_text is 02 (got $($json.enumeration_text))"
    Assert-True ($json.path -like '*hand-02-abc12.md') 'default path is hand-02-abc12.md'

    # --id selects only that ID among shared enums
    $r = Invoke-Resolve @($fixture, '--id', 'f1dsn')
    Assert-True ($r.ExitCode -eq 0) '--id f1dsn exits 0'
    $json = $r.Output | ConvertFrom-Json
    Assert-True ($json.id -eq 'f1dsn') "--id reports id f1dsn (got $($json.id))"
    Assert-True ($json.enumeration -eq 1) "--id reports enumeration 1 (got $($json.enumeration))"
    Assert-True ($json.path -like '*hand-01-f1dsn.md') '--id path is hand-01-f1dsn.md'

    # -Id form also works
    $r = Invoke-Resolve @($fixture, '-Id', 'msq6h')
    Assert-True ($r.ExitCode -eq 0) '-Id msq6h exits 0'
    $json = $r.Output | ConvertFrom-Json
    Assert-True ($json.id -eq 'msq6h') "-Id reports id msq6h (got $($json.id))"

    # --enumeration with zero padding
    $r = Invoke-Resolve @($fixture, '--enumeration', '01')
    Assert-True ($r.ExitCode -ne 0) 'enumeration 01 alone is ambiguous across three IDs'
    Assert-True ($r.Output -match 'multiple matching handoffs') 'enumeration-only ambiguity message'

    $r = Invoke-Resolve @($fixture, '--id', 'f4djc', '--enumeration', '1')
    Assert-True ($r.ExitCode -eq 0) 'id+enumeration intersection exits 0'
    $json = $r.Output | ConvertFrom-Json
    Assert-True ($json.id -eq 'f4djc' -and $json.enumeration -eq 1) 'id+enumeration selects f4djc/1'

    # Default with only tied max enums must fail (no mtime guess)
    $tied = Join-Path $fixture 'tied'
    New-Item -ItemType Directory -Path $tied -Force | Out-Null
    Set-Content -Path (Join-Path $tied 'hand-03-aaaa1.md') -Value 't1'
    Set-Content -Path (Join-Path $tied 'hand-03-bbbb2.md') -Value 't2'
    $r = Invoke-Resolve @($tied)
    Assert-True ($r.ExitCode -ne 0) 'tied max enumeration fails without selectors'
    Assert-True ($r.Output -match 'multiple matching handoffs') 'tied max uses multiple-match error'

    # Allocate next enum and new name pattern
    $allocDir = Join-Path $fixture 'alloc'
    New-Item -ItemType Directory -Path $allocDir -Force | Out-Null
    Set-Content -Path (Join-Path $allocDir 'hand-01-zzzz1.md') -Value 'seed'
    $a = Invoke-Allocate @($allocDir)
    Assert-True ($a.ExitCode -eq 0) 'allocate exits 0'
    $aj = $a.Output | ConvertFrom-Json
    Assert-True ($aj.enumeration -eq 2) "allocate next enum is 2 (got $($aj.enumeration))"
    Assert-True ($aj.enumeration_text -eq '02') 'allocate enumeration_text is 02'
    Assert-True ($aj.id -match '^[a-z0-9]{5}$') "allocate id is 5 chars (got $($aj.id))"
    Assert-True ($aj.path -match 'hand-02-[a-z0-9]{5}\.md$') "allocate path matches hand-02-<id>.md (got $($aj.path))"

    # Exact .md path passthrough
    $exact = Join-Path $fixture 'hand-02-abc12.md'
    $r = Invoke-Resolve @($exact)
    Assert-True ($r.ExitCode -eq 0) 'exact path resolve exits 0'
    $json = $r.Output | ConvertFrom-Json
    Assert-True ($null -eq $json.id -and $null -eq $json.enumeration) 'exact path null selectors'
}
finally {
    Remove-Item -Recurse -Force $fixture -ErrorAction SilentlyContinue
}

if ($failed -gt 0) {
    Write-Host "`n$failed test(s) failed." -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests passed." -ForegroundColor Green
exit 0
