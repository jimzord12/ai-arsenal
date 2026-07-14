[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$InputPdf,

    [Parameter(Mandatory = $true)]
    [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $InputPdf -PathType Leaf)) {
    throw "Input PDF was not found: $InputPdf"
}

$inputPath = (Resolve-Path -LiteralPath $InputPdf).Path
if ([IO.Path]::GetExtension($inputPath).ToLowerInvariant() -ne '.pdf') {
    throw "Input must be a PDF file: $InputPdf"
}

if (Test-Path -LiteralPath $OutputDirectory -PathType Leaf) {
    throw "Output path is a file, not a directory: $OutputDirectory"
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$outputPath = (Resolve-Path -LiteralPath $OutputDirectory).Path

$docling = Get-Command -Name 'docling' -CommandType Application -ErrorAction SilentlyContinue
if ($null -eq $docling) {
    throw 'Docling was not found on PATH. Install it with uv before running this skill.'
}

$environmentNames = @(
    'OMP_NUM_THREADS',
    'MKL_NUM_THREADS',
    'OPENBLAS_NUM_THREADS',
    'NUMEXPR_NUM_THREADS',
    'TOKENIZERS_PARALLELISM'
)
$previousEnvironment = @{}

try {
    foreach ($name in $environmentNames) {
        $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
    }

    $env:OMP_NUM_THREADS = '2'
    $env:MKL_NUM_THREADS = '2'
    $env:OPENBLAS_NUM_THREADS = '2'
    $env:NUMEXPR_NUM_THREADS = '2'
    $env:TOKENIZERS_PARALLELISM = 'false'

    $arguments = @(
        'convert',
        $inputPath,
        '--to',
        'md',
        '--image-export-mode',
        'placeholder',
        '--num-threads',
        '2',
        '--output',
        $outputPath,
        '--abort-on-error'
    )

    & $docling.Source @arguments
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "Docling conversion failed with exit code $exitCode"
    }

    $markdownPath = Join-Path $outputPath (([IO.Path]::GetFileNameWithoutExtension($inputPath)) + '.md')
    if (-not (Test-Path -LiteralPath $markdownPath -PathType Leaf)) {
        throw "Docling completed without creating the expected Markdown file: $markdownPath"
    }

    Write-Output $markdownPath
}
finally {
    foreach ($name in $environmentNames) {
        [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
    }
}
