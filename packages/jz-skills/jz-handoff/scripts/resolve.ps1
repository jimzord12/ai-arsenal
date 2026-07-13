param(
    [string]$Location,
    [string]$Id,
    [string]$Enumeration
)

$ErrorActionPreference = 'Stop'

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

$pattern = '^[a-z0-9]{5}-(\d+)-handoff\.md$'
$files = Get-ChildItem -Path $directory -Filter '*-handoff.md' -File | Where-Object { $_.Name -match $pattern }

$found = @()
foreach ($f in $files) {
    if ($f.Name -match $pattern) {
        $fileId = $Matches[1]
        $fileEnum = [int]$Matches[2]
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
                id = $fileId
                enumeration = $fileEnum
                path = $f.FullName
            }
        }
    }
}

if ($found.Count -eq 0) {
    throw "no matching handoff found"
}

if (-not $Id -and -not $Enumeration -and $found.Count -gt 1) {
    # take highest enumeration
    $found = @($found | Sort-Object enumeration -Descending | Select-Object -First 1)
}

if ($found.Count -gt 1) {
    throw "multiple matching handoffs found; add selectors"
}

$chosen = $found[0]
$obj = @{
    path = $chosen.path
    id = $chosen.id
    enumeration = $chosen.enumeration
    enumeration_text = '{0:D2}' -f $chosen.enumeration
}
$obj | ConvertTo-Json -Compress
