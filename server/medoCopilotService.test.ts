import test from "node:test";
import assert from "node:assert/strict";
import {
  MedoCopilotRequest,
  generateMedoCopilotPlan,
  validateMedoCopilotRequest,
} from "./medoCopilotService";

const BASE_REQUEST: MedoCopilotRequest = {
  hackathonContext: {
    id: "hack-1",
    title: "LovHack x Medo",
    format: "Online",
    themes: ["AI/ML", "Productivity"],
    startDate: "2026-02-28T00:00:00.000Z",
    finalSubmissionDate: "2026-03-02T14:00:00.000Z",
    prizes: ["Unspecified"],
    locationText: "Global",
  },
  userSkills: ["AI/ML", "Frontend"],
  goal: "Build a useful student productivity copilot",
  constraints: {
    hoursAvailable: 8,
    teamSize: 1,
    skillLevel: "beginner",
  },
};

test("validateMedoCopilotRequest accepts valid payload", () => {
  const validated = validateMedoCopilotRequest(BASE_REQUEST);
  assert.equal(validated.hackathonContext.id, "hack-1");
  assert.equal(validated.userSkills.length, 2);
});

test("validateMedoCopilotRequest rejects invalid payload", () => {
  assert.throws(() =>
    validateMedoCopilotRequest({
      ...BASE_REQUEST,
      hackathonContext: {
        ...BASE_REQUEST.hackathonContext,
        id: "",
      },
    }),
  );
});

test("generateMedoCopilotPlan falls back when fetch throws", async () => {
  const result = await generateMedoCopilotPlan(BASE_REQUEST, {
    medoApiUrl: "https://api.example.com/medo",
    medoApiKey: "x-test",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });

  assert.equal(typeof result.projectTitle, "string");
  assert.equal(result.judgingAlignment.execution.length > 0, true);
  assert.equal(result.submissionKit.checklist.length > 0, true);
});

test("generateMedoCopilotPlan falls back when API returns invalid response shape", async () => {
  const result = await generateMedoCopilotPlan(BASE_REQUEST, {
    medoApiUrl: "https://api.example.com/medo",
    medoApiKey: "x-test",
    fetchImpl: async () =>
      new Response(JSON.stringify({ foo: "bar" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });

  assert.equal(typeof result.problemStatement, "string");
  assert.equal(Array.isArray(result.buildPlan), true);
  assert.equal(result.riskMitigation.length > 0, true);
});
