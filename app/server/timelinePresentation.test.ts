import test from "node:test";
import assert from "node:assert/strict";
import { describeTimeline } from "./timelinePresentation";

test("describeTimeline returns clear labels for upcoming events", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");
  const timeline = describeTimeline(
    "2026-03-03T12:00:00.000Z",
    "2026-03-06T18:30:00.000Z",
    now,
  );

  assert.equal(timeline.registrationStatus, "Registration opens in 2 days");
  assert.equal(timeline.startsLabel, "Registration opens Mar 3, 2026");
  assert.equal(timeline.deadlineLabel, "Registration closes Mar 6, 2026");
  assert.equal(timeline.windowLabel, "3-day window");
});

test("describeTimeline returns clear labels for ongoing events", () => {
  const now = new Date("2026-03-04T10:00:00.000Z");
  const timeline = describeTimeline(
    "2026-03-03T00:00:00.000Z",
    "2026-03-06T00:00:00.000Z",
    now,
  );

  assert.equal(timeline.registrationStatus, "Registration open");
});
