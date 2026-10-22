import { beforeEach, describe, expect, it } from "vitest";
import { handleSession, onRequest } from "../../functions/api/session";
import type { D1Like } from "../../functions/_lib/d1";
import { TEST_STUDENTS, seedSql } from "../helpers/account-seed";
import { createTestD1, type TestD1 } from "../helpers/d1-sqlite";

const NOW = 1767225600000;
const IP = "203.0.113.10";
const ADA = TEST_STUDENTS[0];
const BEN = TEST_STUDENTS[1];

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://practice.test/api/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": IP,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function call(db: D1Like, body: unknown, now = NOW): Promise<Response> {
  return handleSession({ request: makeRequest(body), env: { DB: db } }, now);
}

let db: TestD1;

beforeEach(async () => {
  db = createTestD1();
  db.exec(await seedSql());
});

describe("POST /api/session", () => {
  it("returns an empty account with no online copy", async () => {
    const response = await call(db, { code: ADA.code });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      name: "Ada Test",
      className: "Test class",
      classPrefix: "TEST",
      revision: 0,
      progress: null,
      updatedAt: null,
    });
  });

  it("returns the online copy and its revision", async () => {
    const progress = "DSP2.12345678.AAAA";
    await db
      .prepare(
        "UPDATE students SET progress = ?, revision = ?, updated_at = ? WHERE id = 2",
      )
      .bind(progress, 3, NOW - 5000)
      .run();

    const response = await call(db, { code: BEN.code });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      name: "Ben Test",
      className: "Test class",
      classPrefix: "TEST",
      revision: 3,
      progress,
      updatedAt: NOW - 5000,
    });
  });

  it("accepts lower case, spaces, hyphens, and the O/I/L mapping", async () => {
    const typed = ADA.code.toLowerCase().replace(/-/g, " ");
    expect((await call(db, { code: typed })).status).toBe(200);
    const response = await call(db, { code: "TEST-OIL2-3456-78" });
    expect(response.status).toBe(401);
  });

  it("rejects an unknown code with 401 and counts one failure", async () => {
    const response = await call(db, { code: "TEST-ZZZZ-ZZZZ-ZZ" });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unknown-code" });
    const row = await db
      .prepare("SELECT count FROM login_failures")
      .first<{ count: number }>();
    expect(row?.count).toBe(1);
  });

  it("rejects a malformed code with 401", async () => {
    const response = await call(db, { code: "not-a-code" });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unknown-code" });
  });

  it("rejects a missing or wrong code field with 400", async () => {
    expect((await call(db, {})).status).toBe(400);
    expect((await call(db, { code: 42 })).status).toBe(400);
    expect((await call(db, [])).status).toBe(400);
  });

  it("rejects bad JSON with 400", async () => {
    const response = await call(db, "{not json");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "bad-request" });
  });

  it("rejects a body over 16 KB in UTF-8 bytes with 413", async () => {
    const response = await call(db, JSON.stringify({ code: "X".repeat(20000) }));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "too-large" });

    const wide = JSON.stringify({
      code: ADA.code,
      padding: "中".repeat(6000),
    });
    expect(new TextEncoder().encode(wide).byteLength).toBeGreaterThan(16384);
    expect((await call(db, wide)).status).toBe(413);
  });

  it("answers unsupported methods with 405 and no-store", async () => {
    const response = await onRequest({
      request: new Request("https://practice.test/api/session", {
        method: "GET",
        headers: { "CF-Connecting-IP": IP },
      }),
      env: { DB: db },
    });
    expect(response.status).toBe(405);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Allow")).toBe("POST");
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
    const response = await handleSession(
      { request: makeRequest({ code: ADA.code }), env: { DB: failing } },
      NOW,
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
  });
});
