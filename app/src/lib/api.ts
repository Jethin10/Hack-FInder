import {
  FilterState,
  HackathonListResponse,
  MedoCopilotRequest,
  MedoCopilotResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

const buildApiUrl = (path: string): string =>
  API_BASE_URL.length > 0 ? `${API_BASE_URL}${path}` : path;

const encodeListParam = (values: string[]): string =>
  values.join(",");

export const fetchHackathons = async (
  filters: FilterState,
  signal?: AbortSignal,
): Promise<HackathonListResponse> => {
  const query = new URLSearchParams({
    includeOnline: String(filters.format.online),
    includeOffline: String(filters.format.offline),
    includeHybrid: String(filters.format.hybrid),
    radiusKm: String(filters.location.radiusKm),
    timeToFinal: filters.timeToFinal,
    startProximity: filters.startProximity,
    organizerTrackRecord: filters.organizerTrackRecord,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    searchQuery: filters.searchQuery,
    limit: "200",
    offset: "0",
  });

  if (filters.location.baseCoordinates) {
    query.set("baseLat", String(filters.location.baseCoordinates.lat));
    query.set("baseLng", String(filters.location.baseCoordinates.lng));
  }
  if (typeof filters.startWithinDays === "number" && filters.startWithinDays > 0) {
    query.set("startWithinDays", String(filters.startWithinDays));
  }
  if (filters.themes.length > 0) {
    query.set("themes", encodeListParam(filters.themes));
  }
  if (filters.prizes.length > 0) {
    query.set("prizes", encodeListParam(filters.prizes));
  }

  const response = await fetch(`${buildApiUrl("/api/hackathons")}?${query}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }

  return (await response.json()) as HackathonListResponse;
};

export interface RefreshHackathonsResponse {
  status: string;
  startedAt: string;
  completedAt: string;
  summary: {
    status: string;
    sources: string[];
    fetched: number;
    writtenToDb: number;
    writtenToJson: number;
    deactivatedInDb: number;
  };
}

export const refreshHackathons = async (): Promise<RefreshHackathonsResponse> => {
  const response = await fetch(buildApiUrl("/api/hackathons/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Refresh failed with ${response.status}`);
  }

  return (await response.json()) as RefreshHackathonsResponse;
};

export const generateMedoCopilotPlan = async (
  request: MedoCopilotRequest,
): Promise<MedoCopilotResponse> => {
  const response = await fetch(buildApiUrl("/api/medo/copilot"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = `Copilot failed with ${response.status}`;
    try {
      const errorPayload = (await response.json()) as { message?: string };
      if (typeof errorPayload.message === "string" && errorPayload.message.trim()) {
        message = errorPayload.message;
      }
    } catch {
      // No-op: use generic error message.
    }
    throw new Error(message);
  }

  return (await response.json()) as MedoCopilotResponse;
};
