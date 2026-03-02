import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DisplayHackathonListItem,
  MedoCopilotResponse,
  PrizeCategory,
} from "../types";
import {
  AlertTriangle,
  Award,
  Bookmark,
  BookmarkCheck,
  Bot,
  ChevronDown,
  EyeOff,
  ExternalLink,
  Globe,
  Map,
  MapPin,
  RefreshCw,
  Scale,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import SkeletonCard from "./SkeletonCard";
import EmptyState from "./EmptyState";
import { describeTimeline } from "../../shared/timelinePresentation";
import { addToLimitedSelection } from "../lib/userState";
import { generateMedoCopilotPlan } from "../lib/api";
import MedoCopilotPanel from "./MedoCopilotPanel";

interface DataGridProps {
  hackathons: DisplayHackathonListItem[];
  totalResults: number;
  sourceTotalResults: number;
  isLoading: boolean;
  error: string | null;
  onResetFilters: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  refreshElapsedSeconds: number;
  refreshMessage: string | null;
  lastUpdatedAt: string | null;
  savedIds: string[];
  listMode: "all" | "saved";
  onListModeChange: (mode: "all" | "saved") => void;
  onToggleSaved: (hackathonId: string) => void;
  onClearWatchlist: () => void;
  onHideHackathon: (hackathonId: string) => void;
  hiddenInCurrentResultsCount: number;
  onRestoreHiddenInCurrentResults: () => void;
  userSkills: string[];
}

const PAGE_SIZE = 40;

const SOURCE_COLORS: Record<string, string> = {
  Devpost: "text-zinc-700 bg-zinc-100 border-zinc-200",
  Devfolio: "text-zinc-700 bg-zinc-100 border-zinc-200",
  MLH: "text-zinc-700 bg-zinc-100 border-zinc-200",
  HackerEarth: "text-zinc-700 bg-zinc-100 border-zinc-200",
  Unstop: "text-zinc-700 bg-zinc-100 border-zinc-200",
};

const FORMAT_STYLES: Record<string, { icon: React.ReactNode; color: string }> = {
  Online: { icon: <Globe className="w-3.5 h-3.5" />, color: "text-zinc-700" },
  Offline: { icon: <Map className="w-3.5 h-3.5" />, color: "text-zinc-700" },
  Hybrid: { icon: <MapPin className="w-3.5 h-3.5" />, color: "text-zinc-700" },
};

const timelineStatusColor = (label: string): string => {
  if (label === "Registration open") {
    return "text-zinc-900";
  }
  if (label.startsWith("Registration opens in")) {
    return "text-zinc-700";
  }
  return "text-zinc-500";
};

const sourcePillClasses = (source: string): string =>
  SOURCE_COLORS[source] ?? "text-zinc-700 bg-zinc-100 border-zinc-200";

const HackathonRow = React.memo(function HackathonRow({
  hackathon,
  isSaved,
  isCompared,
  listMode,
  onToggleSaved,
  onToggleCompare,
  onHide,
  onGenerateCopilot,
}: {
  hackathon: DisplayHackathonListItem;
  isSaved: boolean;
  isCompared: boolean;
  listMode: "all" | "saved";
  onToggleSaved: (hackathonId: string) => void;
  onToggleCompare: (hackathonId: string) => void;
  onHide: (hackathonId: string) => void;
  onGenerateCopilot: (hackathon: DisplayHackathonListItem) => void;
}) {
  const format =
    FORMAT_STYLES[hackathon.format] ?? { icon: null, color: "text-zinc-500" };
  const timeline = describeTimeline(
    hackathon.startDate,
    hackathon.finalSubmissionDate,
  );
  const statusColor = timelineStatusColor(timeline.registrationStatus);

  return (
    <article className="group rounded-2xl bg-white/98 border border-zinc-200 px-5 py-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.32)] hover:border-zinc-300 hover:shadow-[0_20px_44px_-32px_rgba(15,23,42,0.38)] transition-all">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(170px,210px)] gap-x-6 gap-y-3 items-start lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-zinc-900 truncate">
              {hackathon.title}
            </h3>
            {hackathon.organizerStatus === "trusted" && (
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border font-medium ${sourcePillClasses(
                hackathon.sourcePlatform,
              )}`}
            >
              {hackathon.sourcePlatform}
            </span>
            <span className={`inline-flex items-center gap-1 ${format.color}`}>
              {format.icon}
              {hackathon.format}
            </span>
            {hackathon.locationText &&
              hackathon.locationText !== "Global" &&
              hackathon.locationText !== "Location TBD" && (
                <span className="truncate max-w-[220px]" title={hackathon.locationText}>
                  {hackathon.locationText}
                </span>
              )}
            {typeof hackathon.distanceKm === "number" && (
              <span className="text-zinc-600">{hackathon.distanceKm.toFixed(0)} km</span>
            )}
            {typeof hackathon.matchScore === "number" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-zinc-300 bg-zinc-100 text-zinc-700 font-medium">
                {hackathon.matchScore}% Skill Match
              </span>
            )}
          </div>
          {hackathon.themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {hackathon.themes.slice(0, 3).map((theme) => (
                <span
                  key={theme}
                  className="text-[11px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200/70"
                >
                  {theme}
                </span>
              ))}
              {hackathon.themes.length > 3 && (
                <span className="text-[11px] text-zinc-500">
                  +{hackathon.themes.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="text-[11px] leading-tight lg:text-right pr-1">
          <p className={`font-semibold ${statusColor}`}>
            {timeline.registrationStatus}
          </p>
          <p className="text-zinc-600 mt-1">{timeline.startsLabel}</p>
          <p className="text-zinc-500 mt-0.5">{timeline.deadlineLabel}</p>
          <p className="text-zinc-800 font-medium mt-1">{timeline.windowLabel}</p>
        </div>

      </div>
      <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => onToggleSaved(hackathon.id)}
          className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs border transition-colors cursor-pointer ${isSaved
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-300 hover:text-zinc-950 hover:border-zinc-500"
            }`}
          title={
            isSaved
              ? listMode === "saved"
                ? "Remove from watchlist"
                : "Remove from watch later"
              : "Save for watch later"
          }
        >
          {isSaved ? (
            <BookmarkCheck className="w-3.5 h-3.5" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
          {isSaved ? (listMode === "saved" ? "Remove" : "Saved") : "Save"}
        </button>
        <button
          type="button"
          onClick={() => onToggleCompare(hackathon.id)}
          className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs border transition-colors cursor-pointer ${isCompared
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-300 hover:text-zinc-950 hover:border-zinc-500"
            }`}
          title={
            isCompared
              ? "Remove from compare selection"
              : "Add to compare selection"
          }
        >
          <Scale className="w-3.5 h-3.5" />
          {isCompared ? "Added" : "Compare"}
        </button>
        <button
          type="button"
          onClick={() => onGenerateCopilot(hackathon)}
          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs border transition-colors cursor-pointer bg-white text-zinc-700 border-zinc-300 hover:text-zinc-950 hover:border-zinc-500"
          title="Generate Medo copilot plan"
        >
          <Bot className="w-3.5 h-3.5" />
          Copilot
        </button>
        <button
          type="button"
          onClick={() => onHide(hackathon.id)}
          className="inline-flex items-center justify-center px-2.5 py-2 rounded-xl text-zinc-500 border border-zinc-300 bg-white hover:text-zinc-900 hover:border-zinc-500 transition-colors cursor-pointer"
          title="Hide from current instance"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
        <a
          href={hackathon.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-900 bg-zinc-100 border border-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors cursor-pointer"
        >
          {hackathon.prizes.length > 0 &&
            hackathon.prizes[0] !== "Unspecified" && (
              <Award className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-200" />
            )}
          Apply
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </article >
  );
});

export default function DataGrid({
  hackathons,
  totalResults,
  sourceTotalResults,
  isLoading,
  error,
  onResetFilters,
  onRefresh,
  isRefreshing,
  refreshElapsedSeconds,
  refreshMessage,
  lastUpdatedAt,
  savedIds,
  listMode,
  onListModeChange,
  onToggleSaved,
  onClearWatchlist,
  onHideHackathon,
  hiddenInCurrentResultsCount,
  onRestoreHiddenInCurrentResults,
  userSkills,
}: DataGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isClearWatchlistConfirmOpen, setIsClearWatchlistConfirmOpen] =
    useState(false);
  const [compareWarning, setCompareWarning] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [copilotResult, setCopilotResult] = useState<MedoCopilotResponse | null>(
    null,
  );
  const [selectedHackathon, setSelectedHackathon] =
    useState<DisplayHackathonListItem | null>(null);
  const dataKey = hackathons.length;
  const [prevDataKey, setPrevDataKey] = useState(dataKey);
  if (dataKey !== prevDataKey) {
    setVisibleCount(PAGE_SIZE);
    setPrevDataKey(dataKey);
  }

  const visibleHackathons = useMemo(
    () => hackathons.slice(0, visibleCount),
    [hackathons, visibleCount],
  );
  const hasMore = visibleCount < hackathons.length;
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, hackathons.length));
  }, [hackathons.length]);
  const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);
  const compareIdSet = useMemo(() => new Set(compareIds), [compareIds]);

  useEffect(() => {
    const currentIds = new Set(hackathons.map((hackathon) => hackathon.id));
    setCompareIds((previous) => previous.filter((id) => currentIds.has(id)));
  }, [hackathons]);

  const compareHackathons = useMemo(
    () =>
      hackathons.filter((hackathon) => compareIdSet.has(hackathon.id)).slice(0, 3),
    [compareIdSet, hackathons],
  );

  const handleToggleCompare = (hackathonId: string) => {
    setCompareWarning(null);
    setCompareIds((previous) => {
      const result = addToLimitedSelection(previous, hackathonId, 3);
      if (result.reachedLimit) {
        setCompareWarning("You can compare up to 3 hackathons at once.");
      }
      return result.ids;
    });
  };

  const handleConfirmClearWatchlist = () => {
    onClearWatchlist();
    setIsClearWatchlistConfirmOpen(false);
    if (listMode === "saved") {
      onListModeChange("all");
    }
  };

  const handleGenerateCopilot = async (hackathon: DisplayHackathonListItem) => {
    setSelectedHackathon(hackathon);
    setIsCopilotOpen(true);
    setCopilotError(null);
    setCopilotResult(null);
    setCopilotLoading(true);

    try {
      const result = await generateMedoCopilotPlan({
        hackathonContext: {
          id: hackathon.id,
          title: hackathon.title,
          format: hackathon.format,
          themes: hackathon.themes,
          startDate: hackathon.startDate,
          finalSubmissionDate: hackathon.finalSubmissionDate,
          prizes: hackathon.prizes as PrizeCategory[],
          locationText: hackathon.locationText,
        },
        userSkills,
        goal: `Build a practical project for ${hackathon.title}`,
        constraints: {
          hoursAvailable: 8,
          teamSize: 1,
          skillLevel: "beginner",
        },
      });
      setCopilotResult(result);
    } catch (copilotFetchError) {
      setCopilotError(
        copilotFetchError instanceof Error
          ? copilotFetchError.message
          : "Copilot request failed",
      );
    } finally {
      setCopilotLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="mb-5">
            <div className="skeleton h-8 w-52 mb-2" />
            <div className="skeleton h-4 w-40" />
          </div>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center rounded-2xl bg-white border border-zinc-300 px-6 py-7 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.38)]">
          <AlertTriangle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-900 mb-1">
            Failed to load hackathons
          </p>
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      </main>
    );
  }

  if (hackathons.length === 0) {
    if (listMode === "saved") {
      return (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center rounded-2xl bg-white border border-zinc-300 px-6 py-7 shadow-[0_24px_56px_-40px_rgba(15,23,42,0.35)]">
            <Bookmark className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-zinc-900 mb-1">
              No Saved Hackathons In This View
            </p>
            <p className="text-sm text-zinc-500 mb-4">
              Saved hackathons appear here when they match your current filters.
            </p>
            <button
              type="button"
              onClick={() => onListModeChange("all")}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-sm font-medium border bg-white border-zinc-300 text-zinc-800 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
            >
              Back To All Results
            </button>
          </div>
        </main>
      );
    }
    return <EmptyState onReset={onResetFilters} />;
  }

  return (
    <main className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-5 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-[0_30px_64px_-42px_rgba(15,23,42,0.58)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">
                Hackathons
              </h1>
              <p className="text-sm text-zinc-300">
                Showing {totalResults} visible of {sourceTotalResults} matching the
                current filter set.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="inline-flex rounded-xl border border-zinc-700 p-1 bg-zinc-800">
                <button
                  type="button"
                  onClick={() => onListModeChange("all")}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${listMode === "all"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-300 hover:text-zinc-100"
                    }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => onListModeChange("saved")}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${listMode === "saved"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-300 hover:text-zinc-100"
                    }`}
                >
                  Watchlist ({savedIds.length})
                </button>
              </div>
              {savedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearWatchlistConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-zinc-700 text-zinc-200 bg-zinc-800 hover:border-zinc-500 hover:text-zinc-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Empty Watchlist
                </button>
              )}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${isRefreshing
                  ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-100 border-zinc-100 text-zinc-900 hover:bg-zinc-300 hover:border-zinc-300 cursor-pointer"
                  }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? `Refreshing ${refreshElapsedSeconds}s` : "Refresh"}
              </button>
            </div>
          </div>

          {(refreshMessage || lastUpdatedAt) && (
            <div className="mt-3 text-xs text-zinc-300 flex flex-wrap items-center gap-2">
              {lastUpdatedAt && (
                <span>
                  Last updated{" "}
                  {new Date(lastUpdatedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {refreshMessage && <span>• {refreshMessage}</span>}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            <span>Saved for later: {savedIds.length}</span>
            {hiddenInCurrentResultsCount > 0 && (
              <>
                <span>• Hidden in this view: {hiddenInCurrentResultsCount}</span>
                <button
                  type="button"
                  onClick={onRestoreHiddenInCurrentResults}
                  className="text-zinc-100 hover:text-zinc-300 underline underline-offset-2 cursor-pointer"
                >
                  Restore hidden
                </button>
              </>
            )}
          </div>
        </header>

        <div className="space-y-3">
          {visibleHackathons.map((hackathon) => (
            <HackathonRow
              key={hackathon.id}
              hackathon={hackathon}
              isSaved={savedIdSet.has(hackathon.id)}
              isCompared={compareIdSet.has(hackathon.id)}
              listMode={listMode}
              onToggleSaved={onToggleSaved}
              onToggleCompare={handleToggleCompare}
              onHide={onHideHackathon}
              onGenerateCopilot={handleGenerateCopilot}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center pt-7 pb-4">
            <button
              type="button"
              onClick={loadMore}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:border-zinc-500 hover:text-zinc-900 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
              Show more ({hackathons.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
      {compareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(860px,calc(100vw-2rem))] rounded-2xl bg-zinc-900/96 backdrop-blur border border-zinc-700 shadow-[0_24px_54px_-34px_rgba(15,23,42,0.58)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                Compare Selection ({compareHackathons.length}/3)
              </p>
              <p className="text-xs text-zinc-300">
                Pick 2 to 3 hackathons to compare details side-by-side.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
              <button
                type="button"
                disabled={compareHackathons.length < 2}
                onClick={() => setIsCompareOpen(true)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs border transition-colors ${compareHackathons.length < 2
                  ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-100 border-zinc-100 text-zinc-900 hover:bg-zinc-300 hover:border-zinc-300 cursor-pointer"
                  }`}
              >
                <Scale className="w-3.5 h-3.5" />
                Open Compare
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {compareHackathons.map((hackathon) => (
              <span
                key={hackathon.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-200 border border-zinc-700"
              >
                {hackathon.title}
                <button
                  type="button"
                  onClick={() => handleToggleCompare(hackathon.id)}
                  className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  title="Remove from compare"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          {compareWarning && (
            <p className="mt-2 text-xs text-zinc-300">{compareWarning}</p>
          )}
        </div>
      )}
      {isCompareOpen && compareHackathons.length >= 2 && (
        <div className="fixed inset-0 z-50 bg-zinc-900/35 backdrop-blur-sm p-4 sm:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto rounded-3xl bg-white border border-zinc-300 shadow-[0_38px_90px_-46px_rgba(15,23,42,0.5)]">
            <div className="sticky top-0 z-10 bg-white/96 backdrop-blur rounded-t-3xl border-b border-zinc-200 px-5 py-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Compare Hackathons</h2>
                <p className="text-xs text-zinc-500">
                  Side-by-side overview to decide faster.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-500 transition-colors cursor-pointer"
                title="Close compare"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-x-auto">
              <div className="grid gap-3" style={{ gridTemplateColumns: `220px repeat(${compareHackathons.length}, minmax(220px, 1fr))` }}>
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.14em]">
                  Field
                </div>
                {compareHackathons.map((hackathon) => (
                  <div key={hackathon.id} className="text-sm font-semibold text-zinc-900">
                    {hackathon.title}
                  </div>
                ))}

                <div className="text-sm text-zinc-500">Source</div>
                {compareHackathons.map((hackathon) => (
                  <div key={`${hackathon.id}-source`} className="text-sm text-zinc-800">
                    {hackathon.sourcePlatform}
                  </div>
                ))}

                <div className="text-sm text-zinc-500">Format</div>
                {compareHackathons.map((hackathon) => (
                  <div key={`${hackathon.id}-format`} className="text-sm text-zinc-800">
                    {hackathon.format}
                  </div>
                ))}

                <div className="text-sm text-zinc-500">Location</div>
                {compareHackathons.map((hackathon) => (
                  <div key={`${hackathon.id}-location`} className="text-sm text-zinc-800">
                    {hackathon.locationText || "Unspecified"}
                  </div>
                ))}

                <div className="text-sm text-zinc-500">Registration Status</div>
                {compareHackathons.map((hackathon) => {
                  const timeline = describeTimeline(
                    hackathon.startDate,
                    hackathon.finalSubmissionDate,
                  );
                  return (
                    <div key={`${hackathon.id}-status`} className="text-sm text-zinc-800">
                      {timeline.registrationStatus}
                    </div>
                  );
                })}

                <div className="text-sm text-zinc-500">Registration Opens</div>
                {compareHackathons.map((hackathon) => {
                  const timeline = describeTimeline(
                    hackathon.startDate,
                    hackathon.finalSubmissionDate,
                  );
                  return (
                    <div key={`${hackathon.id}-opens`} className="text-sm text-zinc-800">
                      {timeline.startsLabel}
                    </div>
                  );
                })}

                <div className="text-sm text-zinc-500">Registration Deadline</div>
                {compareHackathons.map((hackathon) => {
                  const timeline = describeTimeline(
                    hackathon.startDate,
                    hackathon.finalSubmissionDate,
                  );
                  return (
                    <div key={`${hackathon.id}-deadline`} className="text-sm text-zinc-800">
                      {timeline.deadlineLabel}
                    </div>
                  );
                })}

                <div className="text-sm text-zinc-500">Event Window</div>
                {compareHackathons.map((hackathon) => {
                  const timeline = describeTimeline(
                    hackathon.startDate,
                    hackathon.finalSubmissionDate,
                  );
                  return (
                    <div key={`${hackathon.id}-window`} className="text-sm text-zinc-800">
                      {timeline.windowLabel}
                    </div>
                  );
                })}

                <div className="text-sm text-zinc-500">Themes</div>
                {compareHackathons.map((hackathon) => (
                  <div key={`${hackathon.id}-themes`} className="text-sm text-zinc-800">
                    {hackathon.themes.length > 0
                      ? hackathon.themes.join(", ")
                      : "Unspecified"}
                  </div>
                ))}

                <div className="text-sm text-zinc-500">Prizes</div>
                {compareHackathons.map((hackathon) => (
                  <div key={`${hackathon.id}-prizes`} className="text-sm text-zinc-800">
                    {hackathon.prizes.length > 0
                      ? hackathon.prizes.join(", ")
                      : "Unspecified"}
                  </div>
                ))}

                <div className="text-sm text-zinc-500">Organizer Track</div>
                {compareHackathons.map((hackathon) => (
                  <div key={`${hackathon.id}-org`} className="text-sm text-zinc-800 capitalize">
                    {hackathon.organizerStatus}
                  </div>
                ))}

                <div className="text-sm text-zinc-500">Apply</div>
                {compareHackathons.map((hackathon) => (
                  <div key={`${hackathon.id}-apply`} className="text-sm">
                    <a
                      href={hackathon.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-zinc-900 hover:text-zinc-600"
                    >
                      Open Link
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <MedoCopilotPanel
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        isLoading={copilotLoading}
        error={copilotError}
        result={copilotResult}
        hackathonTitle={selectedHackathon?.title ?? null}
      />
      {isClearWatchlistConfirmOpen && (
        <div className="fixed inset-0 z-[60] bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-300 bg-white shadow-[0_36px_90px_-48px_rgba(15,23,42,0.52)] p-5">
            <h3 className="text-base font-semibold text-zinc-900">
              Empty Watchlist
            </h3>
            <p className="mt-1.5 text-sm text-zinc-500">
              This will remove all saved hackathons from your watchlist.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearWatchlistConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl text-sm font-medium border border-zinc-300 text-zinc-700 bg-white hover:border-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearWatchlist}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-zinc-900 text-white bg-zinc-900 hover:bg-zinc-700 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Empty
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
