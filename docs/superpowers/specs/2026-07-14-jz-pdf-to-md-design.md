# Design: jz-pdf-to-md

Date: 2026-07-14

## Goal

Create a reusable `jz-pdf-to-md` skill for converting exactly one PDF at a time into Markdown with Docling. The workflow must use image placeholders, two CPU threads, and no document-level concurrency or parallel invocation.

## Docling command contract

The researched Docling CLI supports:

```powershell
docling convert <input.pdf> --to md --image-export-mode placeholder --num-threads 2 --output <output-dir> --abort-on-error
```

The skill will set `OMP_NUM_THREADS`, `MKL_NUM_THREADS`, `OPENBLAS_NUM_THREADS`, and `NUMEXPR_NUM_THREADS` to `2`, and `TOKENIZERS_PARALLELISM` to `false`. It will preserve Docling's default OCR and standard pipeline behavior and will not add optional model or enrichment flags.

Docling's `--image-export-mode placeholder` option marks image positions without embedding base64 image data or exporting image files. The CLI has no RAM limit requirement for this skill.

## Skill contents

Create `packages/jz-skills/jz-pdf-to-md` with:

- `SKILL.md` — discovery description, fixed workflow, command reference, constraints, error handling, and output expectations.
- `agents/openai.yaml` — generated UI metadata.
- `scripts/convert-pdf-to-md.ps1` — validates one existing PDF and output directory, sets thread environment variables, and invokes one Docling process with the fixed flags.
- `tests/test-sample.ps1` — reusable integration test that uses `C:\Users\jimzord12\Downloads\docling-test-sample.pdf` by default, writes to an isolated temporary output directory, and verifies the generated Markdown.

## Execution behavior

The launcher will:

1. Require one input path ending in `.pdf` and reject missing files, directories, and multiple inputs.
2. Require or accept an explicit output directory without processing a directory of PDFs.
3. Invoke Docling once with Markdown output, image placeholders, two Docling threads, and abort-on-error.
4. Fail clearly when `docling` is unavailable or conversion exits non-zero.
5. Return the generated Markdown path after successful conversion.

The skill instructions will explicitly forbid `ForEach-Object -Parallel`, background jobs, multiple Docling processes, and directory inputs.

## Verification

The sample test will assert:

- Docling is available.
- The sample PDF exists.
- Conversion exits successfully.
- A non-empty Markdown file is created.
- The Markdown does not contain embedded base64 image data.
- The output is produced by the one-document workflow.

The skill folder will pass the skill creator's `quick_validate.py` check. The PowerShell launcher and sample integration test will be executed directly.
