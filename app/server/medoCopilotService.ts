import {
  MedoCopilotRequest,
  MedoCopilotResponse,
  MedoSkillLevel,
} from "../shared/contracts";

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 2;

export type { MedoCopilotRequest, MedoCopilotResponse };

interface GenerateMedoCopilotPlanOptions {
  medoApiUrl?: string;
  medoApiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isSkillLevel = (value: unknown): value is MedoSkillLevel =>
  value === "beginner" || value === "intermediate" || value === "advanced";

const parseMedoCopilotResponse = (value: unknown): MedoCopilotResponse | null => {
  if (!isObject(value)) {
    return null;
  }

  const judgingAlignment = isObject(value.judgingAlignment)
    ? value.judgingAlignment
    : null;
  const submissionKit = isObject(value.submissionKit) ? value.submissionKit : null;

  if (
    typeof value.projectTitle !== "string" ||
    typeof value.oneLinePitch !== "string" ||
    typeof value.problemStatement !== "string" ||
    typeof value.solutionOverview !== "string" ||
    !Array.isArray(value.architecture) ||
    !Array.isArray(value.buildPlan) ||
    !judgingAlignment ||
    !submissionKit ||
    typeof judgingAlignment.execution !== "string" ||
    typeof judgingAlignment.usefulness !== "string" ||
    typeof judgingAlignment.creativity !== "string" ||
    typeof judgingAlignment.design !== "string" ||
    typeof judgingAlignment.complexity !== "string" ||
    typeof submissionKit.devpostSummary !== "string" ||
    typeof submissionKit.demoScript60s !== "string" ||
    !Array.isArray(submissionKit.checklist) ||
    !Array.isArray(value.riskMitigation)
  ) {
    return null;
  }

  const architecture = toStringArray(value.architecture);
  const buildPlan = toStringArray(value.buildPlan);
  const checklist = toStringArray(submissionKit.checklist);
  const riskMitigation = toStringArray(value.riskMitigation);

  if (
    architecture.length === 0 ||
    buildPlan.length === 0 ||
    checklist.length === 0 ||
    riskMitigation.length === 0
  ) {
    return null;
  }

  return {
    projectTitle: value.projectTitle,
    oneLinePitch: value.oneLinePitch,
    problemStatement: value.problemStatement,
    solutionOverview: value.solutionOverview,
    architecture,
    buildPlan,
    judgingAlignment: {
      execution: judgingAlignment.execution,
      usefulness: judgingAlignment.usefulness,
      creativity: judgingAlignment.creativity,
      design: judgingAlignment.design,
      complexity: judgingAlignment.complexity,
    },
    submissionKit: {
      devpostSummary: submissionKit.devpostSummary,
      demoScript60s: submissionKit.demoScript60s,
      checklist,
    },
    riskMitigation,
  };
};

const tryParseJsonFromString = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const pickResponseCandidate = (payload: unknown): unknown => {
  if (!isObject(payload)) {
    return null;
  }

  const direct = parseMedoCopilotResponse(payload);
  if (direct) {
    return direct;
  }

  const nestedCandidates: unknown[] = [
    payload.data,
    payload.result,
    payload.output,
    isObject(payload.response) ? payload.response : null,
    isObject(payload.message) ? payload.message : null,
  ];

  for (const candidate of nestedCandidates) {
    const parsed = parseMedoCopilotResponse(candidate);
    if (parsed) {
      return parsed;
    }
  }

  if (typeof payload.output === "string") {
    return tryParseJsonFromString(payload.output);
  }

  if (
    Array.isArray(payload.choices) &&
    payload.choices.length > 0 &&
    isObject(payload.choices[0]) &&
    isObject(payload.choices[0].message) &&
    typeof payload.choices[0].message.content === "string"
  ) {
    return tryParseJsonFromString(payload.choices[0].message.content);
  }

  return null;
};

const buildPrompt = (request: MedoCopilotRequest): string =>
  [
    "You are a hackathon copilot.",
    "Return JSON only. Do not include markdown fences.",
    "All fields are required and must match this schema:",
    JSON.stringify(
      {
        projectTitle: "string",
        oneLinePitch: "string",
        problemStatement: "string",
        solutionOverview: "string",
        architecture: ["string"],
        buildPlan: ["string"],
        judgingAlignment: {
          execution: "string",
          usefulness: "string",
          creativity: "string",
          design: "string",
          complexity: "string",
        },
        submissionKit: {
          devpostSummary: "string",
          demoScript60s: "string",
          checklist: ["string"],
        },
        riskMitigation: ["string"],
      },
      null,
      2,
    ),
    "Hackathon Context:",
    JSON.stringify(request.hackathonContext, null, 2),
    "User Skills:",
    JSON.stringify(request.userSkills, null, 2),
    "Goal:",
    request.goal,
    "Constraints:",
    JSON.stringify(request.constraints, null, 2),
    "Must explicitly optimize for judging criteria: Execution, Usefulness, Creativity, Design, Technical Complexity.",
  ].join("\n");

const buildFallbackResponse = (request: MedoCopilotRequest): MedoCopilotResponse => {
  const topThemes = request.hackathonContext.themes.slice(0, 2).join(" + ");
  const themeText = topThemes || "the hackathon theme";
  const skillsText =
    request.userSkills.length > 0 ? request.userSkills.join(", ") : "your core skills";

  return {
    projectTitle: `${request.hackathonContext.title} Copilot Project`,
    oneLinePitch: `Build a practical ${themeText} app using ${skillsText}.`,
    problemStatement:
      "Students often struggle to turn ideas into working projects within short hackathon windows.",
    solutionOverview:
      "Create an agent-assisted workflow app that plans tasks, tracks progress, and generates submission-ready outputs.",
    architecture: [
      "React frontend for user inputs and result views",
      "Express API for orchestration and validation",
      "Medo API integration for guided planning output",
    ],
    buildPlan: [
      "Define one focused user problem and success metric",
      "Implement core interaction flow and working prototype",
      "Add submission polish: screenshots, summary, and demo script",
    ],
    judgingAlignment: {
      execution: "Working end-to-end flow with clear UI and reliable API handling.",
      usefulness: "Solves project-scoping pain for students under time pressure.",
      creativity: "Combines hackathon discovery with AI-guided execution.",
      design: "Simple, clear interaction with actionable outputs.",
      complexity: "Demonstrates API orchestration, validation, and recommendation logic.",
    },
    submissionKit: {
      devpostSummary:
        "A skill-aware hackathon copilot that turns event context into an actionable build and submission strategy.",
      demoScript60s:
        "Show skill profile, open a hackathon card, generate plan with Medo, then present build checklist and judging alignment.",
      checklist: [
        "Working prototype link",
        "Problem + solution summary",
        "Short demo video",
        "Repository and run instructions",
      ],
    },
    riskMitigation: [
      "Keep scope to one polished user flow",
      "Use fallback response if external API fails",
      "Prioritize reliability over feature breadth",
    ],
  };
};

const sleep = async (durationMs: number): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, durationMs));

const callMedoApi = async (
  request: MedoCopilotRequest,
  options: GenerateMedoCopilotPlanOptions,
): Promise<MedoCopilotResponse | null> => {
  const medoApiUrl = options.medoApiUrl ?? process.env.MEDO_API_URL?.trim();
  const medoApiKey = options.medoApiKey ?? process.env.MEDO_API_KEY?.trim();
  if (!medoApiUrl || !medoApiKey) {
    return null;
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const envTimeout = Number(process.env.MEDO_API_TIMEOUT_MS);
  const timeoutMs = Math.max(
    2_000,
    options.timeoutMs ??
      (Number.isFinite(envTimeout) ? envTimeout : DEFAULT_TIMEOUT_MS),
  );

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(medoApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${medoApiKey}`,
        },
        body: JSON.stringify({
          input: {
            prompt: buildPrompt(request),
            request,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (attempt < MAX_ATTEMPTS) {
          await sleep(150 * attempt);
          continue;
        }
        return null;
      }

      const payload = (await response.json()) as unknown;
      const candidate = pickResponseCandidate(payload);
      const parsed = parseMedoCopilotResponse(candidate);
      if (parsed) {
        return parsed;
      }

      if (attempt < MAX_ATTEMPTS) {
        await sleep(150 * attempt);
        continue;
      }
      return null;
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(150 * attempt);
        continue;
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
};

export const validateMedoCopilotRequest = (value: unknown): MedoCopilotRequest => {
  if (!isObject(value)) {
    throw new Error("Invalid request payload");
  }
  if (!isObject(value.hackathonContext)) {
    throw new Error("Invalid request payload: hackathonContext is required");
  }
  if (!isObject(value.constraints)) {
    throw new Error("Invalid request payload: constraints is required");
  }

  const hackathonContext = value.hackathonContext;
  const constraints = value.constraints;
  const userSkills = toStringArray(value.userSkills);

  if (
    typeof hackathonContext.id !== "string" ||
    hackathonContext.id.trim().length === 0 ||
    typeof hackathonContext.title !== "string" ||
    hackathonContext.title.trim().length === 0 ||
    (hackathonContext.format !== "Online" &&
      hackathonContext.format !== "Offline" &&
      hackathonContext.format !== "Hybrid") ||
    !Array.isArray(hackathonContext.themes) ||
    typeof hackathonContext.startDate !== "string" ||
    typeof hackathonContext.finalSubmissionDate !== "string" ||
    !Array.isArray(hackathonContext.prizes) ||
    typeof hackathonContext.locationText !== "string"
  ) {
    throw new Error("Invalid request payload: hackathonContext fields are invalid");
  }

  if (
    typeof value.goal !== "string" ||
    value.goal.trim().length === 0 ||
    typeof constraints.hoursAvailable !== "number" ||
    !Number.isFinite(constraints.hoursAvailable) ||
    constraints.hoursAvailable <= 0 ||
    typeof constraints.teamSize !== "number" ||
    !Number.isFinite(constraints.teamSize) ||
    constraints.teamSize <= 0 ||
    !isSkillLevel(constraints.skillLevel)
  ) {
    throw new Error("Invalid request payload: constraints/goal are invalid");
  }

  return {
    hackathonContext: {
      id: hackathonContext.id.trim(),
      title: hackathonContext.title.trim(),
      format: hackathonContext.format,
      themes: toStringArray(hackathonContext.themes),
      startDate: hackathonContext.startDate,
      finalSubmissionDate: hackathonContext.finalSubmissionDate,
      prizes: toStringArray(hackathonContext.prizes) as MedoCopilotRequest["hackathonContext"]["prizes"],
      locationText: hackathonContext.locationText.trim(),
    },
    userSkills: userSkills.map((item) => item.trim()).filter(Boolean),
    goal: value.goal.trim(),
    constraints: {
      hoursAvailable: Math.round(constraints.hoursAvailable),
      teamSize: Math.round(constraints.teamSize),
      skillLevel: constraints.skillLevel,
    },
  };
};

export const generateMedoCopilotPlan = async (
  request: MedoCopilotRequest,
  options: GenerateMedoCopilotPlanOptions = {},
): Promise<MedoCopilotResponse> => {
  const validated = validateMedoCopilotRequest(request);
  const externalResponse = await callMedoApi(validated, options);
  if (externalResponse) {
    return externalResponse;
  }
  return buildFallbackResponse(validated);
};
