import unittest
from datetime import datetime, timezone

from app.ingestion.transformers import normalize_devpost_hackathons


class TransformerTests(unittest.TestCase):
    def test_normalizes_devpost_records(self) -> None:
        now = datetime(2026, 2, 28, 12, 0, tzinfo=timezone.utc)
        records = [
            {
                "id": 101,
                "title": "AI Sprint",
                "url": "https://example.com/ai-sprint",
                "displayed_location": {"icon": "globe", "location": "Online"},
                "submission_period_dates": "Feb 27 - Mar 01, 2026",
                "themes": [{"name": "Machine Learning/AI"}, {"name": "Open Source"}],
                "organization_name": "Acme",
                "prize_amount": "$10,000",
            },
            {
                "id": 102,
                "title": "Campus Build",
                "url": "https://example.com/campus",
                "displayed_location": {
                    "icon": "map-marker-alt",
                    "location": "Delhi NCR",
                },
                "submission_period_dates": "Feb 28 - Mar 04, 2026",
                "themes": [{"name": "Web3"}],
                "organization_name": "Acme",
                "prize_amount": "",
            },
        ]

        normalized = normalize_devpost_hackathons(records, now=now)

        self.assertEqual(len(normalized), 2)
        online = normalized[0]
        offline = normalized[1]

        self.assertEqual(online["id"], "devpost-101")
        self.assertEqual(online["format"], "Online")
        self.assertEqual(online["location_text"], "Global")
        self.assertEqual(online["days_to_final"], 2)
        self.assertIn("Cash", online["prizes"])
        self.assertEqual(online["organizer_past_events"], 1)

        self.assertEqual(offline["format"], "Offline")
        self.assertEqual(offline["location_text"], "Delhi NCR")
        self.assertIn("Unspecified", offline["prizes"])
        self.assertEqual(offline["organizer_past_events"], 1)

    def test_drops_records_with_unparseable_timeline(self) -> None:
        records = [
            {
                "id": 1,
                "title": "Unknown Dates",
                "url": "https://example.com",
                "displayed_location": {"icon": "globe", "location": "Online"},
                "submission_period_dates": "TBA",
                "themes": [],
                "organization_name": "Org",
                "prize_amount": "",
            }
        ]

        normalized = normalize_devpost_hackathons(records)
        self.assertEqual(normalized, [])

    def test_keeps_single_day_devpost_timeline(self) -> None:
        records = [
            {
                "id": 2,
                "title": "Deadline Today",
                "url": "https://example.com/deadline-today",
                "displayed_location": {"icon": "globe", "location": "Online"},
                "submission_period_dates": "Feb 28, 2026",
                "themes": [],
                "organization_name": "Org",
                "prize_amount": "",
            }
        ]

        normalized = normalize_devpost_hackathons(
            records,
            now=datetime(2026, 2, 28, 12, 0, tzinfo=timezone.utc),
        )

        self.assertEqual(len(normalized), 1)
        self.assertEqual(normalized[0]["id"], "devpost-2")
        self.assertEqual(normalized[0]["days_to_final"], 0)


if __name__ == "__main__":
    unittest.main()
