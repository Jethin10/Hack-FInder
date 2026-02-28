export interface TimelineDescription {
  registrationStatus: string;
  startsLabel: string;
  deadlineLabel: string;
  windowLabel: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDay = (value: Date): string =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

const toUtcDayTimestamp = (value: Date): number =>
  Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());

const pluralize = (value: number, singular: string, plural: string): string =>
  `${value} ${value === 1 ? singular : plural}`;

const buildRegistrationStatus = (
  startDate: Date,
  finalDate: Date,
  now: Date,
): string => {
  if (now < startDate) {
    const dayDelta = Math.max(
      1,
      Math.round((toUtcDayTimestamp(startDate) - toUtcDayTimestamp(now)) / DAY_MS),
    );
    return `Registration opens in ${pluralize(dayDelta, "day", "days")}`;
  }
  if (now <= finalDate) {
    return "Registration open";
  }
  return "Registration closed";
};

export const describeTimeline = (
  startIso: string,
  finalIso: string,
  now: Date = new Date(),
): TimelineDescription => {
  const startDate = new Date(startIso);
  const finalDate = new Date(finalIso);
  const dayWindow = Math.max(
    1,
    Math.round((toUtcDayTimestamp(finalDate) - toUtcDayTimestamp(startDate)) / DAY_MS),
  );

  return {
    registrationStatus: buildRegistrationStatus(startDate, finalDate, now),
    startsLabel: `Registration opens ${formatDay(startDate)}`,
    deadlineLabel: `Registration closes ${formatDay(finalDate)}`,
    windowLabel: `${dayWindow}-day window`,
  };
};
