export interface LimitedSelectionResult {
  ids: string[];
  reachedLimit: boolean;
}

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
