import { beforeEach, describe, expect, it } from "vitest";
import { handleProgress, onRequest } from "../../functions/api/progress";
import type { D1Like } from "../../functions/_lib/d1";
import { TEST_STUDENTS, seedSql } from "../helpers/account-seed";
import { createTestD1, type TestD1 } from "../helpers/d1-sqlite";

const NOW = 1767225600000;
const IP = "203.0.113.20";
const BEN = TEST_STUDENTS[1];
const P1 = "DSP2.12345678.AAAA";
const P2 = "DSP2.abcdef01.BBBB";
const P3 = "DSP2.00000000.CCCC";
const UPDATED = NOW - 5000;

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://practice.test/api/progress", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": IP,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function save(db: D1Like, body: unknown, now = NOW): Promise<Response> {
  return handleProgress({ request: makeRequest(body), env: { DB: db } }, now);
}

function body(progress: string, updatedAt: number, code: string = BEN.code) {
  return { code, baseRevision: 0, progress, updatedAt };
}

let db: TestD1;

beforeEach(async () => {
  db = createTestD1();
  db.exec(await seedSql());
});

describe("PUT /api/progress", () => {
  it("saves the first copy into an empty account", async () => {
    const response = await save(db, body(P1, UPDATED));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ revision: 1 });

    const row = await db
      .prepare(
        "SELECT progress, revision, updated_at AS updatedAt, saved_at AS savedAt FROM students WHERE id = 2",
      )
      .first<{
        progress: string;
        revision: number;
        updatedAt: number;
        savedAt: number;
      }>();
    expect(row).toEqual({
      progress: P1,
      revision: 1,
      updatedAt: UPDATED,
      savedAt: NOW,
    });
  });

  it("accepts the next save with the revision it returned", async () => {
    await save(db, body(P1, UPDATED));
    const response = await save(db, {
      code: BEN.code,
      baseRevision: 1,
      progress: P2,
      updatedAt: UPDATED + 1000,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revision: 2 });
  });

  it("returns 409 with the online copy when the base revision is stale", async () => {
    await save(db, body(P1, UPDATED));
    await save(db, {
      code: BEN.code,
      baseRevision: 1,
      progress: P2,
      updatedAt: UPDATED + 1000,
    });

    const response = await save(db, {
      code: BEN.code,
      baseRevision: 0,
      progress: P3,
      updatedAt: UPDATED + 2000,
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "conflict",
      revision: 2,
      progress: P2,
      updatedAt: UPDATED + 1000,
    });

    const row = await db
      .prepare("SELECT progress, revision FROM students WHERE id = 2")
      .first<{ progress: string; revision: number }>();
    expect(row).toEqual({ progress: P2, revision: 2 });

    const failures = await db
      .prepare("SELECT count(*) AS total FROM login_failures")
      .first<{ total: number }>();
    expect(failures?.total).toBe(0);
  });

  it("returns 409 with an empty copy when the account has no progress", async () => {
    const response = await save(db, {
      code: BEN.code,
      baseRevision: 1,
      progress: P1,
      updatedAt: UPDATED,
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "conflict",
      revision: 0,
      progress: null,
      updatedAt: null,
    });
  });

  it("stores a client timestamp from a wrong device clock", async () => {
    for (const [baseRevision, updatedAt] of [
      [0, NOW + 172800000],
      [1, 946684799999],
    ] as const) {
      const response = await save(db, {
        code: BEN.code,
        baseRevision,
        progress: baseRevision === 0 ? P1 : P2,
        updatedAt,
      });
      expect(response.status).toBe(200);
      const row = await db
        .prepare("SELECT updated_at AS updatedAt FROM students WHERE id = 2")
        .first<{ updatedAt: number }>();
      expect(row?.updatedAt).toBe(updatedAt);
    }
  });

  it("rejects an unknown or malformed code with 401", async () => {
    const unknown = await save(db, body(P1, UPDATED, "TEST-ZZZZ-ZZZZ-ZZ"));
    expect(unknown.status).toBe(401);
    expect(await unknown.json()).toEqual({ error: "unknown-code" });

    const malformed = await save(db, body(P1, UPDATED, "not-a-code"));
    expect(malformed.status).toBe(401);

    const failures = await db
      .prepare("SELECT SUM(count) AS total FROM login_failures")
      .first<{ total: number }>();
    expect(failures?.total).toBe(2);
  });

  it("rejects a progress text that is not DSP2 with 400", async () => {
    const response = await save(db, body("DSP1.12345678.AAAA", UPDATED));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "bad-request" });
  });

  it("rejects missing or invalid fields with 400", async () => {
    const invalid = [
      {},
      { code: 42, baseRevision: 0, progress: P1, updatedAt: UPDATED },
      { code: BEN.code, baseRevision: -1, progress: P1, updatedAt: UPDATED },
      { code: BEN.code, baseRevision: 1.5, progress: P1, updatedAt: UPDATED },
      { code: BEN.code, baseRevision: "0", progress: P1, updatedAt: UPDATED },
      { code: BEN.code, baseRevision: 0, progress: 42, updatedAt: UPDATED },
      { code: BEN.code, baseRevision: 0, progress: P1 },
    ];
    for (const value of invalid) expect((await save(db, value)).status).toBe(400);
  });

  it("rejects bad JSON with 400 and a body over 16 KB with 413", async () => {
    expect((await save(db, "{not json")).status).toBe(400);
    const oversized = JSON.stringify({
      code: BEN.code,
      baseRevision: 0,
      progress: `DSP2.12345678.${"A".repeat(20000)}`,
      updatedAt: UPDATED,
    });
    expect((await save(db, oversized)).status).toBe(413);
  });

  it("answers unsupported methods with 405 and no-store", async () => {
    const response = await onRequest({
      request: new Request("https://practice.test/api/progress", {
        method: "GET",
        headers: { "CF-Connecting-IP": IP },
      }),
      env: { DB: db },
    });
    expect(response.status).toBe(405);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Allow")).toBe("PUT");
    expect(await response.json()).toEqual({ error: "method-not-allowed" });
  });

  it("returns 503 when D1 fails", async () => {
    const failing = {
      prepare() {
        throw Error("D1 unavailable");
      },
      async batch() {
        return [];
      },
    } as unknown as D1Like;
    const response = await handleProgress(
      { request: makeRequest(body(P1, UPDATED)), env: { DB: failing } },
      NOW,
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
  });
});
