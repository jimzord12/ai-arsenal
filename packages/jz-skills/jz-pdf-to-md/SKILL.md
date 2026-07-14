---
name: jz-pdf-to-md
description: Use when converting a single PDF file to Markdown with Docling, especially when image positions must remain placeholders and CPU usage must be limited to two threads.
---

# PDF to Markdown with Docling

## Overview

Convert exactly one PDF into Markdown with Docling. Keep images as placeholders, use two CPU threads, and run one conversion process at a time.

## Workflow

1. Confirm that the input is one existing `.pdf` file and choose an output directory.
2. Run the bundled PowerShell launcher:

   ```powershell
   $skillRoot = 'C:\path\to\jz-pdf-to-md'
   pwsh -NoLogo -NoProfile -File "$skillRoot\scripts\convert-pdf-to-md.ps1" `
     -InputPdf "C:\path\to\document.pdf" `
   -OutputDirectory ".\output"
   ```

3. Confirm that the returned Markdown path exists and contains the expected text.

## Fixed Conversion Contract

The launcher invokes Docling with these required options:

```text
docling convert <input.pdf> --to md --image-export-mode placeholder --num-threads 2 --output <output-directory> --abort-on-error
```

These flags were verified against the installed Docling `2.100.0` CLI. After upgrading Docling, rerun the bundled integration test and check the current CLI help if behavior changes.

Set these environment variables for the child process:

- `OMP_NUM_THREADS=2`
- `MKL_NUM_THREADS=2`
- `OPENBLAS_NUM_THREADS=2`
- `NUMEXPR_NUM_THREADS=2`
- `TOKENIZERS_PARALLELISM=false`

`--image-export-mode placeholder` records image positions without embedding base64 image data or exporting image files. Preserve Docling's default OCR and standard pipeline behavior.

## Resource and Scope Rules

- Process one PDF per invocation.
- Do not pass a directory of PDFs.
- Do not use `ForEach-Object -Parallel`, background jobs, multiple Docling processes, or other concurrent conversion mechanisms.
- Do not add optional VLM, enrichment, or alternate pipeline flags unless the user explicitly requests them.
- Do not use `uvx` for the normal workflow when the installed `docling` command is available.

## Common Mistakes

- Passing a folder converts more than one document; pass one PDF path.
- Omitting `--image-export-mode placeholder` embeds images by default.
- Omitting `--num-threads 2` or the environment limits allows larger thread pools.
- Running several launcher invocations concurrently violates the workflow contract.
- Treating a non-zero launcher exit as a successful conversion; inspect the error and retry one input.

## Verification

Run the bundled integration test with the supplied sample PDF:

```powershell
$skillRoot = 'C:\path\to\jz-pdf-to-md'
pwsh -NoLogo -NoProfile -File "$skillRoot\tests\test-sample.ps1"
```

Pass a different sample path when needed:

```powershell
pwsh -NoLogo -NoProfile -File "$skillRoot\tests\test-sample.ps1" -SamplePdf "C:\path\to\sample.pdf"
```
