param(
    [string]$Location
)

$ErrorActionPreference = 'Stop'

function New-RandomId {
    $alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
    $id = ''
    for ($i = 0; $i -lt 5; $i++) {
        $id += $alphabet[(Get-Random -Maximum $alphabet.Length)]
    }
    return $id
}

$tempDir = [System.IO.Path]::GetTempPath()
$base = if ($Location) { $Location } else { Join-Path $tempDir 'jz-handoffs' }

if ($base -like '*.md') {
    $path = [System.IO.Path]::GetFullPath($base)
    if (Test-Path $path) {
        throw "refusing to overwrite existing handoff: $path"
    }
    $obj = @{
        path = $path
        id = $null
        enumeration = $null
        enumeration_text = $null
    }
    $obj | ConvertTo-Json -Compress
    exit 0
}

$directory = [System.IO.Path]::GetFullPath($base)
if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

$pattern = '^[a-z0-9]{5}-(\d+)-handoff\.md$'
$files = Get-ChildItem -Path $directory -Filter '*-handoff.md' -File | Where-Object { $_.Name -match $pattern }

$maxEnum = 0
$usedIds = @{}
foreach ($f in $files) {
    if ($f.Name -match $pattern) {
        $id = $matches[1]
        $enum = [int]$matches[2]
        if (-not $usedIds.ContainsKey($id)) { $usedIds[$id] = $true }
        if ($enum -gt $maxEnum) { $maxEnum = $enum }
    }
}

$nextEnum = $maxEnum + 1
$enumText = '{0:D2}' -f $nextEnum

$id = $null
for ($attempt = 0; $attempt -lt 100; $attempt++) {
    $candidate = New-RandomId
    if (-not $usedIds.ContainsKey($candidate)) {
        $id = $candidate
        break
    }
}

if (-not $id) {
    throw "unable to allocate a unique handoff ID"
}

$fullPath = Join-Path $directory "$id-$enumText-handoff.md"
$obj = @{
    path = $fullPath
    id = $id
    enumeration = $nextEnum
    enumeration_text = $enumText
}
$obj | ConvertTo-Json -Compress
