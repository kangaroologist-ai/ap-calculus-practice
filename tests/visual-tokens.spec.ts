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
        await page.getByRole("button", { name: /Start practicing|Continue practicing/ }).click();
        await page.locator("math-field").first().waitFor({ state: "visible" });
        await page.screenshot({ path: `${output}/after-${width}-${scheme}-question.png` });
        const heading = page.locator(".question-body h2");
        const headingBefore = await heading.screenshot();
        await page.getByRole("button", { name: "Math keyboard" }).click();
        await expect(page.locator(".ML__keyboard")).toBeVisible();
        // MathLive's root covers the whole viewport. Only its bottom panel
        // may paint a background, or the question and controls disappear.
        await expect(page.locator(".ML__keyboard")).toHaveCSS(
          "background-color", "rgba(0, 0, 0, 0)",
        );
        // The root ignores pointer events, so hit tests miss an overlay.
        // Compare pixels to catch any way of painting over the question.
        expect(await heading.screenshot()).toEqual(headingBefore);
        await page.screenshot({ path: `${output}/after-${width}-${scheme}-keyboard.png` });
      },
    );
  }
}

test("math keyboard geometry and tooltips match on Main and More", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Keyboard geometry is verified once in Chromium.");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 860 },
  });

  try {
    const viewports = [
      { page: await mobileContext.newPage(), width: 390, touch: true },
      { page: await desktopContext.newPage(), width: 1280, touch: false },
    ];
    for (const { page, width, touch } of viewports) {
      await page.goto("/");
      await page.getByRole("button", { name: /Start practicing|Continue practicing/ }).click();
      await page.locator("math-field").first().waitFor({ state: "visible" });
      // This test is about geometry; the toggle button is covered in app.spec.ts. On a touch
      // screen the answer's focus handler also opens the keyboard, so a click could race it.
      await page.locator("math-field").first().focus();
      await page.evaluate(() => window.mathVirtualKeyboard.show());
      await expect.poll(() => page.evaluate(() => window.mathVirtualKeyboard.visible)).toBe(true);
      await expect(page.locator(".ML__keyboard")).toBeVisible();

      const plateHeights: number[] = [];
      for (const pageName of ["Main", "More"] as const) {
        const visibleLayer = page.locator(".MLK__layer.is-visible");
        const selectedPage = (await visibleLayer.locator(".MLK__toolbar .selected").textContent())?.trim();
        if (selectedPage !== pageName) {
          await visibleLayer.locator(".MLK__toolbar .layer-switch").filter({ hasText: pageName }).click();
        }
        await expect(page.locator(".MLK__layer.is-visible .MLK__toolbar .selected")).toHaveText(pageName);

        const geometry = await page.locator(".MLK__layer.is-visible").evaluate((layer) => {
          const plate = layer.closest<HTMLElement>(".MLK__plate")!;
          const plateRect = plate.getBoundingClientRect();
          const firstRow = layer.querySelector(".MLK__rows > .MLK__row")!;
          const rowKeys = Array.from(firstRow.children)
            .filter((key) => !key.classList.contains("separator")) as HTMLElement[];
          const firstKey = rowKeys[0].getBoundingClientRect();
          const lastKey = rowKeys[rowKeys.length - 1].getBoundingClientRect();
          const enter = layer.querySelector<HTMLElement>(".practice-enter")!;
          const enterHasTwoUnitClass = enter.classList.contains("w20");
          const enterBackground = getComputedStyle(enter).backgroundColor;
          const tintProbe = document.createElement("span");
          tintProbe.style.backgroundColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--tint")
            .trim();
          document.body.append(tintProbe);
          const tintBackground = getComputedStyle(tintProbe).backgroundColor;
          tintProbe.remove();
          const oneUnitWidths = Array.from(layer.querySelectorAll<HTMLElement>(
            ".MLK__rows > .MLK__row > div:not(.separator)",
          ))
            .filter((key) => !["w5", "w15", "w20", "w30", "w40", "w50"].some((widthClass) =>
              key.classList.contains(widthClass),
            ))
            .map((key) => key.getBoundingClientRect().width);
          const actionOffsets = Array.from(layer.querySelectorAll<HTMLElement>(
            ".MLK__rows > .MLK__row > div.action",
          )).flatMap((key) => {
            const svg = key.querySelector("svg");
            if (!svg) return [];
            const keyRect = key.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();
            return [Math.abs(
              (svgRect.left + svgRect.right) / 2 - (keyRect.left + keyRect.right) / 2,
            )];
          });
          return {
            // Spec K2 measures from the screen edge, not from MathLive's inset plate.
            leftMargin: firstKey.left,
            rightMargin: document.documentElement.clientWidth - lastKey.right,
            keyAreaLeft: firstKey.left,
            keyAreaRight: lastKey.right,
            oneUnitWidths,
            actionOffsets,
            plateHeight: plateRect.height,
            enterHasTwoUnitClass,
            enterBackground,
            tintBackground,
          };
        });

        if (width === 390) {
          expect(geometry.leftMargin).toBeGreaterThanOrEqual(0);
          expect(geometry.leftMargin).toBeLessThanOrEqual(6);
          expect(geometry.rightMargin).toBeGreaterThanOrEqual(0);
          expect(geometry.rightMargin).toBeLessThanOrEqual(6);
        }
        expect(geometry.oneUnitWidths.length).toBeGreaterThan(0);
        for (const keyWidth of geometry.oneUnitWidths) {
          expect(Math.abs(keyWidth - geometry.oneUnitWidths[0])).toBeLessThanOrEqual(1);
        }
        if (width === 1280) {
          expect(geometry.keyAreaRight - geometry.keyAreaLeft).toBeLessThanOrEqual(760);
          expect(Math.abs((geometry.keyAreaLeft + geometry.keyAreaRight) / 2 - width / 2))
            .toBeLessThanOrEqual(2);
        }
        expect(geometry.actionOffsets).toHaveLength(3);
        for (const offset of geometry.actionOffsets) {
          expect(offset).toBeLessThanOrEqual(1);
        }
        expect(geometry.enterHasTwoUnitClass).toBe(true);
        expect(geometry.enterBackground).toBe(geometry.tintBackground);
        plateHeights.push(geometry.plateHeight);
        await expect(page.locator('.ML__keyboard [data-command*="undo"]')).toHaveCount(0);
        await page.screenshot({ path: `${output}/keyboard-${width}-${pageName.toLowerCase()}.png` });

        if (pageName === "Main") {
          const plus = page.locator('.MLK__layer.is-visible .MLK__keycap[aria-label="plus"]');
          if (touch) await plus.tap();
          else await plus.click();
          await page.waitForTimeout(1500);
          const tooltipDisplays = await page.locator(".ML__keyboard [data-tooltip]").evaluateAll((elements) =>
            elements.map((element) => getComputedStyle(element, "::after").display),
          );
          expect(tooltipDisplays.length).toBeGreaterThan(0);
          expect(tooltipDisplays.every((display) => display === "none")).toBe(true);
        }
      }
      expect(Math.abs(plateHeights[0] - plateHeights[1])).toBeLessThanOrEqual(1);
    }
  } finally {
    await Promise.all([mobileContext.close(), desktopContext.close()]);
  }
});

test("brand mark geometry and favicon match on Main and Help", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Brand mark geometry is verified once in Chromium.");
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/help.html"] as const) {
      await page.goto(route);
      const mark = page.locator(".brand-mark");
      const svg = mark.locator("svg");
      await expect(svg).toHaveCount(1);
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.svg");
      const offset = await mark.evaluate((element) => {
        const painted = element.querySelector("svg g")!.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return {
          x: Math.abs((painted.left + painted.right) / 2 - (box.left + box.right) / 2),
          y: Math.abs((painted.top + painted.bottom) / 2 - (box.top + box.bottom) / 2),
        };
      });
      expect(offset.x).toBeLessThanOrEqual(0.75);
      expect(offset.y).toBeLessThanOrEqual(0.75);
      await page.screenshot({ path: `${output}/brand-${width}-${route === "/" ? "home" : "help"}.png` });
    }
  }
});

for (const scheme of ["light", "dark"] as const) {
  test(
    `all visible 390px practice and path text is at least 12px in ${scheme}`,
    async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Visual token checks use Chromium.");
      await page.setViewportSize({ width: 390, height: 900 });
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await expectReadableText(page);

      await page.getByRole("button", { name: /Start practicing|Continue practicing/ }).click();
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

for (const width of [390, 1280]) {
  for (const scheme of ["light", "dark"] as const) {
    test(
      `What's new notes fit and stay readable in ${scheme} at ${width}px`,
      async ({ page, browserName }) => {
        test.skip(browserName !== "chromium", "Visual token checks use Chromium.");
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto("/");
        await page.getByRole("button", { name: /What’s new/ }).click();
        const dialog = page.locator("dialog.whats-new");
        await expect(dialog).toBeVisible();
        await expectReadableText(page);
        const overflow = await dialog.evaluate((element) => ({
          dialog: element.scrollWidth - element.clientWidth,
          page: document.documentElement.scrollWidth - window.innerWidth,
          fits: element.getBoundingClientRect().bottom <= window.innerHeight,
        }));
        expect(overflow).toEqual({ dialog: 0, page: 0, fits: true });
        await page.screenshot({ path: `${output}/whats-new-${width}-${scheme}.png` });
      },
    );
  }
}
