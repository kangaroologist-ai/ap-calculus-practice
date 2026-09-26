import { expect, test } from "@playwright/test";

test("normal motion and mobile heading and footer alignment", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Motion checks run in Chromium.");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();

  try {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);

    const headingFonts = await page.locator("h1.brand-heading").evaluate((heading) => ({
      heading: getComputedStyle(heading).fontSize,
      parent: getComputedStyle(heading.parentElement!).fontSize,
    }));
    expect(headingFonts.heading).toBe(headingFonts.parent);

    const footerTextBottoms = await page.evaluate(() => {
      const elements = [
        document.querySelector('footer a.text-button[href="/help.html"]'),
        document.getElementById("input-help"),
        document.getElementById("whats-new"),
      ];
      return elements.map((element) => {
        const range = document.createRange();
        range.selectNodeContents(element!);
        return range.getBoundingClientRect().bottom;
      });
    });
    expect(Math.max(...footerTextBottoms) - Math.min(...footerTextBottoms)).toBeLessThanOrEqual(1);

    await page.getByRole("button", { name: /Start practicing|Continue practicing/ }).click();
    const submit = page.locator("#submit");
    await expect(submit).toBeVisible();
    const buttonTransition = await submit.evaluate((button) => getComputedStyle(button).transition);
    expect(buttonTransition).toMatch(/transform\s+0\.1s/);
    const feedbackTransition = await page.locator("#feedback").evaluate((feedback) =>
      getComputedStyle(feedback).transition,
    );
    expect(feedbackTransition).toContain("background-color");

    await submit.scrollIntoViewIfNeeded();
    const submitBox = await submit.boundingBox();
    expect(submitBox).not.toBeNull();
    await page.mouse.move(submitBox!.x + submitBox!.width / 2, submitBox!.y + submitBox!.height / 2);
    await page.mouse.down();
    await expect.poll(() => submit.evaluate((button) => getComputedStyle(button).transform)).not.toBe("none");
    await page.mouse.up();

    await page.getByRole("button", { name: "Move progress" }).click();
    const dialogTransition = await page.locator("dialog").evaluate((dialog) =>
      getComputedStyle(dialog).transition,
    );
    expect(dialogTransition).toContain("opacity");
    expect(dialogTransition).toContain("transform");
  } finally {
    await context.close();
  }
});

test("reduced motion keeps color and opacity transitions without scale", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Motion checks run in Chromium.");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  try {
    await page.goto("/");
    await page.getByRole("button", { name: /Start practicing|Continue practicing/ }).click();
    const submit = page.locator("#submit");
    const buttonTransition = await submit.evaluate((button) => getComputedStyle(button).transition);
    expect(buttonTransition).not.toMatch(/\btransform\b/);
    const feedbackTransition = await page.locator("#feedback").evaluate((feedback) =>
      getComputedStyle(feedback).transition,
    );
    expect(feedbackTransition).toContain("background-color");

    await submit.scrollIntoViewIfNeeded();
    const submitBox = await submit.boundingBox();
    expect(submitBox).not.toBeNull();
    await page.mouse.move(submitBox!.x + submitBox!.width / 2, submitBox!.y + submitBox!.height / 2);
    await page.mouse.down();
    await expect.poll(() => submit.evaluate((button) => getComputedStyle(button).transform)).toBe("none");
    await page.mouse.up();

    await page.getByRole("button", { name: "Move progress" }).click();
    const dialogStyles = await page.locator("dialog").evaluate((dialog) => ({
      transition: getComputedStyle(dialog).transition,
      transform: getComputedStyle(dialog).transform,
    }));
    expect(dialogStyles.transition).toContain("opacity");
    expect(dialogStyles.transition).not.toContain("transform");
    expect(dialogStyles.transform).toBe("none");

    const actionBarTransition = await page.locator(".actions").evaluate((actions) => {
      document.body.classList.add("keyboard-open");
      return getComputedStyle(actions).transition;
    });
    expect(actionBarTransition).not.toContain("bottom");
  } finally {
    await context.close();
  }
});
