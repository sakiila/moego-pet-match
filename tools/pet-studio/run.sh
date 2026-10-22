#!/bin/sh
set -eu

studio_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(CDPATH= cd -- "$studio_dir/../.." && pwd)
cd "$studio_dir"

if [ -x "$studio_dir/.venv/bin/python" ]; then
  studio_python="$studio_dir/.venv/bin/python"
elif command -v python3.12 >/dev/null 2>&1; then
  studio_python=$(command -v python3.12)
elif command -v python3.13 >/dev/null 2>&1; then
  studio_python=$(command -v python3.13)
elif command -v python3.11 >/dev/null 2>&1; then
  studio_python=$(command -v python3.11)
else
  studio_python=$(command -v python3)
fi

export PET_STUDIO_PROJECT_ROOT="$project_dir"
export PET_STUDIO_DATA_DIR="${PET_STUDIO_DATA_DIR:-$project_dir/data/pet-studio}"
export U2NET_HOME="${U2NET_HOME:-$project_dir/data/pet-studio/models}"
export PET_STUDIO_MODEL="${PET_STUDIO_MODEL:-u2net}"
export OMP_NUM_THREADS="${OMP_NUM_THREADS:-2}"
studio_port="${PET_STUDIO_PORT:-8765}"

"$studio_python" "$studio_dir/setup_local.py"
printf '\nMoeGo 宠物素材工作台：http://127.0.0.1:%s\n按 Ctrl+C 停止；设置和结果保存在本地。\n\n' "$studio_port"
exec "$studio_dir/.venv/bin/python" -m uvicorn backend.app:app --host 127.0.0.1 --port "$studio_port"
