from __future__ import annotations

import os
from typing import Dict, Optional, Tuple


FALLBACK_COORDINATES: Dict[str, Tuple[float, float]] = {
    "delhi ncr": (28.6139, 77.2090),
    "gurugram": (28.4595, 77.0266),
    "new delhi": (28.6139, 77.2090),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "mumbai": (19.0760, 72.8777),
    "noida": (28.5355, 77.3910),
    "pune": (18.5204, 73.8567),
    "san francisco": (37.7749, -122.4194),
    "london": (51.5074, -0.1278),
}


class LocationGeocoder:
    def __init__(self, enabled: bool = True) -> None:
        disable_env = os.getenv("HACKHUNT_DISABLE_GEOCODING", "").strip().lower()
        self.enabled = enabled and disable_env not in {"1", "true", "yes"}
        self._cache: Dict[str, Optional[Tuple[float, float]]] = {}
        self._nominatim = None

        if self.enabled:
            try:
                from geopy.geocoders import Nominatim  # type: ignore

                self._nominatim = Nominatim(user_agent="hackhunt-ingestion")
            except Exception:
                self._nominatim = None

    def geocode(self, location_text: str) -> Optional[Tuple[float, float]]:
        normalized = location_text.strip().lower()
        if not normalized or normalized in {"global", "online", "virtual"}:
            return None

        if normalized in self._cache:
            return self._cache[normalized]

        for key, value in FALLBACK_COORDINATES.items():
            if key in normalized:
                self._cache[normalized] = value
                return value

        if not self.enabled or self._nominatim is None:
            self._cache[normalized] = None
            return None

        try:
            result = self._nominatim.geocode(location_text, timeout=10)
            if result is None:
                self._cache[normalized] = None
                return None
            coordinates = (float(result.latitude), float(result.longitude))
            self._cache[normalized] = coordinates
            return coordinates
        except Exception:
            self._cache[normalized] = None
            return None

