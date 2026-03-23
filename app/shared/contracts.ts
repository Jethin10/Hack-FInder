export type HackathonFormat = "Online" | "Offline" | "Hybrid";
export type PrizeCategory = "Cash" | "Swag" | "Job/Internship" | "Unspecified";
export type TimeToFinalFilter = "any" | "lt3days" | "oneWeek" | "oneMonthPlus";
export type StartProximityFilter =
  | "any"
  | "happeningNow"
  | "lt48Hours"
  | "nextWeek";
export type OrganizerTrackRecordFilter = "any" | "established" | "firstTime";
export type SortBy = "startDate" | "daysToFinal" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Hackathon {
  id: string;
  title: string;
  url: string;
  sourcePlatform: string;
  format: HackathonFormat;
  locationText: string;
  coordinates?: Coordinates;
  startDate: string;
  finalSubmissionDate: string;
  daysToFinal: number;
  themes: string[];
  organizerPastEvents: number;
  prizes: PrizeCategory[];
  createdAt: string;
}

export interface HackathonListFilters {
  includeOnline: boolean;
  includeOffline: boolean;
  includeHybrid: boolean;
  baseCoordinates?: Coordinates;
  radiusKm: number;
  startWithinDays?: number;
  timeToFinal: TimeToFinalFilter;
  startProximity: StartProximityFilter;
  organizerTrackRecord: OrganizerTrackRecordFilter;
  themes: string[];
  prizes: PrizeCategory[];
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  limit: number;
  offset: number;
}

export interface HackathonListItem extends Hackathon {
  distanceKm?: number;
  isHappeningNow: boolean;
  startsInHours: number;
  organizerStatus: "trusted" | "returning" | "first-time";
}

export interface HackathonFacets {
  themes: string[];
  prizes: PrizeCategory[];
  sources: string[];
}

export interface HackathonListResponse {
  data: HackathonListItem[];
  total: number;
  limit: number;
  offset: number;
  facets: HackathonFacets;
  generatedAt: string;
}

export type MedoSkillLevel = "beginner" | "intermediate" | "advanced";

export interface MedoCopilotHackathonContext {
  id: string;
  title: string;
  format: HackathonFormat;
  themes: string[];
  startDate: string;
  finalSubmissionDate: string;
  prizes: PrizeCategory[];
  locationText: string;
}

export interface MedoCopilotConstraints {
  hoursAvailable: number;
  teamSize: number;
  skillLevel: MedoSkillLevel;
}

export interface MedoCopilotRequest {
  hackathonContext: MedoCopilotHackathonContext;
  userSkills: string[];
  goal: string;
  constraints: MedoCopilotConstraints;
}

export interface MedoCopilotJudgingAlignment {
  execution: string;
  usefulness: string;
  creativity: string;
  design: string;
  complexity: string;
}

export interface MedoCopilotSubmissionKit {
  devpostSummary: string;
  demoScript60s: string;
  checklist: string[];
}

export interface MedoCopilotResponse {
  projectTitle: string;
  oneLinePitch: string;
  problemStatement: string;
  solutionOverview: string;
  architecture: string[];
  buildPlan: string[];
  judgingAlignment: MedoCopilotJudgingAlignment;
  submissionKit: MedoCopilotSubmissionKit;
  riskMitigation: string[];
}
