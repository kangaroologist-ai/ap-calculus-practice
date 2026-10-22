import {
  normalizeLoginCode,
  normalizeTeacherCode,
  sha256Hex,
} from "../../src/account-code";

export const TEST_CLASS = { prefix: "TEST", name: "Test class" } as const;

export const TEST_STUDENTS = [
  { name: "Ada Test", code: "TEST-K7QM-4ZX9-B2" },
  { name: "Ben Test", code: "TEST-8RHD-3MNP-QW" },
] as const;

export const TEST_TEACHER_CODE = "RJ7K-2M4X-9QWD-5T8N";

const CREATED_AT = 1767225600000;

function sqlText(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export async function seedSql(): Promise<string> {
  const students = await Promise.all(
    TEST_STUDENTS.map(async (student, index) => {
      const code = normalizeLoginCode(student.code);
      if (code === null) throw Error("Invalid seed login code.");
      return (
        "INSERT INTO students (id, code_hash, class_prefix, name, progress, revision, updated_at, saved_at, created_at) " +
        `VALUES (${index + 1}, ${sqlText(await sha256Hex(code))}, ` +
        `${sqlText(TEST_CLASS.prefix)}, ${sqlText(student.name)}, NULL, 0, NULL, NULL, ${CREATED_AT});`
      );
    }),
  );
  const teacher = normalizeTeacherCode(TEST_TEACHER_CODE);
  if (teacher === null) throw Error("Invalid seed teacher code.");
  return [
    "DELETE FROM login_failures;",
    "DELETE FROM students;",
    "DELETE FROM classes;",
    "DELETE FROM teacher;",
    "INSERT INTO classes (prefix, name, created_at) " +
      `VALUES (${sqlText(TEST_CLASS.prefix)}, ${sqlText(TEST_CLASS.name)}, ${CREATED_AT});`,
    ...students,
    "INSERT INTO teacher (id, code_hash) " +
      `VALUES (1, ${sqlText(await sha256Hex(teacher))});`,
    "",
  ].join("\n");
}
