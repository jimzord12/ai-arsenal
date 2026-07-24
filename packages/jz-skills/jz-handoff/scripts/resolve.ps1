# Resolves one handoff file under a directory (or an exact .md path).
# Generated names: hand-<NN>-<5-random-char>.md
# Usage:
#   pwsh resolve.ps1 [location] [--id ID] [--enumeration N]
#   pwsh resolve.ps1 [location] -Id ID -Enumeration N

$ErrorActionPreference = 'Stop'

$Location = ''
$Id = ''
$Enumeration = ''

$i = 0
while ($i -lt $args.Count) {
    $a = [string]$args[$i]
    if ($a -in @('--id', '-id', '-Id') -and ($i + 1) -lt $args.Count) {
        $Id = [string]$args[$i + 1]
        $i += 2
        continue
    }
    if ($a -in @('--enumeration', '-enumeration', '-Enumeration') -and ($i + 1) -lt $args.Count) {
        $Enumeration = [string]$args[$i + 1]
        $i += 2
        continue
    }
    if (-not $a.StartsWith('-') -and -not $Location) {
        $Location = $a
        $i += 1
        continue
    }
    throw "unknown argument: $a"
}

$tempDir = [System.IO.Path]::GetTempPath()
$base = if ($Location) { $Location } else { Join-Path $tempDir 'jz-handoffs' }

if ($base -like '*.md') {
    $path = [System.IO.Path]::GetFullPath($base)
    if (-not (Test-Path $path -PathType Leaf)) {
        throw "handoff file does not exist: $path"
    }
    if ($Id -or $Enumeration) {
        throw "selectors cannot be used with an exact Markdown path"
    }
    $obj = @{ path = $path; id = $null; enumeration = $null; enumeration_text = $null }
    $obj | ConvertTo-Json -Compress
    exit 0
}

$directory = [System.IO.Path]::GetFullPath($base)
if (-not (Test-Path $directory -PathType Container)) {
    throw "handoff directory does not exist: $directory"
}

# hand-<NN>-<5-random-char>.md
$pattern = '^hand-(\d+)-([a-z0-9]{5})\.md$'
$files = @(Get-ChildItem -Path $directory -Filter 'hand-*.md' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match $pattern })

$found = @()
foreach ($f in $files) {
    if ($f.Name -match $pattern) {
        $fileEnum = [int]$Matches[1]
        $fileId = $Matches[2]
        $include = $true
        if ($Id) {
            if ($fileId -ne $Id) { $include = $false }
        }
        if ($Enumeration) {
            $normEnum = [int]$Enumeration
            if ($fileEnum -ne $normEnum) { $include = $false }
        }
        if ($include) {
            $found += [pscustomobject]@{
                id          = $fileId
                enumeration = $fileEnum
                path        = $f.FullName
            }
        }
    }
}

if ($found.Count -eq 0) {
    throw "no matching handoff found"
}

if (-not $Id -and -not $Enumeration -and $found.Count -gt 1) {
    $maxEnum = ($found | Measure-Object -Property enumeration -Maximum).Maximum
    $found = @($found | Where-Object { $_.enumeration -eq $maxEnum })
}

if ($found.Count -gt 1) {
    throw "multiple matching handoffs found; add selectors"
}

$chosen = $found[0]
$obj = @{
    path             = $chosen.path
    id               = $chosen.id
    enumeration      = $chosen.enumeration
    enumeration_text = '{0:D2}' -f $chosen.enumeration
}
$obj | ConvertTo-Json -Compress
