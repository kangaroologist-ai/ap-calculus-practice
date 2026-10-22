import { beforeEach, describe, expect, it } from "vitest";
import { handleProgress } from "../../functions/api/progress";
import { handleSession } from "../../functions/api/session";
import { handleTeacher } from "../../functions/api/teacher";
import { FAILURE_WINDOW_MS } from "../../functions/_lib/attempts";
import { CODE_ALPHABET, formatLoginCode, sha256Hex } from "../../src/account-code";
import {
  TEST_STUDENTS,
  TEST_TEACHER_CODE,
  seedSql,
} from "../helpers/account-seed";
import { createTestD1, type TestD1 } from "../helpers/d1-sqlite";

const NOW = 1767225600000;
const IP = "198.51.100.25";
const BAD = "not-a-code";
const ADA = TEST_STUDENTS[0];

function request(
  url: string,
  body: unknown,
  ip: string,
  method: string,
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
    body: JSON.stringify(body),
  });
}

let db: TestD1;

beforeEach(async () => {
  db = createTestD1();
  db.exec(await seedSql());
});

function signIn(code: string, now = NOW, ip = IP): Promise<Response> {
  return handleSession(
    {
      request: request("https://practice.test/api/session", { code }, ip, "POST"),
      env: { DB: db },
    },
    now,
  );
}

function teacher(code: string, now = NOW, ip = IP): Promise<Response> {
  return handleTeacher(
    {
      request: request(
        "https://practice.test/api/teacher",
        { code },
        ip,
        "POST",
      ),
      env: { DB: db },
    },
    now,
  );
}

function save(code: string, now = NOW, ip = IP): Promise<Response> {
  return handleProgress(
    {
      request: request(
        "https://practice.test/api/progress",
        {
          code,
          baseRevision: 0,
          progress: "DSP2.12345678.AAAA",
          updatedAt: NOW - 1000,
        },
        ip,
        "PUT",
      ),
      env: { DB: db },
    },
    now,
  );
}

describe("guessing control", () => {
  it("lets 30 students sign in and make 20 typing errors without a 429", async () => {
    const codes: string[] = [];
    for (let index = 0; index < 30; index += 1) {
      const normalized = `TESTAAAAAAAAA${CODE_ALPHABET[index]}`;
      codes.push(formatLoginCode(normalized));
      await db
        .prepare(
          "INSERT INTO students (id, code_hash, class_prefix, name, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(
          100 + index,
          await sha256Hex(normalized),
          "TEST",
          `Student ${String(index + 1).padStart(2, "0")}`,
          NOW,
        )
        .run();
    }

    for (const code of codes) expect((await signIn(code)).status).toBe(200);
    for (let index = 0; index < 20; index += 1)
      expect((await signIn(BAD)).status).toBe(401);

    const row = await db
      .prepare("SELECT count FROM login_failures WHERE ip_hash = ?")
      .bind(await sha256Hex(`ip:${IP}`))
      .first<{ count: number }>();
    expect(row?.count).toBe(20);
  });

  it("blocks the 61st failed sign-in from one IP until the window ends", async () => {
    for (let index = 0; index < 60; index += 1)
      expect((await signIn(BAD)).status).toBe(401);

    const response = await signIn(BAD);
    expect(response.status).toBe(429);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const retryAfter = Number(response.headers.get("Retry-After"));
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(FAILURE_WINDOW_MS / 1000);
    expect(await response.json()).toEqual({ error: "too-many-attempts" });
  });

  it("does not let overlapping failures exceed the window limit", async () => {
    const ipHash = await sha256Hex(`ip:${IP}`);
    const windowStart = Math.floor(NOW / FAILURE_WINDOW_MS) * FAILURE_WINDOW_MS;
    await db
      .prepare(
        "INSERT INTO login_failures (ip_hash, window_start, count) VALUES (?, ?, 59)",
      )
      .bind(ipHash, windowStart)
      .run();

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => signIn(BAD)),
    );
    const statuses = responses.map((response) => response.status);
    expect(statuses.filter((status) => status === 401)).toHaveLength(1);
    expect(statuses.filter((status) => status === 429)).toHaveLength(9);

    const row = await db
      .prepare(
        "SELECT count FROM login_failures WHERE ip_hash = ? AND window_start = ?",
      )
      .bind(ipHash, windowStart)
      .first<{ count: number }>();
    expect(row?.count).toBe(60);
  });

  it("blocks even a correct code while the IP is over the limit", async () => {
    for (let index = 0; index < 60; index += 1) await signIn(BAD);
    expect((await signIn(ADA.code)).status).toBe(429);
  });

  it("starts a new count after the window ends", async () => {
    for (let index = 0; index < 60; index += 1) await signIn(BAD);
    expect((await signIn(BAD, NOW + FAILURE_WINDOW_MS)).status).toBe(401);
  });

  it("keeps counts separate for different IP addresses", async () => {
    for (let index = 0; index < 60; index += 1) await signIn(BAD);
    expect((await signIn(BAD, NOW, "198.51.100.99")).status).toBe(401);
  });

  it("counts teacher code failures in the same window", async () => {
    for (let index = 0; index < 60; index += 1)
      expect((await teacher(BAD)).status).toBe(401);
    expect((await teacher(BAD)).status).toBe(429);
    expect((await teacher(TEST_TEACHER_CODE)).status).toBe(429);
  });

  it("counts progress failures in the same window", async () => {
    for (let index = 0; index < 60; index += 1) await signIn(BAD);
    expect((await save(ADA.code)).status).toBe(429);
  });
});

describe("limit key", () => {
  it("groups IPv6 addresses by /64 and keeps IPv4 as it is", async () => {
    const { limitKey } = await import("../../functions/_lib/attempts");
    expect(limitKey("203.0.113.7")).toBe("203.0.113.7");
    expect(limitKey("2001:db8:85a3:0042:1000:8a2e:370:7334")).toBe(
      "2001:db8:85a3:42::/64",
    );
    expect(limitKey("2001:DB8:85A3:42::1")).toBe("2001:db8:85a3:42::/64");
    expect(limitKey("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(limitKey("::1")).toBe("0:0:0:0::/64");
  });

  it("counts two addresses of one IPv6 /64 together", async () => {
    for (let i = 0; i < 60; i++)
      await signIn("TEST-ZZZZ-ZZZZ-ZZ", NOW, `2001:db8:1:2::${(i + 1).toString(16)}`);
    expect((await signIn("TEST-ZZZZ-ZZZZ-ZZ", NOW, "2001:db8:1:2:ffff::9")).status).toBe(429);
    expect((await signIn("TEST-ZZZZ-ZZZZ-ZZ", NOW, "2001:db8:1:3::1")).status).toBe(401);
  });
});
