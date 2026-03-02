import test from "node:test";
import assert from "node:assert/strict";
import {
  computeSkillMatchScore,
  rankHackathonsBySkillMatch,
} from "./skillMatcher";

test("computeSkillMatchScore returns 100 for exact overlap", () => {
  const score = computeSkillMatchScore(["AI/ML", "Productivity"], [
    "ai/ml",
    "productivity",
  ]);
  assert.equal(score, 100);
});

test("computeSkillMatchScore returns expected score for partial overlap", () => {
  const score = computeSkillMatchScore(["AI/ML", "Productivity"], ["ai/ml"]);
  // coverage=1/2=0.5, density=1/1=1 => round((0.7*0.5 + 0.3*1) * 100)=65
  assert.equal(score, 65);
});

test("computeSkillMatchScore returns 0 when there is no overlap", () => {
  const score = computeSkillMatchScore(["AI/ML"], ["web3", "blockchain"]);
  assert.equal(score, 0);
});

test("computeSkillMatchScore returns 0 when user skills are empty", () => {
  const score = computeSkillMatchScore([], ["ai/ml", "productivity"]);
  assert.equal(score, 0);
});

test("rankHackathonsBySkillMatch keeps stable ordering for equal scores", () => {
  const ranked = rankHackathonsBySkillMatch(
    [
      { id: "a", title: "Alpha Build", themes: ["AI/ML"] },
      { id: "b", title: "Beta Build", themes: ["AI/ML"] },
      { id: "c", title: "Gamma Build", themes: ["Web3"] },
    ],
    ["AI/ML"],
  );

  assert.deepEqual(
    ranked.map((item) => item.id),
    ["a", "b", "c"],
  );
  assert.equal(ranked[0].matchScore, ranked[1].matchScore);
  assert.equal(ranked[2].matchScore, 0);
});
