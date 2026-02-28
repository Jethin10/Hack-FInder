from __future__ import annotations

import json
import logging
import re
import time
import urllib.request
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

DEVFOLIO_HACKATHONS_URL = "https://devfolio.co/hackathons"
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_USER_AGENT = "HackHuntBot/1.0 (+https://github.com)"
MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 2
NEXT_DATA_PATTERN = re.compile(
    r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
    flags=re.DOTALL,
)


def _iter_hackathon_candidates(value: Any) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    if isinstance(value, list):
        for item in value:
            results.extend(_iter_hackathon_candidates(item))
        return results

    if not isinstance(value, dict):
        return results

    uuid = str(value.get("uuid") or "").strip()
    if uuid:
        results.append(value)
        return results

    preferred_keys = (
        "open_hackathons",
        "featured_hackathons",
        "hackathons",
        "all_hackathons",
    )
    for key in preferred_keys:
        nested = value.get(key)
        if isinstance(nested, list):
            results.extend(_iter_hackathon_candidates(nested))

    for nested in value.values():
        if isinstance(nested, (dict, list)):
            results.extend(_iter_hackathon_candidates(nested))

    return results


def extract_devfolio_hackathons_from_html(html: str) -> List[Dict[str, Any]]:
    match = NEXT_DATA_PATTERN.search(html)
    if not match:
        logger.warning("Devfolio: __NEXT_DATA__ script tag not found in HTML")
        return []

    try:
        payload = json.loads(match.group(1))
    except Exception as exc:
        logger.error("Devfolio: failed to parse __NEXT_DATA__ JSON: %s", exc)
        return []

    queries = (
        payload.get("props", {})
        .get("pageProps", {})
        .get("dehydratedState", {})
        .get("queries", [])
    )
    if not queries:
        logger.warning("Devfolio: no queries found in __NEXT_DATA__ payload")
        return []

    records: List[Dict[str, Any]] = []
    seen_uuids = set()
    for query in queries:
        if not isinstance(query, dict):
            continue
        data = query.get("state", {}).get("data", {})
        for event in _iter_hackathon_candidates(data):
            uuid = str(event.get("uuid") or "").strip()
            if not uuid or uuid in seen_uuids:
                continue
            seen_uuids.add(uuid)
            records.append(event)

    logger.info("Devfolio: extracted %d hackathons from HTML", len(records))
    return records


def fetch_devfolio_hackathons(
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> List[Dict[str, Any]]:
    request = urllib.request.Request(
        DEVFOLIO_HACKATHONS_URL,
        headers={
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "text/html",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )

    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                html = response.read().decode("utf-8", errors="ignore")
            return extract_devfolio_hackathons_from_html(html)
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Devfolio attempt %d/%d failed: %s", attempt, MAX_RETRIES, exc
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)

    logger.error("Devfolio: all %d attempts failed: %s", MAX_RETRIES, last_error)
    return []
