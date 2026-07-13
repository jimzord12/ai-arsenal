#!/usr/bin/env bash
set -euo pipefail

location="${1:-}"
id_arg=""
enum_arg=""

# parse args (simple for now: location first, then --id --enumeration)
shift || true
while [[ $# -gt 0 ]]; do
    case "$1" in
        --id) id_arg="$2"; shift 2;;
        --enumeration) enum_arg="$2"; shift 2;;
        *) shift;;
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

declare -a matches=()
max_enum=0
while IFS= read -r -d '' file; do
    name=$(basename "$file")
    if [[ "$name" =~ ^([a-z0-9]{5})-([0-9]+)-handoff\.md$ ]]; then
        fid="${BASH_REMATCH[1]}"
        fenum="${BASH_REMATCH[2]}"
        include=true
        if [[ -n "$id_arg" && "$fid" != "$id_arg" ]]; then include=false; fi
        if [[ -n "$enum_arg" && "$fenum" != "$enum_arg" ]]; then include=false; fi
        if $include; then
            matches+=("$fid:$fenum:$file")
            if (( fenum > max_enum )); then max_enum=$fenum; fi
        fi
    fi
done < <(find "$directory" -maxdepth 1 -type f -name '*-handoff.md' -print0 2>/dev/null || true)

if [[ ${#matches[@]} -eq 0 ]]; then
    echo '{"error": "no matching handoff found"}' >&2
    exit 1
fi

if [[ -z "$id_arg" && -z "$enum_arg" && ${#matches[@]} -gt 1 ]]; then
    # pick highest
    chosen=""
    for m in "${matches[@]}"; do
        IFS=: read -r fid fenum fpath <<< "$m"
        if (( fenum == max_enum )); then
            chosen="$fid:$fenum:$fpath"
            break
        fi
    done
else
    chosen="${matches[0]}"
fi

if [[ -z "$chosen" ]]; then
    echo '{"error": "multiple matching handoffs found; add selectors"}' >&2
    exit 1
fi

IFS=: read -r cid cenum cpath <<< "$chosen"
cenum_text=$(printf "%02d" "$cenum")
echo '{"path":"'"$cpath"'","id":"'"$cid"'","enumeration":'"$cenum"',"enumeration_text":"'"$cenum_text"'"}'