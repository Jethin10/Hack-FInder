type RankableHackathon = {
  title: string;
  themes: string[];
};

type RankedHackathon<T> = T & {
  matchScore: number;
  matchOverlap: number;
};

const TITLE_KEYWORD_MAP: Record<string, string> = {
  ai: "AI/ML",
  "ai/ml": "AI/ML",
  ml: "AI/ML",
  agent: "AI/ML",
  agents: "AI/ML",
  productivity: "Productivity",
  web3: "Web3",
  blockchain: "Blockchain",
  frontend: "Frontend",
  react: "Frontend",
  ui: "Frontend",
  backend: "Backend",
  node: "Backend",
  api: "Backend",
  mobile: "Mobile",
  android: "Mobile",
  ios: "Mobile",
  education: "Education",
  healthcare: "Healthcare",
  cloud: "Cloud",
  devops: "Cloud",
  security: "Security",
  cybersecurity: "Security",
  data: "Data",
  analytics: "Data",
  beginner: "Beginner",
  design: "Design",
};

const SKILL_ALIAS_MAP: Record<string, string> = {
  "machine learning": "AI/ML",
  "artificial intelligence": "AI/ML",
  "open source": "Open Source",
  ux: "Design",
};

const toTitleCase = (value: string): string =>
  value
    .split(" ")
    .map((part) =>
      part.length === 0 ? part : `${part[0].toUpperCase()}${part.slice(1)}`,
    )
    .join(" ");

export const normalizeSkillTag = (tag: string): string => {
  const trimmed = tag.trim();
  if (!trimmed) {
    return "";
  }

  const lowered = trimmed.toLowerCase();
  if (SKILL_ALIAS_MAP[lowered]) {
    return SKILL_ALIAS_MAP[lowered];
  }

  if (lowered === "ai/ml") {
    return "AI/ML";
  }

  if (lowered.includes("/")) {
    return lowered
      .split("/")
      .map((part) => toTitleCase(part))
      .join("/");
  }

  return toTitleCase(lowered);
};

const dedupeNormalized = (values: string[]): string[] => {
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = normalizeSkillTag(value);
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(normalized);
  }
  return deduped;
};

export const extractHackathonTags = (hackathon: RankableHackathon): string[] => {
  const tags = [...hackathon.themes];
  const title = hackathon.title.toLowerCase();
  for (const [keyword, mappedSkill] of Object.entries(TITLE_KEYWORD_MAP)) {
    if (title.includes(keyword)) {
      tags.push(mappedSkill);
    }
  }
  return dedupeNormalized(tags);
};

export const computeSkillMatchOverlap = (
  userSkills: string[],
  hackathonTags: string[],
): number => {
  const user = dedupeNormalized(userSkills).map((item) => item.toLowerCase());
  const tags = new Set(
    dedupeNormalized(hackathonTags).map((item) => item.toLowerCase()),
  );

  return user.filter((skill) => tags.has(skill)).length;
};

export const computeSkillMatchScore = (
  userSkills: string[],
  hackathonTags: string[],
): number => {
  const normalizedUserSkills = dedupeNormalized(userSkills);
  const normalizedHackathonTags = dedupeNormalized(hackathonTags);
  if (normalizedUserSkills.length === 0 || normalizedHackathonTags.length === 0) {
    return 0;
  }

  const overlap = computeSkillMatchOverlap(
    normalizedUserSkills,
    normalizedHackathonTags,
  );
  const coverage = overlap / Math.max(1, normalizedUserSkills.length);
  const density = overlap / Math.max(1, normalizedHackathonTags.length);
  return Math.round((0.7 * coverage + 0.3 * density) * 100);
};

export const rankHackathonsBySkillMatch = <T extends RankableHackathon>(
  hackathons: T[],
  userSkills: string[],
): RankedHackathon<T>[] => {
  const normalizedUserSkills = dedupeNormalized(userSkills);
  if (normalizedUserSkills.length === 0) {
    return hackathons.map((hackathon) => ({
      ...hackathon,
      matchScore: 0,
      matchOverlap: 0,
    }));
  }

  const withScore = hackathons.map((hackathon, index) => {
    const tags = extractHackathonTags(hackathon);
    const overlap = computeSkillMatchOverlap(normalizedUserSkills, tags);
    const score = computeSkillMatchScore(normalizedUserSkills, tags);
    return {
      ...hackathon,
      matchScore: score,
      matchOverlap: overlap,
      __index: index,
    };
  });

  withScore.sort((left, right) => {
    if (right.matchScore !== left.matchScore) {
      return right.matchScore - left.matchScore;
    }
    return left.__index - right.__index;
  });

  return withScore.map(({ __index: _ignored, ...item }) => item as RankedHackathon<T>);
};
