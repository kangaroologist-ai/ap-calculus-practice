import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import QRCode from "qrcode";
import {
  formatLoginCode,
  formatTeacherCode,
  isValidPrefix,
  newLoginCode,
  newTeacherCode,
  sha256Hex,
} from "../src/account-code";
import { validateConfig } from "../src/catalog";
import {
  ALL_CLASSES,
  buildTeacherGridModel,
  renderTeacherGrid,
  type TeacherGridModel,
  type TeacherStudent,
} from "../src/teacher-grid";
import type { Config } from "../src/types";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATABASE = "ap-calculus-practice";
const SITE_URL = "https://ap-calculus-practice.pages.dev";
const DEFAULT_OUT = path.join(
  homedir(),
  "Documents",
  "20_Study",
  "AP Calculus",
  "accounts-private",
);
const SLIP_NOTE =
  "Keep this slip. You need the code to sign in on a new device.";

const USAGE = `Usage: npm run accounts -- <command> [options]

Commands:
  create-class <PREFIX> "<class name>"   Add a class.
  add-students <PREFIX> <names.txt>      Add students, then write slips and a CSV.
  reissue <PREFIX> "<name>"              Give one student a new code.
  delete-student <PREFIX> "<name>"       Delete one student, after confirmation.
  delete-class <PREFIX>                  Delete a class and its students, after confirmation.
  teacher-code                           Replace the teacher code.
  report [PREFIX]                        Write an HTML progress report.
  list [PREFIX]                          List classes and student counts.

Options:
  --local          Use the local D1 database (default: remote).
  --out <dir>      Private output folder (default: ${DEFAULT_OUT}).`;

export interface Target {
  local: boolean;
}

export interface ScriptOptions {
  local: boolean;
  out: string;
}

export interface ParsedArgs {
  command: string | null;
  args: string[];
  options: ScriptOptions;
  help: boolean;
}

interface Context {
  target: Target;
  out: string;
}

export interface NewStudent {
  name: string;
  codeHash: string;
}

export interface SlipStudent {
  name: string;
  code: string;
}

export interface SlipOptions {
  className: string;
}

interface ClassRow {
  prefix: string;
  name: string;
}

interface StudentNameRow {
  id: number;
  name: string;
}

const pad2 = (value: number): string => String(value).padStart(2, "0");

export function dateStamp(now: number): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function clockStamp(now: number): string {
  const date = new Date(now);
  return `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
}

function availableFile(target: string): string {
  if (!existsSync(target)) return target;
  const extension = path.extname(target);
  const stem = extension ? target.slice(0, -extension.length) : target;
  for (let index = 2; ; index++) {
    const candidate = `${stem}-${index}${extension}`;
    if (!existsSync(candidate)) return candidate;
  }
}

export function sqlText(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function requirePrefix(prefix: string): string {
  if (!isValidPrefix(prefix))
    throw Error("Invalid class prefix. Use 2 to 8 letters A-Z.");
  return prefix;
}

export function createClassSql(
  prefix: string,
  name: string,
  createdAt: number,
): string {
  requirePrefix(prefix);
  return `INSERT INTO classes (prefix, name, created_at) VALUES (${sqlText(prefix)}, ${sqlText(name)}, ${createdAt});`;
}

export function addStudentsSql(
  prefix: string,
  students: NewStudent[],
  createdAt: number,
): string {
  requirePrefix(prefix);
  if (!students.length) throw Error("No students to add.");
  const values = students.map(
    (student) =>
      `(${sqlText(student.codeHash)}, ${sqlText(prefix)}, ${sqlText(student.name)}, ${createdAt})`,
  );
  return `INSERT INTO students (code_hash, class_prefix, name, created_at) VALUES ${values.join(", ")};`;
}

export function reissueSql(
  prefix: string,
  name: string,
  codeHash: string,
): string {
  requirePrefix(prefix);
  return `UPDATE students SET code_hash = ${sqlText(codeHash)} WHERE class_prefix = ${sqlText(prefix)} AND name = ${sqlText(name)};`;
}

export function deleteStudentSql(prefix: string, name: string): string {
  requirePrefix(prefix);
  return `DELETE FROM students WHERE class_prefix = ${sqlText(prefix)} AND name = ${sqlText(name)};`;
}

export function deleteClassSql(prefix: string): string {
  requirePrefix(prefix);
  return [
    `DELETE FROM students WHERE class_prefix = ${sqlText(prefix)};`,
    `DELETE FROM classes WHERE prefix = ${sqlText(prefix)};`,
  ].join("\n");
}

export function setTeacherCodeSql(codeHash: string): string {
  return `INSERT OR REPLACE INTO teacher (id, code_hash) VALUES (1, ${sqlText(codeHash)});`;
}

export function classQuerySql(prefix: string): string {
  requirePrefix(prefix);
  return `SELECT prefix, name FROM classes WHERE prefix = ${sqlText(prefix)};`;
}

export function studentsOfClassQuerySql(prefix: string): string {
  requirePrefix(prefix);
  return `SELECT id, name FROM students WHERE class_prefix = ${sqlText(prefix)} ORDER BY name;`;
}

export function allClassesQuerySql(): string {
  return "SELECT prefix, name FROM classes ORDER BY prefix;";
}

export function allStudentsQuerySql(): string {
  return "SELECT id, class_prefix AS classPrefix, name, revision, progress, updated_at AS updatedAt, saved_at AS savedAt FROM students ORDER BY class_prefix, name;";
}

const nameKey = (name: string): string => name.toLocaleLowerCase("en-US");

export function parseNamesFile(content: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const line of content.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const name = line.trim();
    if (!name) continue;
    const key = nameKey(name);
    if (seen.has(key)) throw Error("The names file has duplicate names.");
    seen.add(key);
    names.push(name);
  }
  if (!names.length) throw Error("The names file has no names.");
  return names;
}

function realPath(target: string): string {
  let current = path.resolve(target);
  const missing: string[] = [];
  for (;;) {
    try {
      const resolved = realpathSync(current);
      return missing.length
        ? path.join(resolved, ...missing.reverse())
        : resolved;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return path.resolve(target);
      missing.push(path.basename(current));
      current = parent;
    }
  }
}

export function isInsideRepository(dir: string, repoRoot: string): boolean {
  const relative = path.relative(realPath(repoRoot), realPath(dir));
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

export function assertOutputOutsideRepository(
  dir: string,
  repoRoot: string,
): void {
  if (isInsideRepository(dir, repoRoot))
    throw Error("Choose an output folder outside this git repository.");
}

export function repositoryRoot(cwd = REPO_ROOT): string {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  }).trim();
}

// Every checkout of this repository counts, not only the current one: the
// main checkout and other worktrees are in git too.
export function repositoryRoots(cwd = REPO_ROOT): string[] {
  const listed = execFileSync("git", ["worktree", "list", "--porcelain"], {
    cwd,
    encoding: "utf8",
  })
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length));
  return [repositoryRoot(cwd), ...listed];
}

// Names and login codes: only the owner of the laptop account may read them.
const PRIVATE_FILE = { encoding: "utf8", mode: 0o600 } as const;

function prepareOut(out: string): void {
  let roots: string[];
  try {
    roots = repositoryRoots();
  } catch {
    throw Error("Could not find the git repository root.");
  }
  for (const root of roots) assertOutputOutsideRepository(out, root);
  mkdirSync(out, { recursive: true, mode: 0o700 });
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

export function slipUrl(code: string): string {
  return `${SITE_URL}/#login=${formatLoginCode(code)}`;
}

async function renderSlip(
  student: SlipStudent,
  escapedClassName: string,
): Promise<string> {
  const code = formatLoginCode(student.code);
  const url = slipUrl(student.code);
  const qr = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    width: 132,
    errorCorrectionLevel: "M",
  });
  return `<article class="slip" data-login-url="${escapeHtml(url)}">
<div class="slip-copy">
<p class="slip-site">AP Calculus Practice</p>
<p class="slip-name">${escapeHtml(student.name)}</p>
<p class="slip-class">Class: ${escapedClassName}</p>
<p class="slip-code">${escapeHtml(code)}</p>
<p class="slip-note">${SLIP_NOTE}</p>
<p class="slip-link">${escapeHtml(url)}</p>
</div>
<div class="slip-qr">${qr}</div>
</article>`;
}

const SLIP_CSS = `
@page { size: A4; margin: 8mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #111; }
body { font-family: -apple-system, ui-sans-serif, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.sheet { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 68mm; }
.slip { display: flex; align-items: center; gap: 3mm; padding: 4mm; border-right: 1px dashed #9a9a9e; border-bottom: 1px dashed #9a9a9e; break-inside: avoid; overflow: hidden; }
.slip:nth-child(2n) { border-right: 0; }
.slip-copy { flex: 1 1 auto; min-width: 0; }
.slip-site { margin: 0 0 1.5mm; font-size: 8pt; font-weight: 600; letter-spacing: 0.3pt; text-transform: uppercase; color: #555; }
.slip-name { margin: 0 0 1mm; font-size: 13pt; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
.slip-class { margin: 0 0 2mm; font-size: 8.5pt; color: #444; overflow-wrap: anywhere; }
.slip-code { margin: 0 0 2mm; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12pt; font-weight: 700; letter-spacing: 0.2pt; white-space: nowrap; }
.slip-note { margin: 0; font-size: 7.5pt; line-height: 1.35; color: #333; }
.slip-link { margin: 1.5mm 0 0; font-size: 6.5pt; line-height: 1.3; color: #555; overflow-wrap: anywhere; }
.slip-qr { flex: 0 0 24mm; }
.slip-qr svg { display: block; width: 24mm; height: 24mm; }
`;

export async function renderSlipsHtml(
  students: SlipStudent[],
  options: SlipOptions,
): Promise<string> {
  const className = escapeHtml(options.className);
  const slips = await Promise.all(
    students.map((student) => renderSlip(student, className)),
  );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Login codes · ${className}</title>
<style>${SLIP_CSS}</style>
</head>
<body>
<main class="sheet">
${slips.join("\n")}
</main>
</body>
</html>
`;
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function renderCodesCsv(students: SlipStudent[]): string {
  const lines = [
    "name,code",
    ...students.map(
      (student) =>
        `${csvField(student.name)},${csvField(formatLoginCode(student.code))}`,
    ),
  ];
  return `${lines.join("\r\n")}\r\n`;
}

export interface ReportOptions {
  now?: number;
  classFilter?: string | null;
}

export function renderReportHtml(
  model: TeacherGridModel,
  css: string,
  options: ReportOptions = {},
): string {
  const now = options.now ?? Date.now();
  const filter = options.classFilter ?? null;
  const scopeClass =
    filter === null
      ? undefined
      : model.classes.find((entry) => entry.prefix === filter);
  const scope =
    filter === null ? "All classes" : `${scopeClass?.name || filter} (${filter})`;
  const count = model.rows.filter(
    (row) => filter === null || row.classPrefix === filter,
  ).length;
  const generated = new Date(now).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const grid = renderTeacherGrid(model, {
    classFilter: filter ?? ALL_CLASSES,
    now,
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Class progress · AP Calculus Practice</title>
<style>${css}</style>
</head>
<body>
<main class="teacher-page report-page">
<header class="teacher-heading report-heading">
<p class="report-eyebrow">AP Calculus Practice · Teacher report</p>
<h1>Class progress</h1>
<p class="report-meta">${escapeHtml(scope)} · ${count} ${count === 1 ? "student" : "students"} · Generated <time datetime="${new Date(now).toISOString()}">${escapeHtml(generated)}</time></p>
</header>
<div class="teacher-grid-scroll report-grid">${grid}</div>
</main>
</body>
</html>
`;
}

export function reportTokensCss(styleCss: string): string {
  const root = styleCss.match(/:root\s*\{[^}]*\}/)?.[0] ?? "";
  const dark =
    styleCss.match(
      /@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{[^}]*\}\s*\}/,
    )?.[0] ?? "";
  return [root, dark].filter(Boolean).join("\n");
}

const REPORT_BASE_CSS = `
* { box-sizing: border-box; }
html, body { margin: 0; }
body { background: var(--bg); color: var(--label); font-size: var(--t-body); }
`;

const REPORT_CSS = `
.report-page { max-width: 1600px; margin: 0 auto; padding: var(--space-6) var(--space-5); }
.report-heading { max-width: 900px; margin: 0 0 var(--space-5); }
.report-eyebrow { margin: 0 0 var(--space-2); color: var(--label-2); font-size: var(--t-caption); font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; }
.report-heading h1 { margin: var(--space-2) 0; font-size: var(--t-help-title); font-weight: 400; letter-spacing: -1.4px; line-height: 1.15; }
.report-meta { margin: 0; color: var(--label-2); font-size: var(--t-subhead); line-height: 1.6; }
.report-grid { max-height: none; overflow: auto; }
@media print {
  @page { size: A4 landscape; margin: 6mm; }
  html, body { background: #fff; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .report-page { max-width: none; padding: 0; }
  .report-grid { overflow: visible; border: 0; }
  .teacher-table thead th,
  .teacher-name-cell { position: static; }
}
`;

export function loadReportCss(repoRoot = REPO_ROOT): string {
  const styleCss = readFileSync(path.join(repoRoot, "src", "style.css"), "utf8");
  const teacherCss = readFileSync(
    path.join(repoRoot, "src", "teacher.css"),
    "utf8",
  );
  return [
    reportTokensCss(styleCss),
    REPORT_BASE_CSS,
    teacherCss,
    REPORT_CSS,
  ].join("\n");
}

export function loadPracticeConfig(repoRoot = REPO_ROOT): Config {
  return validateConfig(
    JSON.parse(
      readFileSync(path.join(repoRoot, "public", "practice-config.json"), "utf8"),
    ),
  );
}

function resolveFolder(value: string): string {
  const expanded =
    value === "~" || value.startsWith("~/")
      ? path.join(homedir(), value.slice(1))
      : value;
  return path.resolve(expanded);
}

export function parseArgs(
  argv: string[],
  defaultOut = DEFAULT_OUT,
): ParsedArgs {
  let local = false;
  let out = defaultOut;
  let help = false;
  const positionals: string[] = [];
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--local") {
      local = true;
      continue;
    }
    if (arg === "--out") {
      const value = argv[++index];
      if (value === undefined || value === "")
        throw Error("Missing a folder after --out.");
      out = resolveFolder(value);
      continue;
    }
    if (arg.startsWith("--out=")) {
      const value = arg.slice("--out=".length);
      if (!value) throw Error("Missing a folder after --out.");
      out = resolveFolder(value);
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }
    if (arg.startsWith("--")) throw Error(`Unknown option ${arg}.`);
    positionals.push(arg);
  }
  return {
    command: positionals[0] ?? null,
    args: positionals.slice(1),
    options: { local, out },
    help,
  };
}

export interface D1StatementResult {
  results?: unknown[];
  success?: boolean;
  meta?: { changes?: number };
}

const isImportStatistics = (row: unknown): boolean =>
  row !== null &&
  typeof row === "object" &&
  !Array.isArray(row) &&
  "Total queries executed" in row &&
  "Rows written" in row;

export function firstResults<T>(output: string): T[] {
  const start = output.indexOf("[");
  if (start < 0) throw Error("Could not read the wrangler output.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(output.slice(start));
  } catch {
    throw Error("Could not read the wrangler output.");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  const first = parsed[0];
  let rows: unknown[];
  if (Array.isArray(first)) rows = first;
  else if (
    first !== null &&
    typeof first === "object" &&
    Array.isArray((first as D1StatementResult).results)
  )
    rows = (first as D1StatementResult).results as unknown[];
  else return [];
  return rows.filter((row) => !isImportStatistics(row)) as T[];
}

function wrangler(args: string[], target: Target): string {
  try {
    return execFileSync(
      "npx",
      [
        "wrangler",
        "d1",
        "execute",
        DATABASE,
        target.local ? "--local" : "--remote",
        "--json",
        ...args,
      ],
      {
        cwd: REPO_ROOT,
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        env: {
          ...process.env,
          // Keep query rows (student names and progress) out of log files.
          WRANGLER_WRITE_LOGS: "false",
        },
      },
    );
  } catch (error) {
    const status = (error as { status?: number | null }).status;
    const code = typeof status === "number" ? ` (exit code ${status})` : "";
    const hint = target.local
      ? " Run `npm run db:local` to create the local tables."
      : " Check `npx wrangler login` and the database name.";
    throw Error(`wrangler d1 execute failed${code}.${hint}`);
  }
}

function runSqlFile(sql: string, target: Target): void {
  const directory = mkdtempSync(path.join(tmpdir(), "ap-calculus-accounts-"));
  const file = path.join(directory, "command.sql");
  try {
    // The SQL stays in a private temp file so names never reach a command line.
    writeFileSync(file, sql, { encoding: "utf8", mode: 0o600 });
    wrangler(["--file", file], target);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function query<T>(sql: string, target: Target): T[] {
  // Remote --file runs report import statistics, not rows. Read statements
  // passed with --command never contain student names.
  return firstResults<T>(wrangler(["--command", sql], target));
}

function classPrefix(raw: string): string {
  const prefix = raw.trim().toUpperCase();
  if (!isValidPrefix(prefix))
    throw Error("Invalid class prefix. Use 2 to 8 letters A-Z.");
  return prefix;
}

function findClass(prefix: string, target: Target): ClassRow {
  const rows = query<ClassRow>(classQuerySql(prefix), target);
  if (!rows.length) throw Error(`Unknown class ${prefix}.`);
  return rows[0];
}

function classStudents(prefix: string, target: Target): StudentNameRow[] {
  return query<StudentNameRow>(studentsOfClassQuerySql(prefix), target);
}

function findStudent(
  prefix: string,
  name: string,
  target: Target,
): StudentNameRow[] {
  return classStudents(prefix, target).filter((row) => row.name === name);
}

async function createClass(
  rawPrefix: string,
  rawName: string,
  target: Target,
): Promise<void> {
  const prefix = classPrefix(rawPrefix);
  const name = rawName.trim();
  if (!name) throw Error("The class name is empty.");
  if (query<ClassRow>(classQuerySql(prefix), target).length)
    throw Error(`Class ${prefix} already exists.`);
  runSqlFile(createClassSql(prefix, name, Date.now()), target);
  console.log(`Created class ${prefix}: ${name}`);
}

async function addStudents(
  rawPrefix: string,
  namesFile: string,
  context: Context,
): Promise<void> {
  const prefix = classPrefix(rawPrefix);
  const klass = findClass(prefix, context.target);
  const names = parseNamesFile(readFileSync(path.resolve(namesFile), "utf8"));
  const taken = new Set(
    classStudents(prefix, context.target).map((row) => nameKey(row.name)),
  );
  for (const name of names)
    if (taken.has(nameKey(name)))
      throw Error(`Class ${prefix} already has a student with that name.`);
  prepareOut(context.out);
  const now = Date.now();
  const entries = names.map((name) => ({
    name,
    code: newLoginCode(prefix),
  }));
  const hashes = await Promise.all(
    entries.map((entry) => sha256Hex(entry.code)),
  );
  const slipsHtml = await renderSlipsHtml(entries, {
    className: klass.name,
  });
  const codesCsv = renderCodesCsv(entries);
  const stamp = `${dateStamp(now)}-${clockStamp(now)}`;
  const slipsFile = availableFile(
    path.join(context.out, `${prefix}-slips-${stamp}.html`),
  );
  const codesFile = availableFile(
    path.join(context.out, `${prefix}-codes-${stamp}.csv`),
  );
  // Save the only plaintext copies before the hashes reach D1.
  try {
    writeFileSync(slipsFile, slipsHtml, PRIVATE_FILE);
    writeFileSync(codesFile, codesCsv, PRIVATE_FILE);
  } catch (error) {
    rmSync(slipsFile, { force: true });
    rmSync(codesFile, { force: true });
    throw error;
  }
  runSqlFile(
    addStudentsSql(
      prefix,
      entries.map((entry, index) => ({
        name: entry.name,
        codeHash: hashes[index],
      })),
      now,
    ),
    context.target,
  );
  console.log(`Wrote ${entries.length} slips to ${slipsFile}`);
  console.log(`Wrote ${entries.length} codes to ${codesFile}`);
}

async function reissue(
  rawPrefix: string,
  rawName: string,
  context: Context,
): Promise<void> {
  const prefix = classPrefix(rawPrefix);
  const name = rawName.trim();
  if (!name) throw Error("The student name is empty.");
  const klass = findClass(prefix, context.target);
  const rows = findStudent(prefix, name, context.target);
  if (!rows.length)
    throw Error(`No student with that name in class ${prefix}.`);
  if (rows.length > 1)
    throw Error(`More than one student has that name in class ${prefix}.`);
  prepareOut(context.out);
  const code = newLoginCode(prefix);
  const now = Date.now();
  const file = availableFile(
    path.join(
      context.out,
      `${prefix}-reissue-${dateStamp(now)}-${clockStamp(now)}.html`,
    ),
  );
  // Write the slip before the update so a failed write cannot lose the code.
  writeFileSync(
    file,
    await renderSlipsHtml([{ name, code }], { className: klass.name }),
    PRIVATE_FILE,
  );
  runSqlFile(reissueSql(prefix, name, await sha256Hex(code)), context.target);
  console.log(`Wrote a new slip to ${file}`);
}

async function ask(question: string): Promise<string> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    return (await readline.question(question)).trim();
  } finally {
    readline.close();
  }
}

async function deleteStudent(
  rawPrefix: string,
  rawName: string,
  context: Context,
): Promise<void> {
  const prefix = classPrefix(rawPrefix);
  const name = rawName.trim();
  if (!name) throw Error("The student name is empty.");
  findClass(prefix, context.target);
  const rows = findStudent(prefix, name, context.target);
  if (!rows.length)
    throw Error(`No student with that name in class ${prefix}.`);
  if (rows.length > 1)
    throw Error(`More than one student has that name in class ${prefix}.`);
  const answer = await ask(
    `This deletes 1 student from class ${prefix}. Type DELETE to confirm: `,
  );
  if (answer !== "DELETE") {
    console.log("Nothing was deleted.");
    return;
  }
  runSqlFile(deleteStudentSql(prefix, name), context.target);
  console.log(`Deleted 1 student from class ${prefix}.`);
}

async function deleteClass(
  rawPrefix: string,
  context: Context,
): Promise<void> {
  const prefix = classPrefix(rawPrefix);
  const klass = findClass(prefix, context.target);
  const students = classStudents(prefix, context.target);
  const noun = students.length === 1 ? "student" : "students";
  const answer = await ask(
    `This deletes class ${prefix} (${klass.name}) and ${students.length} ${noun}. Type DELETE to confirm: `,
  );
  if (answer !== "DELETE") {
    console.log("Nothing was deleted.");
    return;
  }
  runSqlFile(deleteClassSql(prefix), context.target);
  console.log(`Deleted class ${prefix} and ${students.length} ${noun}.`);
}

async function setTeacherCode(context: Context): Promise<void> {
  const code = newTeacherCode();
  runSqlFile(setTeacherCodeSql(await sha256Hex(code)), context.target);
  console.log(`New teacher code: ${formatTeacherCode(code)}`);
  console.log("The old teacher code stops working.");
}

async function writeReport(
  rawPrefix: string | undefined,
  context: Context,
): Promise<void> {
  const filter = rawPrefix === undefined ? null : classPrefix(rawPrefix);
  if (filter !== null) findClass(filter, context.target);
  const classes = query<ClassRow>(allClassesQuerySql(), context.target);
  const students = query<TeacherStudent>(allStudentsQuerySql(), context.target);
  const model = buildTeacherGridModel(
    { classes, students },
    loadPracticeConfig(),
  );
  const now = Date.now();
  const html = renderReportHtml(model, loadReportCss(), {
    now,
    classFilter: filter,
  });
  prepareOut(context.out);
  const file = path.join(context.out, `report-${dateStamp(now)}.html`);
  writeFileSync(file, html, PRIVATE_FILE);
  console.log(`Wrote ${file}`);
}

async function listClasses(
  rawPrefix: string | undefined,
  target: Target,
): Promise<void> {
  const filter = rawPrefix === undefined ? null : classPrefix(rawPrefix);
  if (filter !== null) findClass(filter, target);
  const classes = query<ClassRow>(allClassesQuerySql(), target).filter(
    (entry) => filter === null || entry.prefix === filter,
  );
  if (!classes.length) {
    console.log("No classes.");
    return;
  }
  const students = query<TeacherStudent>(allStudentsQuerySql(), target);
  for (const klass of classes) {
    const members = students.filter(
      (student) => student.classPrefix === klass.prefix,
    );
    const noun = members.length === 1 ? "student" : "students";
    console.log(`${klass.prefix}  ${klass.name}  (${members.length} ${noun})`);
  }
}

function requireArgs(args: string[], count: number, usage: string): void {
  if (args.length !== count)
    throw Error(`Usage: npm run accounts -- ${usage}`);
}

function requireMaxArgs(args: string[], max: number, usage: string): void {
  if (args.length > max) throw Error(`Usage: npm run accounts -- ${usage}`);
}

export async function run(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    console.log(USAGE);
    return;
  }
  if (parsed.command === null)
    throw Error("No command. Run: npm run accounts -- --help");
  const context: Context = {
    target: { local: parsed.options.local },
    out: parsed.options.out,
  };
  switch (parsed.command) {
    case "create-class":
      requireArgs(
        parsed.args,
        2,
        'create-class <PREFIX> "<class name>"',
      );
      await createClass(parsed.args[0], parsed.args[1], context.target);
      return;
    case "add-students":
      requireArgs(parsed.args, 2, "add-students <PREFIX> <names.txt>");
      await addStudents(parsed.args[0], parsed.args[1], context);
      return;
    case "reissue":
      requireArgs(parsed.args, 2, 'reissue <PREFIX> "<name>"');
      await reissue(parsed.args[0], parsed.args[1], context);
      return;
    case "delete-student":
      requireArgs(parsed.args, 2, 'delete-student <PREFIX> "<name>"');
      await deleteStudent(parsed.args[0], parsed.args[1], context);
      return;
    case "delete-class":
      requireArgs(parsed.args, 1, "delete-class <PREFIX>");
      await deleteClass(parsed.args[0], context);
      return;
    case "teacher-code":
      requireArgs(parsed.args, 0, "teacher-code");
      await setTeacherCode(context);
      return;
    case "report":
      requireMaxArgs(parsed.args, 1, "report [PREFIX]");
      await writeReport(parsed.args[0], context);
      return;
    case "list":
      requireMaxArgs(parsed.args, 1, "list [PREFIX]");
      await listClasses(parsed.args[0], context.target);
      return;
    default:
      throw Error(
        `Unknown command ${parsed.command}. Run: npm run accounts -- --help`,
      );
  }
}

async function main(): Promise<void> {
  try {
    await run(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`accounts: ${message}`);
    process.exitCode = 1;
  }
}

const invoked = process.argv[1];
if (
  invoked !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(invoked)).href
) {
  void main();
}
