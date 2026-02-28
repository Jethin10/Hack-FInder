from __future__ import annotations

import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import urljoin

from app.ingestion.timeline_parser import parse_submission_period_dates


PRIZE_ORDER = ["Cash", "Swag", "Job/Internship", "Unspecified"]

THEME_ALIASES = {
    "machine learning/ai": "AI/ML",
    "machine learning": "AI/ML",
    "artificial intelligence": "AI/ML",
    "open source": "Open Source",
    "blockchain": "Blockchain",
    "no restrictions": "General",
}


def _normalize_theme(theme: str) -> str:
    normalized = re.sub(r"\s+", " ", theme.strip())
    if not normalized:
        return ""
    lowered = normalized.lower()
    return THEME_ALIASES.get(lowered, normalized)


def _dedupe_preserving_order(values: Iterable[str]) -> List[str]:
    deduped: List[str] = []
    seen = set()
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        deduped.append(value)
    return deduped


def _parse_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None

    normalized = text.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        for format_hint in (
            "%Y-%m-%d %H:%M:%S%z",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
        ):
            try:
                parsed = datetime.strptime(normalized, format_hint)
                break
            except ValueError:
                continue
        else:
            return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _to_utc_iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def _days_between(start_date: datetime, end_date: datetime) -> int:
    return max((end_date.date() - start_date.date()).days, 0)


def _extract_cash_prize(prize_amount: Any) -> bool:
    if prize_amount is None:
        return False
    value = str(prize_amount).strip()
    if not value:
        return False
    digits = re.sub(r"[^\d.]", "", value)
    if not digits:
        return False
    try:
        return float(digits) > 0
    except ValueError:
        return False


def _finalize_prize_categories(categories: List[str]) -> List[str]:
    if len(categories) == 0:
        categories = ["Unspecified"]
    deduped = _dedupe_preserving_order(categories)
    deduped.sort(key=lambda category: PRIZE_ORDER.index(category))
    return deduped


def _extract_themes(record: Dict[str, Any]) -> List[str]:
    themes: List[str] = []
    for theme in record.get("themes") or []:
        if isinstance(theme, dict):
            normalized = _normalize_theme(str(theme.get("name") or ""))
        else:
            normalized = _normalize_theme(str(theme))
        if normalized:
            themes.append(normalized)
    return _dedupe_preserving_order(themes)


def _extract_devfolio_themes(record: Dict[str, Any]) -> List[str]:
    themes: List[str] = []
    for theme in record.get("themes") or []:
        if not isinstance(theme, dict):
            normalized = _normalize_theme(str(theme))
            if normalized:
                themes.append(normalized)
            continue
        inner_theme = theme.get("theme")
        if isinstance(inner_theme, dict):
            normalized = _normalize_theme(str(inner_theme.get("name") or ""))
        else:
            normalized = _normalize_theme(str(theme.get("name") or ""))
        if normalized:
            themes.append(normalized)
    return _dedupe_preserving_order(themes)


def _strip_html(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()


def _derive_devpost_format(location: Dict[str, Any]) -> str:
    icon = str(location.get("icon") or "").strip().lower()
    location_text = str(location.get("location") or "").strip().lower()
    if icon == "globe" or "online" in location_text or "virtual" in location_text:
        return "Online"
    if "online" in location_text and "in-person" in location_text:
        return "Hybrid"
    return "Offline"


def _derive_devpost_location_text(format_value: str, location: Dict[str, Any]) -> str:
    raw_location = str(location.get("location") or "").strip()
    if format_value == "Online":
        return "Global"
    return raw_location or "Unspecified"


def _derive_devpost_prize_categories(record: Dict[str, Any]) -> List[str]:
    title = str(record.get("title") or "").lower()
    summary = str(record.get("analytics_identifier") or "").lower()
    searchable = f"{title} {summary}"
    categories: List[str] = []

    if _extract_cash_prize(record.get("prize_amount")):
        categories.append("Cash")
    if "swag" in searchable or "merch" in searchable:
        categories.append("Swag")
    if "internship" in searchable or re.search(r"\bjob\b", searchable):
        categories.append("Job/Internship")

    return _finalize_prize_categories(categories)


def normalize_devpost_hackathons(
    records: List[Dict[str, Any]], now: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    normalized_records: List[Dict[str, Any]] = []
    current_time = now or datetime.now(timezone.utc)
    organizer_counts = Counter(
        str(record.get("organization_name") or "").strip().lower()
        for record in records
        if str(record.get("organization_name") or "").strip()
    )

    for record in records:
        timeline = parse_submission_period_dates(
            str(record.get("submission_period_dates") or ""),
            fallback_now=current_time,
        )
        if timeline is None:
            continue

        location = record.get("displayed_location") or {}
        format_value = _derive_devpost_format(location)
        location_text = _derive_devpost_location_text(format_value, location)
        organizer_name = str(record.get("organization_name") or "").strip().lower()
        organizer_past_events = max(organizer_counts.get(organizer_name, 1) - 1, 0)

        normalized_records.append(
            {
                "id": f"devpost-{record.get('id')}",
                "title": str(record.get("title") or "Untitled Hackathon"),
                "url": str(record.get("url") or "https://devpost.com/hackathons"),
                "source_platform": "Devpost",
                "format": format_value,
                "location_text": location_text,
                "latitude": None,
                "longitude": None,
                "start_date": timeline.start_date.isoformat(),
                "final_submission_date": timeline.final_submission_date.isoformat(),
                "days_to_final": timeline.days_to_final,
                "themes": _extract_themes(record),
                "organizer_past_events": organizer_past_events,
                "prizes": _derive_devpost_prize_categories(record),
                "created_at": current_time.isoformat(),
            }
        )

    return normalized_records


def normalize_devfolio_hackathons(
    records: List[Dict[str, Any]], now: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    current_time = now or datetime.now(timezone.utc)
    normalized_records: List[Dict[str, Any]] = []

    for record in records:
        settings = record.get("settings") if isinstance(record.get("settings"), dict) else {}
        start_date = _parse_datetime(settings.get("reg_starts_at")) or _parse_datetime(
            record.get("starts_at")
        )
        final_date = _parse_datetime(record.get("ends_at")) or _parse_datetime(
            settings.get("reg_ends_at")
        )
        if start_date is None or final_date is None:
            continue

        # Skip events where registration has closed
        reg_end = _parse_datetime(settings.get("reg_ends_at"))
        if reg_end is not None and reg_end < current_time:
            continue

        is_online = bool(record.get("is_online"))
        format_value = "Online" if is_online else "Offline"

        # Extract location from city/state/country fields
        if is_online:
            location_text = "Global"
        else:
            city = str(record.get("city") or "").strip()
            state = str(record.get("state") or "").strip()
            country_raw = record.get("country")
            country_name = ""
            if isinstance(country_raw, dict):
                country_name = str(country_raw.get("name") or "").strip()
            elif isinstance(country_raw, str):
                country_name = country_raw.strip()

            location_parts = [p for p in (city, state, country_name) if p]
            location_text = ", ".join(location_parts) if location_parts else "Location TBD"
        event_uuid = str(record.get("uuid") or "").strip()
        if not event_uuid:
            continue
        slug = str(record.get("slug") or "").strip()
        url = (
            f"https://devfolio.co/hackathons/{slug}"
            if slug
            else "https://devfolio.co/hackathons"
        )

        normalized_records.append(
            {
                "id": f"devfolio-{event_uuid}",
                "title": str(record.get("name") or "Untitled Hackathon"),
                "url": url,
                "source_platform": "Devfolio",
                "format": format_value,
                "location_text": location_text,
                "latitude": None,
                "longitude": None,
                "start_date": _to_utc_iso(start_date),
                "final_submission_date": _to_utc_iso(final_date),
                "days_to_final": _days_between(start_date, final_date),
                "themes": _extract_devfolio_themes(record),
                "organizer_past_events": 0,
                "prizes": ["Unspecified"],
                "created_at": current_time.isoformat(),
            }
        )

    return normalized_records


def _derive_unstop_format(record: Dict[str, Any]) -> str:
    region = str(record.get("region") or "").strip().lower()
    details = _strip_html(str(record.get("details") or "")).lower()

    if "hybrid" in region:
        return "Hybrid"
    if "online" in region and ("offline" in details or "in-person" in details):
        return "Hybrid"
    if "online" in region:
        return "Online"
    if "offline" in region or "in-person" in details or "campus" in details:
        return "Offline"
    return "Offline"


def _derive_unstop_location_text(record: Dict[str, Any], format_value: str) -> str:
    if format_value == "Online":
        return "Global"

    address = (
        record.get("address_with_country_logo")
        if isinstance(record.get("address_with_country_logo"), dict)
        else {}
    )
    city = str(address.get("city") or "").strip()
    state = str(address.get("state") or "").strip()
    country_raw = address.get("country")
    if isinstance(country_raw, dict):
        country_name = str(country_raw.get("name") or "").strip()
    elif isinstance(country_raw, str):
        country_name = country_raw.strip()
    else:
        country_name = ""

    location_parts = [p for p in (city, state, country_name) if p]
    compact = [part for part in location_parts if part]
    return ", ".join(compact) if compact else "Location TBD"


def _derive_unstop_prizes(record: Dict[str, Any]) -> List[str]:
    categories: List[str] = []
    for prize in record.get("prizes") or []:
        if not isinstance(prize, dict):
            continue
        if float(prize.get("cash") or 0) > 0:
            categories.append("Cash")
        if int(prize.get("pre_placement_internship") or 0) > 0 or int(
            prize.get("pre_placement_opportunity") or 0
        ) > 0:
            categories.append("Job/Internship")
        others = str(prize.get("others") or "").lower()
        if "swag" in others or "merch" in others:
            categories.append("Swag")
    return _finalize_prize_categories(categories)


def _derive_unstop_themes(record: Dict[str, Any]) -> List[str]:
    themes: List[str] = []
    for skill in record.get("required_skills") or []:
        if not isinstance(skill, dict):
            continue
        normalized = _normalize_theme(str(skill.get("skill_name") or skill.get("skill") or ""))
        if normalized:
            themes.append(normalized)
    return _dedupe_preserving_order(themes)


def normalize_unstop_hackathons(
    records: List[Dict[str, Any]], now: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    current_time = now or datetime.now(timezone.utc)
    organizer_counts = Counter(
        str((record.get("organisation") or {}).get("name") or "").strip().lower()
        for record in records
        if isinstance(record.get("organisation"), dict)
        and str((record.get("organisation") or {}).get("name") or "").strip()
    )
    normalized_records: List[Dict[str, Any]] = []

    for record in records:
        regn = record.get("regnRequirements") if isinstance(record.get("regnRequirements"), dict) else {}
        start_date = _parse_datetime(regn.get("start_regn_dt")) or _parse_datetime(
            record.get("approved_date")
        ) or _parse_datetime(record.get("updated_at"))
        final_date = _parse_datetime(record.get("end_date")) or _parse_datetime(
            regn.get("end_regn_dt")
        )
        if start_date is None or final_date is None:
            continue

        # Skip events where registration has closed
        reg_end_date = _parse_datetime(regn.get("end_regn_dt"))
        if reg_end_date is not None and reg_end_date < current_time:
            continue

        identifier = str(record.get("id") or "").strip()
        if not identifier:
            continue

        seo_url = str(record.get("seo_url") or "").strip()
        public_url = str(record.get("public_url") or "").strip()
        if seo_url.startswith("http://") or seo_url.startswith("https://"):
            event_url = seo_url
        elif public_url:
            event_url = urljoin("https://unstop.com/", public_url.lstrip("/"))
        else:
            event_url = "https://unstop.com/hackathons"

        format_value = _derive_unstop_format(record)
        location_text = _derive_unstop_location_text(record, format_value)
        organizer_name = (
            str((record.get("organisation") or {}).get("name") or "").strip().lower()
            if isinstance(record.get("organisation"), dict)
            else ""
        )
        organizer_past_events = max(organizer_counts.get(organizer_name, 1) - 1, 0)

        normalized_records.append(
            {
                "id": f"unstop-{identifier}",
                "title": str(record.get("title") or "Untitled Hackathon"),
                "url": event_url,
                "source_platform": "Unstop",
                "format": format_value,
                "location_text": location_text,
                "latitude": None,
                "longitude": None,
                "start_date": _to_utc_iso(start_date),
                "final_submission_date": _to_utc_iso(final_date),
                "days_to_final": _days_between(start_date, final_date),
                "themes": _derive_unstop_themes(record),
                "organizer_past_events": organizer_past_events,
                "prizes": _derive_unstop_prizes(record),
                "created_at": (
                    _parse_datetime(record.get("updated_at")) or current_time
                ).isoformat(),
            }
        )

    return normalized_records


def _derive_mlh_format(record: Dict[str, Any]) -> str:
    format_type = str(record.get("format_type") or "").strip().lower()
    if format_type in {"online", "virtual", "remote"}:
        return "Online"
    if format_type in {"hybrid"}:
        return "Hybrid"
    return "Offline"


def _derive_mlh_location_text(record: Dict[str, Any], format_value: str) -> str:
    if format_value == "Online":
        return "Global"
    location = str(record.get("location") or "").strip()
    if location:
        return location
    venue = record.get("venue_address") if isinstance(record.get("venue_address"), dict) else {}
    parts = [
        str(venue.get("city") or "").strip(),
        str(venue.get("state") or "").strip(),
        str(venue.get("country") or "").strip(),
    ]
    compact = [part for part in parts if part]
    return ", ".join(compact) if compact else "Location TBD"


def normalize_mlh_hackathons(
    records: List[Dict[str, Any]], now: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    current_time = now or datetime.now(timezone.utc)
    normalized_records: List[Dict[str, Any]] = []
    for record in records:
        start_date = _parse_datetime(record.get("starts_at"))
        final_date = _parse_datetime(record.get("ends_at"))
        if start_date is None or final_date is None:
            continue

        identifier = str(record.get("id") or "").strip()
        if not identifier:
            continue

        website_url = str(record.get("website_url") or "").strip()
        path_url = str(record.get("url") or "").strip()
        event_url = (
            website_url
            if website_url.startswith("http://") or website_url.startswith("https://")
            else urljoin("https://mlh.io/", path_url.lstrip("/"))
        )

        format_value = _derive_mlh_format(record)
        normalized_records.append(
            {
                "id": f"mlh-{identifier}",
                "title": str(record.get("name") or "Untitled Hackathon"),
                "url": event_url,
                "source_platform": "MLH",
                "format": format_value,
                "location_text": _derive_mlh_location_text(record, format_value),
                "latitude": None,
                "longitude": None,
                "start_date": _to_utc_iso(start_date),
                "final_submission_date": _to_utc_iso(final_date),
                "days_to_final": _days_between(start_date, final_date),
                "themes": [],
                "organizer_past_events": 0,
                "prizes": ["Unspecified"],
                "created_at": current_time.isoformat(),
            }
        )
    return normalized_records


def normalize_hackerearth_hackathons(
    records: List[Dict[str, Any]], now: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    current_time = now or datetime.now(timezone.utc)
    organizer_counts = Counter(
        str(record.get("organizer") or "").strip().lower()
        for record in records
        if str(record.get("organizer") or "").strip()
    )
    normalized_records: List[Dict[str, Any]] = []
    for record in records:
        identifier = str(record.get("id") or "").strip()
        if not identifier:
            continue
        try:
            start_unix = int(record.get("start_unix"))
            final_unix = int(record.get("final_submission_unix"))
        except Exception:
            continue
        start_date = datetime.fromtimestamp(start_unix, tz=timezone.utc)
        final_date = datetime.fromtimestamp(final_unix, tz=timezone.utc)
        if final_date < start_date:
            continue

        organizer_name = str(record.get("organizer") or "").strip().lower()
        organizer_past_events = max(organizer_counts.get(organizer_name, 1) - 1, 0)

        normalized_records.append(
            {
                "id": f"hackerearth-{identifier}",
                "title": str(record.get("title") or "Untitled Hackathon"),
                "url": str(record.get("url") or "https://www.hackerearth.com/challenges/hackathon/"),
                "source_platform": "HackerEarth",
                "format": "Online",
                "location_text": "Global",
                "latitude": None,
                "longitude": None,
                "start_date": _to_utc_iso(start_date),
                "final_submission_date": _to_utc_iso(final_date),
                "days_to_final": _days_between(start_date, final_date),
                "themes": [],
                "organizer_past_events": organizer_past_events,
                "prizes": ["Unspecified"],
                "created_at": current_time.isoformat(),
            }
        )
    return normalized_records
