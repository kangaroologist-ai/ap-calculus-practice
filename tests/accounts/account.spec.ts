import { execFileSync } from "node:child_process";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { TEST_STUDENTS } from "../helpers/account-seed";
import { latex } from "../../src/math";
import type { AppState } from "../../src/progress";

const ADA = TEST_STUDENTS[0];
const BEN = TEST_STUDENTS[1];
const WRONG_CODE = "TEST-ZZZZ-ZZZZ-ZZ";

function seedDatabase(): void {
  execFileSync("npm", ["run", "db:local"], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
}

// Each test starts from the seed class and empty online copies. Seeding again
// afterwards leaves the shared local D1 clean for the other account specs.
test.beforeEach(seedDatabase);
test.afterAll(seedDatabase);

async function readStored(
  page: Page,
  key: "current" | "backup" | "account",
): Promise<unknown> {
  return page.evaluate(
    (requested) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("derivative-studio", 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains("state"))
            request.result.createObjectStore("state");
        };
        request.onerror = () =>
          reject(request.error ?? new Error("Could not read IndexedDB."));
        request.onsuccess = () => {
          const database = request.result;
          const get = database
            .transaction("state", "readonly")
            .objectStore("state")
            .get(requested);
          get.onsuccess = () => {
            database.close();
            resolve(get.result);
          };
          get.onerror = () => {
            database.close();
            reject(get.error ?? new Error("Could not read state."));
          };
        };
      }),
    key,
  );
}

async function storedProgress(page: Page) {
  const state = (await readStored(page, "current")) as AppState | undefined;
  return state?.progress;
}

async function currentAnswer(page: Page): Promise<string> {
  let value = "";
  await expect
    .poll(async () => {
      const state = (await readStored(page, "current")) as AppState | undefined;
      const answer = state?.session?.current?.question.answers[0];
      value = answer === undefined ? "" : latex(answer);
      return value;
    })
    .not.toBe("");
  return value;
}

async function setMathfield(
  field: ReturnType<Page["locator"]>,
  value: string,
): Promise<void> {
  await field.evaluate((element, nextValue) => {
    const mathfield = element as HTMLElement & { value: string };
    mathfield.focus();
    mathfield.value = nextValue as string;
    mathfield.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: nextValue as string,
      }),
    );
  }, value);
}

async function startAndAnswer(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: /Start practicing|Continue practicing/ })
    .click();
  await page.locator("math-field").first().waitFor({ state: "visible" });
  await setMathfield(page.locator("math-field").first(), await currentAnswer(page));
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.locator("#feedback")).toContainText("Correct");
}

async function signIn(page: Page, code: string, name: string): Promise<void> {
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const dialog = page.locator("#dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Login code").fill(code);
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: `Signed in as ${name}`, exact: true }),
  ).toBeVisible();
  await expect(page.locator("#account-status")).toHaveText("Saved online");
}

async function openPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Start practicing|Continue practicing/ }),
  ).toBeVisible();
  return page;
}

test("signs in and shows the student name", async ({ page }) => {
  await page.goto("/");
  await signIn(page, ADA.code, ADA.name);
  await expect(page.locator("#footer-note")).toHaveText(
    "Signed in · progress saved online",
  );
});

test("shows the message for a code that does not exist", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const dialog = page.locator("#dialog");
  await dialog.getByLabel("Login code").fill(WRONG_CODE);
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(dialog.locator("#modal-error")).toHaveText(
    "This code doesn't match a student. Check the code on your slip.",
  );
  await expect(
    page
      .locator(".site-header")
      .getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});

test("a sign-in link fills the code field and leaves the address bar", async ({
  page,
}) => {
  await page.goto(`/#login=${ADA.code}`);
  const dialog = page.locator("#dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Login code")).toHaveValue(ADA.code);
  expect(new URL(page.url()).hash).toBe("");
  await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: `Signed in as ${ADA.name}`, exact: true }),
  ).toBeVisible();
});

test("one code carries progress between two browsers", async ({
  browser,
}) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    const pageA = await openPage(contextA);
    await signIn(pageA, ADA.code, ADA.name);
    const saved = pageA.waitForResponse(
      (response) =>
        response.url().endsWith("/api/progress") &&
        response.request().method() === "PUT",
    );
    await startAndAnswer(pageA);
    expect((await saved).status()).toBe(200);
    await expect(pageA.locator("#account-status")).toHaveText("Saved online");
    const progressA = await storedProgress(pageA);
    expect(progressA?.sequence).toBeGreaterThan(0);

    const pageB = await openPage(contextB);
    await signIn(pageB, ADA.code, ADA.name);
    await expect(
      pageB.getByRole("button", { name: /Continue practicing/ }),
    ).toBeVisible();
    await expect
      .poll(async () => (await storedProgress(pageB))?.updatedAt)
      .toBe(progressA?.updatedAt);
    expect((await storedProgress(pageB))?.sequence).toBe(progressA?.sequence);
  } finally {
    await Promise.all([contextA.close(), contextB.close()]);
  }
});

test("offline changes on two devices open the conflict prompt and restore the backup", async ({
  browser,
}) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  try {
    const pageA = await openPage(contextA);
    const pageB = await openPage(contextB);
    await signIn(pageA, BEN.code, BEN.name);
    await signIn(pageB, BEN.code, BEN.name);

    // Start both sessions while online; only the answers happen offline.
    for (const page of [pageA, pageB]) {
      await page
        .getByRole("button", { name: /Start practicing|Continue practicing/ })
        .click();
      await page.locator("math-field").first().waitFor({ state: "visible" });
    }
    await contextA.setOffline(true);
    await contextB.setOffline(true);

    for (const page of [pageA, pageB]) {
      await setMathfield(
        page.locator("math-field").first(),
        await currentAnswer(page),
      );
      await page.getByRole("button", { name: "Check answer" }).click();
      await expect(page.locator("#feedback")).toContainText("Correct");
      await expect(page.locator("#account-status")).toHaveText(
        "Offline: saved on this device",
      );
    }
    const localB = await storedProgress(pageB);

    // Close the offline pages before the network returns, so no online event
    // starts a save in the background. Opening each context again runs the
    // boot sync, as a reload would, but in a predictable order.
    await pageA.close();
    await pageB.close();
    await contextA.setOffline(false);
    await contextB.setOffline(false);

    const pageA2 = await contextA.newPage();
    const uploaded = pageA2.waitForResponse(
      (response) =>
        response.url().endsWith("/api/progress") &&
        response.request().method() === "PUT",
    );
    await pageA2.goto("/");
    expect((await uploaded).status()).toBe(200);
    await expect(pageA2.locator("#account-status")).toHaveText("Saved online");
    const onlineA = await storedProgress(pageA2);

    const pageB2 = await contextB.newPage();
    await pageB2.goto("/");
    const dialog = pageB2.locator("#dialog");
    await expect(dialog.getByRole("heading", { name: "Two copies of your progress" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Use the online copy" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Keep this device's copy" })).toBeVisible();

    await dialog.getByRole("button", { name: "Use the online copy" }).click();
    await expect(pageB2.locator("#dialog")).toHaveCount(0);
    await expect
      .poll(async () => (await storedProgress(pageB2))?.updatedAt)
      .toBe(onlineA?.updatedAt);
    expect((await storedProgress(pageB2))?.sequence).toBe(onlineA?.sequence);

    await pageB2.getByRole("button", { name: "Restore backup" }).click();
    const restore = pageB2.locator("#dialog");
    await expect(restore.getByRole("heading", { name: "Restore your local backup?" })).toBeVisible();
    const restoredUpload = pageB2.waitForResponse(
      (response) =>
        response.url().endsWith("/api/progress") &&
        response.request().method() === "PUT",
    );
    await restore.getByRole("button", { name: "Restore backup" }).click();
    // Restoring while signed in also saves the restored copy online; wait for
    // that save so the shared test database is quiet before the next file.
    expect((await restoredUpload).status()).toBe(200);
    await expect
      .poll(async () => (await storedProgress(pageB2))?.updatedAt)
      .toBe(localB?.updatedAt);
    expect((await storedProgress(pageB2))?.sequence).toBe(localB?.sequence);
  } finally {
    await Promise.all([contextA.close(), contextB.close()]);
  }
});

test("sign out clears the code and this device's progress", async ({ page }) => {
  await page.goto("/");
  await signIn(page, ADA.code, ADA.name);
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/progress") &&
      response.request().method() === "PUT",
  );
  await startAndAnswer(page);
  expect((await saved).status()).toBe(200);
  await expect(page.locator("#account-status")).toHaveText("Saved online");

  await page
    .getByRole("button", { name: `Signed in as ${ADA.name}`, exact: true })
    .click();
  const dialog = page.locator("#dialog");
  await expect(dialog.getByRole("heading", { name: "Your account" })).toBeVisible();
  const facts = dialog.locator(".account-facts dd");
  await expect(facts.nth(0)).toHaveText(ADA.name);
  await expect(facts.nth(1)).toHaveText("Test class");
  await dialog.getByRole("button", { name: "Sign out" }).click();

  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#footer-note")).toHaveText(
    "No account. No uploaded answers.",
  );
  expect(await readStored(page, "account")).toBeUndefined();
  expect(await readStored(page, "current")).toBeUndefined();
  expect(await readStored(page, "backup")).toBeUndefined();
});

test("offline sign out keeps the account and progress on this device", async ({
  page,
}) => {
  await page.goto("/");
  await signIn(page, ADA.code, ADA.name);
  await page.context().setOffline(true);

  await page
    .getByRole("button", { name: `Signed in as ${ADA.name}`, exact: true })
    .click();
  const dialog = page.locator("#dialog");
  await dialog.getByRole("button", { name: "Sign out" }).click();

  await expect(dialog.locator("#modal-error")).toHaveText(
    "You're offline. Your latest progress isn't saved online yet. Connect to the internet, then sign out.",
  );
  expect(await readStored(page, "account")).toBeDefined();
});

test("practice waits while sign out saves, then sign out finishes", async ({
  page,
}) => {
  await page.goto("/");
  await signIn(page, ADA.code, ADA.name);
  await page
    .getByRole("button", { name: /Start practicing|Continue practicing/ })
    .click();
  await page.locator("math-field").first().waitFor({ state: "visible" });

  let releaseSave!: () => void;
  let heldSave = false;
  await page.route("**/api/progress", async (route) => {
    if (route.request().method() === "PUT" && !heldSave) {
      heldSave = true;
      await new Promise<void>((resolve) => {
        releaseSave = resolve;
      });
    }
    await route.continue();
  });

  await page
    .getByRole("button", { name: `Signed in as ${ADA.name}`, exact: true })
    .click();
  const dialog = page.locator("#dialog");
  await dialog.getByRole("button", { name: "Sign out" }).click();
  await expect.poll(() => heldSave).toBe(true);
  await dialog.getByRole("button", { name: "Close" }).click();

  // No answer may change progress between the online save and the clear.
  await setMathfield(page.locator("math-field").first(), await currentAnswer(page));
  await expect(page.getByRole("button", { name: "Check answer" })).toBeDisabled();

  releaseSave();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  expect(await readStored(page, "account")).toBeUndefined();
});

test("at 390 px the signed-in header is one line without page scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await signIn(page, ADA.code, ADA.name);

  const header = await page.locator(".site-header").boundingBox();
  expect(header!.height).toBeLessThanOrEqual(80);
  const centers = await page.locator(".header-tools > *").evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return Math.round(box.top + box.height / 2);
    }),
  );
  expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: `Signed in as ${ADA.name}`, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".account-prefix")).toBeHidden();
  const status = page.locator("#account-status");
  await expect(status).toBeVisible();
  await expect(status).toHaveText("Saved online");
  const statusBox = await status.boundingBox();
  expect(statusBox!.width).toBeGreaterThan(60);
  expect(statusBox!.height).toBeGreaterThan(8);
});

test("at 390 px the offline sync status stays readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await signIn(page, ADA.code, ADA.name);
  // Starting practice loads the teacher settings, so start online.
  await page
    .getByRole("button", { name: /Start practicing|Continue practicing/ })
    .click();
  await page.locator("math-field").first().waitFor({ state: "visible" });
  await page.context().setOffline(true);
  await setMathfield(page.locator("math-field").first(), await currentAnswer(page));
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.locator("#feedback")).toContainText("Correct");

  const status = page.locator("#account-status");
  await expect(status).toHaveText("Offline: saved on this device");
  await expect(status).toBeVisible();
  const statusBox = await status.boundingBox();
  expect(statusBox!.width).toBeGreaterThan(80);
  expect(statusBox!.height).toBeGreaterThan(8);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
