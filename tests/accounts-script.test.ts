import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  addStudentsSql,
  assertOutputOutsideRepository,
  createClassSql,
  deleteClassSql,
  deleteStudentSql,
  firstResults,
  isInsideRepository,
  loadReportCss,
  parseNamesFile,
  renderCodesCsv,
  renderReportHtml,
  renderSlipsHtml,
  repositoryRoot,
  repositoryRoots,
  reissueSql,
  setTeacherCodeSql,
  slipUrl,
  sqlText,
} from "../scripts/accounts";
import { buildTeacherGridModel } from "../src/teacher-grid";
import type { Config } from "../src/types";

const CONFIG: Config = {
  schemaVersion: 1,
  revision: "accounts-script-test",
  initialUnlockedLevel: 1,
  disabledFamilies: ["parametric", "vector", "polar"],
  sessionLength: 12,
};

const TRICKY = `O'Brien; "Zoë" 李`;
const CODE = "CALCABCDEFGHJK";

describe("SQL builders", () => {
  it("escapes quotes in text values", () => {
    expect(sqlText(TRICKY)).toBe(`'O''Brien; "Zoë" 李'`);
  });

  it("adds students with escaped names", () => {
    const sql = addStudentsSql(
      "CALC",
      [{ name: TRICKY, codeHash: "abc123" }],
      1700000000000,
    );
    expect(sql).toContain(
      `('abc123', 'CALC', 'O''Brien; "Zoë" 李', 1700000000000)`,
    );
  });

  it("builds class, reissue, delete, and teacher-code statements", () => {
    expect(createClassSql("CALC", TRICKY, 123)).toContain(
      `'O''Brien; "Zoë" 李'`,
    );
    expect(reissueSql("CALC", TRICKY, "hash")).toContain(
      `'O''Brien; "Zoë" 李'`,
    );
    expect(deleteStudentSql("CALC", TRICKY)).toContain(
      `'O''Brien; "Zoë" 李'`,
    );
    const deleted = deleteClassSql("CALC");
    expect(deleted.indexOf("DELETE FROM students")).toBeLessThan(
      deleted.indexOf("DELETE FROM classes"),
    );
    expect(setTeacherCodeSql("hash")).toContain(
      "INSERT OR REPLACE INTO teacher",
    );
  });

  it("refuses an invalid prefix", () => {
    expect(() =>
      addStudentsSql("CALC1", [{ name: "Ada", codeHash: "h" }], 1),
    ).toThrow();
    expect(() => createClassSql("toolongprefix", "Class", 1)).toThrow();
    expect(() => reissueSql("c", "Ada", "h")).toThrow();
    expect(() => deleteStudentSql("CALC-1", "Ada")).toThrow();
    expect(() => deleteClassSql("")).toThrow();
  });
});

describe("names file", () => {
  it("trims names and skips blank lines", () => {
    expect(parseNamesFile("  Ada Lovelace \n\nBen Test\r\n")).toEqual([
      "Ada Lovelace",
      "Ben Test",
    ]);
  });

  it("refuses duplicate names", () => {
    expect(() => parseNamesFile("Ada\nBen\nAda")).toThrow(/duplicate/i);
    expect(() => parseNamesFile("Ada\nada")).toThrow(/duplicate/i);
  });

  it("refuses a file with no names", () => {
    expect(() => parseNamesFile("\n \r\n")).toThrow();
  });
});

describe("output folder", () => {
  const root = "/tmp/ap-calculus-practice";

  it("detects folders inside the repository", () => {
    expect(isInsideRepository(root, root)).toBe(true);
    expect(isInsideRepository(`${root}/accounts-private`, root)).toBe(true);
    expect(isInsideRepository("/tmp/ap-calculus-practice-notes", root)).toBe(
      false,
    );
    expect(isInsideRepository("/tmp/accounts-private", root)).toBe(false);
  });

  it("refuses an output folder inside the repository", () => {
    expect(() =>
      assertOutputOutsideRepository(`${root}/private`, root),
    ).toThrow();
    expect(() =>
      assertOutputOutsideRepository("/tmp/accounts-private", root),
    ).not.toThrow();
  });

  it("finds the repository root with git", () => {
    const repo = repositoryRoot();
    expect(() =>
      assertOutputOutsideRepository(path.join(repo, "private"), repo),
    ).toThrow();
  });

  it("lists every checkout of the repository, not only this one", () => {
    const roots = repositoryRoots();
    expect(roots).toContain(repositoryRoot());
    // Each worktree has a .git entry, so each listed root is a checkout.
    expect(roots.length).toBeGreaterThanOrEqual(1);
    for (const root of roots)
      expect(() =>
        assertOutputOutsideRepository(path.join(root, "accounts-private"), root),
      ).toThrow();
  });

  it("resolves symlinks before deciding", () => {
    const repo = repositoryRoot();
    const directory = mkdtempSync(path.join(tmpdir(), "accounts-script-"));
    try {
      const link = path.join(directory, "checkout");
      symlinkSync(repo, link, "dir");
      expect(isInsideRepository(path.join(link, "private"), repo)).toBe(true);
      expect(() =>
        assertOutputOutsideRepository(path.join(link, "private"), repo),
      ).toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe("wrangler output", () => {
  it("ignores import statistics from remote file runs", () => {
    const output = JSON.stringify([
      {
        results: [
          {
            "Total queries executed": 1,
            "Rows read": 0,
            "Rows written": 1,
            "Database size (MB)": 0.01,
          },
        ],
        success: true,
      },
    ]);
    expect(firstResults(output)).toEqual([]);
  });

  it("reads rows from a query result", () => {
    const output = JSON.stringify([
      {
        results: [{ prefix: "CALC", name: "Test class" }],
        success: true,
      },
    ]);
    expect(firstResults(output)).toEqual([
      { prefix: "CALC", name: "Test class" },
    ]);
  });
});

describe("slip page", () => {
  it("escapes names and puts the formatted code in the QR fragment", async () => {
    const html = await renderSlipsHtml(
      [{ name: 'Ada "A" <Test> & Co', code: CODE }],
      { className: 'Class "A" & <B>' },
    );

    expect(html).toContain("Ada &quot;A&quot; &lt;Test&gt; &amp; Co");
    expect(html).toContain("Class &quot;A&quot; &amp; &lt;B&gt;");
    expect(html).toContain("CALC-ABCD-EFGH-JK");
    expect(html).toContain("#login=CALC-ABCD-EFGH-JK");
    expect(html).not.toContain("?login=");
    expect(html).toContain(
      "Keep this slip. You need the code to sign in on a new device.",
    );
    expect(html).toContain("<svg");
    expect(html).toContain("@page { size: A4; margin: 8mm; }");
  });

  it("builds the sign-in link from the formatted code", () => {
    expect(slipUrl(CODE)).toBe(
      "https://ap-calculus-practice.pages.dev/#login=CALC-ABCD-EFGH-JK",
    );
  });

  it("writes a CSV with quoted names", () => {
    expect(
      renderCodesCsv([{ name: 'Doe, "Ada"', code: CODE }]),
    ).toBe('name,code\r\n"Doe, ""Ada""",CALC-ABCD-EFGH-JK\r\n');
  });
});

describe("report page", () => {
  it("inlines the styles and makes no external requests", () => {
    const model = buildTeacherGridModel(
      {
        classes: [{ prefix: "CALC", name: "Calculus <A>" }],
        students: [
          {
            id: 1,
            classPrefix: "CALC",
            name: "Ada Test",
            revision: 0,
            progress: null,
            updatedAt: null,
            savedAt: null,
          },
        ],
      },
      CONFIG,
    );
    const css = loadReportCss();
    const html = renderReportHtml(model, css, {
      now: 1767225600000,
      classFilter: "CALC",
    });

    expect(css).toContain("--label:");
    expect(css).toContain(".teacher-table");
    expect(css).not.toContain("@import");
    expect(html).toContain(css);
    expect(html).toContain("Calculus &lt;A&gt;");
    expect(html).toContain("Ada Test");
    expect(html).toContain("Generated");
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("<link");
  });
});
