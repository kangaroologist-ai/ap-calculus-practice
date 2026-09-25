import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");
const requiredPairs = [
  ["label", "surface"],
  ["label-2", "surface"],
  ["label-2", "bg"],
  ["label", "bg"],
  ["tint", "surface"],
  ["success", "surface"],
  ["warning", "surface"],
  ["danger", "surface"],
] as const;
const requiredTokens = [
  "label",
  "label-2",
  "separator",
  "fill",
  "bg",
  "surface",
  "tint",
  "focus",
  "success",
  "warning",
  "danger",
] as const;

function tokenSet(block: string) {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+):\s*(#[\da-f]{6})\s*;/gi)].map(
      ([, name, value]) => [name, value],
    ),
  ) as Record<string, string>;
}

function luminance(hex: string) {
  const rgb = hex.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16) / 255);
  const linear = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("theme token contrast", () => {
  const lightBlock = css.match(/:root\s*\{([^}]*)\}/)?.[1];
  const darkBlock = css.match(
    /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/,
  )?.[1];

  test("the required text and status pairs meet WCAG AA in both themes", () => {
    expect(lightBlock).toBeDefined();
    expect(darkBlock).toBeDefined();

    for (const [scheme, block] of [
      ["light", lightBlock!],
      ["dark", darkBlock!],
    ] as const) {
      const tokens = tokenSet(block);
      for (const name of requiredTokens) {
        expect(tokens[name], `${scheme} ${name} token`).toBeDefined();
      }
      for (const [foreground, background] of requiredPairs) {
        expect(tokens[foreground], `${scheme} ${foreground} token`).toBeDefined();
        expect(tokens[background], `${scheme} ${background} token`).toBeDefined();
        expect(
          contrast(tokens[foreground], tokens[background]),
          `${scheme} ${foreground}/${background}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  // WCAG 1.4.11: an answer field's or secondary button's boundary must be
  // distinguishable (3:1) on both the card and the page background.
  test("control borders meet the non-text contrast minimum in both themes", () => {
    for (const [scheme, block] of [
      ["light", lightBlock!],
      ["dark", darkBlock!],
    ] as const) {
      const tokens = tokenSet(block);
      for (const background of ["surface", "bg"] as const)
        expect(
          contrast(tokens["control-border"], tokens[background]),
          `${scheme} control-border/${background}`,
        ).toBeGreaterThanOrEqual(3);
    }
  });
});
