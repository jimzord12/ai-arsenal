param(
  [Parameter(Mandatory = $true)]
  [string]$SourceCli,
  [string]$MigratedCli = (Join-Path $PSScriptRoot '..\packages\features-cli\src\bin.ts')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$sourceCliPath = (Resolve-Path -LiteralPath $SourceCli).Path
$migratedCliPath = (Resolve-Path -LiteralPath $MigratedCli).Path
$sourceCwd = Join-Path ([IO.Path]::GetTempPath()) ('features-cli-source-' + [guid]::NewGuid().ToString('N'))
$migratedCwd = Join-Path ([IO.Path]::GetTempPath()) ('features-cli-migrated-' + [guid]::NewGuid().ToString('N'))
$comparisons = [Collections.Generic.List[object]]::new()

function Invoke-Cli {
  param(
    [string]$Cli,
    [string]$Cwd,
    [string[]]$Arguments
  )

  Push-Location $Cwd
  try {
    $lines = & bun $Cli @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $output = ($lines | Out-String).TrimEnd().Replace($Cwd, '<cwd>')
  } finally {
    Pop-Location
  }

  [pscustomobject]@{ ExitCode = $exitCode; Output = $output }
}

function Add-CommandComparison {
  param([string[]]$Arguments)

  $source = Invoke-Cli -Cli $sourceCliPath -Cwd $sourceCwd -Arguments $Arguments
  $migrated = Invoke-Cli -Cli $migratedCliPath -Cwd $migratedCwd -Arguments $Arguments
  $comparisons.Add(
    [pscustomobject]@{
      Boundary = $Arguments -join ' '
      Match = $source.ExitCode -eq $migrated.ExitCode -and $source.Output -eq $migrated.Output
      SourceExit = $source.ExitCode
      MigratedExit = $migrated.ExitCode
      SourceOutput = $source.Output
      MigratedOutput = $migrated.Output
    }
  )
}

function Read-NormalizedJson {
  param(
    [string]$Path,
    [switch]$NormalizeFeatureTimestamps
  )

  $value = Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
  if ($null -ne $value.lastUpdated) {
    $value.lastUpdated = '<timestamp>'
  }
  if ($NormalizeFeatureTimestamps) {
    foreach ($feature in $value.features) {
      if ($null -ne $feature.lastUpdated) {
        $feature.lastUpdated = '<timestamp>'
      }
    }
  }
  $value | ConvertTo-Json -Depth 20 -Compress
}

try {
  [IO.Directory]::CreateDirectory($sourceCwd) | Out-Null
  [IO.Directory]::CreateDirectory($migratedCwd) | Out-Null

  $featureCommands = @(
    [pscustomobject]@{ Arguments = @('--help') },
    [pscustomobject]@{ Arguments = @('init') },
    [pscustomobject]@{ Arguments = @('create-feature', 'sample-feature') },
    [pscustomobject]@{ Arguments = @('update-feature', 'sample-feature', '--status', 'in-progress', '--phase', 'design') },
    [pscustomobject]@{ Arguments = @('get-feature') },
    [pscustomobject]@{ Arguments = @('status') },
    [pscustomobject]@{ Arguments = @('progress', '--feature', 'sample-feature', '--json') },
    [pscustomobject]@{ Arguments = @('definitely-invalid') }
  )
  foreach ($command in $featureCommands) {
    Add-CommandComparison -Arguments $command.Arguments
  }

  $sourceFeatureState = Read-NormalizedJson -Path (Join-Path $sourceCwd '.scratch\features-status.json') -NormalizeFeatureTimestamps
  $migratedFeatureState = Read-NormalizedJson -Path (Join-Path $migratedCwd '.scratch\features-status.json') -NormalizeFeatureTimestamps
  $comparisons.Add(
    [pscustomobject]@{
      Boundary = 'normalized feature schema-v2 state'
      Match = $sourceFeatureState -eq $migratedFeatureState
      SourceExit = 0
      MigratedExit = 0
      SourceOutput = $sourceFeatureState
      MigratedOutput = $migratedFeatureState
    }
  )

  foreach ($workspace in @($sourceCwd, $migratedCwd)) {
    $issueDir = Join-Path $workspace '.scratch\features\001-sample-feature\issues\01-parity'
    [IO.Directory]::CreateDirectory($issueDir) | Out-Null
    [IO.File]::WriteAllText(
      (Join-Path $issueDir 'issue.md'),
      "Status: ready-for-agent`nMethod: tdd`nComplexity: 1`nBlockedBy: none`n# Parity issue`n`nUser bytes.`n"
    )
  }

  $issueCommands = @(
    [pscustomobject]@{ Arguments = @('sync-issues', '--feature', 'sample-feature') },
    [pscustomobject]@{ Arguments = @('get-issue', '--next', '--feature', 'sample-feature') },
    [pscustomobject]@{ Arguments = @('update-status', '1', '--status', 'in-progress', '--feature', 'sample-feature') }
  )
  foreach ($command in $issueCommands) {
    Add-CommandComparison -Arguments $command.Arguments
  }

  $sourceIssuePath = Join-Path $sourceCwd '.scratch\features\001-sample-feature\issues\01-parity\issue.md'
  $migratedIssuePath = Join-Path $migratedCwd '.scratch\features\001-sample-feature\issues\01-parity\issue.md'
  $sourceIssue = [IO.File]::ReadAllText($sourceIssuePath)
  $migratedIssue = [IO.File]::ReadAllText($migratedIssuePath)
  $comparisons.Add(
    [pscustomobject]@{
      Boundary = 'canonical issue bytes'
      Match = $sourceIssue -ceq $migratedIssue
      SourceExit = 0
      MigratedExit = 0
      SourceOutput = $sourceIssue
      MigratedOutput = $migratedIssue
    }
  )

  $sourceDerived = Read-NormalizedJson -Path (Join-Path $sourceCwd '.scratch\features\001-sample-feature\issues-status.json')
  $migratedDerived = Read-NormalizedJson -Path (Join-Path $migratedCwd '.scratch\features\001-sample-feature\issues-status.json')
  $comparisons.Add(
    [pscustomobject]@{
      Boundary = 'normalized derived issue JSON'
      Match = $sourceDerived -eq $migratedDerived
      SourceExit = 0
      MigratedExit = 0
      SourceOutput = $sourceDerived
      MigratedOutput = $migratedDerived
    }
  )

  $summary = [pscustomobject]@{
    SourceCli = $sourceCliPath
    MigratedCli = $migratedCliPath
    Comparisons = $comparisons.Count
    Failures = @($comparisons | Where-Object { -not $_.Match }).Count
    Results = $comparisons
  }
  $summary | ConvertTo-Json -Depth 8

  if ($summary.Failures -gt 0) {
    throw "CLI parity failed for $($summary.Failures) boundary comparison(s)."
  }
} finally {
  foreach ($workspace in @($sourceCwd, $migratedCwd)) {
    if (Test-Path -LiteralPath $workspace) {
      Remove-Item -LiteralPath $workspace -Recurse -Force
    }
  }
}
