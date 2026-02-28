import test from "node:test";
import assert from "node:assert/strict";
import { isWithinRegistrationWindowDays } from "./hackathonService";

test("isWithinRegistrationWindowDays includes currently open registrations closing within range", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");
  const startDate = "2026-02-20T00:00:00.000Z";
  const finalDate = "2026-03-03T00:00:00.000Z";

  assert.equal(isWithinRegistrationWindowDays(startDate, finalDate, 5, now), true);
});

test("isWithinRegistrationWindowDays excludes open registrations closing outside range", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");
  const startDate = "2026-02-28T12:00:00.000Z";
  const finalDate = "2026-03-20T00:00:00.000Z";

  assert.equal(isWithinRegistrationWindowDays(startDate, finalDate, 5, now), false);
});

test("isWithinRegistrationWindowDays excludes closed registrations", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");
  const startDate = "2026-02-20T00:00:00.000Z";
  const finalDate = "2026-02-25T00:00:00.000Z";

  assert.equal(isWithinRegistrationWindowDays(startDate, finalDate, 5, now), false);
});

test("isWithinRegistrationWindowDays excludes registrations not yet open", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");
  const startDate = "2026-03-03T00:00:00.000Z";
  const finalDate = "2026-03-20T00:00:00.000Z";

  assert.equal(isWithinRegistrationWindowDays(startDate, finalDate, 5, now), false);
});
