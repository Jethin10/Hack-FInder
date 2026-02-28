import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { initializeDatabase } from "./db";
import { listHackathons } from "./hackathonService";
import { parseHackathonFilters } from "./query";
import { runHackathonRefresh } from "./refreshService";

dotenv.config();

const app = express();
const database = initializeDatabase();
const port = Number(process.env.PORT ?? 8787);
const allowedOrigin = process.env.HACKHUNT_ALLOWED_ORIGIN ?? "*";

app.disable("x-powered-by");

app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "hackhunt-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/hackathons", (request, response, next) => {
  try {
    const filters = parseHackathonFilters(request.query as Record<string, unknown>);
    const payload = listHackathons(database, filters);
    response.json(payload);
  } catch (error) {
    next(error);
  }
});

app.post("/api/hackathons/refresh", async (_request, response, next) => {
  try {
    const refreshResult = await runHackathonRefresh();
    response.json({
      status: "ok",
      ...refreshResult,
    });
  } catch (error) {
    next(error);
  }
});

app.use(
  (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const errorMessage =
      error instanceof Error ? error.message : "Unexpected API error";
    response.status(500).json({
      error: "internal_server_error",
      message: errorMessage,
    });
  },
);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[hackhunt-api] listening on http://localhost:${port}`);
});
