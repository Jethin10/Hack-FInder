from __future__ import annotations

import json
import logging
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

UNSTOP_SEARCH_URL = "https://api.unstop.com/api/public/opportunity/search-result"
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_USER_AGENT = "HackHuntBot/1.0 (+https://github.com)"
MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 2


def _fetch_page(
    page: int,
    per_page: int,
    timeout_seconds: int,
) -> Dict[str, Any]:
    query = urllib.parse.urlencode(
        {"opportunity": "hackathons", "page": str(page), "per_page": str(per_page)}
    )
    url = f"{UNSTOP_SEARCH_URL}?{query}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )

    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                body = response.read().decode("utf-8", errors="ignore")
            return json.loads(body)
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Unstop page %d attempt %d/%d failed: %s",
                page, attempt, MAX_RETRIES, exc,
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)

    raise last_error  # type: ignore[misc]


def fetch_unstop_hackathons(
    max_pages: int = 15,
    per_page: int = 50,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> List[Dict[str, Any]]:
    page_cap = max_pages if max_pages > 0 else None
    items_by_id: Dict[str, Dict[str, Any]] = {}
    page = 1
    while True:
        if page_cap is not None and page > page_cap:
            break
        try:
            payload = _fetch_page(page=page, per_page=per_page, timeout_seconds=timeout_seconds)
        except Exception as exc:
            logger.error("Unstop: giving up on page %d after retries: %s", page, exc)
            break

        data = payload.get("data", {})
        items = data.get("data", [])
        if not isinstance(items, list) or len(items) == 0:
            logger.info("Unstop: no items on page %d, stopping pagination", page)
            break

        for item in items:
            if not isinstance(item, dict):
                continue
            key = str(item.get("id") or "")
            if not key:
                continue
            items_by_id[key] = item

        last_page = int(data.get("last_page") or page)
        if page >= last_page:
            break
        page += 1

    logger.info("Unstop: fetched %d unique hackathons", len(items_by_id))
    return list(items_by_id.values())
