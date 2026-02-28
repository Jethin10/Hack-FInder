from __future__ import annotations

import logging
import re
import time
import urllib.request
from typing import Any, Dict, List
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

HACKEREARTH_HACKATHONS_URL = "https://www.hackerearth.com/challenges/hackathon/"
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_USER_AGENT = "HackHuntBot/1.0 (+https://github.com)"
MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 2

CARD_PATTERN = re.compile(
    r'<div class="challenge-card-modern">\s*'
    r'<a class="challenge-card-wrapper challenge-card-link"[^>]*href="(?P<url>[^"]+)"[^>]*>'
    r'(?P<body>.*?)'
    r"</a>.*?</div>\s*<script type=\"text/javascript\">(?P<script>.*?)</script>",
    flags=re.DOTALL,
)

TITLE_PATTERN = re.compile(
    r'<span class="challenge-list-title challenge-card-wrapper">\s*(?P<title>.*?)\s*</span>',
    flags=re.DOTALL,
)
COUNTDOWN_ID_PATTERN = re.compile(r'id="countdown-(?P<countdown_id>\d+)"')
ORGANIZER_PATTERN = re.compile(
    r'<div class="company-details[^"]*">.*?</div>\s*(?P<organizer>[^<\n]+)',
    flags=re.DOTALL,
)
SECONDS_PATTERN = re.compile(
    r"var seconds_left = (?P<target>\d+) - (?P<now>\d+);\s*"
    r"var countdown_elem = \$\('#countdown-(?P<countdown_id>\d+)'\);",
    flags=re.DOTALL,
)


def _strip_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _slug_from_url(url: str) -> str:
    path = urlparse(url).path.strip("/")
    if not path:
        return ""
    return path.split("/")[-1]


def extract_hackerearth_hackathons_from_html(html_body: str) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    for match in CARD_PATTERN.finditer(html_body):
        url = _strip_whitespace(match.group("url"))
        body = match.group("body")
        script = match.group("script")

        title_match = TITLE_PATTERN.search(body)
        countdown_id_match = COUNTDOWN_ID_PATTERN.search(body)
        seconds_match = SECONDS_PATTERN.search(script)

        if not title_match or not countdown_id_match or not seconds_match:
            logger.debug("HackerEarth: skipping card missing required fields at url=%s", url[:60])
            continue
        if countdown_id_match.group("countdown_id") != seconds_match.group("countdown_id"):
            continue

        organizer_match = ORGANIZER_PATTERN.search(body)
        organizer = (
            _strip_whitespace(organizer_match.group("organizer"))
            if organizer_match
            else "Unknown Organizer"
        )

        slug = _slug_from_url(url)
        if not slug:
            continue

        records.append(
            {
                "id": slug,
                "title": _strip_whitespace(title_match.group("title")),
                "url": urljoin(HACKEREARTH_HACKATHONS_URL, url),
                "organizer": organizer,
                "start_unix": int(seconds_match.group("now")),
                "final_submission_unix": int(seconds_match.group("target")),
            }
        )

    logger.info("HackerEarth: extracted %d hackathons from HTML", len(records))
    return records


def fetch_hackerearth_hackathons(
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> List[Dict[str, Any]]:
    request = urllib.request.Request(
        HACKEREARTH_HACKATHONS_URL,
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
            return extract_hackerearth_hackathons_from_html(html_body)
        except Exception as exc:
            last_error = exc
            logger.warning(
                "HackerEarth attempt %d/%d failed: %s", attempt, MAX_RETRIES, exc
            )
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)

    logger.error("HackerEarth: all %d attempts failed: %s", MAX_RETRIES, last_error)
    return []
