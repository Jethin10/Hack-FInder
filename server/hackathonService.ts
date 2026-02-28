import {
  Coordinates,
  Hackathon,
  HackathonFacets,
  HackathonListFilters,
  HackathonListItem,
  HackathonListResponse,
  PrizeCategory,
} from "../shared/contracts";
import { SqliteDatabase } from "./db";

interface HackathonRow {
  id: string;
  title: string;
  url: string;
  source_platform: string;
  format: Hackathon["format"];
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  final_submission_date: string;
  days_to_final: number;
  themes: string;
  organizer_past_events: number;
  prizes: string;
  created_at: string;
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (value: number): number => (value * Math.PI) / 180;

const calculateDistanceKm = (origin: Coordinates, target: Coordinates): number => {
  const deltaLat = toRadians(target.lat - origin.lat);
  const deltaLng = toRadians(target.lng - origin.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(target.lat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  return EARTH_RADIUS_KM * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const parseJsonArray = <T>(value: string, fallback: T[]): T[] => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return fallback;
    }
    return parsed as T[];
  } catch {
    return fallback;
  }
};

const sortByField = (
  items: HackathonListItem[],
  filters: HackathonListFilters,
): HackathonListItem[] => {
  const direction = filters.sortOrder === "asc" ? 1 : -1;

  return [...items].sort((left, right) => {
    if (filters.sortBy === "daysToFinal") {
      return (left.daysToFinal - right.daysToFinal) * direction;
    }

    const leftDate =
      filters.sortBy === "startDate"
        ? new Date(left.startDate).getTime()
        : new Date(left.createdAt).getTime();
    const rightDate =
      filters.sortBy === "startDate"
        ? new Date(right.startDate).getTime()
        : new Date(right.createdAt).getTime();

    return (leftDate - rightDate) * direction;
  });
};

const hydrateHackathon = (row: HackathonRow): Hackathon => ({
  id: row.id,
  title: row.title,
  url: row.url,
  sourcePlatform: row.source_platform,
  format: row.format,
  locationText: row.location_text,
  coordinates:
    typeof row.latitude === "number" && typeof row.longitude === "number"
      ? { lat: row.latitude, lng: row.longitude }
      : undefined,
  startDate: row.start_date,
  finalSubmissionDate: row.final_submission_date,
  daysToFinal: row.days_to_final,
  themes: parseJsonArray<string>(row.themes, []),
  organizerPastEvents: row.organizer_past_events,
  prizes: parseJsonArray<PrizeCategory>(row.prizes, []),
  createdAt: row.created_at,
});

const matchesTimeToFinal = (
  item: Hackathon,
  filters: HackathonListFilters,
): boolean => {
  if (filters.timeToFinal === "any") {
    return true;
  }
  if (filters.timeToFinal === "lt3days") {
    return item.daysToFinal < 3;
  }
  if (filters.timeToFinal === "oneWeek") {
    return item.daysToFinal >= 3 && item.daysToFinal <= 7;
  }
  return item.daysToFinal > 30;
};

const evaluateStartProximity = (
  item: Hackathon,
  filters: HackathonListFilters,
): { isHappeningNow: boolean; startsInHours: number; matches: boolean } => {
  const now = new Date();
  const startDate = new Date(item.startDate);
  const finalDate = new Date(item.finalSubmissionDate);
  const startsInHours = Math.round(
    (startDate.getTime() - now.getTime()) / (60 * 60 * 1000),
  );
  const isHappeningNow = now >= startDate && now <= finalDate;

  if (filters.startProximity === "any") {
    return { isHappeningNow, startsInHours, matches: true };
  }
  if (filters.startProximity === "happeningNow") {
    return { isHappeningNow, startsInHours, matches: isHappeningNow };
  }
  if (filters.startProximity === "lt48Hours") {
    return {
      isHappeningNow,
      startsInHours,
      matches: startsInHours > 0 && startsInHours <= 48,
    };
  }
  return {
    isHappeningNow,
    startsInHours,
    matches: startsInHours > 48 && startsInHours <= 7 * 24,
  };
};

export const isWithinRegistrationWindowDays = (
  startDateIso: string,
  finalDateIso: string,
  startWithinDays: number,
  now: Date = new Date(),
): boolean => {
  if (startWithinDays < 1) {
    return true;
  }

  const startDate = new Date(startDateIso);
  const finalDate = new Date(finalDateIso);
  if (Number.isNaN(startDate.getTime())) {
    return false;
  }
  if (Number.isNaN(finalDate.getTime())) {
    return false;
  }

  if (finalDate < now) {
    return false;
  }
  if (startDate > now) {
    return false;
  }
  const maxCloseDate = new Date(
    now.getTime() + startWithinDays * 24 * 60 * 60 * 1000,
  );
  return finalDate <= maxCloseDate;
};

const matchesStartWithinDays = (
  item: Hackathon,
  filters: HackathonListFilters,
): boolean => {
  if (typeof filters.startWithinDays !== "number") {
    return true;
  }
  return isWithinRegistrationWindowDays(
    item.startDate,
    item.finalSubmissionDate,
    filters.startWithinDays,
  );
};

const matchesOrganizerTrackRecord = (
  item: Hackathon,
  filters: HackathonListFilters,
): boolean => {
  if (filters.organizerTrackRecord === "any") {
    return true;
  }
  if (filters.organizerTrackRecord === "established") {
    return item.organizerPastEvents >= 3;
  }
  return item.organizerPastEvents === 0;
};

const matchesThemeFilter = (
  item: Hackathon,
  filters: HackathonListFilters,
): boolean => {
  if (filters.themes.length === 0) {
    return true;
  }
  return filters.themes.some((theme) => item.themes.includes(theme));
};

const matchesPrizeFilter = (
  item: Hackathon,
  filters: HackathonListFilters,
): boolean => {
  if (filters.prizes.length === 0) {
    return true;
  }
  return filters.prizes.some((prize) => item.prizes.includes(prize));
};

const matchesSearch = (item: Hackathon, filters: HackathonListFilters): boolean => {
  const query = filters.searchQuery.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return (
    item.title.toLowerCase().includes(query) ||
    item.locationText.toLowerCase().includes(query) ||
    item.sourcePlatform.toLowerCase().includes(query) ||
    item.themes.some((theme) => theme.toLowerCase().includes(query))
  );
};

const matchesFormat = (item: Hackathon, filters: HackathonListFilters): boolean => {
  if (item.format === "Online") {
    return filters.includeOnline;
  }
  if (item.format === "Offline") {
    return filters.includeOffline;
  }
  return filters.includeHybrid;
};

const withDistanceIfApplicable = (
  item: Hackathon,
  filters: HackathonListFilters,
): { include: boolean; distanceKm?: number } => {
  const isLocalFormat = item.format === "Offline" || item.format === "Hybrid";
  if (!filters.baseCoordinates || !isLocalFormat) {
    return { include: true };
  }
  if (!item.coordinates) {
    return { include: false };
  }

  const distanceKm = calculateDistanceKm(filters.baseCoordinates, item.coordinates);
  return {
    include: distanceKm <= filters.radiusKm,
    distanceKm: Number(distanceKm.toFixed(1)),
  };
};

const buildFacets = (items: HackathonListItem[]): HackathonFacets => {
  const themeSet = new Set<string>();
  const prizeSet = new Set<PrizeCategory>();
  const sourceSet = new Set<string>();

  for (const item of items) {
    sourceSet.add(item.sourcePlatform);
    for (const theme of item.themes) {
      themeSet.add(theme);
    }
    for (const prize of item.prizes) {
      prizeSet.add(prize);
    }
  }

  return {
    themes: [...themeSet].sort((left, right) => left.localeCompare(right)),
    prizes: [...prizeSet].sort((left, right) => left.localeCompare(right)),
    sources: [...sourceSet].sort((left, right) => left.localeCompare(right)),
  };
};

const buildBaseQuery = (filters: HackathonListFilters): string => {
  const formats: Hackathon["format"][] = [];
  if (filters.includeOnline) {
    formats.push("Online");
  }
  if (filters.includeOffline) {
    formats.push("Offline");
  }
  if (filters.includeHybrid) {
    formats.push("Hybrid");
  }

  if (formats.length === 0) {
    return "SELECT * FROM hackathons WHERE 1 = 0";
  }

  const placeholders = formats.map(() => "?").join(", ");
  return `SELECT * FROM hackathons WHERE is_active = 1 AND format IN (${placeholders})`;
};

export const listHackathons = (
  db: SqliteDatabase,
  filters: HackathonListFilters,
): HackathonListResponse => {
  const formats: Hackathon["format"][] = [];
  if (filters.includeOnline) {
    formats.push("Online");
  }
  if (filters.includeOffline) {
    formats.push("Offline");
  }
  if (filters.includeHybrid) {
    formats.push("Hybrid");
  }

  const query = buildBaseQuery(filters);
  const rows = db.prepare(query).all(...formats) as HackathonRow[];

  const enriched = rows
    .map(hydrateHackathon)
    .filter((item) => matchesFormat(item, filters))
    .filter((item) => matchesStartWithinDays(item, filters))
    .filter((item) => matchesTimeToFinal(item, filters))
    .filter((item) => matchesOrganizerTrackRecord(item, filters))
    .filter((item) => matchesThemeFilter(item, filters))
    .filter((item) => matchesPrizeFilter(item, filters))
    .filter((item) => matchesSearch(item, filters))
    .flatMap((item) => {
      const startMeta = evaluateStartProximity(item, filters);
      if (!startMeta.matches) {
        return [];
      }

      const distanceMeta = withDistanceIfApplicable(item, filters);
      if (!distanceMeta.include) {
        return [];
      }

      const listItem: HackathonListItem = {
        ...item,
        distanceKm: distanceMeta.distanceKm,
        startsInHours: startMeta.startsInHours,
        isHappeningNow: startMeta.isHappeningNow,
        organizerStatus:
          item.organizerPastEvents >= 3
            ? "trusted"
            : item.organizerPastEvents === 0
              ? "first-time"
              : "returning",
      };

      return [listItem];
    });

  const sorted = sortByField(enriched, filters);
  const total = sorted.length;
  const paginated = sorted.slice(filters.offset, filters.offset + filters.limit);

  return {
    data: paginated,
    total,
    limit: filters.limit,
    offset: filters.offset,
    facets: buildFacets(enriched),
    generatedAt: new Date().toISOString(),
  };
};
