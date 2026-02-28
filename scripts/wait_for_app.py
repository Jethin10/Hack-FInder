from __future__ import annotations

import sys
import time
import urllib.request


URLS = [
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8787/api/health",
]


def main() -> None:
    ok = [False, False]
    for _ in range(60):
        for index, url in enumerate(URLS):
            if ok[index]:
                continue
            try:
                with urllib.request.urlopen(url, timeout=3) as response:
                    ok[index] = response.status == 200
            except Exception:  # noqa: BLE001
                pass
        if all(ok):
            break
        time.sleep(1)

    print(f"web={ok[0]} api={ok[1]}")
    sys.exit(0 if all(ok) else 1)


if __name__ == "__main__":
    main()
