import html
import json
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from app.ingestion.connectors.devpost import fetch_devpost_hackathons
from app.ingestion.connectors.devfolio import extract_devfolio_hackathons_from_html
from app.ingestion.connectors.hackerearth import (
    extract_hackerearth_hackathons_from_html,
)
from app.ingestion.connectors.mlh import extract_mlh_upcoming_events_from_html
from app.ingestion.connectors.unstop import fetch_unstop_hackathons
from app.ingestion.transformers import (
    normalize_devfolio_hackathons,
    normalize_hackerearth_hackathons,
    normalize_mlh_hackathons,
    normalize_unstop_hackathons,
)


class MultiSourceIngestionTests(unittest.TestCase):
    def test_extracts_devfolio_hackathons_from_next_data(self) -> None:
        payload = {
            "props": {
                "pageProps": {
                    "dehydratedState": {
                        "queries": [
                            {
                                "state": {
                                    "data": {
                                        "open_hackathons": [
                                            {"uuid": "a", "name": "Open A"},
                                            {"uuid": "b", "name": "Open B"},
                                        ],
                                        "featured_hackathons": [
                                            {"uuid": "b", "name": "Open B"},
                                            {"uuid": "c", "name": "Featured C"},
                                        ],
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
        html_body = (
            '<script id="__NEXT_DATA__" type="application/json">'
            + json.dumps(payload)
            + "</script>"
        )

        records = extract_devfolio_hackathons_from_html(html_body)

        self.assertEqual([item["uuid"] for item in records], ["a", "b", "c"])

    def test_extracts_devfolio_hackathons_across_all_queries(self) -> None:
        payload = {
            "props": {
                "pageProps": {
                    "dehydratedState": {
                        "queries": [
                            {"state": {"data": {"open_hackathons": []}}},
                            {
                                "state": {
                                    "data": {
                                        "featured_hackathons": [
                                            {"uuid": "x", "name": "X Hack"},
                                        ]
                                    }
                                }
                            },
                        ]
                    }
                }
            }
        }
        html_body = (
            '<script id="__NEXT_DATA__" type="application/json">'
            + json.dumps(payload)
            + "</script>"
        )

        records = extract_devfolio_hackathons_from_html(html_body)

        self.assertEqual([item["uuid"] for item in records], ["x"])

    def test_extracts_mlh_events_from_inertia_data_page(self) -> None:
        payload = {
            "props": {
                "upcoming_events": [
                    {"id": "1", "name": "Hack One"},
                    {"id": "2", "name": "Hack Two"},
                ]
            }
        }
        encoded = html.escape(json.dumps(payload), quote=True)
        html_body = f'<div id="app" data-page="{encoded}"></div>'

        records = extract_mlh_upcoming_events_from_html(html_body)

        self.assertEqual(len(records), 2)
        self.assertEqual(records[0]["id"], "1")

    def test_extracts_hackerearth_cards_and_countdowns(self) -> None:
        html_body = """
        <div class="challenge-card-modern">
          <a class="challenge-card-wrapper challenge-card-link" href="https://www.hackerearth.com/challenges/hackathon/test-event/">
            <span class="challenge-list-title challenge-card-wrapper">Test Event</span>
            <div class="company-details ellipsis"><div class="inline-block company-image"></div> Acme Labs</div>
            <div id="countdown-123" class="countdown hidden"></div>
          </a>
        </div>
        <script type="text/javascript">
          var seconds_left = 1772400000 - 1772300000;
          var countdown_elem = $('#countdown-123');
          var hide_element = $('.challenge-card-modern');
          var show_text = null;
          var visual_countdown = true;
          challengesCountDownTimer(countdown_elem, seconds_left, hide_element, show_text, visual_countdown);
        </script>
        """
        records = extract_hackerearth_hackathons_from_html(html_body)

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["title"], "Test Event")
        self.assertEqual(records[0]["organizer"], "Acme Labs")
        self.assertEqual(records[0]["final_submission_unix"], 1772400000)

    def test_fetches_all_unstop_pages_when_max_pages_is_zero(self) -> None:
        with patch("app.ingestion.connectors.unstop._fetch_page") as mock_fetch_page:
            mock_fetch_page.side_effect = [
                {"data": {"data": [{"id": 1}], "last_page": 3}},
                {"data": {"data": [{"id": 2}], "last_page": 3}},
                {"data": {"data": [{"id": 3}], "last_page": 3}},
            ]

            records = fetch_unstop_hackathons(max_pages=0)

        self.assertEqual([record["id"] for record in records], [1, 2, 3])
        self.assertEqual(mock_fetch_page.call_count, 3)

    def test_fetches_all_devpost_pages_when_max_pages_is_zero(self) -> None:
        with patch("app.ingestion.connectors.devpost._fetch_json") as mock_fetch_json:
            mock_fetch_json.side_effect = [
                {
                    "hackathons": [{"id": 1}],
                    "meta": {"total_count": 18, "per_page": 9},
                },
                {
                    "hackathons": [{"id": 2}],
                    "meta": {"total_count": 18, "per_page": 9},
                },
            ]

            records = fetch_devpost_hackathons(
                max_pages=0,
                challenge_types=("online",),
            )

        self.assertEqual([record["id"] for record in records], [1, 2])
        self.assertEqual(mock_fetch_json.call_count, 2)

    def test_fetches_devpost_hybrid_by_default(self) -> None:
        with patch("app.ingestion.connectors.devpost._fetch_json") as mock_fetch_json:
            mock_fetch_json.side_effect = [
                {"hackathons": [{"id": 1}], "meta": {"total_count": 1, "per_page": 9}},
                {"hackathons": [{"id": 2}], "meta": {"total_count": 1, "per_page": 9}},
                {"hackathons": [{"id": 3}], "meta": {"total_count": 1, "per_page": 9}},
            ]

            records = fetch_devpost_hackathons(max_pages=1)

        self.assertEqual([record["id"] for record in records], [1, 2, 3])
        self.assertEqual(mock_fetch_json.call_count, 3)
        urls = [call.args[0] for call in mock_fetch_json.call_args_list]
        self.assertTrue(any("challenge_type%5B%5D=hybrid" in url for url in urls))

    def test_normalizes_devfolio(self) -> None:
        now = datetime(2026, 3, 1, tzinfo=timezone.utc)
        records = [
            {
                "uuid": "abc",
                "slug": "hello-world",
                "name": "Hello World Hack",
                "starts_at": "2026-03-10T00:00:00+00:00",
                "ends_at": "2026-03-11T00:00:00+00:00",
                "is_online": True,
                "themes": [{"theme": {"name": "AI/ML"}}],
                "settings": {
                    "reg_starts_at": "2026-03-01T00:00:00+00:00",
                    "reg_ends_at": "2026-03-09T00:00:00+00:00",
                },
            }
        ]

        normalized = normalize_devfolio_hackathons(records, now=now)
        self.assertEqual(len(normalized), 1)
        self.assertEqual(normalized[0]["id"], "devfolio-abc")
        self.assertEqual(normalized[0]["format"], "Online")
        self.assertEqual(normalized[0]["location_text"], "Global")
        self.assertEqual(normalized[0]["days_to_final"], 10)

    def test_normalizes_unstop(self) -> None:
        now = datetime(2026, 3, 1, tzinfo=timezone.utc)
        records = [
            {
                "id": 10,
                "title": "CTF Championship",
                "region": "online",
                "details": "Online prelims and offline finals",
                "public_url": "hackathons/ctf-10",
                "seo_url": "https://unstop.com/hackathons/ctf-10",
                "updated_at": "2026-03-01T10:00:00+05:30",
                "end_date": "2026-03-20T11:00:00+05:30",
                "organisation": {"name": "NFSU"},
                "prizes": [{"cash": 5000, "pre_placement_internship": 0}],
                "required_skills": [{"skill_name": "Machine Learning"}],
                "regnRequirements": {"start_regn_dt": "2026-03-01T00:00:00+05:30"},
            }
        ]

        normalized = normalize_unstop_hackathons(records, now=now)
        self.assertEqual(len(normalized), 1)
        self.assertEqual(normalized[0]["id"], "unstop-10")
        self.assertEqual(normalized[0]["format"], "Hybrid")
        self.assertIn("Cash", normalized[0]["prizes"])
        self.assertIn("AI/ML", normalized[0]["themes"])

    def test_normalizes_unstop_paid_hackathons(self) -> None:
        now = datetime(2026, 3, 1, tzinfo=timezone.utc)
        records = [
            {
                "id": 11,
                "title": "Paid Campus Hack",
                "region": "offline",
                "details": "Offline campus finals",
                "public_url": "hackathons/paid-11",
                "updated_at": "2026-03-01T10:00:00+05:30",
                "end_date": "2026-03-20T11:00:00+05:30",
                "isPaid": True,
                "organisation": {"name": "Acme University"},
                "prizes": [],
                "required_skills": [],
                "regnRequirements": {"start_regn_dt": "2026-03-01T00:00:00+05:30"},
            }
        ]

        normalized = normalize_unstop_hackathons(records, now=now)
        self.assertEqual(len(normalized), 1)
        self.assertEqual(normalized[0]["id"], "unstop-11")

    def test_normalizes_mlh(self) -> None:
        now = datetime(2026, 3, 1, tzinfo=timezone.utc)
        records = [
            {
                "id": "mlh1",
                "name": "Hack Illinois",
                "starts_at": "2026-03-02T10:00:00Z",
                "ends_at": "2026-03-03T10:00:00Z",
                "url": "/events/hack-illinois/prizes",
                "website_url": "https://hackillinois.org",
                "location": "Urbana, Illinois",
                "format_type": "physical",
                "region": "AMER",
            }
        ]

        normalized = normalize_mlh_hackathons(records, now=now)
        self.assertEqual(len(normalized), 1)
        self.assertEqual(normalized[0]["id"], "mlh-mlh1")
        self.assertEqual(normalized[0]["format"], "Offline")
        self.assertEqual(normalized[0]["location_text"], "Urbana, Illinois")

    def test_normalizes_hackerearth(self) -> None:
        now = datetime(2026, 3, 1, tzinfo=timezone.utc)
        records = [
            {
                "id": "hackerearth-1",
                "title": "The Big Code",
                "url": "https://www.hackerearth.com/challenges/hackathon/the-big-code/",
                "organizer": "Google India",
                "start_unix": 1772300000,
                "final_submission_unix": 1772400000,
            }
        ]

        normalized = normalize_hackerearth_hackathons(records, now=now)
        self.assertEqual(len(normalized), 1)
        self.assertEqual(normalized[0]["id"], "hackerearth-hackerearth-1")
        self.assertEqual(normalized[0]["format"], "Online")
        self.assertEqual(normalized[0]["location_text"], "Global")
        self.assertEqual(normalized[0]["days_to_final"], 1)


if __name__ == "__main__":
    unittest.main()
