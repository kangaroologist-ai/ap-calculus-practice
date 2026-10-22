import { SKILLS } from "./catalog";
import { PASS_THRESHOLD, READY_THRESHOLD, WEAK_THRESHOLD } from "./mastery";
import { NewerProgressError } from "./migrate";
import { masteryOf } from "./progress";
import { decodeProgress } from "./transfer";
import type { Config } from "./types";

export interface TeacherClass {
  prefix: string;
  name: string;
}
export interface TeacherStudent {
  // D1 returns a number; tests use readable strings.
  id: number | string;
  classPrefix: string;
  name: string;
  revision: number;
  progress: string | null;
  updatedAt: number | null;
  savedAt: number | null;
}
export interface TeacherAnswer {
  classes: TeacherClass[];
  students: TeacherStudent[];
}
export type TeacherRowState = "ok" | "empty" | "newer" | "damaged";
export type MasteryBand = "weak" | "learning" | "passed" | "ready";
export interface TeacherGridColumn {
  id: string;
  label: string;
  level: number;
}
export interface TeacherGridCell {
  skillId: string;
  mastery: number | null;
  percent: number | null;
  band: MasteryBand | null;
}
export interface TeacherGridRow {
  studentId: string;
  name: string;
  classPrefix: string;
  className: string;
  revision: number;
  updatedAt: number | null;
  savedAt: number | null;
  unlockedLevel: number | null;
  state: TeacherRowState;
  cells: TeacherGridCell[];
}
export interface TeacherGridModel {
  classes: TeacherClass[];
  columns: TeacherGridColumn[];
  rows: TeacherGridRow[];
}
export const ALL_CLASSES = "all";
export type TeacherSort = "name" | "last-practice";
export interface TeacherGridOptions {
  classFilter?: string | null;
  sort?: TeacherSort;
  now?: number;
}

const FIXED_WIDTH = 384;
const SKILL_WIDTH = 96;
const nameCollator = new Intl.Collator("en", { sensitivity: "base" });

const bandOf = (mastery: number): MasteryBand => {
  if (mastery < WEAK_THRESHOLD) return "weak";
  if (mastery < PASS_THRESHOLD) return "learning";
  if (mastery < READY_THRESHOLD) return "passed";
  return "ready";
};

const emptyCell = (skillId: string): TeacherGridCell => ({
  skillId,
  mastery: null,
  percent: null,
  band: null,
});

const isTime = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export function buildTeacherGridModel(
  answer: TeacherAnswer,
  config: Config,
): TeacherGridModel {
  const columns: TeacherGridColumn[] = SKILLS.filter(
    (skill) => !config.disabledFamilies.includes(skill.id),
  ).map(({ id, label, level }) => ({ id, label, level }));
  const classNames = new Map<string, string>(
    answer.classes.map((entry) => [entry.prefix, entry.name] as const),
  );
  const rows: TeacherGridRow[] = answer.students.map((student) => {
    const className = classNames.get(student.classPrefix) || student.classPrefix;
    const base = {
      studentId: String(student.id),
      name: student.name,
      classPrefix: student.classPrefix,
      className,
      revision: student.revision,
      updatedAt: isTime(student.updatedAt) ? student.updatedAt : null,
      savedAt: isTime(student.savedAt) ? student.savedAt : null,
    };
    if (student.progress == null)
      return {
        ...base,
        unlockedLevel: null,
        state: "empty" as const,
        cells: columns.map((column) => emptyCell(column.id)),
      };
    try {
      const progress = decodeProgress(student.progress);
      const cells = columns.map((column) => {
        // chooseNext creates a skill record before the first answer.
        const skill = progress.skills[column.id];
        if (!skill || !(skill.lastSeen > 0 || skill.basic.passed))
          return emptyCell(column.id);
        const mastery = masteryOf(progress, column.id);
        return {
          skillId: column.id,
          mastery,
          percent: Math.round(mastery * 100),
          band: bandOf(mastery),
        };
      });
      return {
        ...base,
        updatedAt: base.updatedAt ?? progress.updatedAt,
        unlockedLevel: progress.unlockedLevel,
        state: "ok" as const,
        cells,
      };
    } catch (error) {
      return {
        ...base,
        unlockedLevel: null,
        state:
          error instanceof NewerProgressError
            ? ("newer" as const)
            : ("damaged" as const),
        cells: [],
      };
    }
  });
  return {
    classes: answer.classes.map(({ prefix, name }) => ({ prefix, name })),
    columns,
    rows,
  };
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);

const formatTime = (value: number | null, now: number): string => {
  if (value === null) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  if (date.getFullYear() !== new Date(now).getFullYear())
    options.year = "numeric";
  return date.toLocaleString("en-US", options);
};

const compareNames = (a: TeacherGridRow, b: TeacherGridRow): number =>
  nameCollator.compare(a.name, b.name) ||
  a.studentId.localeCompare(b.studentId);

const sortRows = (
  rows: TeacherGridRow[],
  sort: TeacherSort,
): TeacherGridRow[] =>
  [...rows].sort((a, b) => {
    if (sort === "name") return compareNames(a, b);
    if (a.updatedAt === null && b.updatedAt === null)
      return compareNames(a, b);
    if (a.updatedAt === null) return 1;
    if (b.updatedAt === null) return -1;
    return b.updatedAt - a.updatedAt || compareNames(a, b);
  });

const normalizeClassFilter = (value: string | null | undefined): string => {
  if (!value || value === ALL_CLASSES || value === "All classes")
    return ALL_CLASSES;
  return value;
};

interface RowGroup {
  prefix: string;
  name: string;
  rows: TeacherGridRow[];
}

const visibleGroups = (
  model: TeacherGridModel,
  classFilter: string,
  sort: TeacherSort,
): RowGroup[] => {
  const matching = model.rows.filter(
    (row) => classFilter === ALL_CLASSES || row.classPrefix === classFilter,
  );
  if (!matching.length) return [];
  if (classFilter !== ALL_CLASSES)
    return [{ prefix: "", name: "", rows: sortRows(matching, sort) }];
  const groupOrder: { prefix: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const entry of model.classes)
    if (!seen.has(entry.prefix)) {
      seen.add(entry.prefix);
      groupOrder.push(entry);
    }
  for (const row of matching)
    if (!seen.has(row.classPrefix)) {
      seen.add(row.classPrefix);
      groupOrder.push({ prefix: row.classPrefix, name: row.className });
    }
  return groupOrder
    .map((entry) => ({
      prefix: entry.prefix,
      name: entry.name || entry.prefix,
      rows: sortRows(
        matching.filter((row) => row.classPrefix === entry.prefix),
        sort,
      ),
    }))
    .filter((group) => group.rows.length > 0);
};

const levelGroups = (
  columns: TeacherGridColumn[],
): { level: number; span: number }[] => {
  const groups: { level: number; span: number }[] = [];
  for (const column of columns) {
    const last = groups.at(-1);
    if (last && last.level === column.level) last.span++;
    else groups.push({ level: column.level, span: 1 });
  }
  return groups;
};

const renderCell = (cell: TeacherGridCell): string =>
  cell.percent === null
    ? '<td class="teacher-cell teacher-cell-blank"></td>'
    : `<td class="teacher-cell" data-band="${cell.band}">${cell.percent}%</td>`;

const renderStudent = (
  row: TeacherGridRow,
  skillSpan: number,
  now: number,
): string => {
  const lastPractice = escapeHtml(formatTime(row.updatedAt, now));
  const level =
    row.unlockedLevel === null ? "—" : `Level ${row.unlockedLevel}`;
  const skills =
    row.state === "ok" || row.state === "empty"
      ? row.cells.map(renderCell).join("")
      : row.state === "newer"
        ? `<td class="teacher-row-message" colspan="${skillSpan}"><span class="visually-hidden">Status: </span>Reload the page to update</td>`
        : `<td class="teacher-row-message" colspan="${skillSpan}"><span class="visually-hidden">Status: </span>Can't read</td>`;
  return `<tr class="teacher-student-row" data-student-id="${escapeHtml(row.studentId)}" data-state="${row.state}"><th class="teacher-name-cell" scope="row">${escapeHtml(row.name)}</th><td class="teacher-last-practice">${lastPractice}</td><td class="teacher-level-cell">${level}</td>${skills}</tr>`;
};

export function renderTeacherGrid(
  model: TeacherGridModel,
  options: TeacherGridOptions = {},
): string {
  const classFilter = normalizeClassFilter(options.classFilter);
  const sort: TeacherSort =
    options.sort === "last-practice" ? "last-practice" : "name";
  const now =
    typeof options.now === "number" && Number.isFinite(options.now)
      ? options.now
      : Date.now();
  const skillSpan = Math.max(1, model.columns.length);
  const totalSpan = 3 + skillSpan;
  const groups = levelGroups(model.columns);
  const tableWidth = FIXED_WIDTH + skillSpan * SKILL_WIDTH;
  const head = `<thead><tr><th class="teacher-name-heading" scope="col" rowspan="2">Name</th><th class="teacher-last-heading" scope="col" rowspan="2">Last practice</th><th class="teacher-level-heading" scope="col" rowspan="2">Level</th>${groups.map((group) => `<th class="teacher-level-group" scope="col" colspan="${group.span}">Level ${group.level}</th>`).join("")}</tr><tr>${model.columns.map((column) => `<th class="teacher-skill-heading" scope="col">${escapeHtml(column.label)}</th>`).join("")}</tr></thead>`;
  const rowGroups = visibleGroups(model, classFilter, sort);
  const body = rowGroups.length
    ? rowGroups
        .map((group) => {
          const heading =
            classFilter === ALL_CLASSES
              ? `<tr class="teacher-class-row"><th class="teacher-class-heading" scope="rowgroup" colspan="${totalSpan}"><span class="teacher-class-label">${escapeHtml(group.name)}</span></th></tr>`
              : "";
          const students = group.rows
            .map((row) => renderStudent(row, skillSpan, now))
            .join("");
          return `<tbody>${heading}${students}</tbody>`;
        })
        .join("")
    : `<tbody><tr class="teacher-empty-row"><td colspan="${totalSpan}">No students.</td></tr></tbody>`;
  const columns = `<colgroup><col class="teacher-col-name"><col class="teacher-col-last"><col class="teacher-col-level">${model.columns.map(() => '<col class="teacher-col-skill">').join("")}</colgroup>`;
  return `<table class="teacher-table" style="width:${tableWidth}px"><caption class="visually-hidden">Student mastery by skill</caption>${columns}${head}${body}</table>`;
}
