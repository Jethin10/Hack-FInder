import {
  HackathonListFilters,
  OrganizerTrackRecordFilter,
  PrizeCategory,
  SortBy,
  SortOrder,
  StartProximityFilter,
  TimeToFinalFilter,
} from "../shared/contracts";

type QueryInput = Record<string, unknown>;

const MAX_RADIUS_KM = 2000;
const MIN_RADIUS_KM = 10;
const MAX_LIMIT = 200;
const MIN_LIMIT = 1;
const MAX_START_WITHIN_DAYS = 60;
const MIN_START_WITHIN_DAYS = 1;

const getFirstValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
};

const parseBoolean = (value: unknown, fallback: boolean): boolean => {
  const firstValue = getFirstValue(value);
  if (!firstValue) {
    return fallback;
  }
  const normalized = firstValue.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  return fallback;
};

const parseNumber = (
  value: unknown,
  fallback: number,
  minValue?: number,
  maxValue?: number,
): number => {
  const firstValue = getFirstValue(value);
  if (!firstValue) {
    return fallback;
  }
  const parsed = Number(firstValue);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  let finalValue = parsed;
  if (typeof minValue === "number") {
    finalValue = Math.max(minValue, finalValue);
  }
  if (typeof maxValue === "number") {
    finalValue = Math.min(maxValue, finalValue);
  }
  return finalValue;
};

const parseList = (value: unknown): string[] => {
  const firstValue = getFirstValue(value);
  if (!firstValue) {
    return [];
  }
  return firstValue
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      try {
        return decodeURIComponent(trimmed);
      } catch {
        return trimmed;
      }
    })
    .filter(Boolean);
};

const parseEnum = <T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fallback: T,
): T => {
  const firstValue = getFirstValue(value);
  if (!firstValue) {
    return fallback;
  }
  if (allowedValues.includes(firstValue as T)) {
    return firstValue as T;
  }
  return fallback;
};

const isFiniteNumber = (value: number): boolean =>
  Number.isFinite(value) && !Number.isNaN(value);

const VALID_PRIZE_CATEGORIES: PrizeCategory[] = [
  "Cash",
  "Swag",
  "Job/Internship",
  "Unspecified",
];

const parsePrizeCategories = (value: unknown): PrizeCategory[] =>
  parseList(value).filter((entry): entry is PrizeCategory =>
    VALID_PRIZE_CATEGORIES.includes(entry as PrizeCategory),
  );

export const parseHackathonFilters = (query: QueryInput): HackathonListFilters => {
  const includeOnline = parseBoolean(query.includeOnline, true);
  const includeOffline = parseBoolean(query.includeOffline, true);
  const includeHybrid = parseBoolean(query.includeHybrid, true);

  const baseLat = parseNumber(query.baseLat, NaN);
  const baseLng = parseNumber(query.baseLng, NaN);
  const hasCoordinates = isFiniteNumber(baseLat) && isFiniteNumber(baseLng);

  const timeToFinal = parseEnum<TimeToFinalFilter>(
    query.timeToFinal,
    ["any", "lt3days", "oneWeek", "oneMonthPlus"],
    "any",
  );
  const startProximity = parseEnum<StartProximityFilter>(
    query.startProximity,
    ["any", "happeningNow", "lt48Hours", "nextWeek"],
    "any",
  );
  const organizerTrackRecord = parseEnum<OrganizerTrackRecordFilter>(
    query.organizerTrackRecord,
    ["any", "established", "firstTime"],
    "any",
  );
  const sortBy = parseEnum<SortBy>(
    query.sortBy,
    ["startDate", "daysToFinal", "createdAt"],
    "startDate",
  );
  const sortOrder = parseEnum<SortOrder>(query.sortOrder, ["asc", "desc"], "asc");
  const startWithinDays = parseNumber(
    query.startWithinDays,
    0,
    0,
    MAX_START_WITHIN_DAYS,
  );

  return {
    includeOnline,
    includeOffline,
    includeHybrid,
    baseCoordinates: hasCoordinates ? { lat: baseLat, lng: baseLng } : undefined,
    radiusKm: parseNumber(query.radiusKm, 50, MIN_RADIUS_KM, MAX_RADIUS_KM),
    startWithinDays:
      startWithinDays >= MIN_START_WITHIN_DAYS ? startWithinDays : undefined,
    timeToFinal,
    startProximity,
    organizerTrackRecord,
    themes: parseList(query.themes),
    prizes: parsePrizeCategories(query.prizes),
    searchQuery: getFirstValue(query.searchQuery) ?? getFirstValue(query.q) ?? "",
    sortBy,
    sortOrder,
    limit: parseNumber(query.limit, 50, MIN_LIMIT, MAX_LIMIT),
    offset: parseNumber(query.offset, 0, 0),
  };
};
