import React, { useMemo, useState } from "react";
import { FilterState } from "../types";
import {
  LOCATION_COORDINATES_BY_LABEL,
  LOCATION_OPTIONS,
} from "../constants/locations";
import {
  ChevronDown,
  Globe,
  Map,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";

interface SidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableThemes: string[];
  availablePrizes: FilterState["prizes"];
  onOpenCommandPalette: () => void;
}

const START_WINDOW_PRESETS = [1, 3, 5, 7, 14];
const FORMAT_OPTIONS = [
  {
    key: "online" as const,
    label: "Online",
    icon: <Globe className="w-3.5 h-3.5" />,
  },
  {
    key: "offline" as const,
    label: "In-Person",
    icon: <Map className="w-3.5 h-3.5" />,
  },
  {
    key: "hybrid" as const,
    label: "Hybrid",
    icon: <MapPin className="w-3.5 h-3.5" />,
  },
];

const INPUT_CLASS =
  "w-full bg-white border border-zinc-300 rounded-xl px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:border-zinc-600 transition-all";
const TOP_INPUT_CLASS =
  "w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-400 transition-all";
const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`;
const CHIP_CLASS =
  "px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer";

function Section({
  title,
  children,
  defaultOpen = true,
  subtitle,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-zinc-200/80 pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex items-center justify-between w-full mb-3 cursor-pointer"
      >
        <div className="text-left">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.16em]">
            {title}
          </p>
          {subtitle && <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 group-hover:text-zinc-700 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && <div>{children}</div>}
    </section>
  );
}

export default function Sidebar({
  filters,
  setFilters,
  availableThemes,
  availablePrizes,
  onOpenCommandPalette,
}: SidebarProps) {
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  const startWithinInputValue = useMemo(
    () =>
      typeof filters.startWithinDays === "number"
        ? String(filters.startWithinDays)
        : "",
    [filters.startWithinDays],
  );

  const resetFilters = () => {
    setSearchInput("");
    setFilters({
      format: { online: true, offline: true, hybrid: true },
      location: { baseLocation: "Anywhere", baseCoordinates: undefined, radiusKm: 50 },
      startWithinDays: undefined,
      timeToFinal: "any",
      startProximity: "any",
      organizerTrackRecord: "any",
      themes: [],
      prizes: [],
      searchQuery: "",
      sortBy: "startDate",
      sortOrder: "asc",
    });
  };

  const handleFormatChange = (format: keyof FilterState["format"]) => {
    setFilters((prev) => ({
      ...prev,
      format: { ...prev.format, [format]: !prev.format[format] },
    }));
  };

  const handleThemeToggle = (theme: string) => {
    setFilters((prev) => ({
      ...prev,
      themes: prev.themes.includes(theme)
        ? prev.themes.filter((t) => t !== theme)
        : [...prev.themes, theme],
    }));
  };

  const handlePrizeToggle = (prize: FilterState["prizes"][number]) => {
    setFilters((prev) => ({
      ...prev,
      prizes: prev.prizes.includes(prize)
        ? prev.prizes.filter((p) => p !== prize)
        : [...prev.prizes, prize],
    }));
  };

  const handleLocationChange = (val: string) => {
    if (val === "📍 Use My Location") {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setFilters((prev) => ({
              ...prev,
              location: {
                baseLocation: "My Location",
                baseCoordinates: {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                },
                radiusKm: prev.location.radiusKm,
              },
            }));
          },
          () => {
            setFilters((prev) => ({
              ...prev,
              location: {
                ...prev.location,
                baseLocation: "Anywhere",
                baseCoordinates: undefined,
              },
            }));
          },
        );
      }
      return;
    }
    setFilters((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        baseLocation: val,
        baseCoordinates: LOCATION_COORDINATES_BY_LABEL[val],
      },
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, searchQuery: searchInput }));
  };

  const clearSearch = () => {
    setSearchInput("");
    setFilters((prev) => ({ ...prev, searchQuery: "" }));
  };

  const handleStartWithinDaysChip = (days: number) => {
    setFilters((prev) => ({
      ...prev,
      startWithinDays: prev.startWithinDays === days ? undefined : days,
      sortBy: "startDate",
      sortOrder: "asc",
    }));
  };

  const handleStartWithinInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = event.target.value.trim();
    if (!raw) {
      setFilters((prev) => ({ ...prev, startWithinDays: undefined }));
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const clamped = Math.min(60, Math.max(1, Math.round(parsed)));
    setFilters((prev) => ({
      ...prev,
      startWithinDays: clamped,
      sortBy: "startDate",
      sortOrder: "asc",
    }));
  };

  const activeCount = [
    !filters.format.online || !filters.format.offline || !filters.format.hybrid,
    filters.location.baseLocation !== "Anywhere",
    typeof filters.startWithinDays === "number",
    filters.timeToFinal !== "any",
    filters.startProximity !== "any",
    filters.themes.length > 0,
    filters.prizes.length > 0,
    filters.searchQuery.length > 0,
  ].filter(Boolean).length;

  return (
    <aside className="w-[340px] min-w-[320px] flex-shrink-0 h-screen overflow-y-auto px-5 py-5 bg-zinc-100/80 backdrop-blur-2xl border-r border-zinc-300 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]">
      <div className="sticky top-0 z-20 pb-3 bg-gradient-to-b from-zinc-100/95 via-zinc-100/90 to-transparent">
        <div className="rounded-3xl bg-zinc-900/96 border border-zinc-800 shadow-[0_28px_72px_-42px_rgba(15,23,42,0.6)] p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h2 className="text-xl font-semibold text-zinc-50 tracking-tight">
                HackHunt
              </h2>
              <p className="text-xs text-zinc-300 mt-1">
                Fresh hackathons with open registration.
              </p>
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors cursor-pointer"
              >
                Clear ({activeCount})
              </button>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by theme, city, or organizer"
              className={TOP_INPUT_CLASS}
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="mt-2.5 text-[11px] text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Smart query with{" "}
            <kbd className="font-mono px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-200 bg-zinc-800">
              Cmd/Ctrl + K
            </kbd>
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white/92 border border-zinc-200 shadow-[0_20px_48px_-38px_rgba(15,23,42,0.24)] px-4 py-4">
        <Section title="Format" subtitle="How you want to attend">
          <div className="grid grid-cols-1 gap-2">
            {FORMAT_OPTIONS.map(({ key, label, icon }) => {
              const active = filters.format[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleFormatChange(key)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 border transition-colors cursor-pointer ${
                    active
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {icon}
                    {label}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      active ? "bg-white" : "bg-zinc-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </Section>

        {(filters.format.offline || filters.format.hybrid) && (
          <Section title="Location" subtitle="Filter in-person and hybrid events">
            <select
              value={filters.location.baseLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className={SELECT_CLASS}
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc.label} value={loc.label}>
                  {loc.label}
                </option>
              ))}
            </select>
            {filters.location.baseLocation !== "Anywhere" && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5">
                  <span>Radius</span>
                  <span className="font-mono text-zinc-700">
                    {filters.location.radiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={filters.location.radiusKm}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        radiusKm: parseInt(e.target.value, 10),
                      },
                    }))
                  }
                  className="w-full"
                />
              </div>
            )}
            {filters.location.baseLocation === "My Location" && (
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-500">
                <Navigation className="w-3 h-3" />
                Using your device location.
              </div>
            )}
          </Section>
        )}

        <Section title="When" subtitle="Time-based registration filters">
          <div className="space-y-3.5">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/55 p-3">
              <label className="text-[11px] text-zinc-500 mb-1.5 block">
                Registration closes within next N days
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {START_WINDOW_PRESETS.map((days) => {
                  const active = filters.startWithinDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleStartWithinDaysChip(days)}
                      className={`${CHIP_CLASS} ${
                        active
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500 hover:text-zinc-900"
                      }`}
                    >
                      {days}d
                    </button>
                  );
                })}
              </div>
              <input
                type="number"
                min={1}
                max={60}
                value={startWithinInputValue}
                onChange={handleStartWithinInputChange}
                placeholder="Custom days (1-60)"
                className={`${INPUT_CLASS} py-2`}
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">
                Shows currently open registrations whose deadline is within N days.
              </p>
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">
                Event window (start to final deadline)
              </label>
              <select
                value={filters.timeToFinal}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    timeToFinal: e.target.value as FilterState["timeToFinal"],
                  }))
                }
                className={`${SELECT_CLASS} py-2`}
              >
                <option value="any">Any length</option>
                <option value="lt3days">Sprint (0-2 days)</option>
                <option value="oneWeek">Medium (3-7 days)</option>
                <option value="oneMonthPlus">Long (30+ days)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">
                Registration status quick filter
              </label>
              <select
                value={filters.startProximity}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startProximity: e.target.value as FilterState["startProximity"],
                  }))
                }
                className={`${SELECT_CLASS} py-2`}
              >
                <option value="any">Any status</option>
                <option value="happeningNow">Registration open now</option>
                <option value="lt48Hours">Opens in 48h</option>
                <option value="nextWeek">Opens this week</option>
              </select>
            </div>
          </div>
        </Section>

        {availableThemes.length > 0 && (
          <Section
            title={`Themes${filters.themes.length > 0 ? ` (${filters.themes.length})` : ""}`}
            defaultOpen={false}
            subtitle="Filter by domain focus"
          >
            <div className="flex flex-wrap gap-1.5">
              {availableThemes.map((theme) => {
                const active = filters.themes.includes(theme);
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => handleThemeToggle(theme)}
                    className={`${CHIP_CLASS} ${
                      active
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {theme}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="Prizes" defaultOpen={false} subtitle="What you want to win">
          <div className="flex flex-wrap gap-1.5">
            {availablePrizes.map((prize) => {
              const active = filters.prizes.includes(prize);
              return (
                <button
                  key={prize}
                  type="button"
                  onClick={() => handlePrizeToggle(prize)}
                  className={`${CHIP_CLASS} ${
                    active
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {prize}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Sort" defaultOpen={false} subtitle="Prioritize result order">
          <div className="space-y-2">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as FilterState["sortBy"],
                }))
              }
              className={`${SELECT_CLASS} py-2`}
            >
              <option value="startDate">Start date</option>
              <option value="daysToFinal">Duration</option>
              <option value="createdAt">Recently added</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortOrder: e.target.value as FilterState["sortOrder"],
                }))
              }
              className={`${SELECT_CLASS} py-2`}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </Section>
      </div>
    </aside>
  );
}
