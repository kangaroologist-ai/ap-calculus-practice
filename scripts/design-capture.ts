import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium,
  devices,
  webkit,
  type Browser,
  type BrowserContextOptions,
  type Page,
} from "@playwright/test";
import { SKILLS } from "../src/catalog";
import { grade } from "../src/grading";
import { latex } from "../src/math";
import type { AppState } from "../src/progress";
import type { Config, Question } from "../src/types";

type Scheme = "light" | "dark";
type FeedbackState = "correct" | "incorrect" | "invalid";

interface KeyGeometry {
  label: string;
  ariaLabel: string | null;
  x: number;
  w: number;
  h: number;
  iconOffsetX?: number;
  iconOffsetY?: number;
}

interface KeyboardGeometry {
  viewport: number;
  plate: { x: number; w: number; h: number } | null;
  rows: KeyGeometry[][];
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesWritten = { count: 0 };
const geometry: Record<string, KeyboardGeometry> = {};
const deterministicConfig: Config = {
  schemaVersion: 1,
  revision: "design-capture-constant",
  initialUnlockedLevel: 1,
  disabledFamilies: SKILLS.filter((skill) => skill.id !== "constant").map(
    (skill) => skill.id,
  ),
  sessionLength: 1,
};

function parseOptions(): { base: URL; out?: string } {
  let baseValue = "http://127.0.0.1:5173/";
  let out: string | undefined;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--base=")) baseValue = arg.slice("--base=".length);
    else if (arg.startsWith("--out=")) out = arg.slice("--out=".length);
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!baseValue) throw new Error("--base must contain an absolute URL.");
  const base = new URL(baseValue);
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error("--base must use http or https.");
  }
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  base.hash = "";
  return { base, out };
}

async function checkServer(base: URL): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(base, { signal: controller.signal });
    await response.body?.cancel();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(
      `Cannot reach the design-capture server at ${base.href}. Start the Vite dev server first, or pass --base=<url>. ${(error as Error).message}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

async function inFreshPage(
  browser: Browser,
  options: BrowserContextOptions,
  run: (page: Page) => Promise<void>,
): Promise<void> {
  const context = await browser.newContext(options);
  try {
    await run(await context.newPage());
  } finally {
    await context.close();
  }
}

async function openCandidate(
  page: Page,
  base: URL,
  deterministicQuestion = false,
): Promise<void> {
  if (deterministicQuestion) {
    await page.route("**/practice-config.json", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(deterministicConfig),
      }),
    );
  }
  await page.goto(base.href);
  await page.locator(".site-header").waitFor({ state: "visible" });
}

async function readCurrentQuestion(page: Page): Promise<Question> {
  return page.evaluate(
    () =>
      new Promise<Question>((resolve, reject) => {
        const request = indexedDB.open("derivative-studio", 1);
        request.onerror = () =>
          reject(request.error ?? new Error("Could not open saved practice state."));
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("state", "readonly");
          const get = transaction.objectStore("state").get("current");
          get.onerror = () => {
            database.close();
            reject(get.error ?? new Error("Could not read the current question."));
          };
          get.onsuccess = () => {
            const state = get.result as AppState | undefined;
            const question = state?.session?.current?.question;
            database.close();
            if (!question) {
              reject(new Error("The app did not save its current question."));
              return;
            }
            resolve(question);
          };
        };
      }),
  );
}

async function startQuestion(page: Page, base: URL): Promise<Question> {
  await openCandidate(page, base, true);
  await page
    .getByRole("button", { name: /Start practicing|Continue practicing/ })
    .click();
  await page.locator("math-field").first().waitFor({ state: "visible" });
  return readCurrentQuestion(page);
}

async function hideKeyboard(page: Page, resetScroll = false): Promise<void> {
  await page.locator("math-field").first().blur().catch(() => {});
  await page.evaluate((shouldResetScroll) => {
    window.mathVirtualKeyboard?.hide();
    if (shouldResetScroll) window.scrollTo(0, 0);
  }, resetScroll);
  await page.waitForTimeout(150);
}

async function setMathfieldValue(
  page: Page,
  fieldIndex: number,
  value: string,
): Promise<void> {
  const field = page.locator("math-field").nth(fieldIndex);
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

function wrongAnswer(question: Question): string[] {
  for (const candidate of ["1", "-1", "x", "2", "0"]) {
    const values = Array.from({ length: question.answers.length }, () => candidate);
    if (grade(question, values).status === "incorrect") return values;
  }
  throw new Error("Could not find a deterministic incorrect answer for this question.");
}

async function submitForFeedback(
  page: Page,
  question: Question,
  values: string[],
  expected: FeedbackState,
): Promise<void> {
  if (grade(question, values).status !== expected) {
    throw new Error(`The prepared ${expected} answer did not grade as ${expected}.`);
  }
  const fieldCount = await page.locator("math-field").count();
  if (fieldCount !== values.length) {
    throw new Error(
      `Expected ${values.length} answer fields, but the app rendered ${fieldCount}.`,
    );
  }
  for (const [index, value] of values.entries()) {
    await setMathfieldValue(page, index, value);
  }
  // Focusing a field opens the keyboard asynchronously on touch devices; let that settle
  // before closing it, so every run submits from the same state. After the check the app
  // itself decides: correct moves focus to Next (keyboard stays closed), incorrect and
  // invalid return focus to the answer (keyboard reopens on a phone).
  await page.waitForTimeout(400);
  await page.locator(".question-body h2").click();
  await hideKeyboard(page, true);
  await page.waitForFunction(() => !window.mathVirtualKeyboard.visible);
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.locator(`#feedback.${expected}`).waitFor({ state: "visible" });
  await page.waitForTimeout(600);
}

async function readKeyboardGeometry(page: Page): Promise<KeyboardGeometry> {
  const result = await page.evaluate(() => {
    // Whole pixels, like the baseline. No arrow function here: tsx wraps named functions in a
    // __name() helper that does not exist inside the page.
    const round = Math.round;
    const keyboard = document.querySelector<HTMLElement>(".ML__keyboard");
    const plate = keyboard?.querySelector<HTMLElement>(".MLK__plate");
    const plateRect = plate?.getBoundingClientRect();
    const rows = Array.from(
      keyboard?.querySelectorAll(".MLK__layer.is-visible .MLK__row") ?? [],
    ).map((row) =>
      Array.from(
        row.querySelectorAll<HTMLElement>(".MLK__keycap, .action, .separator"),
      )
        .filter((key) => key.getBoundingClientRect().width > 0)
        .map((key) => {
          const rect = key.getBoundingClientRect();
          const ariaLabel = key.getAttribute("aria-label");
          const svgRect = key.querySelector("svg")?.getBoundingClientRect();
          const entry: KeyGeometry = {
            label: (ariaLabel ?? key.textContent ?? "").trim().slice(0, 16),
            ariaLabel,
            x: round(rect.left),
            w: round(rect.width),
            h: round(rect.height),
          };
          if (svgRect) {
            entry.iconOffsetX = round(
              svgRect.left + svgRect.width / 2 - (rect.left + rect.width / 2),
            );
            entry.iconOffsetY = round(
              svgRect.top + svgRect.height / 2 - (rect.top + rect.height / 2),
            );
          }
          return entry;
        }),
    );
    return {
      viewport: window.innerWidth,
      plate: plateRect
        ? {
            x: round(plateRect.left),
            w: round(plateRect.width),
            h: round(plateRect.height),
          }
        : null,
      rows,
    };
  });
  if (!result.plate || !result.rows.length) {
    throw new Error("The visible MathLive keyboard plate or rows were not found.");
  }
  return result;
}

async function saveImage(
  page: Page,
  out: string,
  width: number,
  scheme: Scheme,
  index: number,
  state: string,
): Promise<string> {
  const name = `${width}-${scheme}-${String(index).padStart(2, "0")}-${state}`;
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false });
  imagesWritten.count += 1;
  return name;
}

async function captureWelcome(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  width: number,
  scheme: Scheme,
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    await openCandidate(page, base);
    await saveImage(page, out, width, scheme, 1, "welcome");
  });
}

async function captureQuestion(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  width: number,
  scheme: Scheme,
  index = 2,
  state = "question",
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    await startQuestion(page, base);
    await hideKeyboard(page, true);
    await saveImage(page, out, width, scheme, index, state);
  });
}

async function captureKeyboard(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  width: number,
  scheme: Scheme,
  index: number,
  state: string,
  mode: "open" | "tap" | "second-page",
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    await startQuestion(page, base);
    await hideKeyboard(page, true);
    // On a touch device the answer's focus handler also opens the keyboard, so a click on
    // the toggle button could race it and close it again. Open it directly instead.
    await page.locator("math-field").first().focus();
    await page.evaluate(() => window.mathVirtualKeyboard.show());
    await page.locator(".ML__keyboard").waitFor({ state: "visible" });
    await page.waitForTimeout(300);
    if (mode === "tap") {
      const key = page
        .locator(".ML__keyboard .MLK__layer.is-visible .MLK__keycap:visible")
        .first();
      await key.waitFor({ state: "visible" });
      await key.tap();
      await page.waitForTimeout(1500);
      await page.locator(".ML__keyboard").waitFor({ state: "visible" });
    } else if (mode === "second-page") {
      const firstLayer = await page
        .locator(".ML__keyboard .MLK__layer.is-visible")
        .getAttribute("id");
      const secondTab = page.locator(
        ".ML__keyboard .MLK__layer.is-visible .MLK__toolbar .left > div",
      ).nth(1);
      await secondTab.waitFor({ state: "visible" });
      await secondTab.click();
      await page.waitForFunction(
        (previousLayer) =>
          document.querySelector(".ML__keyboard .MLK__layer.is-visible")?.id !==
          previousLayer,
        firstLayer,
      );
    }
    const imageName = await saveImage(page, out, width, scheme, index, state);
    geometry[imageName] = await readKeyboardGeometry(page);
  });
}

async function captureFeedback(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  width: number,
  scheme: Scheme,
  index: number,
  state: string,
  verdict: FeedbackState,
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    const question = await startQuestion(page, base);
    const values =
      verdict === "correct"
        ? question.answers.map(latex)
        : verdict === "incorrect"
          ? wrongAnswer(question)
          : Array.from({ length: question.answers.length }, () => "");
    await submitForFeedback(page, question, values, verdict);
    await saveImage(page, out, width, scheme, index, state);
  });
}

async function captureHint(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  width: number,
  scheme: Scheme,
  workedSolution = false,
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    await startQuestion(page, base);
    await hideKeyboard(page, true);
    if (workedSolution) {
      const labels = ["Show next hint", "Show solution", "Solution shown"];
      for (const label of labels) {
        await page.locator("#hint").click();
        await page.waitForFunction(
          (expected) => document.querySelector("#hint")?.textContent === expected,
          label,
        );
      }
      await page
        .locator("#hints .hint-panel .eyebrow")
        .filter({ hasText: "WORKED SOLUTION" })
        .waitFor({ state: "visible" });
      await saveImage(page, out, width, scheme, 10, "worked-solution");
    } else {
      await page.getByRole("button", { name: "Need a hint?" }).click();
      await page.locator("#hints .hint-panel").waitFor({ state: "visible" });
      await saveImage(page, out, width, scheme, 9, "first-hint");
    }
  });
}

async function capturePath(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  scheme: Scheme,
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    await openCandidate(page, base);
    await page.locator(".progress-summary").click();
    await page.locator(".path-level").first().locator("summary").click();
    await page.locator(".journey[open]").waitFor({ state: "visible" });
    await saveImage(page, out, 390, scheme, 11, "progress-path");
  });
}

async function captureMoveDialog(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  width: number,
  scheme: Scheme,
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    await openCandidate(page, base);
    await page.getByRole("button", { name: "Move progress" }).click();
    await page.locator("#dialog").waitFor({ state: "visible" });
    await saveImage(page, out, width, scheme, 12, "move-progress");
  });
}

async function captureWhatsNew(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  width: number,
  scheme: Scheme,
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    await openCandidate(page, base);
    await page.locator("#whats-new").click();
    await page.locator("#dialog.whats-new").waitFor({ state: "visible" });
    await saveImage(page, out, width, scheme, 13, "whats-new");
  });
}

async function captureHelp(
  browser: Browser,
  options: BrowserContextOptions,
  base: URL,
  out: string,
  scheme: Scheme,
): Promise<void> {
  await inFreshPage(browser, options, async (page) => {
    await page.goto(new URL("help.html", base).href);
    await page.locator("body").waitFor({ state: "visible" });
    await saveImage(page, out, 390, scheme, 14, "help");
  });
}

async function capturePhoneScheme(
  browser: Browser,
  base: URL,
  out: string,
  scheme: Scheme,
): Promise<void> {
  const options = { ...devices["iPhone 13"], colorScheme: scheme };
  await captureWelcome(browser, options, base, out, 390, scheme);
  await captureQuestion(browser, options, base, out, 390, scheme);
  await captureKeyboard(
    browser,
    options,
    base,
    out,
    390,
    scheme,
    3,
    "keyboard-open",
    "open",
  );
  await captureKeyboard(
    browser,
    options,
    base,
    out,
    390,
    scheme,
    4,
    "keyboard-after-tap",
    "tap",
  );
  await captureKeyboard(
    browser,
    options,
    base,
    out,
    390,
    scheme,
    5,
    "keyboard-second-page",
    "second-page",
  );
  await captureFeedback(
    browser,
    options,
    base,
    out,
    390,
    scheme,
    6,
    "correct-feedback",
    "correct",
  );
  await captureFeedback(
    browser,
    options,
    base,
    out,
    390,
    scheme,
    7,
    "incorrect-feedback",
    "incorrect",
  );
  await captureFeedback(
    browser,
    options,
    base,
    out,
    390,
    scheme,
    8,
    "invalid-input",
    "invalid",
  );
  await captureHint(browser, options, base, out, 390, scheme);
  await captureHint(browser, options, base, out, 390, scheme, true);
  await capturePath(browser, options, base, out, scheme);
  await captureMoveDialog(browser, options, base, out, 390, scheme);
  await captureWhatsNew(browser, options, base, out, 390, scheme);
  await captureHelp(browser, options, base, out, scheme);
  if (scheme === "light") {
    await captureQuestion(
      browser,
      { ...options, reducedMotion: "reduce" },
      base,
      out,
      390,
      scheme,
      15,
      "question-reduced-motion",
    );
  }
}

async function captureDesktopScheme(
  browser: Browser,
  base: URL,
  out: string,
  scheme: Scheme,
): Promise<void> {
  const options: BrowserContextOptions = {
    viewport: { width: 1280, height: 860 },
    colorScheme: scheme,
  };
  await captureWelcome(browser, options, base, out, 1280, scheme);
  await captureQuestion(browser, options, base, out, 1280, scheme);
  await captureKeyboard(
    browser,
    options,
    base,
    out,
    1280,
    scheme,
    3,
    "keyboard-open",
    "open",
  );
  await captureFeedback(
    browser,
    options,
    base,
    out,
    1280,
    scheme,
    6,
    "correct-feedback",
    "correct",
  );
  await captureMoveDialog(browser, options, base, out, 1280, scheme);
  await captureWhatsNew(browser, options, base, out, 1280, scheme);
}

async function main(): Promise<void> {
  const { base, out: outArgument } = parseOptions();
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ) as { version?: unknown };
  if (typeof packageJson.version !== "string" || !packageJson.version.trim()) {
    throw new Error("package.json does not contain a valid version string.");
  }
  await checkServer(base);
  const out = outArgument
    ? path.resolve(repoRoot, outArgument)
    : path.join(repoRoot, "artifacts", "design", packageJson.version);
  mkdirSync(out, { recursive: true });

  const webkitBrowser = await webkit.launch();
  try {
    await capturePhoneScheme(webkitBrowser, base, out, "light");
    await capturePhoneScheme(webkitBrowser, base, out, "dark");
  } finally {
    await webkitBrowser.close();
  }

  const chromiumBrowser = await chromium.launch();
  try {
    await captureDesktopScheme(chromiumBrowser, base, out, "light");
    await captureDesktopScheme(chromiumBrowser, base, out, "dark");
  } finally {
    await chromiumBrowser.close();
  }

  writeFileSync(
    path.join(out, "keyboard-geometry.json"),
    JSON.stringify(geometry, null, 2),
  );
  console.log(
    `Captured ${imagesWritten.count} screenshots in ${out} (${Object.keys(geometry).length} keyboard geometries).`,
  );
}

main().catch((error: unknown) => {
  console.error(`[design:capture] ${(error as Error).message}`);
  process.exitCode = 1;
});
