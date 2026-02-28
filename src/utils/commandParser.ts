import { LOCATION_OPTIONS } from "../constants/locations";
import { FilterState } from "../types";

const MIN_RADIUS_KM = 10;
const MAX_RADIUS_KM = 2000;
const MILES_TO_KM = 1.60934;

const THEME_KEYWORDS: Record<string, string> = {
  ai: "AI/ML",
  "ai/ml": "AI/ML",
  ml: "AI/ML",
  "machine learning": "AI/ML",
  web3: "Web3",
  blockchain: "Blockchain",
  health: "Healthcare",
  healthcare: "Healthcare",
  climate: "Climate",
  fintech: "FinTech",
  open: "Open Source",
  "open source": "Open Source",
  beginner: "Beginner-friendly",
  beginners: "Beginner-friendly",
  gaming: "Gaming",
  game: "Gaming",
};

const PRIZE_KEYWORDS: Record<string, FilterState["prizes"][number]> = {
  cash: "Cash",
  prize: "Cash",
  swag: "Swag",
  internship: "Job/Internship",
  intern: "Job/Internship",
  job: "Job/Internship",
};

const LOCATION_ALIASES: Array<{
  label: string;
  aliases: string[];
}> = [
    {
      label: "Delhi NCR",
      aliases: ["delhi ncr", "delhi", "gurugram", "gurgaon", "new delhi", "ncr"],
    },
    { label: "Noida", aliases: ["noida"] },
    { label: "Bangalore", aliases: ["bangalore", "bengaluru"] },
    { label: "Mumbai", aliases: ["mumbai"] },
    { label: "Pune", aliases: ["pune"] },
    { label: "Hyderabad", aliases: ["hyderabad"] },
    { label: "Chennai", aliases: ["chennai", "madras"] },
    { label: "Kolkata", aliases: ["kolkata", "calcutta"] },
    { label: "Jaipur", aliases: ["jaipur"] },
    { label: "Ahmedabad", aliases: ["ahmedabad"] },
    { label: "San Francisco", aliases: ["san francisco", "sf", "bay area"] },
    { label: "New York", aliases: ["new york", "nyc", "manhattan"] },
    { label: "Seattle", aliases: ["seattle"] },
    { label: "Austin", aliases: ["austin"] },
    { label: "Boston", aliases: ["boston"] },
    { label: "London", aliases: ["london"] },
    { label: "Berlin", aliases: ["berlin"] },
    { label: "Amsterdam", aliases: ["amsterdam"] },
    { label: "Paris", aliases: ["paris"] },
    { label: "Singapore", aliases: ["singapore"] },
    { label: "Tokyo", aliases: ["tokyo"] },
    { label: "Sydney", aliases: ["sydney"] },
    { label: "Toronto", aliases: ["toronto"] },
    { label: "Vancouver", aliases: ["vancouver"] },
  ];

const includesAny = (source: string, patterns: string[]): boolean =>
  patterns.some((pattern) => source.includes(pattern));

const clampRadius = (value: number): number =>
  Math.max(MIN_RADIUS_KM, Math.min(MAX_RADIUS_KM, Math.round(value)));

const extractRadiusKm = (normalizedQuery: string): number | undefined => {
  const explicitRadiusMatch = normalizedQuery.match(
    /(?:within|radius|around|near)\s+(\d{1,4})\s*(km|kilometers?|mi|miles?)\b/,
  );
  if (explicitRadiusMatch) {
    const rawValue = Number(explicitRadiusMatch[1]);
    const unit = explicitRadiusMatch[2];
    if (!Number.isFinite(rawValue)) {
      return undefined;
    }

    if (unit.startsWith("mi")) {
      return clampRadius(rawValue * MILES_TO_KM);
    }
    return clampRadius(rawValue);
  }

  const looseRadiusMatch = normalizedQuery.match(/(\d{1,4})\s*(km|mi)\b/);
  if (looseRadiusMatch) {
    const rawValue = Number(looseRadiusMatch[1]);
    if (!Number.isFinite(rawValue)) {
      return undefined;
    }
    if (looseRadiusMatch[2] === "mi") {
      return clampRadius(rawValue * MILES_TO_KM);
    }
    return clampRadius(rawValue);
  }

  return undefined;
};

const detectLocation = (
  normalizedQuery: string,
): { label: string; coordinates: FilterState["location"]["baseCoordinates"] } | null => {
  for (const mapping of LOCATION_ALIASES) {
    if (!includesAny(normalizedQuery, mapping.aliases)) {
      continue;
    }
    const location = LOCATION_OPTIONS.find((option) => option.label === mapping.label);
    if (!location) {
      continue;
    }
    return {
      label: location.label,
      coordinates: location.coordinates,
    };
  }
  return null;
};

const withDetectedThemes = (
  normalizedQuery: string,
  previousThemes: FilterState["themes"],
): FilterState["themes"] => {
  const detectedThemes = Object.entries(THEME_KEYWORDS)
    .filter(([keyword]) => normalizedQuery.includes(keyword))
    .map(([, theme]) => theme);

  if (detectedThemes.length === 0) {
    return previousThemes;
  }

  return [...new Set([...previousThemes, ...detectedThemes])];
};

const withDetectedPrizes = (
  normalizedQuery: string,
  previousPrizes: FilterState["prizes"],
): FilterState["prizes"] => {
  const detectedPrizes = Object.entries(PRIZE_KEYWORDS)
    .filter(([keyword]) => normalizedQuery.includes(keyword))
    .map(([, prize]) => prize);

  if (includesAny(normalizedQuery, ["unspecified", "no prize", "without prize"])) {
    detectedPrizes.push("Unspecified");
  }

  if (detectedPrizes.length === 0) {
    return previousPrizes;
  }

  return [...new Set([...previousPrizes, ...detectedPrizes])];
};

const isResetQuery = (normalizedQuery: string): boolean =>
  includesAny(normalizedQuery, [
    "reset filters",
    "clear filters",
    "clear all filters",
    "show everything",
  ]);

const resetState = (query: string): FilterState => ({
  format: {
    online: true,
    offline: true,
    hybrid: true,
  },
  location: {
    baseLocation: "Anywhere",
    baseCoordinates: undefined,
    radiusKm: 50,
  },
  startWithinDays: undefined,
  timeToFinal: "any",
  startProximity: "any",
  organizerTrackRecord: "any",
  themes: [],
  prizes: [],
  searchQuery: query.trim(),
  sortBy: "startDate",
  sortOrder: "asc",
});

export const applyCommandQuery = (
  query: string,
  previous: FilterState,
): FilterState => {
  const normalized = query.trim().toLowerCase();
  if (isResetQuery(normalized)) {
    return resetState(query);
  }

  const next: FilterState = {
    ...previous,
    format: { ...previous.format },
    location: { ...previous.location },
    themes: [...previous.themes],
    prizes: [...previous.prizes],
    searchQuery: query.trim(),
  };

  const startsWithinMatch = normalized.match(
    /\b(?:(?:closes?|closing)\s+(?:in|within)|(?:in|within|next))\s+(\d{1,2})\s+days?\b/,
  );
  if (startsWithinMatch) {
    const parsedDays = Number(startsWithinMatch[1]);
    if (Number.isFinite(parsedDays) && parsedDays > 0) {
      next.startWithinDays = Math.min(60, Math.max(1, parsedDays));
    }
  } else if (includesAny(normalized, ["any start date", "no start window"])) {
    next.startWithinDays = undefined;
  }

  const mentionsOnline = includesAny(normalized, [
    "online",
    "remote",
    "virtual",
    "global",
  ]);
  const mentionsOffline = includesAny(normalized, [
    "offline",
    "in-person",
    "onsite",
    "on-site",
    "local",
  ]);
  const mentionsHybrid = includesAny(normalized, ["hybrid"]);

  if (mentionsOnline || mentionsOffline || mentionsHybrid) {
    if (mentionsOnline && mentionsOffline) {
      next.format = { online: true, offline: true, hybrid: true };
    } else if (mentionsHybrid && !mentionsOnline && !mentionsOffline) {
      next.format = { online: false, offline: false, hybrid: true };
    } else if (mentionsOnline && !mentionsOffline && !mentionsHybrid) {
      next.format = { online: true, offline: false, hybrid: false };
    } else if (mentionsOffline && !mentionsOnline && !mentionsHybrid) {
      next.format = { online: false, offline: true, hybrid: true };
    } else {
      next.format = {
        online: mentionsOnline,
        offline: mentionsOffline,
        hybrid: mentionsHybrid,
      };
    }
  }

  if (includesAny(normalized, ["happening now", "live now", "ongoing"])) {
    next.startProximity = "happeningNow";
  } else if (
    includesAny(normalized, ["48 hours", "next 48", "soon", "tomorrow", "today"])
  ) {
    next.startProximity = "lt48Hours";
  } else if (includesAny(normalized, ["next week", "this week", "upcoming week"])) {
    next.startProximity = "nextWeek";
  }

  if (
    includesAny(normalized, [
      "sprint",
      "weekend",
      "< 3",
      "under 3",
      "fast",
      "quick",
    ])
  ) {
    next.timeToFinal = "lt3days";
  } else if (includesAny(normalized, ["1 week", "7 days", "week-long"])) {
    next.timeToFinal = "oneWeek";
  } else if (includesAny(normalized, ["month", "long term", "long-term"])) {
    next.timeToFinal = "oneMonthPlus";
  }

  if (includesAny(normalized, ["trusted organizer", "established organizer", "hosted"])) {
    next.organizerTrackRecord = "established";
  } else if (includesAny(normalized, ["first-time organizer", "new organizer"])) {
    next.organizerTrackRecord = "firstTime";
  }

  if (includesAny(normalized, ["latest", "recent", "newly added"])) {
    next.sortBy = "createdAt";
    next.sortOrder = "desc";
  } else if (includesAny(normalized, ["earliest", "soonest", "start soon"])) {
    next.sortBy = "startDate";
    next.sortOrder = "asc";
  } else if (includesAny(normalized, ["longest", "largest commitment"])) {
    next.sortBy = "daysToFinal";
    next.sortOrder = "desc";
  } else if (includesAny(normalized, ["shortest", "least commitment"])) {
    next.sortBy = "daysToFinal";
    next.sortOrder = "asc";
  }

  const locationMatch = detectLocation(normalized);
  if (locationMatch) {
    next.location.baseLocation = locationMatch.label;
    next.location.baseCoordinates = locationMatch.coordinates;
    if (!mentionsOnline && !mentionsOffline && !mentionsHybrid) {
      next.format = {
        online: true,
        offline: true,
        hybrid: true,
      };
    }
  } else if (includesAny(normalized, ["anywhere", "global only"])) {
    next.location.baseLocation = "Anywhere";
    next.location.baseCoordinates = undefined;
  }

  const radiusKm = extractRadiusKm(normalized);
  if (typeof radiusKm === "number") {
    next.location.radiusKm = radiusKm;
  } else if (includesAny(normalized, ["near me", "nearby"])) {
    next.location.radiusKm = 50;
  }

  next.themes = withDetectedThemes(normalized, next.themes);
  next.prizes = withDetectedPrizes(normalized, next.prizes);

  return next;
};
