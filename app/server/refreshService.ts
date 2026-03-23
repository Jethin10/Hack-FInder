import { spawn } from "node:child_process";

export interface RefreshRequest {
  command: string;
  args: string[];
}

export interface RefreshSummary {
  status: string;
  sources: string[];
  fetched: number;
  writtenToDb: number;
  writtenToJson: number;
  deactivatedInDb: number;
}

export interface RefreshResult {
  startedAt: string;
  completedAt: string;
  summary: RefreshSummary;
}

const REFRESH_TIMEOUT_MS = 15 * 60 * 1000;

const coerceNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const resolveRefreshRequest = (): RefreshRequest => {
  const command = process.env.HACKHUNT_PYTHON_BIN?.trim() || "python";
  const maxPages = process.env.HACKHUNT_REFRESH_MAX_PAGES?.trim() || "0";
  return {
    command,
    args: ["scripts/run_ingestion.py", "--max-pages", maxPages],
  };
};

export const extractSummaryFromIngestionOutput = (
  output: string,
): RefreshSummary => {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const parsed = JSON.parse(lines[index]) as Record<string, unknown>;
      if (typeof parsed.fetched === "undefined") {
        continue;
      }
      return {
        status: String(parsed.status ?? "ok"),
        sources: Array.isArray(parsed.sources)
          ? parsed.sources
              .filter((source): source is string => typeof source === "string")
              .map((source) => source.trim())
              .filter(Boolean)
          : [],
        fetched: coerceNumber(parsed.fetched),
        writtenToDb: coerceNumber(parsed.written_to_db),
        writtenToJson: coerceNumber(parsed.written_to_json),
        deactivatedInDb: coerceNumber(parsed.deactivated_in_db),
      };
    } catch {
      continue;
    }
  }

  throw new Error("Ingestion summary was not found in script output");
};

const runRefreshCommand = async (request: RefreshRequest): Promise<string> =>
  await new Promise<string>((resolve, reject) => {
    const child = spawn(request.command, request.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timeout = setTimeout(() => {
      if (finished) {
        return;
      }
      finished = true;
      child.kill("SIGTERM");
      reject(new Error("Refresh ingestion timed out"));
    }, REFRESH_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (exitCode) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timeout);
      if (exitCode !== 0) {
        const message = stderr.trim() || stdout.trim() || "refresh ingestion failed";
        reject(new Error(message));
        return;
      }
      resolve(stdout);
    });
  });

let inFlightRefresh: Promise<RefreshResult> | null = null;

const executeRefresh = async (): Promise<RefreshResult> => {
  const startedAt = new Date().toISOString();
  const request = resolveRefreshRequest();
  const output = await runRefreshCommand(request);
  const summary = extractSummaryFromIngestionOutput(output);
  return {
    startedAt,
    completedAt: new Date().toISOString(),
    summary,
  };
};

export const runHackathonRefresh = async (): Promise<RefreshResult> => {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = executeRefresh();
  try {
    return await inFlightRefresh;
  } finally {
    inFlightRefresh = null;
  }
};
