import test from "node:test";
import assert from "node:assert/strict";
import {
  extractSummaryFromIngestionOutput,
  resolveRefreshRequest,
} from "./refreshService";

test("extractSummaryFromIngestionOutput parses last valid JSON line", () => {
  const output = [
    "some log",
    '{"status":"ok","fetched":211,"written_to_db":211,"written_to_json":211}',
    "",
  ].join("\n");

  const summary = extractSummaryFromIngestionOutput(output);
  assert.equal(summary.fetched, 211);
  assert.equal(summary.writtenToDb, 211);
  assert.equal(summary.writtenToJson, 211);
});

test("resolveRefreshRequest builds all-pages ingestion command by default", () => {
  const request = resolveRefreshRequest();
  assert.equal(request.command, "python");
  assert.deepEqual(request.args, ["scripts/run_ingestion.py", "--max-pages", "0"]);
});
