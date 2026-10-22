import { beforeEach, describe, expect, it } from "vitest";
import { handleTeacher, onRequest } from "../../functions/api/teacher";
import type { D1Like } from "../../functions/_lib/d1";
import {
  TEST_TEACHER_CODE,
  seedSql,
} from "../helpers/account-seed";
import { createTestD1, type TestD1 } from "../helpers/d1-sqlite";

const NOW = 1767225600000;
const IP = "203.0.113.30";
const PROGRESS = "DSP2.12345678.AAAA";

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://practice.test/api/teacher", {
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
  return handleTeacher({ request: makeRequest(body), env: { DB: db } }, now);
}

let db: TestD1;

beforeEach(async () => {
  db = createTestD1();
  db.exec(await seedSql());
});

describe("POST /api/teacher", () => {
  it("lists every class and student with an empty online copy", async () => {
    const response = await call(db, { code: TEST_TEACHER_CODE });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      classes: [{ prefix: "TEST", name: "Test class" }],
      students: [
        {
          id: 1,
          classPrefix: "TEST",
          name: "Ada Test",
          revision: 0,
          progress: null,
          updatedAt: null,
          savedAt: null,
        },
        {
          id: 2,
          classPrefix: "TEST",
          name: "Ben Test",
          revision: 0,
          progress: null,
          updatedAt: null,
          savedAt: null,
        },
      ],
    });
  });

  it("includes the saved copy and both times", async () => {
    await db
      .prepare(
        "UPDATE students SET progress = ?, revision = ?, updated_at = ?, saved_at = ? WHERE id = 2",
      )
      .bind(PROGRESS, 4, NOW - 2000, NOW - 1000)
      .run();

    const response = await call(db, { code: TEST_TEACHER_CODE });
    const body = await response.json();
    expect(body.students[1]).toEqual({
      id: 2,
      classPrefix: "TEST",
      name: "Ben Test",
      revision: 4,
      progress: PROGRESS,
      updatedAt: NOW - 2000,
      savedAt: NOW - 1000,
    });
  });

  it("orders classes by prefix and students by class prefix, then name", async () => {
    await db
      .prepare("INSERT INTO classes (prefix, name, created_at) VALUES (?, ?, ?)")
      .bind("ALPHA", "Alpha class", NOW)
      .run();
    for (const [id, name] of [
      [10, "Zoe Test"],
      [11, "Amy Test"],
    ] as const) {
      await db
        .prepare(
          "INSERT INTO students (id, code_hash, class_prefix, name, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(id, `test-hash-${id}`, "ALPHA", name, NOW)
        .run();
    }

    const response = await call(db, { code: TEST_TEACHER_CODE });
    const body = await response.json();
    expect(body.classes).toEqual([
      { prefix: "ALPHA", name: "Alpha class" },
      { prefix: "TEST", name: "Test class" },
    ]);
    expect(body.students.map((student: { classPrefix: string; name: string }) =>
      `${student.classPrefix}:${student.name}`,
    )).toEqual([
      "ALPHA:Amy Test",
      "ALPHA:Zoe Test",
      "TEST:Ada Test",
      "TEST:Ben Test",
    ]);
  });

  it("accepts the code in its display form or with lower case and spaces", async () => {
    expect((await call(db, { code: TEST_TEACHER_CODE })).status).toBe(200);
    expect(
      (await call(db, { code: TEST_TEACHER_CODE.toLowerCase().replace(/-/g, " ") }))
        .status,
    ).toBe(200);
  });

  it("rejects a wrong code, a malformed code, and a missing teacher row with 401", async () => {
    const wrong = await call(db, { code: "RJ7K-2M4X-9QWD-5T8Z" });
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: "unknown-code" });

    expect((await call(db, { code: "not-a-code" })).status).toBe(401);

    await db.prepare("DELETE FROM teacher").run();
    expect((await call(db, { code: TEST_TEACHER_CODE })).status).toBe(401);
  });

  it("rejects a missing or wrong code field with 400", async () => {
    expect((await call(db, {})).status).toBe(400);
    expect((await call(db, { code: 42 })).status).toBe(400);
    expect((await call(db, "{not json")).status).toBe(400);
  });

  it("rejects a body over 16 KB with 413", async () => {
    const response = await call(
      db,
      JSON.stringify({ code: "X".repeat(20000) }),
    );
    expect(response.status).toBe(413);
  });

  it("answers unsupported methods with 405 and no-store", async () => {
    const response = await onRequest({
      request: new Request("https://practice.test/api/teacher", {
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
    const response = await handleTeacher(
      { request: makeRequest({ code: TEST_TEACHER_CODE }), env: { DB: failing } },
      NOW,
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
  });
});
