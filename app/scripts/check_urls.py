import urllib.request

URLS = [
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8787/api/health",
]

for url in URLS:
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            body = response.read(200).decode("utf-8", errors="ignore")
            print(url, response.status)
            print(body)
    except Exception as error:  # noqa: BLE001
        print(url, "ERR", error)
