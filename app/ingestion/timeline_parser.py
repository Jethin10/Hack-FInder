from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


MONTH_BY_ABBREV = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}

FULL_DATE_RANGE_PATTERN = re.compile(
    r"^(?P<start_month>[A-Za-z]{3})\s+(?P<start_day>\d{1,2}),\s*(?P<start_year>\d{4})\s*-\s*"
    r"(?P<end_month>[A-Za-z]{3})\s+(?P<end_day>\d{1,2}),\s*(?P<end_year>\d{4})$"
)

MONTH_TO_MONTH_RANGE_PATTERN = re.compile(
    r"^(?P<start_month>[A-Za-z]{3})\s+(?P<start_day>\d{1,2})\s*-\s*"
    r"(?P<end_month>[A-Za-z]{3})\s+(?P<end_day>\d{1,2}),\s*(?P<end_year>\d{4})$"
)

SAME_MONTH_RANGE_PATTERN = re.compile(
    r"^(?P<start_month>[A-Za-z]{3})\s+(?P<start_day>\d{1,2})\s*-\s*(?P<end_day>\d{1,2}),\s*(?P<end_year>\d{4})$"
)

SINGLE_DAY_PATTERN = re.compile(
    r"^(?P<month>[A-Za-z]{3})\s+(?P<day>\d{1,2}),\s*(?P<year>\d{4})$"
)


@dataclass(frozen=True)
class TimelineParseResult:
    start_date: datetime
    final_submission_date: datetime
    days_to_final: int


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def _month_to_number(value: str) -> Optional[int]:
    return MONTH_BY_ABBREV.get(value.strip().lower()[:3])


def _to_utc_datetime(year: int, month: int, day: int, *, is_end: bool) -> Optional[datetime]:
    try:
        if is_end:
            return datetime(year, month, day, 23, 59, 59, tzinfo=timezone.utc)
        return datetime(year, month, day, 0, 0, 0, tzinfo=timezone.utc)
    except ValueError:
        return None


def _build_result(
    start_year: int,
    start_month: int,
    start_day: int,
    end_year: int,
    end_month: int,
    end_day: int,
) -> Optional[TimelineParseResult]:
    start_date = _to_utc_datetime(start_year, start_month, start_day, is_end=False)
    final_submission_date = _to_utc_datetime(end_year, end_month, end_day, is_end=True)
    if start_date is None or final_submission_date is None:
        return None
    if final_submission_date < start_date:
        return None

    days_to_final = (final_submission_date.date() - start_date.date()).days
    return TimelineParseResult(
        start_date=start_date,
        final_submission_date=final_submission_date,
        days_to_final=days_to_final,
    )


def parse_submission_period_dates(
    period_text: str, fallback_now: Optional[datetime] = None
) -> Optional[TimelineParseResult]:
    normalized = _normalize_text(period_text)
    if not normalized:
        return None

    match = FULL_DATE_RANGE_PATTERN.match(normalized)
    if match:
        start_month = _month_to_number(match.group("start_month"))
        end_month = _month_to_number(match.group("end_month"))
        if start_month is None or end_month is None:
            return None
        return _build_result(
            int(match.group("start_year")),
            start_month,
            int(match.group("start_day")),
            int(match.group("end_year")),
            end_month,
            int(match.group("end_day")),
        )

    match = MONTH_TO_MONTH_RANGE_PATTERN.match(normalized)
    if match:
        start_month = _month_to_number(match.group("start_month"))
        end_month = _month_to_number(match.group("end_month"))
        if start_month is None or end_month is None:
            return None
        end_year = int(match.group("end_year"))
        start_year = end_year if start_month <= end_month else end_year - 1
        return _build_result(
            start_year,
            start_month,
            int(match.group("start_day")),
            end_year,
            end_month,
            int(match.group("end_day")),
        )

    match = SAME_MONTH_RANGE_PATTERN.match(normalized)
    if match:
        month = _month_to_number(match.group("start_month"))
        if month is None:
            return None
        end_year = int(match.group("end_year"))
        start_year = fallback_now.year if fallback_now is not None else end_year
        if fallback_now is None:
            start_year = end_year
        elif start_year > end_year:
            start_year = end_year

        return _build_result(
            start_year,
            month,
            int(match.group("start_day")),
            end_year,
            month,
            int(match.group("end_day")),
        )

    match = SINGLE_DAY_PATTERN.match(normalized)
    if match:
        month = _month_to_number(match.group("month"))
        if month is None:
            return None
        year = int(match.group("year"))
        day = int(match.group("day"))
        return _build_result(year, month, day, year, month, day)

    return None
