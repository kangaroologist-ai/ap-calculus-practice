import { expect, test } from "@playwright/test";
import { TEST_STUDENTS } from "../helpers/account-seed";

const ADA = TEST_STUDENTS[0];
const BEN = TEST_STUDENTS[1];
const PROGRESS = "DSP2.12345678.AAAA";

test("signs in with a seed code", async ({ request }) => {
  const response = await request.post("/api/session", {
    data: { code: ADA.code },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    name: "Ada Test",
    className: "Test class",
    classPrefix: "TEST",
    revision: 0,
    progress: null,
    updatedAt: null,
  });
});

test("rejects a wrong code", async ({ request }) => {
  const response = await request.post("/api/session", {
    data: { code: "TEST-ZZZZ-ZZZZ-ZZ" },
  });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: "unknown-code" });
});

test("answers unsupported methods with no-store", async ({ request }) => {
  const response = await request.get("/api/session");
  expect(response.status()).toBe(405);
  expect(response.headers()["cache-control"]).toBe("no-store");
});

test("saves with the current revision and refuses the stale one", async ({
  request,
}) => {
  const session = await request.post("/api/session", {
    data: { code: BEN.code },
  });
  expect(session.status()).toBe(200);
  const current = (await session.json()) as { revision: number };
  const updatedAt = Date.now();

  const first = await request.put("/api/progress", {
    data: {
      code: BEN.code,
      baseRevision: current.revision,
      progress: PROGRESS,
      updatedAt,
    },
  });
  expect(first.status()).toBe(200);
  const saved = (await first.json()) as { revision: number };
  expect(saved.revision).toBe(current.revision + 1);

  const stale = await request.put("/api/progress", {
    data: {
      code: BEN.code,
      baseRevision: current.revision,
      progress: PROGRESS,
      updatedAt,
    },
  });
  expect(stale.status()).toBe(409);
  expect(await stale.json()).toEqual({
    error: "conflict",
    revision: saved.revision,
    progress: PROGRESS,
    updatedAt,
  });
});
