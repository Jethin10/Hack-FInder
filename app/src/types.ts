import type {
  Coordinates,
  HackathonListItem,
  OrganizerTrackRecordFilter,
  PrizeCategory,
  SortBy,
  SortOrder,
  StartProximityFilter,
  TimeToFinalFilter,
} from "../shared/contracts";

export type {
  Coordinates,
  Hackathon,
  HackathonFacets,
  HackathonFormat,
  HackathonListFilters,
  HackathonListItem,
  HackathonListResponse,
  MedoCopilotRequest,
  MedoCopilotResponse,
  OrganizerTrackRecordFilter,
  PrizeCategory,
  SortBy,
  SortOrder,
  StartProximityFilter,
  TimeToFinalFilter,
} from "../shared/contracts";

export interface FilterState {
  format: {
    online: boolean;
    offline: boolean;
    hybrid: boolean;
  };
  location: {
    baseLocation: string;
    baseCoordinates?: Coordinates;
    radiusKm: number;
  };
  startWithinDays?: number;
  timeToFinal: TimeToFinalFilter;
  startProximity: StartProximityFilter;
  organizerTrackRecord: OrganizerTrackRecordFilter;
  themes: string[];
  prizes: PrizeCategory[];
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export interface DisplayHackathonListItem extends HackathonListItem {
  matchScore?: number;
  matchOverlap?: number;
}
