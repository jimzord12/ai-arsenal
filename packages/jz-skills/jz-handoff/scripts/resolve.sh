#!/usr/bin/env bash
# Resolves one handoff file under a directory (or an exact .md path).
# Generated names: hand-<NN>-<5-random-char>.md
# Usage:
#   bash resolve.sh [location] [--id ID] [--enumeration N]
set -euo pipefail

location=""
id_arg=""
enum_arg=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --id|-id)
            id_arg="${2:-}"
            shift 2
            ;;
        --enumeration|-enumeration)
            enum_arg="${2:-}"
            shift 2
            ;;
        -*)
            echo '{"error": "unknown argument: '"$1"'"}' >&2
            exit 1
            ;;
        *)
            if [[ -z "$location" ]]; then
                location="$1"
                shift
            else
                echo '{"error": "unexpected positional argument: '"$1"'"}' >&2
                exit 1
            fi
            ;;
    esac
done

temp_dir="${TMPDIR:-/tmp}"
base="${location:-$temp_dir/jz-handoffs}"

if [[ "$base" == *.md ]]; then
    path=$(realpath "$base" 2>/dev/null || echo "$base")
    if [[ ! -f "$path" ]]; then
        echo '{"error": "handoff file does not exist: '"$path"'"}' >&2
        exit 1
    fi
    if [[ -n "$id_arg" || -n "$enum_arg" ]]; then
        echo '{"error": "selectors cannot be used with an exact Markdown path"}' >&2
        exit 1
    fi
    echo '{"path":"'"$path"'","id":null,"enumeration":null,"enumeration_text":null}'
    exit 0
fi

directory=$(realpath "$base" 2>/dev/null || echo "$base")
if [[ ! -d "$directory" ]]; then
    echo '{"error": "handoff directory does not exist: '"$directory"'"}' >&2
    exit 1
fi

# hand-<NN>-<5-random-char>.md
declare -a matches=()
max_enum=-1
while IFS= read -r -d '' file; do
    name=$(basename "$file")
    if [[ "$name" =~ ^hand-([0-9]+)-([a-z0-9]{5})\.md$ ]]; then
        fenum="${BASH_REMATCH[1]}"
        fid="${BASH_REMATCH[2]}"
        include=true
        if [[ -n "$id_arg" && "$fid" != "$id_arg" ]]; then
            include=false
        fi
        if [[ -n "$enum_arg" ]]; then
            # Numeric compare so 1, 01, 001 match enumeration 1
            if (( 10#$fenum != 10#$enum_arg )); then
                include=false
            fi
        fi
        if $include; then
            matches+=("$fid:$fenum:$file")
            if (( 10#$fenum > max_enum )); then
                max_enum=$((10#$fenum))
            fi
        fi
    fi
done < <(find "$directory" -maxdepth 1 -type f -name 'hand-*.md' -print0 2>/dev/null || true)

if [[ ${#matches[@]} -eq 0 ]]; then
    echo '{"error": "no matching handoff found"}' >&2
    exit 1
fi

declare -a final=()
if [[ -z "$id_arg" && -z "$enum_arg" && ${#matches[@]} -gt 1 ]]; then
    for m in "${matches[@]}"; do
        IFS=: read -r fid fenum fpath <<< "$m"
        if (( 10#$fenum == max_enum )); then
            final+=("$m")
        fi
    done
else
    final=("${matches[@]}")
fi

if [[ ${#final[@]} -eq 0 ]]; then
    echo '{"error": "no matching handoff found"}' >&2
    exit 1
fi

if [[ ${#final[@]} -gt 1 ]]; then
    echo '{"error": "multiple matching handoffs found; add selectors"}' >&2
    exit 1
fi

IFS=: read -r cid cenum cpath <<< "${final[0]}"
cenum_num=$((10#$cenum))
cenum_text=$(printf "%02d" "$cenum_num")
echo '{"path":"'"$cpath"'","id":"'"$cid"'","enumeration":'"$cenum_num"',"enumeration_text":"'"$cenum_text"'"}'
