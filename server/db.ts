import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { Hackathon, PrizeCategory } from "../shared/contracts";
import { createSeedHackathons } from "./seed";

export type SqliteDatabase = InstanceType<typeof Database>;

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "hackhunt.db");
const DEFAULT_INGESTED_JSON_PATH = path.join(
  process.cwd(),
  "data",
  "ingested_hackathons.json",
);
const VALID_PRIZE_CATEGORIES = new Set<PrizeCategory>([
  "Cash",
  "Swag",
  "Job/Internship",
  "Unspecified",
]);

const createSchema = (db: SqliteDatabase): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hackathons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      source_platform TEXT NOT NULL,
      format TEXT NOT NULL CHECK (format IN ('Online', 'Offline', 'Hybrid')),
      location_text TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      start_date TEXT NOT NULL,
      final_submission_date TEXT NOT NULL,
      days_to_final INTEGER NOT NULL CHECK (days_to_final >= 0),
      themes TEXT NOT NULL,
      organizer_past_events INTEGER NOT NULL DEFAULT 0,
      prizes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_hackathons_format ON hackathons(format);
    CREATE INDEX IF NOT EXISTS idx_hackathons_start_date ON hackathons(start_date);
    CREATE INDEX IF NOT EXISTS idx_hackathons_days_to_final ON hackathons(days_to_final);
    CREATE INDEX IF NOT EXISTS idx_hackathons_created_at ON hackathons(created_at);
  `);
};

const upsertSeedHackathons = (db: SqliteDatabase, records: Hackathon[]): void => {
  const statement = db.prepare(`
    INSERT INTO hackathons (
      id,
      title,
      url,
      source_platform,
      format,
      location_text,
      latitude,
      longitude,
      start_date,
      final_submission_date,
      days_to_final,
      themes,
      organizer_past_events,
      prizes,
      created_at,
      is_active
    ) VALUES (
      @id,
      @title,
      @url,
      @source_platform,
      @format,
      @location_text,
      @latitude,
      @longitude,
      @start_date,
      @final_submission_date,
      @days_to_final,
      @themes,
      @organizer_past_events,
      @prizes,
      @created_at,
      1
    )
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      url = excluded.url,
      source_platform = excluded.source_platform,
      format = excluded.format,
      location_text = excluded.location_text,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      start_date = excluded.start_date,
      final_submission_date = excluded.final_submission_date,
      days_to_final = excluded.days_to_final,
      themes = excluded.themes,
      organizer_past_events = excluded.organizer_past_events,
      prizes = excluded.prizes,
      created_at = excluded.created_at,
      is_active = 1;
  `);

  const transaction = db.transaction((items: Hackathon[]) => {
    for (const item of items) {
      statement.run({
        id: item.id,
        title: item.title,
        url: item.url,
        source_platform: item.sourcePlatform,
        format: item.format,
        location_text: item.locationText,
        latitude: item.coordinates?.lat ?? null,
        longitude: item.coordinates?.lng ?? null,
        start_date: item.startDate,
        final_submission_date: item.finalSubmissionDate,
        days_to_final: item.daysToFinal,
        themes: JSON.stringify(item.themes),
        organizer_past_events: item.organizerPastEvents,
        prizes: JSON.stringify(item.prizes),
        created_at: item.createdAt,
      });
    }
  });

  transaction(records);
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const parseIngestedHackathons = (raw: unknown): Hackathon[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  const records: Hackathon[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Partial<Hackathon>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.title !== "string" ||
      typeof candidate.url !== "string" ||
      typeof candidate.sourcePlatform !== "string" ||
      (candidate.format !== "Online" &&
        candidate.format !== "Offline" &&
        candidate.format !== "Hybrid") ||
      typeof candidate.locationText !== "string" ||
      typeof candidate.startDate !== "string" ||
      typeof candidate.finalSubmissionDate !== "string" ||
      typeof candidate.daysToFinal !== "number" ||
      !isStringArray(candidate.themes) ||
      typeof candidate.organizerPastEvents !== "number" ||
      !Array.isArray(candidate.prizes) ||
      typeof candidate.createdAt !== "string"
    ) {
      continue;
    }

    const coordinates =
      candidate.coordinates &&
      typeof candidate.coordinates.lat === "number" &&
      typeof candidate.coordinates.lng === "number"
        ? candidate.coordinates
        : undefined;

    const prizes = candidate.prizes.filter(
      (prize): prize is PrizeCategory =>
        typeof prize === "string" && VALID_PRIZE_CATEGORIES.has(prize as PrizeCategory),
    );

    records.push({
      id: candidate.id,
      title: candidate.title,
      url: candidate.url,
      sourcePlatform: candidate.sourcePlatform,
      format: candidate.format,
      locationText: candidate.locationText,
      coordinates,
      startDate: candidate.startDate,
      finalSubmissionDate: candidate.finalSubmissionDate,
      daysToFinal: candidate.daysToFinal,
      themes: candidate.themes,
      organizerPastEvents: candidate.organizerPastEvents,
      prizes: prizes.length > 0 ? prizes : ["Unspecified"],
      createdAt: candidate.createdAt,
    });
  }

  return records;
};

const loadIngestedHackathons = (): Hackathon[] => {
  const ingestedPath = process.env.HACKHUNT_INGESTED_JSON_PATH?.trim().length
    ? process.env.HACKHUNT_INGESTED_JSON_PATH.trim()
    : DEFAULT_INGESTED_JSON_PATH;

  if (!fs.existsSync(ingestedPath)) {
    return [];
  }

  try {
    const rawFile = fs.readFileSync(ingestedPath, "utf8");
    const parsed = JSON.parse(rawFile) as unknown;
    return parseIngestedHackathons(parsed);
  } catch {
    return [];
  }
};

const maybeSeed = (db: SqliteDatabase): void => {
  const forceSeed = process.env.HACKHUNT_FORCE_SEED === "true";
  if (forceSeed) {
    db.prepare("DELETE FROM hackathons").run();
  }

  const ingestedRecords = loadIngestedHackathons();
  if (ingestedRecords.length > 0) {
    upsertSeedHackathons(db, ingestedRecords);
    return;
  }

  const countResult = db
    .prepare("SELECT COUNT(*) AS count FROM hackathons")
    .get() as { count: number };

  if (countResult.count === 0) {
    upsertSeedHackathons(db, createSeedHackathons());
  }
};

export const initializeDatabase = (): SqliteDatabase => {
  const envDbPath = process.env.HACKHUNT_DB_PATH?.trim();
  const dbPath = envDbPath && envDbPath.length > 0 ? envDbPath : DEFAULT_DB_PATH;

  const normalizedPath = path.resolve(dbPath);
  fs.mkdirSync(path.dirname(normalizedPath), { recursive: true });

  const db = new Database(normalizedPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  createSchema(db);
  maybeSeed(db);

  return db;
};
