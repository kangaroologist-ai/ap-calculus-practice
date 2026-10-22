import { describe, expect, it } from 'vitest';
import { strToU8, zlibSync } from 'fflate';
import { SKILLS } from '../src/catalog';
import { chooseNext, freshProgress, stateFor } from '../src/progress';
import {
  checksum,
  decodeProgress,
  encodeProgress,
  makePortableProgress,
} from '../src/transfer';
import {
  ALL_CLASSES,
  buildTeacherGridModel,
  renderTeacherGrid,
  type TeacherAnswer,
  type TeacherGridCell,
  type TeacherStudent,
} from '../src/teacher-grid';
import type { Config } from '../src/types';

const NOW = Date.now() - 10 * 60_000;
const config: Config = {
  schemaVersion: 1,
  revision: 'teacher-grid-test',
  initialUnlockedLevel: 1,
  disabledFamilies: ['parametric', 'vector', 'polar'],
  sessionLength: 12,
};
const classes = [
  { prefix: 'CALC', name: 'Alpha' },
  { prefix: 'BC', name: 'Beta' },
];

function code(
  masteries: Record<string, number> = {},
  updatedAt = NOW,
  unlockedLevel = 1,
): string {
  const progress = freshProgress(config, updatedAt);
  progress.updatedAt = updatedAt;
  progress.unlockedLevel = unlockedLevel;
  for (const [id, mastery] of Object.entries(masteries)) {
    const skill = stateFor(progress, id, updatedAt);
    skill.mastery = mastery;
    skill.lastSeen = 1;
  }
  return encodeProgress(makePortableProgress(progress, NOW));
}

function student(
  id: string,
  name: string,
  classPrefix: string,
  progress: string | null,
  updatedAt: number | null,
): TeacherStudent {
  return {
    id,
    name,
    classPrefix,
    revision: 1,
    progress,
    updatedAt,
    savedAt: updatedAt,
  };
}

function answer(students: TeacherStudent[]): TeacherAnswer {
  return { classes, students };
}

function ids(html: string): string[] {
  return [...html.matchAll(/data-student-id="([^"]+)"/g)].map(
    (match) => match[1],
  );
}

function cell(row: { cells: TeacherGridCell[] }, skillId: string) {
  return row.cells.find((entry) => entry.skillId === skillId);
}

function newerCode(): string {
  const body = Buffer.from(
    zlibSync(
      strToU8(JSON.stringify({ formatVersion: 4, exportedAt: NOW })),
    ),
  ).toString('base64url');
  return `DSP1.${checksum(body)}.${body}`;
}

describe('teacher grid model', () => {
  it('uses catalog order and leaves disabled families out', () => {
    const model = buildTeacherGridModel(
      answer([student('a', 'Ada', 'CALC', code(), NOW)]),
      config,
    );
    const expected = SKILLS.filter(
      (skill) => !config.disabledFamilies.includes(skill.id),
    ).map(({ id, label, level }) => ({ id, label, level }));

    expect(model.columns).toEqual(expected);
    const html = renderTeacherGrid(model, { now: NOW });
    expect(html).toContain('<caption class="visually-hidden">');
    expect(html).toContain('scope="row"');
    expect(html).toContain('teacher-level-group');
    expect(html).toContain('teacher-skill-heading');
    expect(html).not.toContain('Parametric derivatives');
    expect(html).not.toContain('Vector derivatives');
    expect(html).not.toContain('Polar slopes');
    expect(html).not.toContain('Level 6');
  });

  it('reads mastery, percent, and band for each started skill', () => {
    const model = buildTeacherGridModel(
      answer([
        student(
          'a',
          'Ada',
          'CALC',
          code(
            { constant: 0.55, power: 0.7, sum: 0.82, root: 0.9 },
            NOW,
            3,
          ),
          NOW,
        ),
      ]),
      config,
    );
    const row = model.rows[0];
    expect(row.state).toBe('ok');
    expect(row.unlockedLevel).toBe(3);
    expect(cell(row, 'constant')).toEqual({
      skillId: 'constant',
      mastery: 0.55,
      percent: 55,
      band: 'weak',
    });
    expect(cell(row, 'power')).toMatchObject({
      percent: 70,
      band: 'learning',
    });
    expect(cell(row, 'sum')).toMatchObject({
      percent: 82,
      band: 'passed',
    });
    expect(cell(row, 'root')).toMatchObject({
      percent: 90,
      band: 'ready',
    });
    expect(cell(row, 'exp')).toEqual({
      skillId: 'exp',
      mastery: null,
      percent: null,
      band: null,
    });

    const html = renderTeacherGrid(model, { now: NOW });
    expect(html).toContain('55%');
    expect(html).toContain('70%');
    expect(html).toContain('82%');
    expect(html).toContain('90%');
    expect(html).toContain('data-band="weak"');
    expect(html).toContain('data-band="learning"');
    expect(html).toContain('data-band="passed"');
    expect(html).toContain('data-band="ready"');
    expect(html).not.toContain('Not started');
    expect(html).toContain('<td class="teacher-cell teacher-cell-blank"></td>');
    expect(html).toContain('Level 3');
  });

  it('leaves a chosen but unpracticed skill empty', () => {
    const progress = freshProgress(config, NOW);
    chooseNext(progress, config, NOW);
    expect(Object.keys(progress.skills).length).toBeGreaterThan(0);
    expect(
      Object.values(progress.skills).every((skill) => skill.lastSeen === 0),
    ).toBe(true);

    const unpracticed = encodeProgress(makePortableProgress(progress, NOW));
    expect(Object.keys(decodeProgress(unpracticed).skills).length).toBeGreaterThan(
      0,
    );
    const model = buildTeacherGridModel(
      answer([student('a', 'Ada', 'CALC', unpracticed, NOW)]),
      config,
    );
    expect(model.rows[0].state).toBe('ok');
    expect(model.rows[0].cells.every((entry) => entry.percent === null)).toBe(
      true,
    );
    expect(renderTeacherGrid(model, { now: NOW })).not.toContain('%');
  });

  it('marks empty, unreadable, and newer rows without stopping the grid', () => {
    const model = buildTeacherGridModel(
      answer([
        student('good', 'Ada', 'CALC', code({ constant: 0.82 }), NOW),
        student('empty', 'Bea', 'CALC', null, null),
        student('damaged', 'Cy', 'CALC', 'DSP2.00000000.broken', NOW),
        student('newer', 'Dee', 'CALC', newerCode(), NOW),
      ]),
      config,
    );
    const byId = (id: string) =>
      model.rows.find((row) => row.studentId === id)!;

    expect(byId('good').state).toBe('ok');
    expect(byId('empty').state).toBe('empty');
    expect(byId('empty').unlockedLevel).toBeNull();
    expect(byId('empty').cells.every((entry) => entry.percent === null)).toBe(
      true,
    );
    expect(byId('damaged').state).toBe('damaged');
    expect(byId('damaged').cells).toEqual([]);
    expect(byId('newer').state).toBe('newer');
    expect(byId('newer').cells).toEqual([]);

    const html = renderTeacherGrid(model, { now: NOW });
    expect(html).toContain('data-student-id="good"');
    expect(html).toContain('data-state="empty"');
    expect(html).toContain('data-state="damaged"');
    expect(html).toContain("Can't read");
    expect(html.match(/Can't read/g)).toHaveLength(1);
    expect(html).toContain('data-state="newer"');
    expect(html).toContain('Reload the page to update');
    expect(html.match(/Reload the page to update/g)).toHaveLength(1);
  });

  it('sorts by name by default and by newest practice on request', () => {
    const model = buildTeacherGridModel(
      answer([
        student('zoe', 'Zoe', 'CALC', code({}, NOW - 30_000), NOW - 30_000),
        student('ada', 'Ada', 'CALC', code({}, NOW - 20_000), NOW - 20_000),
        student('mia', 'Mia', 'CALC', code({}, NOW - 10_000), NOW - 10_000),
      ]),
      config,
    );

    expect(ids(renderTeacherGrid(model, { now: NOW }))).toEqual([
      'ada',
      'mia',
      'zoe',
    ]);
    expect(
      ids(renderTeacherGrid(model, { sort: 'last-practice', now: NOW })),
    ).toEqual(['mia', 'ada', 'zoe']);
  });

  it('filters to one class and only adds class headings for all classes', () => {
    const model = buildTeacherGridModel(
      answer([
        student('a', 'Ada', 'CALC', code(), NOW),
        student('b', 'Bea', 'BC', code(), NOW),
      ]),
      config,
    );

    const all = renderTeacherGrid(model, { now: NOW });
    expect(all.match(/teacher-class-row/g)).toHaveLength(2);
    expect(all).toContain('scope="rowgroup"');
    expect(all).toContain('Alpha');
    expect(all).toContain('Beta');

    const filtered = renderTeacherGrid(model, {
      classFilter: 'CALC',
      now: NOW,
    });
    expect(ids(filtered)).toEqual(['a']);
    expect(filtered).not.toContain('teacher-class-row');
    expect(filtered).not.toContain('Beta');
    expect(
      ids(
        renderTeacherGrid(model, {
          classFilter: ALL_CLASSES,
          now: NOW,
        }),
      ),
    ).toEqual(['a', 'b']);
  });

  it('filters by class prefix even when another class name matches it', () => {
    const model = buildTeacherGridModel(
      {
        classes: [
          { prefix: 'CALC', name: 'Alpha' },
          { prefix: 'BC', name: 'CALC' },
        ],
        students: [
          student('a', 'Ada', 'CALC', code(), NOW),
          student('b', 'Bea', 'BC', code(), NOW),
        ],
      },
      config,
    );

    expect(
      ids(renderTeacherGrid(model, { classFilter: 'CALC', now: NOW })),
    ).toEqual(['a']);
    expect(
      ids(renderTeacherGrid(model, { classFilter: 'BC', now: NOW })),
    ).toEqual(['b']);
  });

  it('escapes student and class names', () => {
    const escapedClasses = [
      { prefix: 'CALC', name: 'Alpha & "Co"' },
      { prefix: 'BC', name: 'Beta' },
    ];
    const model = buildTeacherGridModel(
      {
        classes: escapedClasses,
        students: [
          student('x', '<b>"Zoë" & Co</b>', 'CALC', code(), NOW),
        ],
      },
      config,
    );
    const html = renderTeacherGrid(model, { now: NOW });

    expect(html).not.toContain('<b>');
    expect(html).toContain('&lt;b&gt;&quot;Zoë&quot; &amp; Co&lt;/b&gt;');
    expect(html).toContain('Alpha &amp; &quot;Co&quot;');
  });
});

describe('teacher grid with server data', () => {
  it('accepts the numeric student id that D1 returns', () => {
    const model = buildTeacherGridModel(
      answer([{ ...student('x', 'Ada', 'CALC', null, null), id: 7 }]),
      config,
    );
    expect(model.rows[0].studentId).toBe('7');
    expect(renderTeacherGrid(model)).toContain('data-student-id="7"');
  });
});
