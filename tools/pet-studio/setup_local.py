#!/usr/bin/env python3
"""Prepare isolated runtime, frontend build and the local background-removal model."""

import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import venv

STUDIO = Path(__file__).resolve().parent
PROJECT = STUDIO.parent.parent
VENV = STUDIO / ".venv"
PYTHON = VENV / "bin" / "python"
FRONTEND = STUDIO / "frontend"
MODEL_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"
MODEL_MD5 = "60024c5c889badc19c04ad937298a77b"


def run(args, **kwargs):
    subprocess.run([str(value) for value in args], check=True, **kwargs)


def prepare_python():
    if not (3, 11) <= sys.version_info[:2] < (3, 14):
        raise SystemExit("需要 Python 3.11–3.13。请用支持版本运行 setup_local.py。")
    if not PYTHON.exists():
        print("正在创建工具专用 Python 环境…", flush=True)
        venv.EnvBuilder(with_pip=True).create(VENV)
    requirements = STUDIO / "backend" / "requirements.txt"
    # Check exact declared versions without changing any global Python environment.
    probe = "import importlib.metadata as m,json; names=json.loads(__import__('sys').argv[1]); print(json.dumps({n:m.version(n) for n in names}))"
    expected = {}
    for line in requirements.read_text().splitlines():
        if "==" in line:
            name, version = line.split("==", 1)
            expected[name.split("[", 1)[0]] = version
    installed = subprocess.run([str(PYTHON), "-c", probe, json.dumps(list(expected))], capture_output=True, text=True)
    if installed.returncode or json.loads(installed.stdout) != expected:
        print("正在安装本地抠图依赖…", flush=True)
        run([PYTHON, "-m", "pip", "install", "-r", requirements])


def prepare_model():
    model_root = Path(os.environ.get("U2NET_HOME", str(PROJECT / "data" / "pet-studio" / "models")))
    destination = model_root / "u2net.onnx"
    model_root.mkdir(parents=True, exist_ok=True)
    if destination.is_file():
        if hashlib.md5(destination.read_bytes()).hexdigest() != MODEL_MD5:
            raise SystemExit(f"模型文件校验失败，未覆盖原文件。请检查：{destination}")
        return
    print("首次准备：下载 U2Net 本地抠图模型（约 168 MiB，仅下载模型，不上传照片）…", flush=True)
    # Run through the isolated runtime so its verified TLS roots and pooch are available.
    script = "import pooch,sys;pooch.retrieve(sys.argv[1],known_hash='md5:'+sys.argv[2],path=sys.argv[3],fname='u2net.onnx',progressbar=True)"
    run([PYTHON, "-c", script, MODEL_URL, MODEL_MD5, model_root])


def prepare_frontend():
    npm = shutil.which("npm")
    if not npm:
        raise SystemExit("需要 Node.js 20.19+（含 npm）来构建本地界面。")
    if not (FRONTEND / "node_modules" / ".bin" / "vite").exists():
        print("正在安装界面依赖…", flush=True)
        run([npm, "ci" if (FRONTEND / "package-lock.json").exists() else "install"], cwd=FRONTEND)
    sources = [FRONTEND / "package.json", FRONTEND / "index.html", *[p for p in (FRONTEND / "src").rglob("*") if p.is_file()]]
    entry = FRONTEND / "dist" / "index.html"
    if not entry.exists() or any(p.stat().st_mtime > entry.stat().st_mtime for p in sources):
        print("正在构建照片工作台…", flush=True)
        run([npm, "run", "build"], cwd=FRONTEND)


if __name__ == "__main__":
    try:
        prepare_python()
        prepare_model()
        prepare_frontend()
        print("本地运行环境已准备好。", flush=True)
    except subprocess.CalledProcessError as error:
        raise SystemExit(f"准备失败（退出码 {error.returncode}），请保留上方错误信息后重试。")
