[CmdletBinding()]
param(
    [string]$SamplePdf = 'C:\Users\jimzord12\Downloads\docling-test-sample.pdf'
)

$ErrorActionPreference = 'Stop'
$skillRoot = Split-Path -Parent $PSScriptRoot
$converter = Join-Path $skillRoot 'scripts\convert-pdf-to-md.ps1'

function Assert-Condition {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

Assert-Condition (Test-Path -LiteralPath $SamplePdf -PathType Leaf) "Sample PDF not found: $SamplePdf"
Assert-Condition (Test-Path -LiteralPath $converter -PathType Leaf) "Converter script not found: $converter"

$converterText = Get-Content -Raw -LiteralPath $converter
foreach ($requiredText in @(
        '--to',
        'md',
        '--image-export-mode',
        'placeholder',
        '--num-threads',
        '--abort-on-error',
        'OMP_NUM_THREADS',
        'TOKENIZERS_PARALLELISM'
    )) {
    Assert-Condition ($converterText.Contains($requiredText)) "Converter is missing required contract text: $requiredText"
}

$outputDirectory = Join-Path ([IO.Path]::GetTempPath()) ("jz-pdf-to-md-test-" + [IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

try {
    $conversionOutput = & $converter -InputPdf $SamplePdf -OutputDirectory $outputDirectory 2>&1 | Out-String
    $exitCode = $LASTEXITCODE

    Assert-Condition ($exitCode -eq 0) "Docling conversion failed with exit code $exitCode`n$conversionOutput"

    $expectedMarkdown = Join-Path $outputDirectory (([IO.Path]::GetFileNameWithoutExtension($SamplePdf)) + '.md')
    Assert-Condition (Test-Path -LiteralPath $expectedMarkdown -PathType Leaf) "Expected Markdown not found: $expectedMarkdown"

    $markdown = Get-Content -Raw -LiteralPath $expectedMarkdown
    Assert-Condition ($markdown.Trim().Length -gt 0) 'Generated Markdown is empty'
    Assert-Condition ($markdown.Contains('<!-- image -->')) 'Generated Markdown does not contain image placeholders'
    Assert-Condition (-not $markdown.Contains('data:image/')) 'Generated Markdown contains embedded image data'
    Assert-Condition (-not $markdown.Contains('base64,')) 'Generated Markdown contains base64 data'
    Write-Output "PASS: $expectedMarkdown"
}
finally {
    if (Test-Path -LiteralPath $outputDirectory) {
        Remove-Item -LiteralPath $outputDirectory -Recurse -Force
    }
}
