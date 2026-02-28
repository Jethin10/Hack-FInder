from __future__ import annotations

import html
import json
import logging
import re
import time
import urllib.request
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

MLH_SEASON_EVENTS_URL_TEMPLATE = "https://mlh.io/seasons/{season_year}/events"
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_USER_AGENT = "HackHuntBot/1.0 (+https://github.com)"
MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 2
DATA_PAGE_PATTERN = re.compile(r'data-page="([^"]+)"', flags=re.DOTALL)


def extract_mlh_upcoming_events_from_html(html_body: str) -> List[Dict[str, Any]]:
    match = DATA_PAGE_PATTERN.search(html_body)
    if not match:
        logger.warning("MLH: data-page attribute not found in HTML")
        return []

    try:
        decoded = html.unescape(match.group(1))
        payload = json.loads(decoded)
    except Exception as exc:
        logger.error("MLH: failed to parse data-page JSON: %s", exc)
        return []

    upcoming = payload.get("props", {}).get("upcoming_events", [])
    if not isinstance(upcoming, list):
        logger.warning("MLH: upcoming_events is not a list")
        return []

    results = [item for item in upcoming if isinstance(item, dict)]
    logger.info("MLH: extracted %d upcoming events", len(results))
    return results


def fetch_mlh_hackathons(
    season_year: Optional[int] = None,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> List[Dict[str, Any]]:
    resolved_year = season_year or datetime.now(timezone.utc).year
    url = MLH_SEASON_EVENTS_URL_TEMPLATE.format(season_year=resolved_year)
    request = urllib.request.Request(
        url,
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
                html_body = response.read().decode("utf-8", errors="ignore")
            return extract_mlh_upcoming_events_from_html(html_body)
        except Exception as exc:
            last_error = exc
            logger.warning(
                "MLH attempt %d/%d failed: %s", attempt, MAX_RETRIES, exc
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)

    logger.error("MLH: all %d attempts failed: %s", MAX_RETRIES, last_error)
    return []
