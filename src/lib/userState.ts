export interface LimitedSelectionResult {
  ids: string[];
  reachedLimit: boolean;
}

const toTitleCase = (value: string): string =>
  value
    .split(" ")
    .map((part) =>
      part.length > 0 ? `${part[0].toUpperCase()}${part.slice(1)}` : part,
    )
    .join(" ");

export const normalizeSkillTag = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const lowered = trimmed.toLowerCase();
  if (
    lowered === "ai" ||
    lowered === "ml" ||
    lowered === "ai/ml" ||
    lowered === "machine learning" ||
    lowered === "artificial intelligence"
  ) {
    return "AI/ML";
  }

  return toTitleCase(lowered);
};

export const normalizeSkillTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const normalized = normalizeSkillTag(item);
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

export const toggleSkillTag = (skills: string[], skill: string): string[] => {
  const normalized = normalizeSkillTag(skill);
  if (!normalized) {
    return normalizeSkillTags(skills);
  }

  const normalizedSkills = normalizeSkillTags(skills);
  const exists = normalizedSkills.some(
    (candidate) => candidate.toLowerCase() === normalized.toLowerCase(),
  );
  if (exists) {
    return normalizedSkills.filter(
      (candidate) => candidate.toLowerCase() !== normalized.toLowerCase(),
    );
  }
  return [...normalizedSkills, normalized];
};

export const normalizeStoredIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    deduped.push(normalized);
  }
  return deduped;
};

export const toggleInList = (ids: string[], id: string): string[] => {
  const normalized = id.trim();
  if (!normalized) {
    return ids;
  }
  if (ids.includes(normalized)) {
    return ids.filter((item) => item !== normalized);
  }
  return [...ids, normalized];
};

export const removeFromList = (ids: string[], id: string): string[] => {
  const normalized = id.trim();
  if (!normalized) {
    return ids;
  }
  return ids.filter((item) => item !== normalized);
};

export const addToLimitedSelection = (
  ids: string[],
  id: string,
  maxCount: number,
): LimitedSelectionResult => {
  const normalized = id.trim();
  if (!normalized) {
    return { ids, reachedLimit: false };
  }
  if (ids.includes(normalized)) {
    return { ids: removeFromList(ids, normalized), reachedLimit: false };
  }
  if (ids.length >= maxCount) {
    return { ids, reachedLimit: true };
  }
  return { ids: [...ids, normalized], reachedLimit: false };
};

export const readIdsFromStorage = (storageKey: string): string[] => {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    return normalizeStoredIds(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeIdsToStorage = (storageKey: string, ids: string[]): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(normalizeStoredIds(ids)));
  } catch {
    // Intentionally ignore storage write failures to avoid UI disruption.
  }
};

export const readSkillsFromStorage = (storageKey: string): string[] => {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    return normalizeSkillTags(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const writeSkillsToStorage = (
  storageKey: string,
  skills: string[],
): void => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(normalizeSkillTags(skills)),
    );
  } catch {
    // Intentionally ignore storage write failures to avoid UI disruption.
  }
};
