import unittest
from datetime import datetime, timezone

from app.ingestion.timeline_parser import parse_submission_period_dates


class TimelineParserTests(unittest.TestCase):
    def test_parses_cross_month_range(self) -> None:
        parsed = parse_submission_period_dates("Feb 02 - Mar 16, 2026")

        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(parsed.start_date.isoformat(), "2026-02-02T00:00:00+00:00")
        self.assertEqual(
            parsed.final_submission_date.isoformat(), "2026-03-16T23:59:59+00:00"
        )
        self.assertEqual(parsed.days_to_final, 42)

    def test_parses_same_month_day_range(self) -> None:
        parsed = parse_submission_period_dates("Feb 01 - 28, 2026")

        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(parsed.start_date.isoformat(), "2026-02-01T00:00:00+00:00")
        self.assertEqual(
            parsed.final_submission_date.isoformat(), "2026-02-28T23:59:59+00:00"
        )
        self.assertEqual(parsed.days_to_final, 27)

    def test_parses_explicit_year_range(self) -> None:
        parsed = parse_submission_period_dates("Dec 05, 2025 - Mar 30, 2026")

        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(parsed.start_date.isoformat(), "2025-12-05T00:00:00+00:00")
        self.assertEqual(
            parsed.final_submission_date.isoformat(), "2026-03-30T23:59:59+00:00"
        )
        self.assertEqual(parsed.days_to_final, 115)

    def test_returns_none_for_invalid_period(self) -> None:
        parsed = parse_submission_period_dates("Rolling admissions")
        self.assertIsNone(parsed)

    def test_uses_fallback_date_for_missing_year(self) -> None:
        parsed = parse_submission_period_dates(
            "Feb 14 - 28, 2026",
            fallback_now=datetime(2026, 1, 1, tzinfo=timezone.utc),
        )

        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(parsed.start_date.year, 2026)

    def test_parses_single_day_deadline(self) -> None:
        parsed = parse_submission_period_dates("Feb 28, 2026")

        self.assertIsNotNone(parsed)
        assert parsed is not None
        self.assertEqual(parsed.start_date.isoformat(), "2026-02-28T00:00:00+00:00")
        self.assertEqual(
            parsed.final_submission_date.isoformat(), "2026-02-28T23:59:59+00:00"
        )
        self.assertEqual(parsed.days_to_final, 0)


if __name__ == "__main__":
    unittest.main()
