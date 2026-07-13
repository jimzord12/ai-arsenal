#!/usr/bin/env bash
set -euo pipefail

location="${1:-}"

temp_dir="${TMPDIR:-/tmp}"
base="${location:-$temp_dir/jz-handoffs}"

if [[ "$base" == *.md ]]; then
    path=$(realpath "$base" 2>/dev/null || echo "$base")
    if [[ -f "$path" ]]; then
        echo '{"error": "refusing to overwrite existing handoff: '"$path"'"}' >&2
        exit 1
    fi
    echo '{"path":"'"$path"'","id":null,"enumeration":null,"enumeration_text":null}'
    exit 0
fi

mkdir -p "$base"
directory=$(realpath "$base")

# Find existing
max_enum=0
declare -A used_ids
while IFS= read -r -d '' file; do
    name=$(basename "$file")
    if [[ "$name" =~ ^([a-z0-9]{5})-([0-9]+)-handoff\.md$ ]]; then
        id="${BASH_REMATCH[1]}"
        enum="${BASH_REMATCH[2]}"
        used_ids["$id"]=1
        if (( enum > max_enum )); then
            max_enum=$enum
        fi
    fi
done < <(find "$directory" -maxdepth 1 -type f -name '*-handoff.md' -print0 2>/dev/null || true)

next_enum=$((max_enum + 1))
enum_text=$(printf "%02d" "$next_enum")

# generate id
id=""
for i in {1..100}; do
    id=$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 5)
    if [[ ! -v used_ids["$id"] ]]; then
        break
    fi
done

if [[ -z "$id" ]]; then
    echo '{"error": "unable to allocate a unique handoff ID"}' >&2
    exit 1
fi

full_path="$directory/$id-$enum_text-handoff.md"
echo '{"path":"'"$full_path"'","id":"'"$id"'","enumeration":'"$next_enum"',"enumeration_text":"'"$enum_text"'"}'