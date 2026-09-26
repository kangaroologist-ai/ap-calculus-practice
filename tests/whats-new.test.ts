import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { WHATS_NEW, compareVersions, unseenEntries } from "../src/whats-new";

describe("What's new entries", () => {
  it("are strictly newest first with valid, unique versions", () => {
    for (const e of WHATS_NEW) {
      expect(e.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.items.length).toBeGreaterThanOrEqual(2);
      expect(e.items.length).toBeLessThanOrEqual(6);
    }
    for (let i = 1; i < WHATS_NEW.length; i++)
      expect(compareVersions(WHATS_NEW[i - 1].version, WHATS_NEW[i].version)).toBeGreaterThan(0);
  });
  it("match the app version from package.json", () => {
    expect(__APP_VERSION__).toBe(pkg.version);
    expect(WHATS_NEW[0].version).toBe(pkg.version);
  });
  it("compares versions numerically", () => {
    expect(compareVersions("1.10.0", "1.9.9")).toBeGreaterThan(0);
    expect(compareVersions("1.1.1", "1.1.1")).toBe(0);
    expect(compareVersions("1.0.9", "1.1.0")).toBeLessThan(0);
  });
});

describe("unseenEntries", () => {
  const entries = [
    { version: "1.2.0", date: "2026-10-01", title: "c", items: [] },
    { version: "1.1.1", date: "2026-09-26", title: "b", items: [] },
    { version: "1.1.0", date: "2026-09-26", title: "a", items: [] },
  ];
  const versions = (seen: string | null) => unseenEntries(entries, seen).map((e) => e.version);
  it("returns everything when nothing is seen or the marker is unreadable", () => {
    expect(versions(null)).toEqual(["1.2.0", "1.1.1", "1.1.0"]);
    expect(versions("")).toEqual(["1.2.0", "1.1.1", "1.1.0"]);
    expect(versions("2026-09-26")).toEqual(["1.2.0", "1.1.1", "1.1.0"]);
  });
  it("returns only newer entries, newest first", () => {
    expect(versions("1.1.0")).toEqual(["1.2.0", "1.1.1"]);
    expect(versions("1.1.5")).toEqual(["1.2.0"]);
  });
  it("returns nothing when the latest or a newer version was seen", () => {
    expect(versions("1.2.0")).toEqual([]);
    expect(versions("2.0.0")).toEqual([]);
  });
});
