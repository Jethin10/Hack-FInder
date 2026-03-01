import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import DataGrid from "./components/DataGrid";
import CommandPalette from "./components/CommandPalette";
import { fetchHackathons, refreshHackathons } from "./lib/api";
import {
  readIdsFromStorage,
  toggleInList,
  writeIdsToStorage,
} from "./lib/userState";
import { applyCommandQuery } from "./utils/commandParser";
import { FilterState, HackathonListItem, PrizeCategory } from "./types";

const DEFAULT_PRIZES: PrizeCategory[] = [
  "Cash",
  "Swag",
  "Job/Internship",
  "Unspecified",
];

const INITIAL_FILTERS: FilterState = {
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
  searchQuery: "",
  sortBy: "startDate",
  sortOrder: "asc",
};

const SAVED_IDS_STORAGE_KEY = "hackhunt.saved.ids";

export default function App() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const [hackathons, setHackathons] = useState<HackathonListItem[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    readIdsFromStorage(SAVED_IDS_STORAGE_KEY),
  );
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [listMode, setListMode] = useState<"all" | "saved">("all");
  const [totalResults, setTotalResults] = useState(0);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [availablePrizes, setAvailablePrizes] =
    useState<PrizeCategory[]>(DEFAULT_PRIZES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStartedAtMs, setRefreshStartedAtMs] = useState<number | null>(
    null,
  );
  const [refreshElapsedSeconds, setRefreshElapsedSeconds] = useState(0);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const debounceDurationMs = filters.searchQuery ? 250 : 0;

    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchHackathons(filters, controller.signal);
        setHackathons(result.data);
        setTotalResults(result.total);
        setAvailableThemes(result.facets.themes);
        setLastUpdatedAt(result.generatedAt);
        setAvailablePrizes(
          result.facets.prizes.length > 0
            ? result.facets.prizes
            : DEFAULT_PRIZES,
        );
      } catch (fetchError) {
        if (
          fetchError instanceof Error &&
          fetchError.name.toLowerCase() === "aborterror"
        ) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to fetch hackathons",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, debounceDurationMs);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [filters, refreshVersion]);

  useEffect(() => {
    writeIdsToStorage(SAVED_IDS_STORAGE_KEY, savedIds);
  }, [savedIds]);

  useEffect(() => {
    if (!isRefreshing || refreshStartedAtMs === null) {
      return;
    }

    const interval = window.setInterval(() => {
      setRefreshElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - refreshStartedAtMs) / 1000)),
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRefreshing, refreshStartedAtMs]);

  const handleResetFilters = () => setFilters(INITIAL_FILTERS);
  const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);
  const hiddenIdSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);

  const hiddenInCurrentResultsCount = useMemo(
    () => hackathons.filter((hackathon) => hiddenIdSet.has(hackathon.id)).length,
    [hackathons, hiddenIdSet],
  );

  const visibleHackathons = useMemo(() => {
    const notHidden = hackathons.filter(
      (hackathon) => !hiddenIdSet.has(hackathon.id),
    );
    if (listMode === "saved") {
      return notHidden.filter((hackathon) => savedIdSet.has(hackathon.id));
    }
    return notHidden;
  }, [hackathons, hiddenIdSet, listMode, savedIdSet]);

  const handleToggleSaved = (hackathonId: string) => {
    setSavedIds((previous) => toggleInList(previous, hackathonId));
  };

  const handleClearWatchlist = () => {
    setSavedIds([]);
  };

  const handleHideHackathon = (hackathonId: string) => {
    setHiddenIds((previous) =>
      previous.includes(hackathonId) ? previous : [...previous, hackathonId],
    );
  };

  const handleRestoreHiddenInCurrentResults = () => {
    const currentIds = new Set(hackathons.map((hackathon) => hackathon.id));
    setHiddenIds((previous) => previous.filter((id) => !currentIds.has(id)));
  };

  const isHostedProduction = Boolean(
    import.meta.env.VITE_API_BASE_URL?.trim(),
  );

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    if (isHostedProduction) {
      setRefreshMessage(
        "Data auto-refreshes every 12 hours via GitHub Actions. Pull down to reload current data.",
      );
      setRefreshVersion((previous) => previous + 1);
      return;
    }

    const startedAt = Date.now();
    setRefreshStartedAtMs(startedAt);
    setRefreshElapsedSeconds(0);
    setIsRefreshing(true);
    setRefreshMessage(null);

    try {
      const result = await refreshHackathons();
      setRefreshMessage(
        `Updated ${result.summary.writtenToDb} events from ${result.summary.sources.length} sources.`,
      );
      setRefreshVersion((previous) => previous + 1);
    } catch (refreshError) {
      setRefreshMessage(
        refreshError instanceof Error
          ? refreshError.message
          : "Refresh failed. Please try again.",
      );
    } finally {
      setIsRefreshing(false);
      setRefreshStartedAtMs(null);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-300 via-zinc-100 to-zinc-300 text-zinc-900 overflow-hidden font-sans selection:bg-zinc-900/15">
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        availableThemes={availableThemes}
        availablePrizes={availablePrizes}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      <DataGrid
        hackathons={visibleHackathons}
        totalResults={visibleHackathons.length}
        sourceTotalResults={totalResults}
        isLoading={isLoading}
        error={error}
        onResetFilters={handleResetFilters}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshElapsedSeconds={refreshElapsedSeconds}
        refreshMessage={refreshMessage}
        lastUpdatedAt={lastUpdatedAt}
        savedIds={savedIds}
        listMode={listMode}
        onListModeChange={setListMode}
        onToggleSaved={handleToggleSaved}
        onClearWatchlist={handleClearWatchlist}
        onHideHackathon={handleHideHackathon}
        hiddenInCurrentResultsCount={hiddenInCurrentResultsCount}
        onRestoreHiddenInCurrentResults={handleRestoreHiddenInCurrentResults}
      />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        initialQuery={filters.searchQuery}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSearch={(query) =>
          setFilters((previous) => applyCommandQuery(query, previous))
        }
      />
    </div>
  );
}
