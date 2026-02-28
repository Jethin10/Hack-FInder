from __future__ import annotations

import json
import logging
import math
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Sequence

logger = logging.getLogger(__name__)

DEVPOST_API_URL = "https://devpost.com/api/hackathons"
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_USER_AGENT = "HackHuntBot/1.0 (+https://github.com)"
MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 2


def _build_url(challenge_type: str, page: int) -> str:
    params = urllib.parse.urlencode(
        [("challenge_type[]", challenge_type), ("status[]", "open"), ("page", str(page))]
    )
    return f"{DEVPOST_API_URL}?{params}"


def _fetch_json(url: str, timeout_seconds: int) -> Dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": DEFAULT_USER_AGENT, "Accept": "application/json"},
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
                "Devpost fetch attempt %d/%d for %s failed: %s",
                attempt, MAX_RETRIES, url[:80], exc,
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)

    raise last_error  # type: ignore[misc]


def fetch_devpost_hackathons(
    max_pages: int = 5,
    challenge_types: Sequence[str] = ("online", "in-person", "hybrid"),
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> List[Dict[str, Any]]:
    page_cap = max_pages if max_pages > 0 else None
    records_by_id: Dict[str, Dict[str, Any]] = {}
    for challenge_type in challenge_types:
        page = 1
        inferred_page_cap = page_cap
        while True:
            if inferred_page_cap is not None and page > inferred_page_cap:
                break
            url = _build_url(challenge_type=challenge_type, page=page)
            try:
                payload = _fetch_json(url, timeout_seconds=timeout_seconds)
            except Exception as exc:
                logger.error(
                    "Devpost: giving up on %s page %d: %s", challenge_type, page, exc
                )
                break

            hackathons = payload.get("hackathons")
            if not isinstance(hackathons, list) or len(hackathons) == 0:
                logger.info(
                    "Devpost: no more results for %s at page %d", challenge_type, page
                )
                break

            if page == 1 and inferred_page_cap is None:
                meta = payload.get("meta") if isinstance(payload.get("meta"), dict) else {}
                total_count = int(meta.get("total_count") or 0)
                per_page = int(meta.get("per_page") or len(hackathons) or 1)
                if total_count > 0:
                    inferred_page_cap = max(
                        1, math.ceil(total_count / max(per_page, 1))
                    )

            for item in hackathons:
                if not isinstance(item, dict):
                    continue
                key = str(item.get("id"))
                records_by_id[key] = item
            page += 1

    logger.info("Devpost: fetched %d unique hackathons", len(records_by_id))
    return list(records_by_id.values())
