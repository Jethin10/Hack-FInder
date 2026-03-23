import test from "node:test";
import assert from "node:assert/strict";
import { parseHackathonFilters } from "./query";

test("parseHackathonFilters parses startWithinDays", () => {
  const filters = parseHackathonFilters({ startWithinDays: "5" });
  assert.equal(filters.startWithinDays, 5);
});

test("parseHackathonFilters clamps startWithinDays to bounds", () => {
  const lower = parseHackathonFilters({ startWithinDays: "-10" });
  assert.equal(lower.startWithinDays, undefined);

  const upper = parseHackathonFilters({ startWithinDays: "999" });
  assert.equal(upper.startWithinDays, 60);
});
