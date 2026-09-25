import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const output = "artifacts/ux-refresh";
mkdirSync(output, { recursive: true });

async function expectReadableText(page: Page) {
  const smallText = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) =>
        Array.from(element.childNodes).some(
          (node) => node.nodeType === Node.TEXT_NODE &&
            Boolean(node.textContent?.replace(/[\s\u200b]/g, "")),
        ),
      )
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          element.getClientRects().length > 0 &&
          Number.parseFloat(style.fontSize) < 12
        );
      })
      .map((element) => ({
        text: element.textContent?.trim().slice(0, 60),
        fontSize: getComputedStyle(element).fontSize,
      })),
  );
  expect(smallText).toEqual([]);
}

for (const width of [390, 1280]) {
  for (const scheme of ["light", "dark"] as const) {
    test(
      `welcome and question render in ${scheme} at ${width}px`,
      async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Visual token screenshots use Chromium.");
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto("/");

        if (scheme === "dark") {
          const backgrounds = await page.evaluate(() => ({
            body: getComputedStyle(document.body).backgroundColor,
            token: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
          }));
          expect(backgrounds.body).toBe("rgb(0, 0, 0)");
          expect(backgrounds.token).toBe("#000000");
        }

        await page.screenshot({ path: `${output}/after-${width}-${scheme}-welcome.png` });
        await page.getByRole("button", { name: /Start practicing/ }).click();
        await page.locator("math-field").first().waitFor({ state: "visible" });
        await page.screenshot({ path: `${output}/after-${width}-${scheme}-question.png` });
      },
    );
  }
}

for (const scheme of ["light", "dark"] as const) {
  test(
    `all visible 390px practice and path text is at least 12px in ${scheme}`,
    async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Visual token checks use Chromium.");
      await page.setViewportSize({ width: 390, height: 900 });
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await expectReadableText(page);

      await page.getByRole("button", { name: /Start practicing/ }).click();
      await page.locator("math-field").first().waitFor({ state: "visible" });
      await expectReadableText(page);

      await page.locator(".progress-summary").click();
      const lockedLevel = page.locator('.path-level[data-level="2"]');
      await lockedLevel.locator("summary").click();
      await expectReadableText(page);
      const colors = await lockedLevel.locator("summary").evaluate((element) => ({
        text: getComputedStyle(element).color,
        token: getComputedStyle(document.documentElement).getPropertyValue("--label-2").trim(),
      }));
      const tokenColor = await page.evaluate((value) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }, colors.token);
      expect(colors.text).toBe(tokenColor);
    },
  );
}
