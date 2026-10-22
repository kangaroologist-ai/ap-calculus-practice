import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { TEST_STUDENTS, TEST_TEACHER_CODE } from "../helpers/account-seed";

test.describe.configure({ timeout: 90_000 });

test.beforeEach(() => {
  try {
    execFileSync("npm", ["run", "db:local"], { stdio: "pipe" });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr;
    throw new Error(`db:local failed.${stderr ? `\n${stderr.toString()}` : ""}`);
  }
});

async function openTeacher(page: Page, code: string): Promise<void> {
  await page.goto("/teacher");
  await page.locator("#teacher-code").fill(code);
  await page.getByRole("button", { name: "Open" }).click();
}

test("a wrong teacher code shows the message", async ({ page }) => {
  await openTeacher(page, "RJ7K-2M4X-9QWD-5T8Z");
  await expect(page.locator("#teacher-error")).toHaveText(
    "This teacher code doesn't work.",
  );
  await expect(page.locator("#teacher-gate")).toBeVisible();
  await expect(page.locator("#teacher-view")).toBeHidden();
});

test("the seed teacher code shows the grid with both seed students", async ({
  page,
}) => {
  await openTeacher(page, TEST_TEACHER_CODE);
  await expect(page.locator("#teacher-view")).toBeVisible();

  const grid = page.locator("#teacher-grid");
  await expect(
    grid.getByText(TEST_STUDENTS[0].name, { exact: true }),
  ).toBeVisible();
  await expect(
    grid.getByText(TEST_STUDENTS[1].name, { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#teacher-count")).toHaveText("2 students");
  await expect(page.locator("#teacher-error")).toBeHidden();

  const selects = page.locator(".teacher-select");
  const selectCount = await selects.count();
  expect(selectCount).toBeGreaterThan(0);
  for (let index = 0; index < selectCount; index++) {
    const box = await selects.nth(index).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test("the name column stays visible after horizontal scroll at 390 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTeacher(page, TEST_TEACHER_CODE);
  await expect(page.locator("#teacher-view")).toBeVisible();

  const grid = page.locator("#teacher-grid");
  const nameCell = grid
    .locator("tr.teacher-student-row .teacher-name-cell")
    .first();
  await expect(nameCell).toHaveText(TEST_STUDENTS[0].name);

  await grid.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect
    .poll(() => grid.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);

  const gridBox = await grid.boundingBox();
  const cellBox = await nameCell.boundingBox();
  expect(gridBox).not.toBeNull();
  expect(cellBox).not.toBeNull();
  expect(cellBox!.x).toBeGreaterThanOrEqual(gridBox!.x - 1);
  expect(cellBox!.x + cellBox!.width).toBeLessThanOrEqual(
    gridBox!.x + gridBox!.width + 1,
  );

  const headingBox = await grid
    .locator("thead .teacher-name-heading")
    .boundingBox();
  const headingIsOnTop = await page.evaluate(
    ({ x, y }) => {
      const top = document.elementFromPoint(x, y);
      const heading = document.querySelector(
        ".teacher-table thead .teacher-name-heading",
      );
      return !!top && !!heading && heading.contains(top);
    },
    {
      x: headingBox!.x + headingBox!.width / 2,
      y: headingBox!.y + headingBox!.height / 2,
    },
  );
  expect(headingIsOnTop).toBe(true);
});

test("Close returns to the form and clears sessionStorage", async ({
  page,
}) => {
  await openTeacher(page, TEST_TEACHER_CODE);
  await expect(page.locator("#teacher-view")).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("teacher-code")),
  ).not.toBeNull();

  await page.getByRole("button", { name: "Close" }).click();

  await expect(page.locator("#teacher-gate")).toBeVisible();
  await expect(page.locator("#teacher-view")).toBeHidden();
  expect(
    await page.evaluate(() => sessionStorage.getItem("teacher-code")),
  ).toBeNull();
});
