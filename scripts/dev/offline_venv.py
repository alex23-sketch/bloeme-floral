#!/usr/bin/env python3
"""
Development helper (not part of the resale package).

Assembles a Python virtual environment's site-packages directly from the local
`uv` package archive cache. This exists only because this machine has no network
access; buyers use `pip install -r backend/requirements.txt` or Docker instead.

Usage:
    python3 scripts/dev/offline_venv.py <venv-python> pkg1 pkg2 ...
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

CACHE_ROOTS = [
    Path.home() / ".cache" / "uv" / "archive-v0",
    Path.home() / ".cache" / "uv" / "wheels-v6",
    Path.home() / "Library" / "Caches" / "uv" / "archive-v0",
]


def iter_dists():
    for root in CACHE_ROOTS:
        if not root.is_dir():
            continue
        for entry in root.iterdir():
            if not entry.is_dir():
                continue
            for info in entry.glob("*.dist-info"):
                yield info.name[: -len(".dist-info")], entry


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    venv_python = Path(sys.argv[1]).absolute()
    wanted = sys.argv[2:]
    if not venv_python.exists():
        print(f"missing interpreter: {venv_python}")
        return 2

    # Ask the target interpreter itself where its purelib lives.
    import json, subprocess

    probe = subprocess.run(
        [str(venv_python), "-c", "import json,sys,sysconfig;print(json.dumps({'v':[sys.version_info.major,sys.version_info.minor],'p':sysconfig.get_paths()['purelib']}))"],
        capture_output=True,
        text=True,
        check=True,
    )
    info = json.loads(probe.stdout)
    target = Path(info["p"])
    target.mkdir(parents=True, exist_ok=True)

    available: dict[str, list[Path]] = {}
    for name, path in iter_dists():
        base = name.split("-")[0]
        available.setdefault(base.replace("_", "-").lower(), []).append(path)

    installed: set[str] = set()
    resolved: list[tuple[str, Path]] = []
    queue = list(wanted)
    while queue:
        req = queue.pop(0)
        # strip version specifiers / extras
        base = req.split("=")[0].split("<")[0].split(">")[0].split("!")[0].split("[")[0].strip()
        key = base.replace("_", "-").lower()
        if key in installed:
            continue
        candidates = available.get(key)
        if not candidates:
            print(f"  MISSING {req}")
            continue
        # newest by mtime, matching the requested major version when given
        if "==" in req:
            want = req.split("==")[1].strip()
            exact = [c for c in candidates if any(p.name.startswith(f"{key.replace('-', '_')}-{want}") or p.name.startswith(f"{key}-{want}") for p in c.glob('*.dist-info'))]
            candidates = exact or candidates
        path = max(candidates, key=os.path.getmtime)
        resolved.append((key, path))
        installed.add(key)
        # enqueue runtime requirements
        for meta in path.glob("*.dist-info/METADATA"):
            in_reqs = False
            for line in meta.read_text(encoding="utf-8", errors="ignore").splitlines():
                if line.startswith("Requires-Dist:"):
                    req_line = line.split(":", 1)[1].strip()
                    if "extra ==" in req_line:
                        continue
                    queue.append(req_line)
                    in_reqs = True
            break

    linked = 0
    for key, path in resolved:
        for item in path.iterdir():
            dest = target / item.name
            if dest.exists():
                continue
            if item.is_dir():
                shutil.copytree(item, dest, symlinks=False)
            else:
                shutil.copy2(item, dest)
        linked += 1
    print(f"installed {linked} distributions into {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
