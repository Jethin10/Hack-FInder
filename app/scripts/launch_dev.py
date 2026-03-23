from __future__ import annotations

import os
import subprocess
from pathlib import Path


DETACHED_FLAGS = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP


def _launch_process(command: list[str], cwd: Path, log_path: Path, env: dict[str, str]) -> int:
    log_handle = log_path.open("a", encoding="utf-8")
    process = subprocess.Popen(
        command,
        cwd=str(cwd),
        env=env,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        creationflags=DETACHED_FLAGS,
        close_fds=True,
    )
    return process.pid


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    app_dir = repo_root / "app"
    node_dir = repo_root / ".tools" / "node" / "node-v24.14.0-win-x64"
    node_exe = node_dir / "node.exe"

    env = os.environ.copy()
    env["PATH"] = str(node_dir) + os.pathsep + env.get("PATH", "")

    api_pid = _launch_process(
        [str(node_exe), "node_modules/tsx/dist/cli.mjs", "server/index.ts"],
        cwd=app_dir,
        log_path=app_dir / "run-api.log",
        env=env,
    )
    web_pid = _launch_process(
        [str(node_exe), "node_modules/vite/bin/vite.js", "--port=3000", "--host=0.0.0.0"],
        cwd=app_dir,
        log_path=app_dir / "run-web.log",
        env=env,
    )
    print(f"launched api_pid={api_pid} web_pid={web_pid}")


if __name__ == "__main__":
    main()
