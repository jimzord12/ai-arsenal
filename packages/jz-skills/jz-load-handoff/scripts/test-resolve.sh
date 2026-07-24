#!/usr/bin/env bash
# Fixture tests for handoff resolve/allocate naming and selection rules.
# Usage: bash test-resolve.sh
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
resolve="$script_dir/resolve.sh"
allocate="$script_dir/allocate.sh"
failed=0

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; failed=$((failed + 1)); }

fixture="$(mktemp -d "${TMPDIR:-/tmp}/jz-handoff-test.XXXXXX")"
cleanup() { rm -rf "$fixture"; }
trap cleanup EXIT

# Three files sharing enumeration 1 + one true latest
printf 'a' >"$fixture/hand-01-f1dsn.md"
printf 'b' >"$fixture/hand-01-f4djc.md"
printf 'c' >"$fixture/hand-01-msq6h.md"
printf 'latest' >"$fixture/hand-02-abc12.md"
printf 'legacy' >"$fixture/f1dsn-01-handoff.md"
printf 'noise' >"$fixture/notes.md"

# Default: highest enumeration wins when unique
out="$(bash "$resolve" "$fixture")"
json_id="$(printf '%s' "$out" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
json_enum="$(printf '%s' "$out" | sed -n 's/.*"enumeration":\([0-9]*\).*/\1/p')"
json_enum_text="$(printf '%s' "$out" | sed -n 's/.*"enumeration_text":"\([^"]*\)".*/\1/p')"
[[ "$json_id" == "abc12" ]] && pass "default id is abc12" || fail "default id is abc12 (got $json_id)"
[[ "$json_enum" == "2" ]] && pass "default enumeration is 2" || fail "default enumeration is 2 (got $json_enum)"
[[ "$json_enum_text" == "02" ]] && pass "default enumeration_text is 02" || fail "default enumeration_text is 02 (got $json_enum_text)"
[[ "$out" == *hand-02-abc12.md* ]] && pass "default path is hand-02-abc12.md" || fail "default path is hand-02-abc12.md"

# --id selects only that ID
out="$(bash "$resolve" "$fixture" --id f1dsn)"
json_id="$(printf '%s' "$out" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
json_enum="$(printf '%s' "$out" | sed -n 's/.*"enumeration":\([0-9]*\).*/\1/p')"
[[ "$json_id" == "f1dsn" ]] && pass "--id reports id f1dsn" || fail "--id reports id f1dsn (got $json_id)"
[[ "$json_enum" == "1" ]] && pass "--id reports enumeration 1" || fail "--id reports enumeration 1 (got $json_enum)"

# enumeration alone across three IDs is ambiguous
set +e
err="$(bash "$resolve" "$fixture" --enumeration 01 2>&1)"
code=$?
set -e
[[ $code -ne 0 ]] && pass "enumeration 01 alone is ambiguous" || fail "enumeration 01 alone is ambiguous"
[[ "$err" == *multiple\ matching\ handoffs* ]] && pass "enumeration-only ambiguity message" || fail "enumeration-only ambiguity message"

# id+enumeration intersection
out="$(bash "$resolve" "$fixture" --id f4djc --enumeration 1)"
json_id="$(printf '%s' "$out" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
json_enum="$(printf '%s' "$out" | sed -n 's/.*"enumeration":\([0-9]*\).*/\1/p')"
[[ "$json_id" == "f4djc" && "$json_enum" == "1" ]] && pass "id+enumeration selects f4djc/1" || fail "id+enumeration selects f4djc/1"

# tied max enum fails
tied="$fixture/tied"
mkdir -p "$tied"
printf 't1' >"$tied/hand-03-aaaa1.md"
printf 't2' >"$tied/hand-03-bbbb2.md"
set +e
err="$(bash "$resolve" "$tied" 2>&1)"
code=$?
set -e
[[ $code -ne 0 ]] && pass "tied max enumeration fails without selectors" || fail "tied max enumeration fails without selectors"
[[ "$err" == *multiple\ matching\ handoffs* ]] && pass "tied max uses multiple-match error" || fail "tied max uses multiple-match error"

# allocate next enum
alloc_dir="$fixture/alloc"
mkdir -p "$alloc_dir"
printf 'seed' >"$alloc_dir/hand-01-zzzz1.md"
out="$(bash "$allocate" "$alloc_dir")"
json_id="$(printf '%s' "$out" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
json_enum="$(printf '%s' "$out" | sed -n 's/.*"enumeration":\([0-9]*\).*/\1/p')"
json_enum_text="$(printf '%s' "$out" | sed -n 's/.*"enumeration_text":"\([^"]*\)".*/\1/p')"
[[ "$json_enum" == "2" ]] && pass "allocate next enum is 2" || fail "allocate next enum is 2 (got $json_enum)"
[[ "$json_enum_text" == "02" ]] && pass "allocate enumeration_text is 02" || fail "allocate enumeration_text is 02"
[[ "$json_id" =~ ^[a-z0-9]{5}$ ]] && pass "allocate id is 5 chars" || fail "allocate id is 5 chars (got $json_id)"
[[ "$out" =~ hand-02-[a-z0-9]{5}\.md ]] && pass "allocate path matches hand-02-<id>.md" || fail "allocate path matches hand-02-<id>.md (got $out)"

if [[ $failed -gt 0 ]]; then
    echo
    echo "$failed test(s) failed."
    exit 1
fi

echo
echo "All tests passed."
exit 0
