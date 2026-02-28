import test from "node:test";
import assert from "node:assert/strict";
import {
  addToLimitedSelection,
  normalizeStoredIds,
  removeFromList,
  toggleInList,
} from "./userState";

test("normalizeStoredIds keeps stable unique ids", () => {
  const normalized = normalizeStoredIds([
    "a",
    "",
    "a",
    "  b  ",
    42,
    null,
    "c",
  ]);
  assert.deepEqual(normalized, ["a", "b", "c"]);
});

test("toggleInList adds and removes ids", () => {
  const added = toggleInList(["a"], "b");
  assert.deepEqual(added, ["a", "b"]);

  const removed = toggleInList(added, "a");
  assert.deepEqual(removed, ["b"]);
});

test("removeFromList removes matching id only", () => {
  const next = removeFromList(["a", "b", "c"], "b");
  assert.deepEqual(next, ["a", "c"]);
});

test("addToLimitedSelection enforces max count", () => {
  const first = addToLimitedSelection(["a", "b"], "c", 3);
  assert.deepEqual(first.ids, ["a", "b", "c"]);
  assert.equal(first.reachedLimit, false);

  const second = addToLimitedSelection(["a", "b", "c"], "d", 3);
  assert.deepEqual(second.ids, ["a", "b", "c"]);
  assert.equal(second.reachedLimit, true);
});
